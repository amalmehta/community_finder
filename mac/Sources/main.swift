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

    func applicationDidFinishLaunching(_ notification: Notification) {
        guard let webRoot = Bundle.main.resourceURL?.appendingPathComponent("web") else {
            fail("The app bundle is missing its web resources.")
            return
        }

        server = StaticServer(root: webRoot)
        let port: UInt16
        do {
            port = try server.start()
        } catch {
            fail(error.localizedDescription)
            return
        }

        buildMenu()
        buildWindow()

        if let url = URL(string: "http://127.0.0.1:\(port)/") {
            webView.load(URLRequest(url: url))
        }

        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)
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
        view.addItem(withTitle: "Start Over", action: #selector(startOver), keyEquivalent: "R")
        view.addItem(.separator())
        view.addItem(withTitle: "Enter Full Screen",
                     action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f")
        viewItem.submenu = view
        main.addItem(viewItem)

        NSApp.mainMenu = main
    }

    @objc private func reload() { webView.reload() }

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
        if url.host == "127.0.0.1" {
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
