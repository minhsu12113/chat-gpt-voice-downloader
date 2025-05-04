import { Button } from '@/ui/components/ui/button';
import { cn } from '@/ui/components/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
	FileAudioIcon,
	PlayIcon,
	FolderOpenIcon,
	PencilIcon,
	TrashIcon,
	AlertTriangleIcon,
} from 'lucide-react';
import { type DownloadedFile } from '@/ui/components/pages/HomePage';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/ui/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { vi } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';

interface DownloadHistoryProps {
	downloads: DownloadedFile[];
	onPlayFile: (file: DownloadedFile) => void;
	onRenameFile: (file: DownloadedFile) => void;
	onDeleteFile: (file: DownloadedFile) => void;
	onOpenFolder: (file: DownloadedFile) => void;
	className?: string;
}

export default function DownloadHistory({
	downloads,
	onPlayFile,
	onRenameFile,
	onDeleteFile,
	onOpenFolder,
	className,
}: DownloadHistoryProps) {
	const { t, i18n } = useTranslation('home');

	const getLocale = () => {
		switch (i18n.language) {
			case 'vi':
				return vi;
			default:
				return enUS;
		}
	};

	if (downloads.length === 0) {
		return (
			<div className={cn('text-center py-8', className)}>
				<FileAudioIcon className='h-12 w-12 mx-auto text-muted-foreground' />
				<p className='mt-2 text-muted-foreground'>{t('history.empty')}</p>
			</div>
		);
	}

	return (
		<div className={cn('space-y-2', className)}>
			{downloads.map((file, index) => (
				<div
					key={index}
					className={cn(
						'flex items-center justify-between p-3 rounded-md border transition-colors',
						file.isFound
							? 'hover:bg-accent/50'
							: 'opacity-70 border-dashed hover:bg-destructive/10'
					)}>
					<div className='flex items-center space-x-3'>
						{file.isFound ? (
							<FileAudioIcon className='h-6 w-6 text-primary' />
						) : (
							<div className='relative'>
								<FileAudioIcon className='h-6 w-6 text-muted-foreground' />
								<AlertTriangleIcon className='h-3 w-3 text-destructive absolute -top-1 -right-1' />
							</div>
						)}
						<div className='space-y-1'>
							<div className='flex items-center'>
								<p
									className={cn(
										'font-medium leading-none',
										!file.isFound && 'text-muted-foreground line-through'
									)}>
									{file.fileName}
								</p>
								{!file.isFound && (
									<span className='ml-2 text-xs text-destructive'>Not found</span>
								)}
							</div>
							<p className='text-xs text-muted-foreground'>
								{formatDistanceToNow(new Date(file.downloadedAt), {
									addSuffix: true,
									locale: getLocale(),
								})}
							</p>
						</div>
					</div>

					<div className='flex items-center space-x-1  '>
						<Button
							variant={'outline'}
							onClick={() => onPlayFile(file)}
							title={t('history.play')}
							disabled={!file.isFound}>
							<PlayIcon className='h-4 w-4' />
						</Button>

						<Button
							variant='outline'
							onClick={() => onOpenFolder(file)}
							title={t('history.openFolder')}
							disabled={!file.isFound}>
							<FolderOpenIcon className='h-4 w-4' />
						</Button>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='outline'>
									<MoreVertical className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem onClick={() => onRenameFile(file)} disabled={!file.isFound}>
									<PencilIcon className='h-4 w-4 mr-2' />
									{t('history.rename')}
								</DropdownMenuItem>
								<DropdownMenuItem
									className='text-destructive focus:text-destructive'
									onClick={() => onDeleteFile(file)}>
									<TrashIcon className='h-4 w-4 mr-2' />
									{t('history.delete')}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			))}
		</div>
	);
}
