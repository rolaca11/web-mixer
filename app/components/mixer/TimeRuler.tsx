import { useMemo } from 'react';

interface TimeRulerProps {
  zoom: number;
  scrollX: number;
  width: number;
  onClick: (time: number) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return `${secs}s`;
}

export function TimeRuler({ zoom, scrollX, width, onClick }: TimeRulerProps) {
  const markers = useMemo(() => {
    const result: { time: number; x: number; isMajor: boolean }[] = [];

    let interval: number;
    if (zoom >= 100) {
      interval = 1;
    } else if (zoom >= 50) {
      interval = 2;
    } else if (zoom >= 25) {
      interval = 5;
    } else {
      interval = 10;
    }

    const startTime = Math.floor(scrollX / zoom / interval) * interval;
    const endTime = (scrollX + width) / zoom;

    for (let time = startTime; time <= endTime + interval; time += interval) {
      const x = time * zoom - scrollX;
      if (x >= -20 && x <= width + 20) {
        result.push({
          time,
          x,
          isMajor: time % (interval * 5) === 0 || interval >= 5,
        });
      }
    }

    return result;
  }, [zoom, scrollX, width]);

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
      {markers.map(({ time, x, isMajor }) => (
        <div
          key={time}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: x }}
        >
          <div
            className={`w-px ${isMajor ? 'h-4 bg-gray-500' : 'h-2 bg-gray-600'}`}
          />
          {isMajor && (
            <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">
              {formatTime(time)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
