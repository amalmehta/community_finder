import Foundation
import Network

/// A minimal read-only HTTP server bound to loopback, serving the bundled site.
///
/// Why a server at all, rather than `loadFileURL`? WKWebView gives `file://`
/// pages an opaque origin, so `localStorage` is unavailable — which would break
/// the saved plan and the feedback panel. An `http://127.0.0.1` origin behaves
/// like a normal web origin, so the app works exactly as it does in a browser.
final class StaticServer {
    private let root: URL
    private var listener: NWListener?
    private let queue = DispatchQueue(label: "fyc.server")
    private(set) var port: UInt16 = 0

    init(root: URL) {
        self.root = root.standardizedFileURL
    }

    /// Starts on a random free loopback port and returns it.
    func start() throws -> UInt16 {
        let params = NWParameters.tcp
        params.requiredLocalEndpoint = .hostPort(host: .ipv4(.loopback), port: .any)
        params.allowLocalEndpointReuse = true

        let listener = try NWListener(using: params)
        self.listener = listener

        let ready = DispatchSemaphore(value: 0)
        listener.stateUpdateHandler = { state in
            if case .ready = state { ready.signal() }
            if case .failed = state { ready.signal() }
        }
        listener.newConnectionHandler = { [weak self] conn in
            conn.start(queue: self?.queue ?? .global())
            self?.receive(on: conn, buffer: Data())
        }
        listener.start(queue: queue)

        guard ready.wait(timeout: .now() + 5) == .success,
              let p = listener.port?.rawValue else {
            throw NSError(domain: "fyc", code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "Could not start the local server."])
        }
        port = p
        return p
    }

    // MARK: - Request handling

    private func receive(on conn: NWConnection, buffer: Data) {
        conn.receive(minimumIncompleteLength: 1, maximumLength: 16 * 1024) { [weak self] data, _, done, _ in
            guard let self else { return }
            var buf = buffer
            if let data { buf.append(data) }

            // Headers end at the blank line; this server ignores request bodies.
            if let range = buf.range(of: Data("\r\n\r\n".utf8)) {
                let head = String(decoding: buf[..<range.lowerBound], as: UTF8.self)
                self.respond(to: head, on: conn)
                return
            }
            if done || buf.count > 64 * 1024 {
                conn.cancel()
                return
            }
            self.receive(on: conn, buffer: buf)
        }
    }

    private func respond(to head: String, on conn: NWConnection) {
        let requestLine = head.split(separator: "\r\n", maxSplits: 1).first.map(String.init) ?? ""
        let parts = requestLine.split(separator: " ")
        guard parts.count >= 2, parts[0] == "GET" || parts[0] == "HEAD" else {
            send(status: "405 Method Not Allowed", body: Data("Method not allowed".utf8),
                 type: "text/plain; charset=utf-8", on: conn)
            return
        }

        var path = String(parts[1])
        if let q = path.firstIndex(of: "?") { path = String(path[..<q]) }
        path = path.removingPercentEncoding ?? path
        if path == "/" { path = "/index.html" }

        let target = root.appendingPathComponent(String(path.dropFirst())).standardizedFileURL

        // Refuse anything that escapes the bundled site directory.
        guard target.path == root.path || target.path.hasPrefix(root.path + "/"),
              let body = try? Data(contentsOf: target) else {
            send(status: "404 Not Found", body: Data("Not found".utf8),
                 type: "text/plain; charset=utf-8", on: conn)
            return
        }
        send(status: "200 OK", body: body, type: Self.mimeType(for: target), on: conn)
    }

    private func send(status: String, body: Data, type: String, on conn: NWConnection) {
        var header = "HTTP/1.1 \(status)\r\n"
        header += "Content-Type: \(type)\r\n"
        header += "Content-Length: \(body.count)\r\n"
        header += "Cache-Control: no-store\r\n"
        header += "Connection: close\r\n\r\n"
        conn.send(content: Data(header.utf8) + body,
                  completion: .contentProcessed { _ in conn.cancel() })
    }

    private static func mimeType(for url: URL) -> String {
        switch url.pathExtension.lowercased() {
        case "html", "htm": return "text/html; charset=utf-8"
        case "css":         return "text/css; charset=utf-8"
        case "js":          return "text/javascript; charset=utf-8"
        case "json":        return "application/json; charset=utf-8"
        case "svg":         return "image/svg+xml"
        case "png":         return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "webp":        return "image/webp"
        case "woff2":       return "font/woff2"
        case "ico":         return "image/x-icon"
        default:            return "application/octet-stream"
        }
    }
}
