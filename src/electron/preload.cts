/// <reference path="../../type.d.ts" />

import electron = require('electron');

electron.contextBridge.exposeInMainWorld('electron', {
  downloadVoice: (curlCmd: string, filePath: string, fileName: string) =>
    electron.ipcRenderer.send('download-voice', curlCmd, filePath, fileName),

  onDownloadProgress: (callback: (data: ProgressData) => void) => {
    const listener = (_: unknown, data: ProgressData) => callback(data);
    electron.ipcRenderer.on('download-progress', listener);
    return () => electron.ipcRenderer.off('download-progress', listener);
  },

  onDownloadSuccess: (callback: (filePath: string, fileName: string) => void) => {
    const listener = (_: unknown, filePath: string, fileName: string) => callback(filePath, fileName);
    electron.ipcRenderer.on('download-success', listener);
    return () => electron.ipcRenderer.off('download-success', listener);
  },

  onDownloadError: (callback: (error: Error) => void) => {
    const listener = (_: unknown, error: Error) => callback(error);
    electron.ipcRenderer.on('download-error', listener);
    return () => electron.ipcRenderer.off('download-error', listener);
  },

  checkFileExists: (filePath: string) => electron.ipcRenderer.invoke('check-file-exists', filePath),
  renameFile: (oldPath: string, newPath: string) => electron.ipcRenderer.invoke('rename-file', oldPath, newPath),
  deleteFile: (filePath: string) => electron.ipcRenderer.invoke('delete-file', filePath),
  openFileLocation: (filePath: string) => electron.ipcRenderer.send('open-file-location', filePath),

  getDownloadPath: () => electron.ipcRenderer.invoke('get-download-path'),
  selectDownloadPath: () => electron.ipcRenderer.invoke('select-download-path'),
  loadAudioFile: (filePath: string) => electron.ipcRenderer.invoke('load-audio-file', filePath),

  invoke: (channel: string, ...args: any[]) => {
    const validChannels = [
      'check-for-updates',
      'open-external-link',
      'start-update'
    ];
    if (validChannels.includes(channel)) {
      return electron.ipcRenderer.invoke(channel, ...args);
    }
  },

  on: (channel: string, callback: (...args: any[]) => void) => {
    const validChannels = [ 
      'checking-for-update',
      'update-available',
      'update-not-available',
      'update-error',
      'update-download-progress',
      'update-downloaded'
    ];
    if (validChannels.includes(channel)) {
      electron.ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  }

} satisfies Window['electron']);
