// „Fotos aufbereiten“ – kleines Mac-Programm mit Fenster (seit 22.11.2026). Ordner oder Fotos ins Fenster (oder aufs
// Symbol im Dock) ziehen; die fertigen Web-Versionen landen daneben in „<Name> – fertig“. Die eigentliche Arbeit macht
// scripts/prepare-folder.mjs (Node). Gebaut wird mit `bash scripts/make-app.sh`, das PROJECT_DIR und NODE_PATH einsetzt.
import AppKit
import SwiftUI
import UniformTypeIdentifiers

let projectDir = "__PROJECT_DIR__"
let nodePath = "__NODE_PATH__"

@MainActor
final class Runner: ObservableObject {
    static let shared = Runner()
    @Published var lines: [String] = []
    @Published var busy = false
    @Published var summary = ""
    @Published var outputDirs: [URL] = []
    /// Ablagefläche hervorheben, solange etwas darübergezogen wird
    @Published var targeted = false

    func process(_ urls: [URL], watermark: Bool) {
        guard !busy, !urls.isEmpty else { return }
        busy = true
        lines = []
        summary = "Wird aufbereitet …"
        outputDirs = urls.map { url in
            var isDir: ObjCBool = false
            FileManager.default.fileExists(atPath: url.path, isDirectory: &isDir)
            return isDir.boolValue
                ? url.deletingLastPathComponent().appendingPathComponent(url.lastPathComponent + " – fertig")
                : url.deletingLastPathComponent().appendingPathComponent("Fotos – fertig")
        }

        let task = Process()
        task.executableURL = URL(fileURLWithPath: nodePath)
        task.currentDirectoryURL = URL(fileURLWithPath: projectDir)
        task.arguments = ["scripts/prepare-folder.mjs", watermark ? "--wasserzeichen" : "--ohne-wasserzeichen"]
            + urls.map(\.path)
        let pipe = Pipe()
        task.standardOutput = pipe
        task.standardError = pipe
        pipe.fileHandleForReading.readabilityHandler = { handle in
            let data = handle.availableData
            guard !data.isEmpty, let text = String(data: data, encoding: .utf8) else { return }
            let new = text.split(separator: "\n").map(String.init)
            Task { @MainActor in Runner.shared.lines.append(contentsOf: new) }
        }
        task.terminationHandler = { t in
            pipe.fileHandleForReading.readabilityHandler = nil
            let ok = t.terminationStatus == 0
            Task { @MainActor in
                let r = Runner.shared
                r.busy = false
                r.summary = r.lines.last(where: { $0.contains("fertig") }) ?? (ok ? "Fertig." : "Es gab einen Fehler.")
                if ok, let first = r.outputDirs.first(where: { FileManager.default.fileExists(atPath: $0.path) }) {
                    NSWorkspace.shared.open(first)
                }
            }
        }
        do {
            try task.run()
        } catch {
            busy = false
            summary = "Konnte nicht starten: \(error.localizedDescription)"
        }
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    // Ordner/Fotos aufs Symbol im Dock gezogen
    func application(_ application: NSApplication, open urls: [URL]) {
        Task { @MainActor in
            Runner.shared.process(urls, watermark: UserDefaults.standard.bool(forKey: "wasserzeichen"))
        }
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}

struct ContentView: View {
    @ObservedObject var runner = Runner.shared
    @AppStorage("wasserzeichen") var watermark = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 14)
                    .strokeBorder(style: StrokeStyle(lineWidth: 2, dash: [8, 6]))
                    .foregroundStyle(runner.targeted ? Color.accentColor : Color.secondary.opacity(0.6))
                    .background(RoundedRectangle(cornerRadius: 14).fill(runner.targeted ? Color.accentColor.opacity(0.08) : Color.clear))
                VStack(spacing: 10) {
                    Image(systemName: runner.busy ? "hourglass" : "photo.on.rectangle.angled")
                        .font(.system(size: 42, weight: .light))
                        .foregroundStyle(.secondary)
                    Text(runner.busy ? "Wird aufbereitet …" : "Ordner oder Fotos hier hineinziehen")
                        .font(.title3.weight(.medium))
                    Text("Fertige Web-Versionen (2400 px, ohne GPS) landen daneben in „… – fertig“.\nDie Originale bleiben unverändert.")
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding()
            }
            .frame(minHeight: 220)
            .onDrop(of: [.fileURL], isTargeted: $runner.targeted) { providers in
                load(providers)
                return true
            }

            Toggle("Wasserzeichen „© Jesko Dorner“ einfügen", isOn: $watermark)
                .disabled(runner.busy)

            if !runner.summary.isEmpty {
                HStack {
                    Text(runner.summary).font(.callout.weight(.medium))
                    Spacer()
                    if !runner.busy, let dir = runner.outputDirs.first(where: { FileManager.default.fileExists(atPath: $0.path) }) {
                        Button("Ordner zeigen") { NSWorkspace.shared.activateFileViewerSelecting([dir]) }
                    }
                }
            }
            if !runner.lines.isEmpty {
                ScrollView {
                    Text(runner.lines.joined(separator: "\n"))
                        .font(.system(.caption, design: .monospaced))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .textSelection(.enabled)
                }
                .frame(minHeight: 80, maxHeight: 160)
            }
        }
        .padding(20)
        .frame(width: 460)
    }

    func load(_ providers: [NSItemProvider]) {
        var urls: [URL] = []
        let group = DispatchGroup()
        let lock = NSLock()
        for p in providers {
            group.enter()
            _ = p.loadObject(ofClass: URL.self) { url, _ in
                if let url { lock.lock(); urls.append(url); lock.unlock() }
                group.leave()
            }
        }
        group.notify(queue: .main) {
            let wm = watermark
            Task { @MainActor in Runner.shared.process(urls, watermark: wm) }
        }
    }
}

@main
struct FotosAufbereitenApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var delegate
    var body: some Scene {
        Window("Fotos aufbereiten", id: "main") {
            ContentView()
        }
        .windowResizability(.contentSize)
    }
}
