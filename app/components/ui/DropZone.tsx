import { useCallback, useState, useRef } from 'react';

interface DropZoneProps {
  onFilesDropped: (files: File[]) => void;
  accept?: string;
  className?: string;
  children?: React.ReactNode;
}

const ACCEPTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/aac',
  'audio/flac',
];

export function DropZone({
  onFilesDropped,
  accept = 'audio/*',
  className = '',
  children,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const filterAudioFiles = useCallback((files: FileList | File[]): File[] => {
    return Array.from(files).filter(
      (file) =>
        ACCEPTED_AUDIO_TYPES.includes(file.type) ||
        file.name.match(/\.(mp3|wav|ogg|webm|aac|flac)$/i)
    );
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCountRef.current = 0;

      const files = filterAudioFiles(e.dataTransfer.files);
      if (files.length > 0) {
        setIsLoading(true);
        onFilesDropped(files);
        setTimeout(() => setIsLoading(false), 500);
      }
    },
    [filterAudioFiles, onFilesDropped]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current--;
    if (dragCountRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        const audioFiles = filterAudioFiles(files);
        if (audioFiles.length > 0) {
          setIsLoading(true);
          onFilesDropped(audioFiles);
          setTimeout(() => setIsLoading(false), 500);
        }
      }
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [filterAudioFiles, onFilesDropped]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onClick={handleClick}
      className={`
        border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer
        ${isDragging
          ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
        }
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        ${className}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      {children || (
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <svg
            className={`w-8 h-8 ${isDragging ? 'text-blue-400' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span className="text-sm">
            {isLoading
              ? 'Loading...'
              : isDragging
              ? 'Drop audio files here'
              : 'Drop audio files or click to browse'}
          </span>
          <span className="text-xs text-gray-500">
            MP3, WAV, OGG, FLAC, AAC
          </span>
        </div>
      )}
    </div>
  );
}
