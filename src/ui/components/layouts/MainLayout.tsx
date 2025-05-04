import { cn } from '@/ui/components/lib/utils';
import { AudioLines, Sun, Moon, Download } from 'lucide-react';
import React, { useContext, useState, useEffect } from 'react';
import { Toggle } from '@/ui/components/ui/toggle';
import { ThemeProviderContext } from '@/ui/components/theme-provider';
import LanguageSwitcher from '@/ui/components/LanguageSwitcher';
import { Button } from '@/ui/components/ui/button';
import { useToast } from '../hooks/use-toast';
import { Progress } from '@/ui/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/components/ui/dialog';

interface MainLayoutProps {
	children: React.ReactNode;
	className?: string;
}

export default function MainLayout({ children, className }: MainLayoutProps) {
	const themContext = useContext(ThemeProviderContext);
	const [theme, setTheme] = useState(themContext.theme);
	const { toast } = useToast();
	const [downloadProgress, setDownloadProgress] = useState(0);
	const [isDownloading, setIsDownloading] = useState(false);

	useEffect(() => {
		if (window.electron) {
			const timer = setTimeout(() => {
				window.electron.invoke('check-for-updates')?.catch((error) => {
					console.error('Error checking for updates on startup:', error);
				});
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, []);

	useEffect(() => {
		if (window.electron) {
			window.electron.on('update-not-available', () => {
				console.log('No updates available');
			});

			window.electron.on('update-available', (info) => {
				toast({
					title: 'Update Available',
					description: `Version ${info.version} is available to download.`,
					action: (
						<Button
							variant='outline'
							onClick={() => {
								window.electron.invoke('start-update');
								setIsDownloading(true);
								setDownloadProgress(0);
							}}>
							Update Now
						</Button>
					),
					duration: 0,
				});
			});

			window.electron.on('update-download-progress', (progressObj) => {
				const percent = progressObj.percent || 0;
				setDownloadProgress(percent);
				setIsDownloading(true);
			});

			window.electron.on('update-downloaded', (info) => {
				setIsDownloading(false);
				toast({
					title: 'Update Downloaded',
					description: `Version ${info.version} will be installed when you restart the app.`,
					action: (
						<Button variant='outline' onClick={() => window.electron.invoke('install-update')}>
							Restart Now
						</Button>
					),
					duration: 0,
				});
			});

			window.electron.on('update-error', (error) => {
				if (isDownloading) {
					setIsDownloading(false);
					console.error('Update error:', error);
					toast({
						title: 'Update Error',
						description: `Failed to download update: ${error.message || error}`,
						variant: 'destructive',
						duration: 5000,
					});
				} else {
					console.error('Update check error:', error);
				}
			});
		}
	}, [isDownloading, toast]);

	return (
		<>
			<div className='flex flex-col min-h-screen bg-background w-full items-center'>
				<header className='sticky top-0 z-10 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/50'>
					<div className='flex h-14 items-center justify-between'>
						<div className='flex items-center space-x-2 px-4'>
							<AudioLines className='h-6 w-6 text-primary' />
							<span className='font-semibold'>Download Voice From Chat GPT</span>
						</div>
						<div className='flex items-center'>
							<LanguageSwitcher />
							<Toggle
								className='mx-2 rounded-full hover:bg-accent transition'
								onClick={() => {
									const themeChange = theme === 'dark' ? 'light' : 'dark';
									setTheme(themeChange);
									themContext.setTheme(themeChange);
								}}
								aria-label='Toggle theme'
								type='button'>
								{theme === 'dark' ? (
									<Sun className='size-4 text-white' />
								) : (
									<Moon className='size-4 text-blue-600' />
								)}
							</Toggle>
						</div>
					</div>
				</header>
				<main className={cn('flex-1 container py-6 w-full', className)}>{children}</main>
				<footer className='w-full border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/50'>
					<div className='flex items-center justify-center h-14'>
						<span className='text-sm text-muted-foreground'>
							Developed by{' '}
							<a
								href='https://www.linkedin.com/in/minh-su-justin-5a5852241/'
								className='underline hover:text-primary'
								onClick={(e) => {
									e.preventDefault();
									if (window.electron) {
										window.electron.invoke(
											'open-external-link',
											'https://www.linkedin.com/in/minh-su-justin-5a5852241/'
										);
									}
								}}>
								Minhsu (Justin)
							</a>
						</span>
					</div>
				</footer>
			</div>

			<Dialog open={isDownloading} onOpenChange={setIsDownloading}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<Download className='h-5 w-5' />
							Downloading Update
						</DialogTitle>
					</DialogHeader>
					<div className='py-6'>
						<div className='flex flex-col gap-4'>
							<Progress value={downloadProgress} className='w-full h-2' />
							<div className='flex justify-between text-sm text-muted-foreground'>
								<span>{downloadProgress.toFixed(1)}% Complete</span>
								{downloadProgress < 100 ? (
									<span>Downloading...</span>
								) : (
									<span>Finalizing update...</span>
								)}
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
