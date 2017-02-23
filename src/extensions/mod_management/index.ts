import {IExtensionContext} from '../../types/IExtensionContext';
import {ITableAttribute} from '../../types/ITableAttribute';
import {ITestResult} from '../../types/ITestResult';
import {activeGameId, currentActivator, downloadPath, installPath} from '../../util/selectors';
import {getSafe} from '../../util/storeHelper';

import {IDownload} from '../download_management/types/IDownload';

import {addMod, removeMod} from './actions/mods';
import {setActivator} from './actions/settings';
import {modsReducer} from './reducers/mods';
import {settingsReducer} from './reducers/settings';
import {IInstall} from './types/IInstall';
import {IMod} from './types/IMod';
import {IModActivator} from './types/IModActivator';
import {IStatePaths} from './types/IStateSettings';
import {ITestSupported} from './types/ITestSupported';
import * as basicInstaller from './util/basicInstaller';
import refreshMods from './util/refreshMods';
import supportedActivators from './util/supportedActivators';
import ActivationButton from './views/ActivationButton';
import DeactivationButton from './views/DeactivationButton';
import ModList from './views/ModList';
import Settings from './views/Settings';

import InstallManager from './InstallManager';

import * as Promise from 'bluebird';
import * as fs from 'fs-extra-promise';
import * as path from 'path';

let activators: IModActivator[] = [];

let installManager: InstallManager;

interface IInstaller {
  priority: number;
  testSupported: ITestSupported;
  install: IInstall;
}

let installers: IInstaller[] = [];

export interface IExtensionContextExt extends IExtensionContext {
  registerModAttribute: (attribute: ITableAttribute) => void;
  registerModActivator: (activator: IModActivator) => void;
  registerInstaller: (priority: number, testSupported: ITestSupported, install: IInstall) => void;
}

function registerModActivator(activator: IModActivator) {
  activators.push(activator);
}

function registerInstaller(priority: number, testSupported: ITestSupported, install: IInstall) {
  installers.push({ priority, testSupported, install });
}

function init(context: IExtensionContextExt): boolean {
  context.registerMainPage('cubes', 'Mods', ModList, {
    hotkey: 'M',
    visible: () => activeGameId(context.api.store.getState()) !== undefined,
  });

  context.registerIcon('application-icons', ActivationButton, () => {
    return {
      key: 'activate-button',
      activators,
    };
  });

  context.registerIcon('application-icons', DeactivationButton, () => {
    return {
      key: 'deactivate-button',
      activators,
    };
  });

  const validActivatorCheck = () => new Promise<ITestResult>((resolve, reject) => {
    const state = context.api.store.getState();
    if (supportedActivators(activators, state).length > 0) {
      return resolve(undefined);
    }

    const messages = activators.map(
      (activator) => `${activator.name} - ${activator.isSupported(state)}`);

    return resolve({
      description: {
        short: 'In the current constellation, mods can\'t be activated.',
        long: messages.join('\n'),
      },
      severity: 'error',
      automaticFix: () => new Promise<void>((fixResolve, fixReject) => {
        context.api.events.emit('show-modal', 'settings');
        context.api.events.on('hide-modal', (modal) => {
          if (modal === 'settings') {
            fixResolve();
          }
        });
      }),
    });
  });

  context.registerTest('valid-activator', 'gamemode-activated', validActivatorCheck);
  context.registerTest('valid-activator', 'settings-changed', validActivatorCheck);


  context.registerSettings('Mods', Settings, () => ({activators}));

  context.registerReducer(['settings', 'mods'], settingsReducer);
  context.registerReducer(['persistent', 'mods'], modsReducer);

  context.registerModActivator = registerModActivator;
  context.registerInstaller = registerInstaller;

  registerInstaller(1000, basicInstaller.testSupported, basicInstaller.install);

  context.once(() => {
    const store: Redux.Store<any> = context.api.store;

    if (installManager === undefined) {
      installManager = new InstallManager(() => installPath(store.getState()));
      installers.forEach((installer: IInstaller) => {
        installManager.addInstaller(installer.priority, installer.testSupported, installer.install);
      });
    }

    context.api.events.on('gamemode-activated', (newGame: string) => {
      let configuredActivator = currentActivator(store.getState());
      let supported = supportedActivators(activators, store.getState());
      if (supported.find((activator: IModActivator) =>
        activator.id === configuredActivator) === undefined) {
        // current activator is not valid for this game. This should only occur
        // if compatibility of the activator has changed
        if (supported.length > 0) {
          context.api.store.dispatch(setActivator(supported[0].id));
        }
      }

      let knownMods = Object.keys(getSafe(store.getState(), ['persistent', 'mods', newGame], {}));
      refreshMods(installPath(store.getState()), knownMods, (mod: IMod) => {
        context.api.store.dispatch(addMod(newGame, mod));
      }, (modNames: string[]) => {
        modNames.forEach((name: string) => {
          context.api.store.dispatch(removeMod(newGame, name));
        });
      })
        .then(() => {
          context.api.events.emit('mods-refreshed');
        });
    });

    context.api.onStateChange(
      ['settings', 'mods', 'paths'],
      (previous: { [gameId: string]: IStatePaths }, current: { [gameId: string]: IStatePaths }) => {
        const gameMode = activeGameId(store.getState());
        if (previous[gameMode] !== current[gameMode]) {
          let knownMods = Object.keys(store.getState().persistent.mods[gameMode]);
          refreshMods(installPath(store.getState()), knownMods, (mod: IMod) => {
            context.api.store.dispatch(addMod(gameMode, mod));
          }, (modNames: string[]) => {
            modNames.forEach((name: string) => {
              context.api.store.dispatch(removeMod(gameMode, name)); });
          });
        }
      });

    context.api.events.on(
        'start-install',
        (archivePath: string, callback?: (error, id: string) => void) => {
          installManager.install(null, archivePath,
                                 activeGameId(store.getState()), context.api,
                                 {}, true, callback);
        });

    context.api.events.on(
        'start-install-download',
        (downloadId: string, callback?: (error, id: string) => void) => {
          let download: IDownload =
              store.getState().persistent.downloads.files[downloadId];
          let fullPath: string = path.join(downloadPath(store.getState()), download.localPath);
          installManager.install(downloadId, fullPath, download.game, context.api,
                                 download.modInfo, true, callback);
        });

    context.api.events.on(
        'remove-mod', (modId: string, callback?: (error: Error) => void) => {
          let mods: {[id: string]: IMod};
          let fullPath: string;
          const gameMode = activeGameId(store.getState());
          try {
            mods = store.getState().persistent.mods[gameMode];
            fullPath = path.join(installPath(store.getState()),
                                 mods[modId].installationPath);
          } catch (err) {
            callback(err);
          }
          fs.removeAsync(fullPath)
              .then(() => {
                store.dispatch(removeMod(gameMode, modId));
                callback(null);
              })
              .catch((err) => { callback(err); });
        });
  });

  return true;
}

export default init;
