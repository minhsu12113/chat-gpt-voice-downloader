import { useState } from 'react';
import { Button } from '@/ui/components/ui/button';
import { Input } from '@/ui/components/ui/input';
import { useToast } from '@/ui/components/hooks/use-toast';
import { DownloadIcon } from 'lucide-react';
import { Separator } from './ui/separator';
import { getFileNameFromDateTime } from './lib/utils';
import { useTranslation } from 'react-i18next';
interface DownloadFormProps {
	onDownloadSuccess: (filePath: string, fileName: string) => void;
}

export default function DownloadForm({ onDownloadSuccess }: DownloadFormProps) {
	const [cmdCurl, setCurl] = useState('');
	const [isDownloading, setIsDownloading] = useState(false);
	const [downloadedMB, setDownloadedMB] = useState(0);
	const [downloadSpeed, setDownloadSpeed] = useState(0);
	const { toast } = useToast();
	const { t } = useTranslation('home');

	const handleDownload = async () => {
		if (!cmdCurl.trim()) {
			toast({
				title: 'Error',
				description: 'Please enter a valid URL',
				variant: 'destructive',
			});
			return;
		}

		let removeProgressListener: () => void;
		let removeSuccessListener: () => void;
		let removeErrorListener: () => void;

		const cleanupAllListeners = () => {
			removeProgressListener();
			removeSuccessListener();
			removeErrorListener();
		};

		setIsDownloading(true);
		setDownloadedMB(0);
		setDownloadSpeed(0);

		try {
			removeProgressListener = window.electron.onDownloadProgress(
				({ downloadedMB, speed }) => {
					setDownloadedMB(downloadedMB);
					setDownloadSpeed(speed);
				}
			);

			const filePath= await window.electron.getDownloadPath();
			const fileName = `${getFileNameFromDateTime()}.mp3`;
			window.electron.downloadVoice(cmdCurl, filePath, fileName);

			removeSuccessListener = window.electron.onDownloadSuccess((filePath: string) => {
				setIsDownloading(false);
				cleanupAllListeners();
				onDownloadSuccess(filePath, fileName);
				toast({
					title: t('toast.downloadComplete'),
					description: t('toast.downloadCompleteDesc', { fileName }),
			});
			});

			removeErrorListener = window.electron.onDownloadError((error: Error) => {
				setIsDownloading(false);
				cleanupAllListeners();
				toast({
					title: 'Download Error',
					description: error.message,
					variant: 'destructive',
			});
			});
		} catch (error) {
			toast({
				title: 'Download Error',
				description: error instanceof Error ? error.message : 'An unknown error occurred',
				variant: 'destructive',
			});
		}
	};

	return (
		<div className='space-y-4'>
			<div className='flex space-x-2'>
				<Input
					className='flex-1'
					placeholder={t('form.placeholder')}
					value={cmdCurl}
					onChange={(e) => setCurl(e.target.value)}
					disabled={isDownloading}
				/>
				<Button onClick={handleDownload} disabled={isDownloading || !cmdCurl.trim()}>
					<DownloadIcon className='mr-2 h-4 w-4' />
					{t('form.download')}
				</Button>
			</div>

			{isDownloading && (
				<div className='flex justify-center p-2'>
					<div className='flex gap-2 text-sm text-muted-foreground '>
						<span>Downloading...</span>
						<span>{downloadedMB.toFixed(2)} MB</span>
						<Separator orientation='vertical' />
						<span>{downloadSpeed.toFixed(2)} MB/s</span>
					</div>
				</div>
			)}
		</div>
	);
}
