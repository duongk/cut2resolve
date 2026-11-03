import { lstat, mkdir, rename } from 'node:fs/promises';
import { basename, dirname, join, parse } from 'node:path';

/** Move recoverably on every platform; never invoke system trash or delete files. */
async function moveToLocalTrashSerial(path: string, fallbackPath: string) {
  try {
    await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }

  const { dir, name, ext } = parse(fallbackPath);
  await mkdir(dir, { recursive: true });
  let destination = fallbackPath;
  for (let suffix = 1; ; suffix += 1) {
    try {
      await lstat(destination);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      break;
    }
    destination = join(dir, `${name}-${suffix}${ext}`);
  }
  // Stay on the source volume. If moving fails, leave the source intact.
  await rename(path, destination);
}

let pendingMove = Promise.resolve();

/** Serialize destination selection so concurrent requests cannot overwrite each other. */
export function moveToLocalTrash(path: string, fallbackPath = join(dirname(path), 'Trash', basename(path))) {
  const move = pendingMove.then(() => moveToLocalTrashSerial(path, fallbackPath));
  pendingMove = move.catch(() => { /* Keep later requests usable; this caller still receives the rejection. */ });
  return move;
}
