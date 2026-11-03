import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execa } from 'execa';

import { macRelease, windowsLinuxRelease } from './ffmpegReleases.ts';

/** Runs before every package, including direct electron-builder invocations. */
export default async function prepareDistribution() {
  const dir = join('dist', 'distribution-notices');
  await mkdir(dir, { recursive: true });
  const { stdout: notices } = await execa(process.execPath, ['.yarn/releases/yarn-4.18.0.cjs', 'licenses', 'generate-disclaimer', '-R']);
  if (!notices.trim()) throw new Error('Dependency license generation returned no notices');
  const licenses = `${notices}\n\nBundled FFmpeg is distributed under the GNU GPL; its applicable version depends on the build configuration.\nThe Windows build uses GPL version 3 or later. See FFmpeg-GPL-3.0.txt, any included FFMPEG-BUILD.txt, and SOURCE.md.\nThe application's GPL-2.0-only license is in LICENSE.\n`;
  await writeFile(join(dir, 'licenses.txt'), licenses);
  // Retain the separate release asset for existing download links.
  await writeFile('licenses.txt', licenses);
  await Promise.all(['LICENSE', 'NOTICE'].map((name) => copyFile(name, join(dir, name))));
  await copyFile('third_party/FFmpeg-GPL-3.0.txt', join(dir, 'FFmpeg-GPL-3.0.txt'));
  const { stdout: commit } = await execa('git', ['rev-parse', 'HEAD']);
  const { stdout: changes } = await execa('git', ['status', '--porcelain', '--untracked-files=normal']);
  const { version } = JSON.parse(await readFile('package.json', 'utf8')) as { version: string };
  const sourceNotice = `# Corresponding source for cut2resolve ${version}

Repository: https://github.com/duongk/cut2resolve
Build base commit: ${commit}
Working tree: ${changes.trim() ? 'MODIFIED — this is a development build; the base commit alone does not reproduce these changes.' : 'clean'}

For public releases, download cut2resolve-source-${commit}.zip beside the binary
on the same release page. It contains the exact application source, yarn.lock,
and build scripts. A repository homepage or a moving branch alone is insufficient.
Do not publicly distribute a modified development build without its full matching source.

Bundled FFmpeg binary release pins:
- macOS: https://github.com/mifi/ffmpeg-build-script/releases/tag/${macRelease}
- Windows/Linux: https://github.com/mifi/ffmpeg-builds/releases/tag/${windowsLinuxRelease}

These upstream links identify the binary suppliers; they are NOT a substitute for
complete corresponding source. Each public release must also provide the matching
FFmpeg source and all bundled-library source, patches, configuration, and build
scripts beside its binaries. Consult docs/distribution.md in the source archive
for the required release checklist and provenance records.

This program is GPL-2.0-only. See LICENSE, NOTICE, and licenses.txt.
`;
  await writeFile(join(dir, 'SOURCE.md'), sourceNotice);
}

if (process.argv.includes('--generate')) await prepareDistribution();
