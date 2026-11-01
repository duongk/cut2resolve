import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import isEqual from 'lodash/isEqual';

import isDev from '../isDev';
import { saveLlcProject, saveResolveMarkerManifest } from '../edlStore';
import { mapSaveableSegments } from '../segments';
import { getOutPath, getSuffixedOutPath } from '../util';
import { basename } from '../util/path';
import type { ClipMetadata, GetFrameCount, StateSegment } from '../types';
import { errorToast } from '../swal';
import i18n from '../i18n';


export default ({ autoSaveProjectFile, storeProjectInWorkingDir, filePath, customOutDir, cutSegments, getFrameCount, clipMetadata }: {
  autoSaveProjectFile: boolean,
  storeProjectInWorkingDir: boolean,
  filePath: string | undefined,
  customOutDir: string | undefined,
  cutSegments: StateSegment[],
  getFrameCount: GetFrameCount,
  clipMetadata: ClipMetadata,
}) => {
  const projectSuffix = 'proj.llc';
  // New LLC format can be stored along with input file or in working dir (customOutDir)
  const getEdlFilePath = useCallback((fp?: string, cod?: string) => getSuffixedOutPath({ customOutDir: cod, filePath: fp, nameSuffix: projectSuffix }), []);
  const getProjectFileSavePath = useCallback((storeProjectInWorkingDirIn: boolean) => getEdlFilePath(filePath, storeProjectInWorkingDirIn ? customOutDir : undefined), [getEdlFilePath, filePath, customOutDir]);
  const projectFileSavePath = useMemo(() => getProjectFileSavePath(storeProjectInWorkingDir), [getProjectFileSavePath, storeProjectInWorkingDir]);
  const resolveMarkerSavePath = useMemo(() => (filePath == null ? undefined : getOutPath({ filePath, fileName: `${basename(filePath)}.resolve-markers.json` })), [filePath]);

  const currentSaveOperation = useMemo(() => {
    if (!projectFileSavePath) return undefined;
    return { cutSegments, projectFileSavePath, filePath, clipMetadata };
  }, [clipMetadata, cutSegments, filePath, projectFileSavePath]);

  // NOTE: Could lose a save if user closes too fast, but not a big issue I think
  const [debouncedSaveOperation] = useDebounce(currentSaveOperation, isDev ? 2000 : 500);

  // eslint-disable-next-line @eslint-react/naming-convention-ref-name -- TODO fix (new rule in @mifi/lint-config)
  const lastSaveOperation = useRef<typeof debouncedSaveOperation>(undefined);

  useEffect(() => {
    async function save() {
      try {
        if (!autoSaveProjectFile
          || !debouncedSaveOperation
          || debouncedSaveOperation.filePath == null
        ) {
          return;
        }

        const shouldSaveProject = debouncedSaveOperation.cutSegments.length > 0
          // Don't create an LLC file from the initial untouched segment.
          && !(debouncedSaveOperation.cutSegments[0]?.initial && debouncedSaveOperation.cutSegments[0].selected);
        const shouldSaveMarkerManifest = shouldSaveProject || Object.keys(debouncedSaveOperation.clipMetadata).length > 0;
        if (!shouldSaveProject && !shouldSaveMarkerManifest) return;

        if (lastSaveOperation.current && lastSaveOperation.current.projectFileSavePath === debouncedSaveOperation.projectFileSavePath && isEqual(mapSaveableSegments(lastSaveOperation.current.cutSegments), mapSaveableSegments(debouncedSaveOperation.cutSegments)) && isEqual(lastSaveOperation.current.clipMetadata, debouncedSaveOperation.clipMetadata)) {
          console.log('Segments unchanged, skipping save');
          return;
        }

        console.log('Saving project file', debouncedSaveOperation.projectFileSavePath, debouncedSaveOperation.cutSegments);
        await Promise.all([
          shouldSaveProject ? saveLlcProject({ savePath: debouncedSaveOperation.projectFileSavePath, mediaFilePath: debouncedSaveOperation.filePath, cutSegments: debouncedSaveOperation.cutSegments }) : undefined,
          shouldSaveMarkerManifest && resolveMarkerSavePath != null ? saveResolveMarkerManifest({ savePath: resolveMarkerSavePath, mediaFilePath: debouncedSaveOperation.filePath, cutSegments: debouncedSaveOperation.cutSegments, getFrameCount, clipMetadata: debouncedSaveOperation.clipMetadata }) : undefined,
        ]);
        lastSaveOperation.current = debouncedSaveOperation;
      } catch (err) {
        errorToast(i18n.t('Unable to save project file'));
        console.error('Failed to save project file', err);
      }
    }
    save();
  }, [debouncedSaveOperation, autoSaveProjectFile, getFrameCount, resolveMarkerSavePath]);

  return {
    getEdlFilePath,
    projectFileSavePath,
    getProjectFileSavePath,
  };
};
