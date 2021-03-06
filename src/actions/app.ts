import * as reduxAct from 'redux-act';

import safeCreateAction from './safeCreateAction';

const id = input => input;

export const setStateVersion = safeCreateAction('SET_STATE_VERSION');

export const setExtensionEnabled = safeCreateAction('SET_EXTENSION_ENABLED',
  (extensionId: string, enabled: boolean) => ({ extensionId, enabled }));

export const removeExtension = safeCreateAction('REMOVE_EXTENSION', id);

export const forgetExtension = safeCreateAction('FORGET_EXTENSION', id);

export const setInstanceId = safeCreateAction('SET_INSTANCE_ID', id);
