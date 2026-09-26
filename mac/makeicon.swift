// Generates AppIcon.iconset (run by build.sh, not part of the app binary).
// Three overlapping circles on a warm ground — legible down to 16pt.
import AppKit

let sizes = [16, 32, 64, 128, 256, 512, 1024]
let out = URL(fileURLWithPath: CommandLine.arguments[1])
try? FileManager.default.createDirectory(at: out, withIntermediateDirectories: true)

func draw(_ px: Int) -> Data {
    let s = CGFloat(px)
    let cs = CGColorSpaceCreateDeviceRGB()
    let ctx = CGContext(data: nil, width: px, height: px, bitsPerComponent: 8,
                        bytesPerRow: 0, space: cs,
                        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!

    // Rounded ground, inset the way modern macOS icons are.
    let inset = s * 0.055
    let rect = CGRect(x: inset, y: inset, width: s - inset * 2, height: s - inset * 2)
    let path = CGPath(roundedRect: rect, cornerWidth: s * 0.222, cornerHeight: s * 0.222,
                      transform: nil)
    ctx.addPath(path)
    ctx.clip()
    let grad = CGGradient(colorsSpace: cs, colors: [
        CGColor(red: 0.76, green: 0.36, blue: 0.19, alpha: 1),
        CGColor(red: 0.62, green: 0.26, blue: 0.13, alpha: 1)
    ] as CFArray, locations: [0, 1])!
    ctx.drawLinearGradient(grad, start: CGPoint(x: 0, y: s), end: CGPoint(x: s, y: 0),
                           options: [])

    // Three figures: one up front, two behind.
    let cream = CGColor(red: 0.98, green: 0.95, blue: 0.90, alpha: 1)
    let soft = CGColor(red: 0.98, green: 0.95, blue: 0.90, alpha: 0.62)

    func dot(_ cx: CGFloat, _ cy: CGFloat, _ r: CGFloat, _ color: CGColor) {
        ctx.setFillColor(color)
        ctx.fillEllipse(in: CGRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2))
    }

    dot(s * 0.33, s * 0.60, s * 0.115, soft)
    dot(s * 0.67, s * 0.60, s * 0.115, soft)
    dot(s * 0.50, s * 0.66, s * 0.145, cream)

    // Shoulders under each head.
    func body(_ cx: CGFloat, _ cy: CGFloat, _ w: CGFloat, _ color: CGColor) {
        ctx.setFillColor(color)
        let r = CGRect(x: cx - w / 2, y: cy - w * 0.62, width: w, height: w * 0.8)
        ctx.addPath(CGPath(roundedRect: r, cornerWidth: w * 0.42, cornerHeight: w * 0.42,
                           transform: nil))
        ctx.fillPath()
    }
    body(s * 0.33, s * 0.40, s * 0.30, soft)
    body(s * 0.67, s * 0.40, s * 0.30, soft)
    body(s * 0.50, s * 0.42, s * 0.38, cream)

    let img = ctx.makeImage()!
    let rep = NSBitmapImageRep(cgImage: img)
    return rep.representation(using: .png, properties: [:])!
}

for size in sizes {
    try! draw(size).write(to: out.appendingPathComponent("icon_\(size)x\(size).png"))
    if size <= 512 {
        try! draw(size * 2).write(to: out.appendingPathComponent("icon_\(size)x\(size)@2x.png"))
    }
}
print("iconset written to \(out.path)")
