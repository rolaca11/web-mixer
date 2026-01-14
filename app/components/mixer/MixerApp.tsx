import { useEffect, useState } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
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
  const { audioFiles, tracks, clips, createClip, addChannel, updateAudioFileTempo, transport } = useMixerStore();
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

  const handleTempoChange = (fileId: string, value: string) => {
    if (value === '') {
      updateAudioFileTempo(fileId, undefined);
    } else {
      const tempo = Number(value);
      if (!isNaN(tempo)) {
        updateAudioFileTempo(fileId, tempo);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <DropZone onFilesDropped={onFilesDropped} />

      {audioFileList.length > 0 && (
        <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto">
          {audioFileList.map((file) => (
            <div
              key={file.id}
              draggable
              onDragStart={(e) => handleDragStart(e, file.id)}
              onDoubleClick={() => handleDoubleClick(file.id)}
              className="p-2 bg-gray-700 rounded cursor-grab hover:bg-gray-600 transition-colors"
              title="Drag to timeline or double-click to add to empty channel"
            >
              <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-2 mt-2">
                <label className="text-xs text-gray-400">BPM:</label>
                <input
                  type="number"
                  min="20"
                  max="300"
                  value={file.tempo ?? ''}
                  placeholder={String(transport.tempo)}
                  onChange={(e) => handleTempoChange(file.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-center text-xs focus:outline-none focus:border-blue-500"
                />
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

        <div className="w-32 flex justify-end">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            title={sidebarOpen ? 'Close library' : 'Open library'}
          >
            {sidebarOpen ? (
              <PanelRightClose className="w-5 h-5" />
            ) : (
              <PanelRightOpen className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-hidden">
            <Timeline onSeek={handleSeek} />
          </main>

          <footer className="border-t border-gray-700 flex-shrink-0">
            <ChannelList />
          </footer>
        </div>

        <aside
          className={`border-l border-gray-700 flex-shrink-0 overflow-hidden transition-all duration-300 ${
            sidebarOpen ? 'w-80' : 'w-0'
          }`}
        >
          <div className={`p-3 w-80 h-full ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            <FileLibrary onFilesDropped={handleFilesDropped} />
          </div>
        </aside>
      </div>
    </div>
  );
}
