import { memo, useCallback, useState } from 'react';
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
  const { clips, audioFiles, ui, removeTrack, renameTrack, tracks, createClip, transport } = useMixerStore();
  const trackClips = getClipsForTrack(clips, track.id);
  const canDelete = Object.keys(tracks).length > 1;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(track.name);

  const snapToBeat = useCallback(
    (time: number): number => {
      const beatDuration = 60 / transport.tempo;
      const beat = Math.round(time / beatDuration);
      return beat * beatDuration;
    },
    [transport.tempo]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const audioFileId = e.dataTransfer.getData('audio-file-id');
      if (audioFileId) {
        createClip(audioFileId, track.id, 0);
      }
    },
    [createClip, track.id]
  );

  const handleStartRename = useCallback(() => {
    setEditName(track.name);
    setIsEditing(true);
  }, [track.name]);

  const handleFinishRename = useCallback(() => {
    if (editName.trim()) {
      renameTrack(track.id, editName.trim());
    }
    setIsEditing(false);
  }, [editName, renameTrack, track.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleFinishRename();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setEditName(track.name);
      }
    },
    [handleFinishRename, track.name]
  );

  return (
    <div className="flex border-b border-gray-700 h-16">
      <div className="w-48 flex-shrink-0 bg-gray-800 border-r border-gray-700 flex items-center px-2 gap-1">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: track.color }}
        />
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleFinishRename}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1 min-w-0 text-sm text-gray-300 bg-gray-700 px-1 rounded outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <span className="text-sm text-gray-300 truncate flex-1">{track.name}</span>
        )}
        <button
          onClick={handleStartRename}
          className="p-1 text-gray-500 hover:text-blue-400 transition-colors flex-shrink-0"
          title="Rename Channel"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
        {canDelete && (
          <button
            onClick={() => removeTrack(track.id)}
            className="p-1 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
            title="Remove Channel"
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
        className="flex-1 relative bg-gray-900/50 overflow-hidden min-w-0"
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
              scrollX={ui.scrollX}
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
