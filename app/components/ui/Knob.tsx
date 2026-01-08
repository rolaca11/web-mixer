import { useCallback, useRef, useEffect, useState } from 'react';

interface KnobProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  size?: number;
  className?: string;
  label?: string;
}

export function Knob({
  value,
  min = -1,
  max = 1,
  onChange,
  size = 40,
  className = '',
  label,
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startYRef.current = e.clientY;
      startValueRef.current = value;
    },
    [value]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startYRef.current - e.clientY;
      const sensitivity = 0.01;
      const deltaValue = deltaY * sensitivity * (max - min);
      const newValue = Math.max(min, Math.min(max, startValueRef.current + deltaValue));
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
  }, [isDragging, min, max, onChange]);

  const handleDoubleClick = useCallback(() => {
    onChange(0);
  }, [onChange]);

  const normalizedValue = (value - min) / (max - min);
  const rotation = -135 + normalizedValue * 270;

  const displayValue = value === 0 ? 'C' : value < 0 ? `L${Math.abs(Math.round(value * 100))}` : `R${Math.round(value * 100)}`;

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className={`relative rounded-full bg-gray-700 cursor-pointer select-none border-2 border-gray-600 ${
          isDragging ? 'border-blue-500' : 'hover:border-gray-500'
        }`}
        style={{ width: size, height: size }}
        title={label}
      >
        <div
          className="absolute inset-1 rounded-full bg-gray-800"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div
            className="absolute top-1 left-1/2 w-1 h-3 bg-blue-400 rounded-full"
            style={{ transform: 'translateX(-50%)' }}
          />
        </div>
        <div className="absolute inset-0 rounded-full pointer-events-none">
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 2"
              className="text-gray-600"
              strokeLinecap="round"
              transform="rotate(-135 20 20)"
              strokeDashoffset="0"
              style={{
                strokeDasharray: `${normalizedValue * 85} 200`,
              }}
            />
          </svg>
        </div>
      </div>
      {label && (
        <span className="text-xs text-gray-400">{displayValue}</span>
      )}
    </div>
  );
}
