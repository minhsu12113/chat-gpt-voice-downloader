import path from 'path';
import { app } from 'electron';
import { isDev } from './util.js';

export const getPreloadPath = () =>
  path.join(app.getAppPath(), isDev() ? '.' : '.', '/dist-electron/preload.cjs');
