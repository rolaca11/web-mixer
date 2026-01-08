import { memo } from 'react';

interface PlayheadProps {
  currentTime: number;
  zoom: number;
  scrollX: number;
}

export const Playhead = memo(function Playhead({
  currentTime,
  zoom,
  scrollX,
}: PlayheadProps) {
  const x = currentTime * zoom - scrollX;

  if (x < -10 || x > 10000) {
    return null;
  }

  return (
    <div
      className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none z-10"
      style={{ left: x }}
    >
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45" />
    </div>
  );
});
