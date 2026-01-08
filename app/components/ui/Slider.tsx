import { useCallback, useRef, useEffect, useState } from 'react';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  label?: string;
}

export function Slider({
  value,
  min = 0,
  max = 1,
  onChange,
  orientation = 'vertical',
  className = '',
  label,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculateValue = useCallback(
    (clientX: number, clientY: number) => {
      const track = trackRef.current;
      if (!track) return value;

      const rect = track.getBoundingClientRect();
      let ratio: number;

      if (orientation === 'vertical') {
        ratio = 1 - (clientY - rect.top) / rect.height;
      } else {
        ratio = (clientX - rect.left) / rect.width;
      }

      ratio = Math.max(0, Math.min(1, ratio));
      return min + ratio * (max - min);
    },
    [min, max, orientation, value]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const newValue = calculateValue(e.clientX, e.clientY);
      onChange(newValue);
    },
    [calculateValue, onChange]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newValue = calculateValue(e.clientX, e.clientY);
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, calculateValue, onChange]);

  const percentage = ((value - min) / (max - min)) * 100;

  const isVertical = orientation === 'vertical';

  return (
    <div
      className={`flex flex-col items-center gap-1 ${className}`}
      title={label}
    >
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        className={`relative bg-gray-700 rounded cursor-pointer ${
          isVertical ? 'w-3 h-24' : 'h-3 w-24'
        }`}
      >
        <div
          className={`absolute bg-blue-500 rounded ${
            isVertical ? 'w-full bottom-0 left-0' : 'h-full top-0 left-0'
          }`}
          style={
            isVertical
              ? { height: `${percentage}%` }
              : { width: `${percentage}%` }
          }
        />
        <div
          className={`absolute w-4 h-4 bg-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 ${
            isDragging ? 'scale-110' : ''
          }`}
          style={
            isVertical
              ? { left: '50%', bottom: `${percentage}%`, transform: 'translate(-50%, 50%)' }
              : { top: '50%', left: `${percentage}%` }
          }
        />
      </div>
      {label && (
        <span className="text-xs text-gray-400 truncate max-w-full">
          {Math.round(value * 100)}%
        </span>
      )}
    </div>
  );
}
