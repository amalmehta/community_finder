import Cocoa
import WebKit

/// Native macOS shell for community_finder.
///
/// The whole site ships inside the bundle at Contents/Resources/web and is
/// served over loopback, so the app is fully offline and behaves identically
/// to the browser build.
final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate {
    private var window: NSWindow!
    private var webView: WKWebView!
    private var server: StaticServer!
    private var usingBackend = false

    /// Where the account server lives. Editable from the Server menu so the app
    /// can point at a deployed instance instead of a local one.
    private var backendURL: URL {
        let raw = UserDefaults.standard.string(forKey: "BackendURL") ?? "http://127.0.0.1:4000"
        return URL(string: raw) ?? URL(string: "http://127.0.0.1:4000")!
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildMenu()
        buildWindow()

        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)

        connect()
    }

    /// Prefer the account server; fall back to the copy inside the app bundle
    /// so the app still works with nothing else running.
    private func connect() {
        probeBackend { [weak self] reachable in
            guard let self else { return }
            if reachable {
                self.usingBackend = true
                self.window.subtitle = self.backendURL.host ?? ""
                self.webView.load(URLRequest(url: self.backendURL))
            } else {
                self.usingBackend = false
                self.window.subtitle = "offline copy"
                self.loadBundled()
            }
        }
    }

    private func loadBundled() {
        guard let webRoot = Bundle.main.resourceURL?.appendingPathComponent("web") else {
            fail("The app bundle is missing its web resources.")
            return
        }
        if server == nil {
            server = StaticServer(root: webRoot)
            do {
                _ = try server.start()
            } catch {
                fail(error.localizedDescription)
                return
            }
        }
        if let url = URL(string: "http://127.0.0.1:\(server.port)/") {
            webView.load(URLRequest(url: url))
        }
    }

    /// A short HEAD-ish probe of /api/me. Anything that answers is good enough;
    /// the web app itself decides what to do with the response.
    private func probeBackend(_ done: @escaping (Bool) -> Void) {
        var req = URLRequest(url: backendURL.appendingPathComponent("api/me"))
        req.timeoutInterval = 2
        req.httpMethod = "GET"
        URLSession.shared.dataTask(with: req) { _, response, _ in
            let ok = (response as? HTTPURLResponse)?.statusCode == 200
            DispatchQueue.main.async { done(ok) }
        }.resume()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    // MARK: - UI

    private func buildWindow() {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()          // persists localStorage between launches
        config.suppressesIncrementalRendering = false

        let frame = NSRect(x: 0, y: 0, width: 1040, height: 800)
        webView = WKWebView(frame: frame, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.autoresizingMask = [.width, .height]
        webView.allowsBackForwardNavigationGestures = false

        window = NSWindow(
            contentRect: frame,
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "community_finder"
        window.subtitle = ""
        window.minSize = NSSize(width: 380, height: 520)
        window.contentView = webView
        window.setFrameAutosaveName("CommunityFinderMainWindow")
        window.center()
        window.makeKeyAndOrderFront(nil)
    }

    private func buildMenu() {
        let main = NSMenu()

        let appItem = NSMenuItem()
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "About community_finder",
                        action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Hide community_finder",
                        action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(withTitle: "Quit community_finder",
                        action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu
        main.addItem(appItem)

        let editItem = NSMenuItem()
        let edit = NSMenu(title: "Edit")
        edit.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        edit.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        edit.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        edit.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editItem.submenu = edit
        main.addItem(editItem)

        let viewItem = NSMenuItem()
        let view = NSMenu(title: "View")
        view.addItem(withTitle: "Reload", action: #selector(reload), keyEquivalent: "r")
        view.addItem(withTitle: "Reconnect to Server", action: #selector(reconnect), keyEquivalent: "R")
        view.addItem(withTitle: "Server\u{2026}", action: #selector(editServer), keyEquivalent: ",")
        view.addItem(.separator())
        view.addItem(withTitle: "Clear Local Data", action: #selector(startOver), keyEquivalent: "")
        view.addItem(.separator())
        view.addItem(withTitle: "Enter Full Screen",
                     action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f")
        viewItem.submenu = view
        main.addItem(viewItem)

        NSApp.mainMenu = main
    }

    @objc private func reload() { webView.reload() }

    @objc private func reconnect() { connect() }

    @objc private func editServer() {
        let alert = NSAlert()
        alert.messageText = "Account server"
        alert.informativeText = "The app uses this server for profiles and messages. If it is unreachable, the bundled offline copy is used instead (finder only, no account)."
        let field = NSTextField(frame: NSRect(x: 0, y: 0, width: 320, height: 24))
        field.stringValue = backendURL.absoluteString
        alert.accessoryView = field
        alert.addButton(withTitle: "Connect")
        alert.addButton(withTitle: "Cancel")
        guard alert.runModal() == .alertFirstButtonReturn else { return }
        let text = field.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
        if !text.isEmpty, URL(string: text) != nil {
            UserDefaults.standard.set(text, forKey: "BackendURL")
            connect()
        }
    }

    /// Clears the saved search, plan and feedback, then reloads.
    @objc private func startOver() {
        let alert = NSAlert()
        alert.messageText = "Start over?"
        alert.informativeText = "This clears your saved search, your plan and any feedback stored on this Mac."
        alert.addButton(withTitle: "Clear")
        alert.addButton(withTitle: "Cancel")
        guard alert.runModal() == .alertFirstButtonReturn else { return }

        webView.evaluateJavaScript("localStorage.clear()") { [weak self] _, _ in
            self?.webView.reload()
        }
    }

    private func fail(_ message: String) {
        let alert = NSAlert()
        alert.messageText = "community_finder could not start"
        alert.informativeText = message
        alert.addButton(withTitle: "Quit")
        alert.runModal()
        NSApp.terminate(nil)
    }

    // MARK: - Load failures

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        showLoadFailure(error)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!,
                 withError error: Error) {
        showLoadFailure(error)
    }

    /// A blank window tells the user nothing; say what went wrong.
    private func showLoadFailure(_ error: Error) {
        let html = """
        <html><body style="font: 15px -apple-system; padding: 40px; color: #221f1b;
        background: #fbf8f4"><h2 style="font-weight:600">The page could not load.</h2>
        <p>\(error.localizedDescription)</p><p style="color:#8a8176">Try View &rarr; Reload.</p>
        </body></html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }

    // MARK: - Navigation policy

    /// Keep the app on its own pages; send every real link to the default browser.
    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }
        // Our own pages: the bundled server, or whichever backend is configured.
        let ourHosts: Set<String> = ["127.0.0.1", "localhost", backendURL.host ?? ""]
        if let host = url.host, ourHosts.contains(host) {
            decisionHandler(.allow)
        } else {
            NSWorkspace.shared.open(url)
            decisionHandler(.cancel)
        }
    }

    /// target="_blank" links have no window to open into; hand them to the browser.
    func webView(_ webView: WKWebView,
                 createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url { NSWorkspace.shared.open(url) }
        return nil
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
