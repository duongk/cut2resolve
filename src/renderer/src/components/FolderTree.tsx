import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as os from 'node:os';
import { FaChevronDown, FaChevronRight, FaFileVideo, FaFolder, FaFolderOpen, FaHdd, FaHome, FaSync, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import { controlsBackground, darkModeTransition, primaryColor } from '../colors';
import useContextMenu from '../hooks/useContextMenu';
import { basename, extname, join } from '../util/path';


const { readdir, lstat } = window.require('node:fs/promises');
const { homedir, platform } = window.require('@electron/remote').require('node:os') as typeof os;

const mediaExtensions = new Set([
  '.3g2', '.3gp', '.aac', '.aiff', '.amr', '.avi', '.flac', '.m2ts', '.m4a', '.m4v', '.mkv', '.mov', '.mp3', '.mp4', '.mpeg', '.mpg', '.mts', '.mxf', '.ogg', '.opus', '.ts', '.wav', '.webm', '.wmv',
]);

const rowStyle = { display: 'flex', alignItems: 'center', gap: '.35em', width: '100%', minWidth: 0, padding: '.28em .4em', color: 'inherit', background: 'none', border: 0, textAlign: 'left', cursor: 'pointer' } as const;

export type FolderFileAction = 'open' | 'tracks' | 'addToBatch' | 'mergeWithCurrentFile' | 'moveRelatedFiles' | 'trashRelatedFiles';

async function getMountedLocationPaths() {
  if (platform() === 'darwin') {
    try {
      const entries = await readdir('/Volumes', { withFileTypes: true }) as { name: string, isDirectory: () => boolean }[];
      return entries.filter((entry) => entry.isDirectory()).map((entry) => join('/Volumes', entry.name));
    } catch {
      return [];
    }
  }

  if (platform() === 'win32') {
    const candidates = Array.from({ length: 26 }, (_, index) => `${String.fromCodePoint(65 + index)}:\\`);
    const mounted = await Promise.all(candidates.map(async (path) => {
      try {
        return (await lstat(path)).isDirectory() ? path : undefined;
      } catch {
        return undefined;
      }
    }));
    return mounted.filter((path): path is string => path != null);
  }

  return [];
}

function MountedLocations({ folderPath, onOpenLocation }: { folderPath: string, onOpenLocation: (path: string) => void }) {
  const { t } = useTranslation();
  const [mountedPaths, setMountedPaths] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getMountedLocationPaths().then((paths) => {
      if (!cancelled) setMountedPaths(paths);
      return undefined;
    });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const locations = useMemo(() => [
    { path: homedir(), label: t('Home'), Icon: FaHome },
    ...mountedPaths.filter((path) => path !== homedir()).map((path) => ({ path, label: basename(path) || path, Icon: FaHdd })),
  ], [mountedPaths, t]);

  return (
    <div style={{ borderBottom: '1px solid var(--gray-7)', paddingBottom: '.25em' }}>
      <div style={{ padding: '.35em .5em .1em', display: 'flex', alignItems: 'center', color: 'var(--gray-11)', fontSize: '.75em' }}>
        <span>{t('Locations')}</span>
        <div style={{ flexGrow: 1 }} />
        <button type="button" title={t('Refresh locations')} style={{ ...rowStyle, width: 'auto', padding: '.1em' }} onClick={() => setRefreshKey((value) => value + 1)}><FaSync /></button>
      </div>
      {locations.map(({ path, label, Icon }) => (
        <button key={path} type="button" title={path} style={{ ...rowStyle, padding: '.2em .5em', background: folderPath === path ? 'var(--gray-7)' : 'transparent' }} onClick={() => onOpenLocation(path)}>
          <Icon color={primaryColor} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        </button>
      ))}
    </div>
  );
}

function MediaFile({ path, name, depth, selectedPath, hasOpenFile, onFileAction }: {
  path: string,
  name: string,
  depth: number,
  selectedPath: string | undefined,
  hasOpenFile: boolean,
  onFileAction: (path: string, action: FolderFileAction) => void,
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLButtonElement>(null);
  const contextMenuTemplate = useMemo(() => [
    { label: t('Open'), click: () => onFileAction(path, 'open') },
    ...(hasOpenFile ? [{ label: t('Include all tracks from the new file'), click: () => onFileAction(path, 'tracks') }] : []),
    { label: t('Add the file to the batch list'), click: () => onFileAction(path, 'addToBatch') },
    ...(hasOpenFile ? [{ label: t('Merge/concatenate with current file'), click: () => onFileAction(path, 'mergeWithCurrentFile') }] : []),
    { type: 'separator' as const },
    { label: t('Move related camera files…'), click: () => onFileAction(path, 'moveRelatedFiles') },
    { label: t('Move related camera files to Trash…'), click: () => onFileAction(path, 'trashRelatedFiles') },
  ], [hasOpenFile, onFileAction, path, t]);
  useContextMenu(ref, contextMenuTemplate);

  return (
    <button
      type="button"
      ref={ref}
      title={path}
      style={{ ...rowStyle, paddingLeft: `${depth * 14 + 6}px`, background: selectedPath === path ? 'var(--gray-7)' : 'transparent' }}
      onClick={() => onFileAction(path, 'open')}
    >
      <FaFileVideo {...(selectedPath === path ? { color: primaryColor } : {})} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
    </button>
  );
}

function Directory({ path, depth, selectedPath, hasOpenFile, onFileAction }: {
  path: string,
  depth: number,
  selectedPath: string | undefined,
  hasOpenFile: boolean,
  onFileAction: (path: string, action: FolderFileAction) => void,
}) {
  const { t } = useTranslation();
  interface TreeEntry { name: string, path: string, isDirectory: boolean }

  const [expanded, setExpanded] = useState(depth === 0);
  const [entries, setEntries] = useState<TreeEntry[]>();
  const [error, setError] = useState<string>();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!expanded) return undefined;
    let canceled = false;
    readdir(path, { withFileTypes: true }).then((dirents: { name: string, isDirectory: () => boolean, isFile: () => boolean }[]) => {
      if (!canceled) {
        const visible = dirents.flatMap((entry) => {
          if (entry.name.startsWith('.')) return [];
          const entryPath = join(path, entry.name);
          if (entry.isDirectory()) return [{ name: entry.name, path: entryPath, isDirectory: true }];
          if (entry.isFile() && mediaExtensions.has(extname(entry.name).toLowerCase())) return [{ name: entry.name, path: entryPath, isDirectory: false }];
          return [];
        });
        visible.sort((a, b) => (Number(b.isDirectory) - Number(a.isDirectory)) || a.name.localeCompare(b.name, undefined, { numeric: true }));
        setEntries(visible);
        setError(undefined);
      }
      return undefined;
    }).catch((err: unknown) => {
      if (!canceled) setError(err instanceof Error ? err.message : String(err));
    });
    return () => { canceled = true; };
  }, [expanded, path, refreshKey]);

  const toggle = useCallback(() => setExpanded((value) => !value), []);
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);
  const indentation = { paddingLeft: `${depth * 14 + 6}px` };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button type="button" title={expanded ? t('Collapse folder') : t('Expand folder')} style={{ ...rowStyle, ...indentation, flex: 1 }} onClick={toggle}>
          {expanded ? <FaChevronDown size=".7em" /> : <FaChevronRight size=".7em" />}
          {expanded ? <FaFolderOpen color={primaryColor} /> : <FaFolder color={primaryColor} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{basename(path)}</span>
        </button>
        {depth === 0 && <button type="button" title={t('Refresh folder')} style={{ ...rowStyle, width: 'auto' }} onClick={refresh}><FaSync /></button>}
      </div>
      {expanded && (
        <>
          {entries?.map((entry) => (
            entry.isDirectory ? <Directory key={entry.path} path={entry.path} depth={depth + 1} selectedPath={selectedPath} hasOpenFile={hasOpenFile} onFileAction={onFileAction} /> : <MediaFile key={entry.path} path={entry.path} name={entry.name} depth={depth + 1} selectedPath={selectedPath} hasOpenFile={hasOpenFile} onFileAction={onFileAction} />
          ))}
          {entries?.length === 0 && <div style={{ padding: '.2em .5em .2em', paddingLeft: `${(depth + 1) * 14 + 6}px`, color: 'var(--gray-10)', fontSize: '.85em' }}>{t('No media files')}</div>}
          {error && <div title={error} style={{ padding: '.2em .5em', color: 'var(--red-10)', fontSize: '.8em' }}>{t('Unable to read folder')}</div>}
        </>
      )}
    </div>
  );
}

