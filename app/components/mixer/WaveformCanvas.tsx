import { useRef, useEffect } from 'react';

interface WaveformCanvasProps {
  peaks: Float32Array;
  width: number;
  height: number;
  color?: string;
  backgroundColor?: string;
}

export function WaveformCanvas({
  peaks,
  width,
  height,
  color = '#3b82f6',
  backgroundColor = 'transparent',
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks || peaks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    ctx.fillStyle = color;
    const centerY = height / 2;
    const peaksPerPixel = peaks.length / width;

    for (let x = 0; x < width; x++) {
      const peakIndex = Math.floor(x * peaksPerPixel);
      const amplitude = peaks[peakIndex] || 0;
      const barHeight = Math.max(1, amplitude * height * 0.9);

      ctx.fillRect(x, centerY - barHeight / 2, 1, barHeight);
    }
  }, [peaks, width, height, color, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="pointer-events-none"
    />
  );
}
