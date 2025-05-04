import { Button } from '@/ui/components/ui/button';
import { Slider } from '@/ui/components/ui/slider';
import { cn } from '@/ui/components/lib/utils';
import { FastForward, PauseIcon, PlayIcon, Rewind } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface AudioPlayerProps {
	base64Audio: string;
	volume: number;
	className?: string;
}

export default function AudioPlayer({ base64Audio, className, volume }: AudioPlayerProps) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	useEffect(() => { 
		const audioElement = audioRef.current;
		if (audioElement) { 
			audioElement.src = base64Audio;
			audioElement.load();
			audioElement
				.play()
				.then(() => {
					setIsPlaying(true);
				})
				.catch((error) => {
					console.error('Error playing audio:', error);
				});
		}

		return () => {
			if (audioElement) {
				audioElement.pause();
			}
		};
	}, [base64Audio]);

	useEffect(() => {
		const audioElement = audioRef.current;
		if (!audioElement) return;

		const handleTimeUpdate = () => {
			setCurrentTime(audioElement.currentTime);
		};

		const handleDurationChange = () => {
			setDuration(audioElement.duration);
		};

		const handleEnded = () => {
			setIsPlaying(false);
			setCurrentTime(0);
		};

		audioElement.addEventListener('timeupdate', handleTimeUpdate);
		audioElement.addEventListener('durationchange', handleDurationChange);
		audioElement.addEventListener('ended', handleEnded);

		return () => {
			audioElement.removeEventListener('timeupdate', handleTimeUpdate);
			audioElement.removeEventListener('durationchange', handleDurationChange);
			audioElement.removeEventListener('ended', handleEnded);
		};
	}, []);

	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = volume / 100;
		}
	}, [volume]);

	const togglePlayPause = () => {
		const audioElement = audioRef.current;
		if (!audioElement) return;

		if (isPlaying) {
			audioElement.pause();
		} else {
			audioElement.play().catch((error) => {
				console.error('Error playing audio:', error);
			});
		}
		setIsPlaying(!isPlaying);
	};

	const seekTo = (value: number[]) => {
		const audioElement = audioRef.current;
		if (audioElement) {
			const newTime = value[0];
			audioElement.currentTime = newTime;
			setCurrentTime(newTime);
		}
	};

	const formatTime = (time: number) => {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
	};

	const skipBackward = () => {
		if (audioRef.current) {
			audioRef.current.currentTime = Math.max(0, currentTime - 10);
		}
	};

	const skipForward = () => {
		if (audioRef.current) {
			audioRef.current.currentTime = Math.min(duration, currentTime + 10);
		}
	};

	return (
		<div className={cn('space-y-4', className)}>
			<audio ref={audioRef} />

			<div className='space-y-1'>
				<Slider
					value={[currentTime]}
					max={duration || 100}
					step={0.1}
					onValueChange={seekTo}
				/>
				<div className='flex justify-between text-xs text-muted-foreground'>
					<span>{formatTime(currentTime)}</span>
					<span>{formatTime(duration || 0)}</span>
				</div>
			</div>

			<div className='flex items-center justify-center space-x-2'>
				<Button
					variant='ghost'
					size='icon'
					onClick={skipBackward}
					disabled={!duration}
					className='h-12 w-12 rounded-full dark:text-accent hover:dark:text-accent-foreground'>
					<Rewind className='h-5 w-5  ' />
				</Button>

				<Button
					variant='outline'
					size='icon'
					className='h-12 w-12 rounded-full'
					onClick={togglePlayPause}
					disabled={!duration}>
					{isPlaying ? <PauseIcon className='h-5 w-5' /> : <PlayIcon className='h-5 w-5' />}
				</Button>

				<Button
					className='h-12 w-12 rounded-full dark:text-accent hover:dark:text-accent-foreground'
					size='icon'
					variant='ghost'
					onClick={skipForward}
					disabled={!duration}>
					<FastForward className='h-5 w-5 ' />
				</Button>
			</div> 
		</div>
	);
}
