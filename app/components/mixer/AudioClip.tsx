import { memo, useCallback, useMemo } from 'react';
import { WaveformCanvas } from './WaveformCanvas';
import { useMixerStore } from '~/store/mixerStore';
import type { AudioClip as AudioClipType, AudioFile } from '~/types/mixer';
import { calculateStretchedDuration } from '~/audio/psola';

interface AudioClipProps {
  clip: AudioClipType;
  audioFile: AudioFile;
  zoom: number;
  scrollX: number;
  trackColor: string;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, clipId: string) => void;
}

export const AudioClip = memo(function AudioClip({
  clip,
  audioFile,
  zoom,
  scrollX,
  trackColor,
  isSelected,
  onMouseDown,
}: AudioClipProps) {
  const { deleteClip, selectClip, transport } = useMixerStore();

  // Calculate the stretched duration based on tempo
  const stretchedDuration = useMemo(() => {
    return calculateStretchedDuration(clip.duration, audioFile.tempo, transport.tempo);
  }, [clip.duration, audioFile.tempo, transport.tempo]);

  const x = clip.startTime * zoom - scrollX;
  const width = Math.max(10, stretchedDuration * zoom);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.shiftKey) {
        selectClip(clip.id, true);
      } else {
        selectClip(clip.id, false);
      }
      onMouseDown(e, clip.id);
    },
    [clip.id, onMouseDown, selectClip]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteClip(clip.id);
    },
    [clip.id, deleteClip]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      deleteClip(clip.id);
    },
    [clip.id, deleteClip]
  );

  return (
    <div
      className={`absolute top-1 bottom-1 rounded overflow-hidden cursor-grab active:cursor-grabbing group ${
        isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900' : ''
      }`}
      style={{
        left: x,
        width,
        backgroundColor: trackColor,
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <WaveformCanvas
          peaks={audioFile.waveformPeaks}
          width={width}
          height={60}
          color="rgba(255, 255, 255, 0.7)"
        />
      </div>

      <div className="absolute top-0 left-0 right-0 px-2 py-1 bg-gradient-to-b from-black/40 to-transparent">
        <span className="text-xs font-medium text-white truncate block">
          {audioFile.name}
        </span>
      </div>

      <button
        onClick={handleDelete}
        className="absolute top-1 right-1 p-1 rounded bg-black/50 opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
        title="Delete clip"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
});
