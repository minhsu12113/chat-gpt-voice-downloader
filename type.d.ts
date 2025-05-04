/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
	interface ProgressData {
		downloadedMB: number;
		speed: number;
	} 

	interface Window {
		electron: {
			downloadVoice: (curlCmd: string,filePath: string,fileName: string) => void;
			onDownloadProgress: (callback: (data: ProgressData) => void) => () =>  void;
			onDownloadSuccess: (callback: (filePath: string, fileName: string) => void)  => () => void;
      onDownloadError: (callback: (error: Error) => void) => () =>  void;
			
			getDownloadPath: () => Promise<string>;
			selectDownloadPath: () => Promise<string | undefined>; 
			loadAudioFile: (filePath: string) => Promise<string>;
 
			checkFileExists: (filePath: string) => Promise<boolean>;
			renameFile: (oldPath: string, newPath: string) => Promise<string | undefined>;
			deleteFile: (filePath: string) => Promise<boolean>;
			openFileLocation: (filePath: string) => void;
			
      invoke: (channel: string, ...args: any[]) => Promise<any> | undefined;
      on: (channel: string, callback: (...args: any[]) => void) => void;
		};
	}
}

export {};
