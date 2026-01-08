import { useEffect } from 'react';
import { TransportBar } from './TransportBar';
import { ChannelList } from './ChannelList';
import { Timeline } from './Timeline';
import { DropZone } from '~/components/ui/DropZone';
import { useMixerStore } from '~/store/mixerStore';
import { useAudioEngine } from '~/hooks/useAudioEngine';

function FileLibrary({
  onFilesDropped,
}: {
  onFilesDropped: (files: File[]) => void;
}) {
  const { audioFiles, tracks, createClip } = useMixerStore();
  const audioFileList = Object.values(audioFiles);

  const handleDragStart = (e: React.DragEvent, audioFileId: string) => {
    e.dataTransfer.setData('audio-file-id', audioFileId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const firstTrackId = Object.keys(tracks)[0];

  return (
    <div className="border-t border-gray-700 bg-gray-800">
      <div className="p-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Audio Files
        </h2>
      </div>

      <div className="p-3">
        <DropZone onFilesDropped={onFilesDropped} className="mb-3" />

        {audioFileList.length > 0 && (
          <div className="space-y-2">
            {audioFileList.map((file) => (
              <div
                key={file.id}
                draggable
                onDragStart={(e) => handleDragStart(e, file.id)}
                onDoubleClick={() => {
                  if (firstTrackId) {
                    createClip(file.id, firstTrackId, 0);
                  }
                }}
                className="flex items-center gap-2 p-2 bg-gray-700 rounded cursor-grab hover:bg-gray-600 transition-colors"
                title="Drag to timeline or double-click to add to first track"
              >
                <svg
                  className="w-4 h-4 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 truncate">{file.name}</div>
                  <div className="text-xs text-gray-500">
                    {file.duration.toFixed(1)}s
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {audioFileList.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">
            Upload audio files to get started
          </p>
        )}
      </div>
    </div>
  );
}

export function MixerApp() {
  const { addChannel, channels } = useMixerStore();
  const { handlePlay, handlePause, handleStop, handleSeek, handleFilesDropped } =
    useAudioEngine();

  useEffect(() => {
    if (Object.keys(channels).length === 0) {
      addChannel();
    }
  }, [addChannel, channels]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        const { isPlaying } = useMixerStore.getState().transport;
        if (isPlaying) {
          handlePause();
        } else {
          handlePlay();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlay, handlePause]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      <header className="h-14 border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-200">Web Mixer</h1>
        </div>

        <TransportBar
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
        />

        <div className="w-32" />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-48 border-r border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
          <div className="flex-1 overflow-y-auto">
            <ChannelList />
          </div>
          <FileLibrary onFilesDropped={handleFilesDropped} />
        </aside>

        <main className="flex-1 overflow-hidden">
          <Timeline onSeek={handleSeek} />
        </main>
      </div>
    </div>
  );
}
