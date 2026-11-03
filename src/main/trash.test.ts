// eslint-disable-next-line import-js/no-extraneous-dependencies
import { expect, test } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { moveToLocalTrash } from './trash.js';

test('moves files recoverably and preserves existing Trash contents', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cut2resolve-trash-'));
  try {
    const source = join(dir, 'clip.MP4');
    await writeFile(source, 'original');
    await moveToLocalTrash(source);
    await expect(stat(source)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await readFile(join(dir, 'Trash', 'clip.MP4'), 'utf8')).toBe('original');
    await writeFile(source, 'second');
    await moveToLocalTrash(source);
    expect(await readFile(join(dir, 'Trash', 'clip.MP4'), 'utf8')).toBe('original');
    expect(await readFile(join(dir, 'Trash', 'clip-1.MP4'), 'utf8')).toBe('second');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('preserves Proxy subfolders and leaves source intact when destination is blocked', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cut2resolve-trash-'));
  try {
    await mkdir(join(dir, 'Proxy'));
    const source = join(dir, 'Proxy', 'clip.MP4');
    await writeFile(source, 'proxy');
    const destination = join(dir, 'Trash', 'Proxy', 'clip.MP4');
    await moveToLocalTrash(source, destination);
    expect(await readFile(destination, 'utf8')).toBe('proxy');
    await writeFile(source, 'keep');
    await writeFile(join(dir, 'blocked'), 'file');
    await expect(moveToLocalTrash(source, join(dir, 'blocked', 'clip.MP4'))).rejects.toThrow(/ENOTDIR|EEXIST/);
    expect(await readFile(source, 'utf8')).toBe('keep');
    await expect(moveToLocalTrash(join(dir, 'missing.MP4'))).resolves.toBeUndefined();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('concurrent requests keep both files with the same destination name', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cut2resolve-trash-'));
  try {
    const first = join(dir, 'first.MP4');
    const second = join(dir, 'second.MP4');
    const destination = join(dir, 'Trash', 'clip.MP4');
    await writeFile(first, 'first');
    await writeFile(second, 'second');
    await Promise.all([moveToLocalTrash(first, destination), moveToLocalTrash(second, destination)]);
    expect(await readFile(destination, 'utf8')).toBe('first');
    expect(await readFile(join(dir, 'Trash', 'clip-1.MP4'), 'utf8')).toBe('second');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
