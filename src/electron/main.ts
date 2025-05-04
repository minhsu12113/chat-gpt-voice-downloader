import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { isDev } from './util.js';
import os from 'os';
import { downloadFile } from './downloadVoice.js';
import fs from 'fs';

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

	mainWindow.setAutoHideMenuBar(true)
	mainWindow.setMenuBarVisibility(false)
	mainWindow.setMenu(null); 

	if (isDev()) {
		mainWindow.loadURL('http://localhost:5173');
	} else {
		mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
	}

	const updateProgressDownload = (downloadedMB: number, speed: number,) => {
		mainWindow.webContents.send('download-progress', { downloadedMB, speed, });
	}

	const onDownloadSuccess = (filePath: string, fileName: string) => {
		mainWindow.webContents.send('download-success', filePath, fileName);
	}

	const onDownloadError = (error: Error) => {
		mainWindow.webContents.send('download-error', error);
	}

	ipcMain.on('download-voice', (_, cmdURL, filePath, fileName) => {
		downloadFile({
			curlCmd: cmdURL,
			filePath,
			fileName,
			progressCallback: updateProgressDownload,
			successCallback: onDownloadSuccess,
			errorCallback: onDownloadError,
		})
	});

	ipcMain.handle('get-download-path', async () => {
		const desktopDir = path.join(os.homedir(), 'Music');
		return desktopDir;
	});

	ipcMain.handle('load-audio-file', async (event, filePath) => { 
		const audioData = fs.readFileSync(filePath);
		const base64Audio = audioData.toString('base64');
		return `data:audio/mpeg;base64,${base64Audio}`; 
	})

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

});
