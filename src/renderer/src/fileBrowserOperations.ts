import { basename, dirname, join, parse, relative } from './util/path';

const { copyFile, lstat, mkdir, readdir, rename, unlink } = window.require('node:fs/promises');

const exists = async (path: string) => lstat(path).then(() => true).catch(() => false);

/** Finds same-named camera files, `.MOV` proxies, and their Sony/Cut2Resolve sidecars below the source folder. */
export async function findRelatedCameraFiles(filePath: string) {
  const sourceFolder = dirname(filePath);
  const fileName = basename(filePath);
  const { name: stem } = parse(fileName);
  const relatedNames = new Set([fileName, `${stem}M01.XML`, `${fileName}.resolve-markers.json`, `${stem}-proj.llc`]);
  const found: string[] = [];

  async function walk(folder: string, isInProxyFolder: boolean): Promise<void> {
    const entries = await readdir(folder, { withFileTypes: true }) as { name: string, isDirectory: () => boolean, isFile: () => boolean }[];
    await Promise.all(entries.map(async (entry) => {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) return walk(path, isInProxyFolder || entry.name.toLowerCase() === 'proxy');
      const parsedEntry = parse(entry.name);
      const isMatchingMovProxy = isInProxyFolder && parsedEntry.name === stem && parsedEntry.ext.toLowerCase() === '.mov';
      if (entry.isFile() && (relatedNames.has(entry.name) || isMatchingMovProxy)) found.push(path);
      return undefined;
    }));
  }

  await walk(sourceFolder, basename(sourceFolder).toLowerCase() === 'proxy');
  return found.toSorted((a, b) => a.localeCompare(b));
}

function getDestinationFileName({ sourceName, mediaFileName, destinationMediaFileName }: { sourceName: string, mediaFileName: string, destinationMediaFileName: string }) {
  const destinationStem = parse(destinationMediaFileName).name;
  const sourceStem = parse(mediaFileName).name;
  if (sourceName === mediaFileName) return destinationMediaFileName;
  const parsedSourceName = parse(sourceName);
  if (parsedSourceName.name === sourceStem && parsedSourceName.ext.toLowerCase() === '.mov') return `${destinationStem}${parsedSourceName.ext}`;
  if (sourceName === `${sourceStem}M01.XML`) return `${destinationStem}M01.XML`;
  if (sourceName === `${mediaFileName}.resolve-markers.json`) return `${destinationMediaFileName}.resolve-markers.json`;
  if (sourceName === `${sourceStem}-proj.llc`) return `${destinationStem}-proj.llc`;
  return sourceName;
}

async function getAvailableDestinationMediaFileName({ pathsByDirectory, sourceFolder, destinationFolder, mediaFileName }: {
  pathsByDirectory: Map<string, string[]>,
  sourceFolder: string,
  destinationFolder: string,
  mediaFileName: string,
}) {
  const { name, ext } = parse(mediaFileName);
  for (let suffix = 1; ; suffix += 1) {
    const candidate = suffix === 1 ? mediaFileName : `${name}-${suffix - 1}${ext}`;
    const destinationPaths = pathsByDirectory.entries().flatMap(([sourceDir, sourcePaths]) => {
      const destinationDir = join(destinationFolder, relative(sourceFolder, sourceDir));
      return sourcePaths.map((sourcePath) => join(destinationDir, getDestinationFileName({ sourceName: basename(sourcePath), mediaFileName, destinationMediaFileName: candidate })));
    });
    // eslint-disable-next-line no-await-in-loop
    const occupied = await Promise.all(destinationPaths.map((destinationPath) => exists(destinationPath)));
    if (!occupied.some(Boolean)) return candidate;
  }
}

async function moveFile({ sourcePath, destinationPath }: { sourcePath: string, destinationPath: string }) {
  try {
    await rename(sourcePath, destinationPath);
  } catch (error: unknown) {
    // rename cannot cross volumes; copy+remove keeps moves portable between local, external, and network drives.
    if ((error as NodeJS.ErrnoException).code !== 'EXDEV') throw error;
    await copyFile(sourcePath, destinationPath);
    await unlink(sourcePath);
  }
}

/** Moves grouped media plus sidecars, keeping their association after collision renaming. */
export async function moveRelatedCameraFiles({ paths, sourceFolder, destinationFolder, mediaFileName }: {
  paths: string[],
  sourceFolder: string,
  destinationFolder: string,
  mediaFileName: string,
}) {
  const pathsByDirectory = Map.groupBy(paths, dirname);
  const destinationMediaFileName = await getAvailableDestinationMediaFileName({ pathsByDirectory, sourceFolder, destinationFolder, mediaFileName });
  return Promise.all(pathsByDirectory.entries().map(async ([sourceDir, sourcePaths]) => {
    const destinationDir = join(destinationFolder, relative(sourceFolder, sourceDir));
    await mkdir(destinationDir, { recursive: true });
    return Promise.all(sourcePaths.map(async (sourcePath) => {
      const destinationPath = join(destinationDir, getDestinationFileName({ sourceName: basename(sourcePath), mediaFileName, destinationMediaFileName }));
      await moveFile({ sourcePath, destinationPath });
      return { sourcePath, destinationPath };
    }));
  }));
}