function FolderTree({ folderPath, selectedPath, width, hasOpenFile, onFileAction, onChangeFolder, onOpenLocation, onClose }: {
  folderPath: string,
  selectedPath: string | undefined,
  width: number,
  hasOpenFile: boolean,
  onFileAction: (path: string, action: FolderFileAction) => void,
  onChangeFolder: () => void,
  onOpenLocation: (path: string) => void,
  onClose: () => void,
}) {
  const { t } = useTranslation();
  return (
    <aside className="no-user-select" style={{ width, flexShrink: 0, background: controlsBackground, color: 'var(--gray-12)', borderRight: '1px solid var(--gray-7)', transition: darkModeTransition, overflow: 'auto' }}>
      <div style={{ padding: '.35em .5em', display: 'flex', alignItems: 'center', gap: '.4em', borderBottom: '1px solid var(--gray-7)' }}>
        <span style={{ fontSize: '.85em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t('Folder browser')}</span>
        <div style={{ flexGrow: 1 }} />
        <button type="button" title={t('Choose folder')} style={{ ...rowStyle, width: 'auto', padding: '.2em' }} onClick={onChangeFolder}><FaFolderOpen /></button>
        <button type="button" title={t('Close folder browser')} style={{ ...rowStyle, width: 'auto', padding: '.2em' }} onClick={onClose}><FaTimes /></button>
      </div>
      <MountedLocations folderPath={folderPath} onOpenLocation={onOpenLocation} />
      <Directory path={folderPath} depth={0} selectedPath={selectedPath} hasOpenFile={hasOpenFile} onFileAction={onFileAction} />
    </aside>
  );
}

export default memo(FolderTree);
