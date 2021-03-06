import { log } from './log';

import * as I18next from 'i18next';
import FSBackend = require('i18next-node-fs-backend');

import * as path from 'path';

const dirName = path.dirname(path.dirname(__dirname));

const basePath = path.normalize(path.join(dirName, 'locales'));
log('info', 'reading localizations', basePath);

let debugging = false;
let currentLanguage = 'en';

interface ITranslationEntry {
  lng: string;
  ns: string;
  key: string;
}
let missingKeys = { common: {} };

export interface IInitResult {
  i18n: I18next.i18n;
  tFunc: I18next.TranslationFunction;
  error?: Error;
}

/**
 * initialize the internationalization library
 *
 * @export
 * @param {string} language
 * @returns {I18next.I18n}
 */
function init(language: string): Promise<IInitResult> {
  currentLanguage = language;
  return new Promise<IInitResult>((resolve, reject) => {
    const res: I18next.i18n = I18next.use(FSBackend).init(
        {
          lng: language,
          fallbackLng: 'en',
          fallbackNS: 'common',

          ns: ['common'],
          defaultNS: 'common',

          nsSeparator: ':::',
          keySeparator: '::',

          debug: false,

          saveMissing: debugging,

          missingKeyHandler: (lng, ns, key, fallbackValue) => {
            if (missingKeys[ns] === undefined) {
              missingKeys[ns] = {};
            }
            missingKeys[ns][key] = key;
          },

          interpolation: {
            escapeValue: false,
          },

          backend: {
            loadPath: path.join(basePath, '{{lng}}', '{{ns}}.json'),
            addPath: path.join(basePath, '{{lng}}', '{{ns}}.missing.json'),
          },
        },
        (error, tFunc) => {
          if ((error !== null) && (error !== undefined)) {
            const trans = str => str;
            return resolve({i18n: res, tFunc: trans, error});
          }
          resolve({i18n: res, tFunc});
        });
    res.on('languageChanged',
           (newLanguage: string) => { currentLanguage = newLanguage; });
  });
}

export function getCurrentLanguage() {
  return currentLanguage;
}

export function debugTranslations(enable?: boolean) {
  debugging = (enable !== undefined)
    ? enable
    : !debugging;
  missingKeys = { common: {} };
  init(I18next.language);
}

export function getMissingTranslations() {
  return missingKeys;
}

export default init;
