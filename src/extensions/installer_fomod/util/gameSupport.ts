import { app as appIn, remote } from 'electron';
import * as path from 'path';

const app = appIn || remote.app;

function bethIni(gamePath: string, iniName: string) {
  return path.join(app.getPath('documents'), 'My Games', gamePath, iniName + '.ini');
}

function toWordExp(input: string): string {
  return '(^|/)' + input + '(/|$)';
}

const gamebryoTopLevel: string[] = ['distantlod', 'textures', 'meshes', 'music', 'shaders', 'video',
      'interface', 'fonts', 'scripts', 'facegen', 'menus', 'lodsettings', 'lsdata', 'sound',
      'strings', 'trees', 'asi'];

const gamebryoPatterns: string[] = [
  '[^/]*\\.esp$',
  '[^/]*\\.esm$',
  '[^/]*\\.esl$',
  'fomod/ModuleConfig.xml$',
].concat(gamebryoTopLevel.map(toWordExp));

const uniPatterns: string[] = ['fomod'].map(toWordExp);

function stopPatterns(gameMode: string) {
  switch (gameMode) {
    case 'fallout3': return [].concat(uniPatterns, gamebryoPatterns, ['fose'].map(toWordExp));
    case 'falloutnv': return [].concat(uniPatterns, gamebryoPatterns, ['nvse'].map(toWordExp));
    case 'fallout4': return [].concat(uniPatterns, gamebryoPatterns, ['f4se'].map(toWordExp));
    case 'fallout4vr': return [].concat(uniPatterns, gamebryoPatterns, ['f4se'].map(toWordExp));
    case 'oblivion': return [].concat(uniPatterns, gamebryoPatterns, ['obse'].map(toWordExp));
    case 'morrowind': return [].concat(uniPatterns, gamebryoPatterns, ['mwse'].map(toWordExp));
    case 'skyrim': return [].concat(uniPatterns, gamebryoPatterns,
                                    ['skse', 'SkyProc Patchers'].map(toWordExp));
    case 'skyrimse': return [].concat(uniPatterns, gamebryoPatterns,
                                      ['skse'].map(toWordExp));
    case 'dragonsdogma': return ['movie', 'rom', 'sa', 'sound', 'system', 'tgs',
                                 'usershader', 'usertexture'].map(toWordExp).concat(uniPatterns);
    case 'stateofdecay': return ['characters', 'dialog', 'Entities', 'languages',
                                  'levels', 'libs', 'objects', 'scripts',
                                   'sounds'].map(toWordExp).concat(uniPatterns);
    case 'witcher2': return ['abilities', 'characters', 'combat', 'cutscenes',
                              'engine', 'environment', 'environment_levels', 'fx',
                              'game', 'globals', 'items', 'junk', 'levels', 'reactions',
                              'speedtree', 'templates', 'tests'].map(toWordExp).concat(uniPatterns);
    default: return [].concat(uniPatterns);
  }
}

interface IGameSupport {
  iniPath?: string;
  stopPatterns: string[];
  pluginPath?: string;
  nativePlugins?: string[];
}

