import AudioPlayer from '@/ui/components/AudioPlayer';
import DownloadForm from '@/ui/components/DownloadForm';
import DownloadHistory from '@/ui/components/DownloadHistory';
import PathSettings from '@/ui/components/PathSettings';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/ui/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/components/ui/tabs';
import { useToast } from '@/ui/components/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Volume1Icon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import { Slider } from '../ui/slider';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useTranslation } from 'react-i18next';

export interface DownloadedFile {
	id: string;
	fileName: string;
	filePath: string;
	downloadedAt: string;
	base64Audio: string;
	isFound: boolean;
}

export default function HomePage() {
	const [downloadedFiles, setDownloadedFiles] = useState<DownloadedFile[]>([]);
	const [currentFile, setCurrentFile] = useState<DownloadedFile | null>(null);
	const { toast } = useToast();
	const [isVolumeOpen, setIsVolumeOpen] = useState(false);
	const [volume, setVolume] = useState(50);
	const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
	const [fileToRename, setFileToRename] = useState<DownloadedFile | null>(null);
	const [newFileName, setNewFileName] = useState('');
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [fileToDelete, setFileToDelete] = useState<DownloadedFile | null>(null);
	const { t } = useTranslation('home');

	useEffect(() => {
		const loadFilesAndCheckExistence = async () => {
			try {
				const savedFiles = localStorage.getItem('download-history');

				if (savedFiles) {
					const files: DownloadedFile[] = JSON.parse(savedFiles);
					const updatedFiles = await Promise.all(
						files.map(async (file) => {
							const exists = await window.electron.checkFileExists(file.filePath);
							return { ...file, isFound: exists };
						})
					);

					setDownloadedFiles(updatedFiles);
				}
			} catch (error) {
				console.error('Failed to load download history:', error);
			}
		};

		loadFilesAndCheckExistence();
	}, []);

	const getVolumeIcon = () => {
		if (volume === 0) return <VolumeXIcon className='h-5 w-5' />;
		if (volume < 50) return <Volume1Icon className='h-5 w-5' />;
		return <Volume2Icon className='h-5 w-5' />;
	};

	useEffect(() => {
		localStorage.setItem('download-history', JSON.stringify(downloadedFiles));
	}, [downloadedFiles]);

	const handleDownloadSuccess = (filePath: string, fileName: string) => {
		const newFile: DownloadedFile = {
			id: Date.now().toString(),
			fileName,
			filePath,
			downloadedAt: new Date().toISOString(),
			base64Audio: '',
			isFound: true,
		};
		setDownloadedFiles([newFile, ...downloadedFiles]);
		handlePlayFile(newFile);

		toast({
			title: t('toast.downloadComplete'),
			description: t('toast.downloadCompleteDesc', { fileName }),
		});
	};

	const handlePlayFile = async (file: DownloadedFile) => {
		try {
			const exists = await window.electron.checkFileExists(file.filePath);

			if (!exists) {
				setDownloadedFiles((prevFiles) =>
					prevFiles.map((f) => (f.id === file.id ? { ...f, isFound: false } : f))
				);

				toast({
					title: t('toast.fileNotFound'),
					description: t('toast.fileNotFoundDesc', { fileName: file.fileName }),
					variant: 'destructive',
				});
				return;
			}

			const base64Audio = await window.electron.loadAudioFile(file.filePath);
			setCurrentFile({
				...file,
				base64Audio,
				isFound: true,
			});
		} catch (error) {
			toast({
				title: t('toast.errorPlayingFile'),
				description: error instanceof Error ? error.message : 'An unknown error occurred',
				variant: 'destructive',
			});
		}
	};

	const handleRenameFile = async () => {
		if (!fileToRename || !newFileName.trim()) return;

		try {
			const newFileNameWithoutEx = newFileName.replace(/\.[^.]+$/, '');
			const newFileNameWithEx = `${newFileNameWithoutEx}.mp3`;
			const newFilePath = await window.electron.renameFile(
				fileToRename.filePath,
				newFileNameWithEx
			);
			if (newFilePath) {
				setDownloadedFiles((prevFiles) =>
					prevFiles.map((file) =>
						file.id === fileToRename.id
							? { ...file, fileName: newFileNameWithEx, filePath: newFilePath }
							: file
					)
				);

				if (currentFile && currentFile.id === fileToRename.id) {
					setCurrentFile({
						...currentFile,
						fileName: newFileNameWithEx,
						filePath: newFilePath,
					});
				}

				toast({
					title: t('toast.fileRenamed'),
					description: t('toast.fileRenamedDesc', { fileName: newFileNameWithEx }),
				});
			} else {
				throw new Error('Failed to rename file');
			}
		} catch (error) {
			toast({
				title: t('toast.renameFailed'),
				description: error instanceof Error ? error.message : 'An unknown error occurred',
				variant: 'destructive',
			});
		} finally {
			setIsRenameDialogOpen(false);
			setFileToRename(null);
			setNewFileName('');
		}
	};

	const handleDeleteFile = async () => {
		if (!fileToDelete) return;

		try {
			if (fileToDelete.isFound) {
				const deleted = await window.electron.deleteFile(fileToDelete.filePath);
				if (!deleted) {
					throw new Error('Failed to delete file');
				}
			}

			setDownloadedFiles((prevFiles) =>
				prevFiles.filter((file) => file.id !== fileToDelete.id)
			);

			if (currentFile && currentFile.id === fileToDelete.id) {
				setCurrentFile(null);
			}

			toast({
				title: t('toast.fileDeleted'),
				description: t('toast.fileDeletedDesc', { fileName: fileToDelete.fileName }),
			});
		} catch (error) {
			toast({
				title: t('toast.deleteFailed'),
				description: error instanceof Error ? error.message : 'An unknown error occurred',
				variant: 'destructive',
			});
		} finally {
			setIsDeleteDialogOpen(false);
			setFileToDelete(null);
		}
	};

	const handleOpenRenameDialog = (file: DownloadedFile) => {
		setFileToRename(file);
		setNewFileName(file.fileName);
		setIsRenameDialogOpen(true);
	};

	const handleOpenDeleteDialog = (file: DownloadedFile) => {
		setFileToDelete(file);
		setIsDeleteDialogOpen(true);
	};

	const handleOpenFolder = (file: DownloadedFile) => {
		if (file.isFound) {
			window.electron.openFileLocation(file.filePath);
		} else {
			toast({
				title: 'File not found',
				description: 'Cannot open folder for a file that no longer exists.',
				variant: 'destructive',
			});
		}
	};

	return (
		<div className='space-y-6 p-4 max-w-4xl mx-auto'>
			<Card>
				<CardHeader>
					<CardTitle className='text-2xl'>{t('appTitle')}</CardTitle>
					<CardDescription>{t('appDescription')} </CardDescription>
				</CardHeader>
				<CardContent>
					<DownloadForm onDownloadSuccess={handleDownloadSuccess} />
				</CardContent>
			</Card>

			{currentFile && (
				<Card>
					<CardHeader>
						<div className='flex justify-between items-center '>
							<div>
								<CardTitle>{t('player.nowPlaying')}</CardTitle>
								<CardDescription>{currentFile.fileName}</CardDescription>
							</div>

							<Popover open={isVolumeOpen} onOpenChange={setIsVolumeOpen}>
								<PopoverTrigger asChild>
									<Button
										variant='ghost'
										size='icon'
										className='h-12 w-12 rounded-full  dark:text-accent hover:dark:text-accent-foreground'
										onClick={() => setIsVolumeOpen(true)}>
										{getVolumeIcon()}
									</Button>
								</PopoverTrigger>
								<PopoverContent className='w-64 p-4' side='top'>
									<div className='space-y-2'>
										<div className='flex items-center justify-between'>
											<span className='text-sm font-medium'>Âm lượng</span>
											<span className='text-sm text-muted-foreground'>{volume}%</span>
										</div>
										<Slider
											value={[volume]}
											max={100}
											step={1}
											onValueChange={(value) => setVolume(value[0])}
											className='cursor-pointer'
										/>
									</div>
								</PopoverContent>
							</Popover>
						</div>
					</CardHeader>
					<CardContent>
						<div>
							<AudioPlayer base64Audio={currentFile.base64Audio} volume={volume} />
						</div>
					</CardContent>
				</Card>
			)}

			<Tabs defaultValue='history'>
				<TabsList className='grid w-full grid-cols-2'>
					<TabsTrigger value='history'>{t('tabs.history')}</TabsTrigger>
					<TabsTrigger value='settings'>{t('tabs.settings')}</TabsTrigger>
				</TabsList>
				<TabsContent value='history'>
					<Card>
						<CardHeader>
							<CardTitle>{t('history.title')}</CardTitle>
							<CardDescription>{t('history.description')}</CardDescription>
						</CardHeader>
						<CardContent>
							<DownloadHistory
								downloads={downloadedFiles}
								onPlayFile={handlePlayFile}
								onRenameFile={handleOpenRenameDialog}
								onDeleteFile={handleOpenDeleteDialog}
								onOpenFolder={handleOpenFolder}
							/>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value='settings'>
					<Card>
						<CardHeader>
							<CardTitle>{t('settings:title')}</CardTitle>
							<CardDescription>{t('settings:description')}</CardDescription>
						</CardHeader>
						<CardContent>
							<PathSettings />
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Rename File</DialogTitle>
						<DialogDescription>
						{t('rename.description')}
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='grid grid-cols-4 items-center gap-4'>
							<Label htmlFor='name' className='text-right'>
								{t('rename.label')}
							</Label>
							<Input
								id='name'
								value={newFileName}
								onChange={(e) => setNewFileName(e.target.value)}
								className='col-span-3'
								autoFocus
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant='outline' onClick={() => setIsRenameDialogOpen(false)}>
							{t('rename.cancel')}
						</Button>
						<Button onClick={handleRenameFile} disabled={!newFileName.trim()}>
							{t('rename.confirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('delete.title')}</DialogTitle>
						<DialogDescription>
							{fileToDelete?.isFound
								? t('delete.descriptionExists')
								: t('delete.descriptionMissing')}
						</DialogDescription>
					</DialogHeader>
					<div className='py-3 text-center'>
						{ t('delete.confirmation', {fileName: fileToDelete?.fileName})}?
					</div>
					<DialogFooter>
						<Button variant='outline' onClick={() => setIsDeleteDialogOpen(false)}>
							{t('delete.cancel')}
						</Button>
						<Button variant='destructive' onClick={handleDeleteFile}>
							{t('delete.confirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
