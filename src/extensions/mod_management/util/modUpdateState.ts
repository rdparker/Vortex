import * as fs from '../../../util/fs';
import { getSafe } from '../../../util/storeHelper';
import { IModWithState } from '../types/IModProps';

import versionClean from './versionClean';

import * as path from 'path';

export type UpdateState =
  'bug-update' | 'bug-update-site' | 'bug-disable' |
  'update' | 'update-site' | 'current' | 'install';

function updateState(mod: IModWithState, downloadPath: string, mods: {}): UpdateState {
  const fileId: string = getSafe(mod.attributes, ['fileId'], undefined);
  const version: string = getSafe(mod.attributes, ['version'], undefined);
  const newestFileId: string = getSafe(mod.attributes, ['newestFileId'], undefined);
  const newestVersion: string = getSafe(mod.attributes, ['newestVersion'], undefined);
  const bugMessage: string = getSafe(mod.attributes, ['bugMessage'], undefined);

  let hasUpdate = false;
  if ((newestFileId !== undefined) && (fileId !== undefined) && (newestFileId !== fileId)) {
    hasUpdate = true;
  } else if ((newestVersion !== undefined) && (version !== undefined)
             && (versionClean(newestVersion) !== versionClean(version))) {
    hasUpdate = true;
  }

  if (hasUpdate) {
    // if the newest file id is unknown this means there *is* an update (according to the
    // site-specific update mechanism) but we don't know which file it is
    if (newestFileId === 'unknown') {
      return bugMessage ? 'bug-update-site' : 'update-site';
    } else {
      return bugMessage ? 'bug-update' : 'update';
    }
  } else {
    return bugMessage ? 'bug-disable' : 'current';
  }
}

export default updateState;
