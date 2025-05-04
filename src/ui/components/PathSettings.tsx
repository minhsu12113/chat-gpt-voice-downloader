import { Button } from '@/ui/components/ui/button';
import { Input } from '@/ui/components/ui/input';
import { useToast } from '@/ui/components/hooks/use-toast';
import { FolderIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PathSettings() {
	const [downloadPath, setDownloadPath] = useState('');
	const { toast } = useToast();
	const { t } = useTranslation('settings');
	useEffect(() => {
		const fetchPath = async () => {
			try {
				const path = await window.electron.getDownloadPath();
				setDownloadPath(path);
			} catch (error) {
				console.error('Failed to get download path:', error);
			}
		};

		fetchPath();
	}, []);

	const handleSelectPath = async () => {
		try {
			const path = await window.electron.selectDownloadPath();
			if (path) {
				setDownloadPath(path);
				toast({
					title: t('toast.pathUpdated'),
					description: t('toast.pathUpdatedDesc', { path }),
				});
			}
		} catch {
			toast({
				title: t('toast.pathError'),
				description: t('toast.pathErrorDesc'),
				variant: 'destructive',
			});
		}
	};

	return (
		<div className='space-y-4'>
			<div className='flex space-x-2'>
				<Input value={downloadPath} readOnly className='flex-1' />
				<Button onClick={handleSelectPath}>
					<FolderIcon className='mr-2 h-4 w-4' />
					{t('downloadPath.browse')}
				</Button>
			</div>
			<p className='text-sm text-muted-foreground'>{t('downloadPath.description')} </p>
		</div>
	);
}
