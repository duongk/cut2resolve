# Documentation

Please read the documentation before creating an issue. Thank you 🙏

## FAQ

See the [❓ FAQ](faq.md), for example [is LosslessCut free?](faq.md#is-losslesscut-free-whats-the-difference-between-the-app-store-and-github-versions) and [commonly requested features](faq.md#commonly-requested-features).

## Troubleshooting

If you have a problem with the app or with a file, please see the [🤔 Troubleshooting, known issues and limitations](troubleshooting.md).

## Usage: Typical workflow

New to LosslessCut? See [🚀 Getting started](getting-started.md) for a typical workflow.

## Primer: Video/audio codecs vs. formats

Here's a little primer about video and audio formats for those not familiar. A common mistake when dealing with audio and video files, is to confuse *formats*, *codecs*, and *file names*. In short: A file's media format is a *container* that holds one or more *codecs* (audio/video/subtitle) inside of it. For example `.mov` is a *container format*, and `H265`/`HEVC` is a *codec*. Some formats support only a few kinds of codecs inside of them (e.g. `.wav`), while others support almost all codecs (e.g. Matroska). The most common formats are MP4/MOV (often `.mp4`,`.mov`,`.m4a`) and Matroska (often `.mkv`,`.mka`). Example: If you have a file named `My video.mp4`, this file most likely (but not necessarily) has the *format* `MP4`. Note that the extension of a file (in this case `.mp4`) doesn't really mean anything, and the file could in reality for example have the `MOV` format, or the extension could be `.txt`. Inside `My video.mp4` there are multiple tracks/streams, each with their own *codec*. In this example, let's say that it contains one `H264` track and one `AAC` track. In LosslessCut you can view and add/delete/modify these tracks.

**Remuxing**: If you change the output format in LosslessCut and export a file, you are *remuxing* the tracks/codecs into a different container format. When you do this, the operation is in theory lossless, meaning you will not lose any codec data and the different tracks will remain exactly the same, even though the format is now different (but some format metadata might get lost due to incompatibilities between container formats). There are limitations: Some popular codecs like VP8 or VP9 are not supported in popular formats like MP4, and some popular formats like Matroska (`.mkv`) are not natively supported in popular video players like iPhone or QuickTime.

If you want to reduce the size of a file using LosslessCut you have to "get rid of" something, either:
- Reduce the duration of the file (cut off start/end)
- Remove one or more tracks/streams (e.g. remove an audio track that you don't need)
Other than that you it's not possible convert a file losslessly to reduce its size, unless you re-encode and lose quality. For that, I recommend using a different tool like e.g. [HandBrake](https://handbrake.fr/).

Here is a great introduction to audio/video: [howvideo.works](https://howvideo.works/).

## Segments

Segments are the first class citizens of LosslessCut. A segment is a time-slice of your source media file, defined by a *start time* and an *end time*. When a segment has no *end time*, it's called a *[marker](#markers)*.
Segments have a segment number (their export order), and can optionally have a label and tags. Segments are be the basis of what gets exported.

### Markers

A segment that has no *end time* is called a *marker*. It has no length and will be excluded from exports, but behaves similar to segments. Markers are distinctively visualized on the timeline with a vertical line and a number on top. You can convert markers to segments by setting their out-point (<kbd>O</kbd>). This can be done manually or automated with one of the many tools in LosslessCut. For example you can invert all segments on the timeline to convert all markers into segments.

## Tracks

Tracks are different from segments, in that the tracks run in parallel. For example most videos have one video track and one audio track. When cutting, LosslessCut will cut all tracks equally, although there are some tracks that [cannot be cut](troubleshooting.md). The LosslessCut tracks panel is used to selectively enable/disable individual tracks for export and edit track or file metadata. It can also be used to change [content disposition.](https://github.com/mifi/lossless-cut/discussions/2291)

## Import/export projects

LosslessCut default project file `.llc` is in a JSON5 format. It contains information about the segments in your timeline. LosslessCut also allows importing/exporting your project (segments) in a variety of file formats. See [list of supported formats](https://github.com/mifi/lossless-cut/issues/1340).

### CSV files

- The CSV export/import function takes CSV files with one cut segment on each line. Each line contains three columns: `segment start`, `segment end`, `label`.
- `segment start` and `segment end` are expressed in seconds. `segment end` may be empty, in that case it's a marker.
- Use comma `,` to separate the fields (**not** semicolon `;`)

#### Example `.csv` file

```csv
,56.9568,First segment starting at 0
70,842.33,"Another quoted label"
1234,,Last marker starting at 1234 seconds
```

### TSV files

Same as CSV but `<tab>` instead.

### DaVinci Resolve Media Pool duration markers

**File → Export project → DaVinci Resolve marker sidecar** creates an adjacent `<original>.resolve-markers.json` file for the currently opened source clip. It is intended for logging: every segment with an In and Out point becomes a blue duration marker; its label becomes the marker name and its tags become the marker note. Segments with no Out point are not exported.

1. Once, use **File → Export project → Install DaVinci Resolve importer**. It installs `cut2resolve import.py` in Resolve's user script folder and opens that folder for you. Restart Resolve or refresh its Scripts menu:
   - macOS: `~/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts/Utility/`
   - Windows: `%APPDATA%\Blackmagic Design\DaVinci Resolve\Support\Fusion\Scripts\Utility\`
2. With **Auto save project file** enabled in Settings, LosslessCut automatically writes and updates each marker sidecar beside its original file after range changes. The Clip metadata panel above Segments to export stores its description, projects, keywords, rating and status in the same sidecar; it never changes the camera original. Keep the sidecar with the source when moving or copying media. You can also export one manually.
3. In Resolve, import the original source clips into the Media Pool. Do not import a proxy in their place.
4. Run the one importer from **Workspace → Scripts → Utility**. It processes every imported original that has its adjacent sidecar.

The importer finds sidecars only by starting from each imported original's full file path. It will not import, move, relink, transcode, or modify original files. It does not scan or change a `Proxy` subfolder. Running it again updates markers previously created by the importer while preserving any manual Resolve marker at the same frame.

The same importer also updates Resolve clip **Description**, **Keywords**, and **Rating** from the Clip metadata panel, and attempts to update **Projects** and **Status** when those metadata fields are available in Resolve. Segment **Notes** become the Resolve marker note, while segment **Keywords** are added as a labeled line in that note because Resolve markers do not have a separate keywords field.

Resolve allows only one marker at a given source frame. Existing manual markers are left untouched; the script reports any range it could not add. Keep the `.llc` project as the portable source of truth and export a fresh sidecar after changing its ranges.

## More

- [🚀 Getting started](getting-started.md)
- [❓ FAQ](faq.md)
- [🤔 Troubleshooting, known issues and limitations](troubleshooting.md)
- [📝 Recipe cookbook](recipes.md)
- [📲 Installation](installation.md)
- [✅ Requirements](requirements.md)
- [👨‍💻 JavaScript expressions](expressions.md)
- [🦾 Batch processing](batch.md)
- [📄 Export file name template documentation](file-name-template.md).
- [💻 Command line interface (CLI)](cli.md)
- [🕸️ HTTP API](api.md)