const gameSupport: { [gameId: string]: IGameSupport } = {
  dragonsdogma: {
    stopPatterns: stopPatterns('dragonsdogma'),
  },
  fallout4: {
    iniPath: bethIni('Fallout4', 'Fallout4'),
    stopPatterns: stopPatterns('fallout4'),
    pluginPath: 'Data',
    nativePlugins: [
      'fallout4.esm',
      'dlcrobot.esm',
      'dlcworkshop01.esm',
      'dlccoast.esm',
      'dlcultrahighresolution.esm',
      'dlcworkshop02.esm',
      'dlcworkshop03.esm',
      'dlcnukaworld.esm',
      'ccbgsfo4001-pipboy(black).esl',
      'ccbgsfo4002-pipboy(blue).esl',
      'ccbgsfo4003-pipboy(camo01).esl',
      'ccbgsfo4004-pipboy(camo02).esl',
      'ccbgsfo4006-pipboy(chrome).esl',
      'ccbgsfo4012-pipboy(red).esl',
      'ccbgsfo4014-pipboy(white).esl',
      'ccbgsfo4016-prey.esl',
      'ccbgsfo4017-mauler.esl',
      'ccbgsfo4018-gaussrifleprototype.esl',
      'ccbgsfo4019-chinesestealtharmor.esl',
      'ccbgsfo4020-powerarmorskin(black).esl',
      'ccbgsfo4038-horsearmor.esl',
      'ccbgsfo4039-tunnelsnakes.esl',
      'ccbgsfo4041-doommarinearmor.esl',
      'ccbgsfo4042-bfg.esl',
      'ccbgsfo4043-doomchainsaw.esl',
      'ccbgsfo4044-hellfirepowerarmor.esl',
      'ccfsvfo4001-modularmilitarybackpack.esl',
      'ccfsvfo4002-midcenturymodern.esl',
      'ccfrsfo4001-handmadeshotgun.esl',
      'cceejfo4001-decorationpack.esl',
    ],
  },
  fallout4vr: {
    iniPath: bethIni('Fallout4VR', 'Fallout4Custom'),
    stopPatterns: stopPatterns('fallout4'),
    pluginPath: 'Data',
    nativePlugins: [
      'fallout4.esm',
      'dlcrobot.esm',
      'dlcworkshop01.esm',
      'dlccoast.esm',
      'dlcultrahighresolution.esm',
      'dlcworkshop02.esm',
      'dlcworkshop03.esm',
      'dlcnukaworld.esm',
    ],
  },
  fallout3: {
    iniPath: bethIni('Fallout3', 'Fallout3'),
    stopPatterns: stopPatterns('fallout3'),
    pluginPath: 'Data',
    nativePlugins: [
      'fallout3.esm',
      'anchorage.esm',
      'thepitt.esm',
      'brokensteel.esm',
      'pointlookout.esm',
      'zeta.esm',
    ],
  },
  falloutnv: {
    iniPath: bethIni('FalloutNV', 'Fallout'),
    stopPatterns: stopPatterns('falloutnv'),
    pluginPath: 'Data',
    nativePlugins: [
      'falloutnv.esm',
    ],
  },
  morrowind: {
    iniPath: bethIni('Morrowind', 'Morrowind'),
    stopPatterns: stopPatterns('morrowind'),
    pluginPath: 'Data',
    nativePlugins: [
      'morrowind.esm',
    ],
  },
  oblivion: {
    iniPath: bethIni('Oblivion', 'Oblivion'),
    stopPatterns: stopPatterns('oblivion'),
    pluginPath: 'Data',
    nativePlugins: [
      'oblivion.esm',
    ],
  },
  skyrim: {
    iniPath: bethIni('Skyrim', 'Skyrim'),
    stopPatterns: stopPatterns('skyrim'),
    pluginPath: 'Data',
    nativePlugins: [
      'skyrim.esm',
      'update.esm',
    ],
  },
  skyrimse: {
    iniPath: bethIni('Skyrim Special Edition', 'Skyrim'),
    stopPatterns: stopPatterns('skyrimse'),
    pluginPath: 'Data',
    nativePlugins: [
      'skyrim.esm',
      'update.esm',
      'dawnguard.esm',
      'hearthfires.esm',
      'dragonborn.esm',
    ],
  },
  witcher2: {
    stopPatterns: stopPatterns('witcher2'),
  },
};

export function getIniFilePath(gameMode: string) {
  if ((gameSupport[gameMode] === undefined)
      || (gameSupport[gameMode].iniPath === undefined)) {
    return '';
  }

  return gameSupport[gameMode].iniPath;
}

export function getStopPatterns(gameMode: string) {
  if ((gameSupport[gameMode] === undefined)
      || (gameSupport[gameMode].stopPatterns === undefined)) {
    return [];
  }

  return gameSupport[gameMode].stopPatterns;
}

export function getPluginPath(gameMode: string) {
  if ((gameSupport[gameMode] === undefined)
      || (gameSupport[gameMode].pluginPath === undefined)) {
    return null;
  }

  return gameSupport[gameMode].pluginPath;
}

export function getNativePlugins(gameMode: string) {
  if ((gameSupport[gameMode] === undefined)
    || (gameSupport[gameMode].nativePlugins === undefined)) {
    return [];
  }

  return gameSupport[gameMode].nativePlugins;
}
