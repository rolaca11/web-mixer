import { useRef, useCallback, useState, useEffect } from 'react';
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
    channels,
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

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const timeDelta = deltaX / ui.zoom;
      const newStartTime = Math.max(0, dragState.originalStartTime + timeDelta);

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
  }, [dragState, ui.zoom, tracks, moveClip]);

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

  const orderedTracks = getOrderedTracks(tracks);
  const firstChannelId = Object.keys(channels)[0];

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
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
          Add Track
        </button>
      </div>

      <div className="flex">
        <div className="w-32 flex-shrink-0" />
        <div className="flex-1">
          <TimeRuler
            zoom={ui.zoom}
            scrollX={ui.scrollX}
            width={containerWidth - 128}
            onClick={handleSeek}
          />
        </div>
      </div>

      <div
        className="flex-1 overflow-auto relative"
        onWheel={handleWheel}
      >
        <div className="relative">
          {orderedTracks.map((track) => (
            <TrackLane
              key={track.id}
              track={track}
              zoom={ui.zoom}
              onClipMouseDown={handleClipMouseDown}
            />
          ))}

          {orderedTracks.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No tracks. Add a channel to get started.
            </div>
          )}

          <div className="absolute top-0 bottom-0 left-32 right-0 pointer-events-none">
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
