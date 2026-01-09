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
  const { audioFiles, tracks, clips, createClip, addChannel } = useMixerStore();
  const audioFileList = Object.values(audioFiles);

  const handleDragStart = (e: React.DragEvent, audioFileId: string) => {
    e.dataTransfer.setData('audio-file-id', audioFileId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDoubleClick = (audioFileId: string) => {
    const trackList = Object.values(tracks);
    const emptyTrack = trackList.find(
      (track) => !Object.values(clips).some((clip) => clip.trackId === track.id)
    );

    if (emptyTrack) {
      createClip(audioFileId, emptyTrack.id, 0);
    } else {
      const channelId = addChannel();
      const newTracks = useMixerStore.getState().tracks;
      const newTrack = Object.values(newTracks).find((t) => t.channelId === channelId);
      if (newTrack) {
        createClip(audioFileId, newTrack.id, 0);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <DropZone onFilesDropped={onFilesDropped} />

      {audioFileList.length > 0 && (
        <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-32">
          {audioFileList.map((file) => (
            <div
              key={file.id}
              draggable
              onDragStart={(e) => handleDragStart(e, file.id)}
              onDoubleClick={() => handleDoubleClick(file.id)}
              className="flex items-center gap-2 p-2 bg-gray-700 rounded cursor-grab hover:bg-gray-600 transition-colors"
              title="Drag to timeline or double-click to add to empty channel"
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
                <div className="text-xs text-gray-200 truncate">
                  {file.name}
                </div>
                <div className="text-xs text-gray-500">
                  {file.duration.toFixed(1)}s
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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

      <main className="flex-1 overflow-hidden">
        <Timeline onSeek={handleSeek} />
      </main>

      <footer className="border-t border-gray-700 flex-shrink-0 flex">
        <div className="flex-1 border-r border-gray-700 p-3 overflow-x-auto">
          <ChannelList />
        </div>

        <div className="w-80 p-3 flex-shrink-0 overflow-y-auto">
          <FileLibrary onFilesDropped={handleFilesDropped} />
        </div>
      </footer>
    </div>
  );
}
