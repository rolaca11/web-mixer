import { useMemo } from 'react';

interface TimeRulerProps {
  zoom: number;
  scrollX: number;
  width: number;
  tempo: number;
  onClick: (time: number) => void;
}

function formatBeatTime(beat: number, beatsPerBar: number = 4): string {
  const bar = Math.floor(beat / beatsPerBar) + 1;
  const beatInBar = (beat % beatsPerBar) + 1;
  return `${bar}.${beatInBar}`;
}

export function TimeRuler({ zoom, scrollX, width, tempo, onClick }: TimeRulerProps) {
  const beatDuration = 60 / tempo;
  const beatsPerBar = 4;
  const barDuration = beatDuration * beatsPerBar;

  const markers = useMemo(() => {
    const result: { beat: number; x: number; isBar: boolean; isBeat: boolean }[] = [];

    const pixelsPerBeat = beatDuration * zoom;

    let beatInterval: number;
    if (pixelsPerBeat >= 40) {
      beatInterval = 1;
    } else if (pixelsPerBeat >= 20) {
      beatInterval = 2;
    } else if (pixelsPerBeat >= 10) {
      beatInterval = 4;
    } else {
      beatInterval = 8;
    }

    const startBeat = Math.floor(scrollX / zoom / beatDuration / beatInterval) * beatInterval;
    const endTime = (scrollX + width) / zoom;
    const endBeat = Math.ceil(endTime / beatDuration);

    for (let beat = startBeat; beat <= endBeat + beatInterval; beat += beatInterval) {
      const time = beat * beatDuration;
      const x = time * zoom - scrollX;

      if (x >= -30 && x <= width + 30) {
        const isBar = beat % beatsPerBar === 0;
        result.push({
          beat,
          x,
          isBar,
          isBeat: !isBar,
        });
      }
    }

    return result;
  }, [zoom, scrollX, width, beatDuration, beatsPerBar]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x + scrollX) / zoom;
    onClick(Math.max(0, time));
  };

  return (
    <div
      className="h-8 bg-gray-800 border-b border-gray-700 relative cursor-pointer select-none"
      onClick={handleClick}
    >
      {markers.map(({ beat, x, isBar, isBeat }) => (
        <div
          key={beat}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: x }}
        >
          <div
            className={`w-px ${
              isBar ? 'h-4 bg-gray-400' : 'h-2 bg-gray-600'
            }`}
          />
          {isBar && (
            <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">
              {formatBeatTime(beat, beatsPerBar)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
