# cut2resolve

Lossless video and audio trimming with a DaVinci Resolve marker workflow.

cut2resolve is an independent, open-source fork of [LosslessCut](https://github.com/mifi/lossless-cut). It retains LosslessCut's fast, lossless FFmpeg-based editing tools and adds a workflow for taking named ranges from a source clip into DaVinci Resolve as Media Pool duration markers.

> cut2resolve is an independent open-source project and is not affiliated with, sponsored, or endorsed by Blackmagic Design Pty. Ltd. DaVinci Resolve is a trademark of Blackmagic Design Pty. Ltd.

## Highlights

- Cut, trim, merge, remux, and manage tracks without re-encoding when the source format allows it.
- Name ranges, notes, and keywords in the **Segments to export** sidebar.
- Save clip metadata and Resolve marker sidecars automatically alongside the original media, without changing the source file.
- Install one universal Resolve importer script from **File → Export project → Install DaVinci Resolve importer**. It finds matching sidecars for clips in the Media Pool and creates or updates duration markers.
- Browse from Home or mounted drives, resize the browser and metadata panes, and manage related camera files together. Moves and Trash actions preserve `Proxy` subdirectories and associated Sony/Cut2Resolve sidecars.
- Preserve camera proxies stored in a `Proxy` subdirectory: they are not used as marker sources.
- Choose 1×, 1.2×, 1.5×, or 2× preview playback speed from the bottom bar.
- Build portable, unsigned macOS DMGs and Windows archives without administrator access.

## DaVinci Resolve workflow

1. Open the original clip in cut2resolve and create ranges.
2. Give each range a name, note, and keywords in **Segments to export** as needed.
3. Save the project or export the Resolve marker data. cut2resolve writes a `*.resolve-markers.json` sidecar beside the original source file.
4. In DaVinci Resolve, import the original media into the Media Pool.
5. In cut2resolve, choose **File → Export project → Install DaVinci Resolve importer**. The app installs `cut2resolve import.py` in Resolve's per-user Utility scripts folder and opens that folder in Finder or Explorer. Restart or refresh Resolve's scripts menu if necessary.
6. In DaVinci Resolve, run **Workspace → Scripts → Utility → cut2resolve import**. It scans Media Pool clips and applies matching sidecars as duration markers.

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

FFmpeg and other dependencies are distributed under their own licenses. Packaged builds include `LICENSE`, `NOTICE`, generated `licenses.txt`, and `SOURCE.md` in their resources `legal` folder. **Help → Licenses** opens the bundled dependency notices offline.

Public releases provide matching application source and corresponding source for bundled FFmpeg builds alongside binary downloads. See the [distribution checklist](docs/distribution.md) for the source archives and provenance records required before publication.

## Contributing and support

Please open bugs and feature requests in this repository's [Issues](https://github.com/duongk/cut2resolve/issues), and use [Discussions](https://github.com/duongk/cut2resolve/discussions) for questions.
