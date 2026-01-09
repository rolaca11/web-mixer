import { useRef, useCallback, useState, useEffect } from 'react';
import { Magnet } from 'lucide-react';
import { TimeRuler } from './TimeRuler';
import { TrackLane } from './TrackLane';
import { Playhead } from './Playhead';
import { useMixerStore, getOrderedTracks } from '~/store/mixerStore';

interface TimelineProps {
  onSeek: (time: number) => void;
}

export function Timeline({ onSeek }: TimelineProps) {
  const {
    tracks,
    clips,
    transport,
    ui,
    moveClip,
    setZoom,
    setScrollX,
    addTrack,
    addChannel,
    createClip,
    channels,
    toggleSnapToGrid,
  } = useMixerStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  const [dragState, setDragState] = useState<{
    clipId: string;
    startX: number;
    startY: number;
    originalStartTime: number;
    originalTrackId: string;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleClipMouseDown = useCallback(
    (e: React.MouseEvent, clipId: string) => {
      const clip = clips[clipId];
      if (!clip) return;

      setDragState({
        clipId,
        startX: e.clientX,
        startY: e.clientY,
        originalStartTime: clip.startTime,
        originalTrackId: clip.trackId,
      });
    },
    [clips]
  );

  const snapToBeat = useCallback(
    (time: number): number => {
      const beatDuration = 60 / transport.tempo;
      const beat = Math.round(time / beatDuration);
      return beat * beatDuration;
    },
    [transport.tempo]
  );

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const timeDelta = deltaX / ui.zoom;
      let newStartTime = Math.max(0, dragState.originalStartTime + timeDelta);

      // Snap to beat if enabled
      if (ui.snapToGrid) {
        newStartTime = snapToBeat(newStartTime);
      }

      const orderedTracks = getOrderedTracks(tracks);
      const trackHeight = 64;
      const deltaY = e.clientY - dragState.startY;
      const trackIndexDelta = Math.round(deltaY / trackHeight);
      const currentTrackIndex = orderedTracks.findIndex(
        (t) => t.id === dragState.originalTrackId
      );
      const newTrackIndex = Math.max(
        0,
        Math.min(orderedTracks.length - 1, currentTrackIndex + trackIndexDelta)
      );
      const newTrackId = orderedTracks[newTrackIndex]?.id || dragState.originalTrackId;

      moveClip(dragState.clipId, newTrackId, newStartTime);
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, ui.zoom, ui.snapToGrid, tracks, moveClip, snapToBeat]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        setZoom(ui.zoom + delta);
      } else {
        setScrollX(ui.scrollX + e.deltaX);
      }
    },
    [ui.zoom, ui.scrollX, setZoom, setScrollX]
  );

  const handleSeek = useCallback(
    (time: number) => {
      onSeek(time);
    },
    [onSeek]
  );

  const handleTimelineDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleTimelineDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const audioFileId = e.dataTransfer.getData('audio-file-id');
      if (!audioFileId) return;

      const channelId = addChannel();
      const newTracks = useMixerStore.getState().tracks;
      const track = Object.values(newTracks).find((t) => t.channelId === channelId);

      if (track) {
        createClip(audioFileId, track.id, 0);
      }
    },
    [addChannel, createClip]
  );

  const orderedTracks = getOrderedTracks(tracks);
  const firstChannelId = Object.keys(channels)[0];

  return (
    <div className="flex flex-col h-full overflow-hidden" ref={containerRef}>
      <div className="flex items-center gap-3 px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm text-gray-400">Zoom:</span>
        <input
          type="range"
          min="10"
          max="200"
          value={ui.zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-24 accent-blue-500"
        />
        <span className="text-sm text-gray-500 min-w-[3rem]">
          {ui.zoom}px/s
        </span>

        <button
          onClick={toggleSnapToGrid}
          className={`p-2 rounded transition-colors ${
            ui.snapToGrid
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
          title="Toggle snap to grid"
        >
          <Magnet className="w-6 h-6" />
        </button>

        <div className="flex-1" />

        <button
          onClick={() => firstChannelId && addTrack(firstChannelId)}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Channel
        </button>
      </div>

      <div className="flex overflow-hidden">
        <div className="w-48 flex-shrink-0" />
        <div className="flex-1 min-w-0 overflow-hidden">
          <TimeRuler
            zoom={ui.zoom}
            scrollX={ui.scrollX}
            width={containerWidth - 192}
            tempo={transport.tempo}
            onClick={handleSeek}
          />
        </div>
      </div>

      <div
        className="flex-1 overflow-hidden relative flex flex-col"
        onWheel={handleWheel}
      >
        <div className="relative flex flex-col flex-1 overflow-hidden">
          {orderedTracks.map((track) => (
            <TrackLane
              key={track.id}
              track={track}
              zoom={ui.zoom}
              onClipMouseDown={handleClipMouseDown}
            />
          ))}

          {orderedTracks.length === 0 && (
            <div
              className="flex items-center justify-center h-32 text-gray-500"
              onDragOver={handleTimelineDragOver}
              onDrop={handleTimelineDrop}
            >
              Drop an audio file here to create a channel
            </div>
          )}

          <div className="flex flex-1 min-h-12">
            <div className="w-48 flex-shrink-0 bg-gray-800 border-r border-gray-700 flex items-start justify-center pt-3">
              <button
                onClick={() => addChannel()}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors flex items-center gap-1"
                title="Add Channel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Channel
              </button>
            </div>
            <div
              className="flex-1 bg-gray-950 flex items-center justify-center text-gray-600 text-sm"
              onDragOver={handleTimelineDragOver}
              onDrop={handleTimelineDrop}
            >
              Drop audio here to create a new channel
            </div>
          </div>

          <div className="absolute top-0 bottom-0 left-48 right-0 pointer-events-none">
            <Playhead
              currentTime={transport.currentTime}
              zoom={ui.zoom}
              scrollX={ui.scrollX}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
