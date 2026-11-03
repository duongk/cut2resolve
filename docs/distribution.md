# Distribution and corresponding source

cut2resolve is GPL-2.0-only. Preserve LICENSE, NOTICE, upstream copyright
notices, and dependency licenses when distributing modified or original builds.

## Notices inside every package

The electron-builder `beforePack` hook generates dependency notices and build
provenance. Every platform package contains `legal/LICENSE`, `legal/NOTICE`,
`legal/licenses.txt`, and `legal/SOURCE.md` inside its resources directory
(`Contents/Resources/legal` on macOS). Help → Licenses opens the bundled notices.
Packaging fails if any of these files are missing. To generate them separately,
run `yarn generate-licenses`.

The legal folder also contains FFmpeg's GPLv3 text. The Windows supplier's build
enables version 3 and reports GPLv3-or-later; do not describe it as GPLv2-only.
Native packages record the actual FFmpeg version, configuration and license in
`legal/FFMPEG-BUILD.txt`. For cross-architecture packages, collect the same report
on a compatible machine before public distribution. This does not change the
application's GPL-2.0-only license.

## Public-release checklist

Do not publish until all items below are complete. Signing does not replace
source-distribution or attribution requirements.

1. Build from a clean, committed release revision. Preserve the release tag and
   full commit ID. Do not publish local test packages with uncommitted changes
   unless their complete matching source, including those changes, is supplied.
2. Offer `cut2resolve-source-<commit>.zip` beside each downloadable binary on the
   same release page, with equally accessible downloads. The tagged build workflow
   creates this archive with `git archive` from the checked-out revision. It must
   include application source, LICENSE, NOTICE, yarn.lock, and the scripts needed
   to build and install it. A link to the latest branch is insufficient.
3. For every platform/architecture, preserve the exact bundled FFmpeg binaries
   and DLLs/libraries and record their SHA-256 hashes. Save the output of
   `ffmpeg -version`, `ffmpeg -buildconf`, and `ffprobe -version` from that package.
   The binary supplier release pins are in `script/ffmpegReleases.ts` and are
   included in `legal/SOURCE.md`.
4. Obtain and archive the complete corresponding source for those exact FFmpeg
   builds: FFmpeg revision, patches, configuration and build scripts, and source
   and required notices for bundled third-party libraries. Include shared-library
   dependencies shipped in the package, not just FFmpeg's own source. Inspect the
   supplier's release/build records; do not assume a current FFmpeg tarball or a
   supplier repository homepage corresponds to the downloaded binary.
5. Upload those source bundles alongside the application source and binaries.
   Include a manifest mapping every platform/architecture to binary hashes,
   source revisions, source-archive filenames and hashes, and build instructions.
   If exact corresponding source cannot be established, do not distribute that
   binary; produce a documented build from available source instead.
6. Check generated dependency notices against the actual packaged dependencies,
   including renderer dependencies bundled by Vite. Supply any additional source
   required by their licenses. Retain Electron/Chromium's existing notice files.
7. Extract the final archive or inspect the app bundle: confirm all four legal
   files are present, Help → Licenses works offline, and source download links
   and filenames match the release. Keep source downloads available with the
   associated binaries; never replace a release asset with a different build
   under the same filename/version.

The workflow automates the application-source archive and packaged notices.
The exact FFmpeg/dependency source bundles and their manifest require maintainer
verification before publication; upstream binary links alone do not satisfy this
checklist. This procedure uses accompanying source downloads rather than relying
on a written offer to provide source later.
