import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { isDev } from './util.js';
import os from 'os';
import { downloadFile } from './downloadVoice.js';
import fs from 'fs';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

app.on('ready', () => {
	const mainWindow = new BrowserWindow({
		width: 950,
		height: 700,
		minHeight: 700,
		minWidth: 850,
		webPreferences: {
			preload: path.join(app.getAppPath(), '/dist-electron/preload.cjs'),
			devTools: false,
		},
	}); 

	mainWindow.setAutoHideMenuBar(true);
	mainWindow.setMenuBarVisibility(false);
	mainWindow.setMenu(null);

	if (isDev()) {
		mainWindow.loadURL('http://localhost:5173');
	} else {
		mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
		autoUpdater.updateConfigPath = path.join(app.getAppPath(), '/app-update.yml');
		setTimeout(() => {
			autoUpdater.checkForUpdates().catch((err) => {
				console.error('Error checking for updates:', err);
			});
		}, 3000);
	}

	ipcMain.handle('install-update', () => {
		autoUpdater.quitAndInstall(false, true);
		return true;
	});

	autoUpdater.on('checking-for-update', () =>
		mainWindow.webContents.send('checking-for-update')
	);

	autoUpdater.on('update-available', (info) => {
		mainWindow.webContents.send('update-available', info);
	});

	autoUpdater.on('update-not-available', () => {
		mainWindow.webContents.send('update-not-available');
	});

	autoUpdater.on('error', (err) => {
		mainWindow.webContents.send('update-error', err);
	});

	autoUpdater.on('download-progress', (progressObj) => {
		mainWindow.webContents.send('update-download-progress', progressObj);
	});

	autoUpdater.on('update-downloaded', (info) => {
		mainWindow.webContents.send('update-downloaded', info);

		dialog
			.showMessageBox({
				type: 'info',
				title: 'Update Ready',
				message: `Version ${info.version} has been downloaded and will be installed on restart`,
				buttons: ['Restart Now', 'Later'],
				defaultId: 0,
			})
			.then(({ response }) => {
				if (response === 0) {
					autoUpdater.quitAndInstall(false, true);
				}
			});
	});

	ipcMain.handle('check-for-updates', async () => {
		if (!isDev()) {
			try {
				return await autoUpdater.checkForUpdates();
			} catch (error) {
				console.error('Error checking for updates:', error);
				throw error;
			}
		} 
	});

	ipcMain.handle('start-update', async () => {
		if (!isDev()) {
			try {
				await autoUpdater.downloadUpdate();
				return true;
			} catch (error) {
				console.error('Error downloading update:', error);
				throw error;
			}
		}
	});

	const updateProgressDownload = (downloadedMB: number, speed: number) => {
		mainWindow.webContents.send('download-progress', { downloadedMB, speed });
	};

	const onDownloadSuccess = (filePath: string, fileName: string) => {
		mainWindow.webContents.send('download-success', filePath, fileName);
	};

	const onDownloadError = (error: Error) => {
		mainWindow.webContents.send('download-error', error);
	};

	ipcMain.on('download-voice', (_, cmdURL, filePath, fileName) => {
		downloadFile({
			curlCmd: cmdURL,
			filePath,
			fileName,
			progressCallback: updateProgressDownload,
			successCallback: onDownloadSuccess,
			errorCallback: onDownloadError,
		});
	});

	ipcMain.handle('get-download-path', async () => {
		const desktopDir = path.join(os.homedir(), 'Music');
		return desktopDir;
	});

	ipcMain.handle('load-audio-file', async (event, filePath) => {
		const audioData = fs.readFileSync(filePath);
		const base64Audio = audioData.toString('base64');
		return `data:audio/mpeg;base64,${base64Audio}`;
	});

	ipcMain.handle('select-download-path', async () => {
		const desktopDir = path.join(os.homedir(), 'Music');
		const { filePaths } = await dialog.showOpenDialog({
			properties: ['openDirectory'],
			defaultPath: desktopDir,
		});
		if (filePaths && filePaths.length > 0) {
			return filePaths[0];
		}
		return undefined;
	});

	ipcMain.handle('check-file-exists', async (_, filePath) => {
		try {
			return fs.existsSync(filePath);
		} catch (error) {
			console.error('Error checking file existence:', error);
			return false;
		}
	});

	ipcMain.handle('rename-file', async (_, oldPath, newFileName) => {
		try {
			const dirPath = path.dirname(oldPath);
			const newPath = path.join(dirPath, newFileName);
			if (fs.existsSync(newPath)) {
				throw new Error('A file with this name already exists');
			}
			fs.renameSync(oldPath, newPath);
			return newPath;
		} catch (error) {
			console.error('Error renaming file:', error);
			return undefined;
		}
	});

	ipcMain.handle('delete-file', async (_, filePath) => {
		try {
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
			return true;
		} catch (error) {
			console.error('Error deleting file:', error);
			return false;
		}
	});

	ipcMain.on('open-file-location', (_, filePath) => {
		shell.showItemInFolder(filePath);
	});

	ipcMain.handle('open-external-link', async (_, url) => {
		if (typeof url === 'string') {
			await shell.openExternal(url);
			return true;
		}
		return false;
	});
});
