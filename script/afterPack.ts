// electron-builder afterPack hook: fail the build if the bundled ffmpeg/ffprobe are missing or don't run.
// electron-builder only warns when an `extraResources` source doesn't exist, so a missing ffmpeg would otherwise ship silently.
import assert from 'node:assert';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Arch } from 'electron-builder';
import type { AfterPackContext } from 'electron-builder';
import { execa } from 'execa';

export default async function afterPack({ appOutDir, arch, electronPlatformName, packager }: AfterPackContext) {
  const resourcesDir = packager.getResourcesDir(appOutDir);
  for (const name of ['LICENSE', 'NOTICE', 'licenses.txt', 'SOURCE.md', 'FFmpeg-GPL-3.0.txt']) {
    assert(existsSync(join(resourcesDir, 'legal', name)), `Packaged legal/${name} is missing`);
  }
  for (const name of ['ffmpeg', 'ffprobe']) {
    const path = join(resourcesDir, electronPlatformName === 'win32' ? `${name}.exe` : name);
    assert(existsSync(path), `${path} is missing. Did you run download-ffmpeg for ${electronPlatformName}-${Arch[arch]}?`);

    // If the binary can run on this machine, check that it does (e.g. not a broken download or missing libraries).
    // Mac App Store builds have electronPlatformName 'mas', so they're not run (the dmg builds use the same binaries)
    if (electronPlatformName === process.platform && Arch[arch] === process.arch) {
      // Like the app does on Linux (see src/main/ffmpeg.ts)
      const { stdout } = await execa(path, ['-hide_banner', '-version'], { env: { LD_LIBRARY_PATH: resourcesDir } });
      console.log(stdout.split('\n')[0]);
    }
  }
  if (electronPlatformName === process.platform && Arch[arch] === process.arch) {
    const ffmpegPath = join(resourcesDir, electronPlatformName === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
    const reports = await Promise.all(['-version', '-buildconf', '-L'].map(async (option) => {
      const { stdout, stderr } = await execa(ffmpegPath, ['-hide_banner', option]);
      return `$ ffmpeg ${option}\n${stdout}\n${stderr}`;
    }));
    await writeFile(join(resourcesDir, 'legal', 'FFMPEG-BUILD.txt'), reports.join('\n\n'));
  }
}
