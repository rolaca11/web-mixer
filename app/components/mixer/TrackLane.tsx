import { memo, useCallback } from 'react';
import { AudioClip } from './AudioClip';
import { useMixerStore, getClipsForTrack } from '~/store/mixerStore';
import type { Track } from '~/types/mixer';

interface TrackLaneProps {
  track: Track;
  zoom: number;
  onClipMouseDown: (e: React.MouseEvent, clipId: string) => void;
}

export const TrackLane = memo(function TrackLane({
  track,
  zoom,
  onClipMouseDown,
}: TrackLaneProps) {
  const { clips, audioFiles, ui, removeTrack, tracks, createClip } = useMixerStore();
  const trackClips = getClipsForTrack(clips, track.id);
  const canDelete = Object.keys(tracks).length > 1;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const audioFileId = e.dataTransfer.getData('audio-file-id');
      if (audioFileId) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const startTime = Math.max(0, x / zoom);
        createClip(audioFileId, track.id, startTime);
      }
    },
    [createClip, track.id, zoom]
  );

  return (
    <div className="flex border-b border-gray-700 h-16">
      <div className="w-32 flex-shrink-0 bg-gray-800 border-r border-gray-700 flex items-center px-2 gap-2">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: track.color }}
        />
        <span className="text-sm text-gray-300 truncate flex-1">{track.name}</span>
        {canDelete && (
          <button
            onClick={() => removeTrack(track.id)}
            className="p-1 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
            title="Remove Track"
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
        )}
      </div>

      <div
        className="flex-1 relative bg-gray-900/50"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {trackClips.map((clip) => {
          const audioFile = audioFiles[clip.audioFileId];
          if (!audioFile) return null;

          return (
            <AudioClip
              key={clip.id}
              clip={clip}
              audioFile={audioFile}
              zoom={zoom}
              trackColor={track.color}
              isSelected={ui.selectedClipIds.includes(clip.id)}
              onMouseDown={onClipMouseDown}
            />
          );
        })}
      </div>
    </div>
  );
});
