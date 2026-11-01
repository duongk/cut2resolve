# cut2resolve

Lossless video and audio trimming with a DaVinci Resolve marker workflow.

cut2resolve is an independent, open-source fork of [LosslessCut](https://github.com/mifi/lossless-cut). It retains LosslessCut's fast, lossless FFmpeg-based editing tools and adds a workflow for taking named ranges from a source clip into DaVinci Resolve as Media Pool duration markers.

> cut2resolve is an independent open-source project and is not affiliated with, sponsored, or endorsed by Blackmagic Design Pty. Ltd. DaVinci Resolve is a trademark of Blackmagic Design Pty. Ltd.

## Highlights

- Cut, trim, merge, remux, and manage tracks without re-encoding when the source format allows it.
- Name ranges in the **Segments to export** sidebar.
- Save Resolve marker sidecars automatically alongside the original media, without changing the source file.
- Install one universal Resolve importer script; it finds matching sidecars for clips in the Media Pool and creates or updates duration markers.
- Preserve camera proxies stored in a `Proxy` subdirectory: they are not used as marker sources.
- Build portable, unsigned macOS DMGs and Windows archives without administrator access.

## DaVinci Resolve workflow

1. Open the original clip in cut2resolve and create ranges.
2. Give each range a name in **Segments to export**.
3. Save the project or export the Resolve marker data. cut2resolve writes a `*.resolve-markers.json` sidecar beside the original source file.
4. In DaVinci Resolve, import the original media into the Media Pool.
5. Run **cut2resolve Resolve Marker Importer.py** once. It scans Media Pool clips and applies matching sidecars as duration markers.

The importer intentionally leaves source media unchanged and ignores files under a directory named `Proxy`.

## Downloads

Unsigned test builds are available from the repository's **Actions** tab. They are intended for testing:

- macOS: download the matching DMG for Intel or Apple Silicon. Because it is unsigned, macOS may require you to explicitly allow it in Privacy & Security.
- Windows: download and extract the `.7z` archive, then run the application. No installer or administrator privileges are required.

For a public release, use the repository's **Releases** page once release tags and signing are configured.

## Getting started

For normal lossless editing, use the upstream documentation as a general reference while cut2resolve documentation is expanded:

- [LosslessCut feature documentation](https://github.com/mifi/lossless-cut/tree/master/docs)
- [Project-specific features](docs/features.md)
- [Build and development instructions](CONTRIBUTING.md)

## License and attribution

cut2resolve is licensed under the **GNU General Public License, version 2 only**. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

It contains code from LosslessCut by Mikael Finstad and other contributors. The original project is available at <https://github.com/mifi/lossless-cut>. The full attribution and modification notice is in [NOTICE](NOTICE).

FFmpeg and other dependencies are distributed under their own licenses. Release builds include a generated `licenses.txt` file listing bundled package notices.

## Contributing and support

Please open bugs and feature requests in this repository's [Issues](https://github.com/duongk/cut2resolve/issues), and use [Discussions](https://github.com/duongk/cut2resolve/discussions) for questions.
