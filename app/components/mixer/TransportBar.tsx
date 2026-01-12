import { useMixerStore } from '~/store/mixerStore';
import { Timer } from 'lucide-react';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

interface TransportBarProps {
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
}

export function TransportBar({ onPlay, onPause, onStop }: TransportBarProps) {
  const { transport, setLoop, setTempo, setMetronome } = useMixerStore();
  const { isPlaying, currentTime, loopEnabled, tempo, metronomeEnabled } = transport;

  const handlePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        <button
          onClick={onStop}
          className="p-2 rounded hover:bg-gray-700 transition-colors"
          title="Stop"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>

        <button
          onClick={handlePlayPause}
          className={`p-2 rounded transition-colors ${
            isPlaying ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-700'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={() => setLoop(!loopEnabled)}
          className={`p-2 rounded transition-colors ${
            loopEnabled ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-gray-700'
          }`}
          title={loopEnabled ? 'Loop On' : 'Loop Off'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      <div className="font-mono text-lg bg-gray-800 px-3 py-1 rounded border border-gray-700 min-w-[120px] text-center">
        {formatTime(currentTime)}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">BPM:</label>
        <input
          type="number"
          min="20"
          max="300"
          value={tempo}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (!isNaN(value)) {
              setTempo(value);
            }
          }}
          className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-center font-mono text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={() => setMetronome(!metronomeEnabled)}
          className={`p-2 rounded transition-colors ${
            metronomeEnabled ? 'bg-orange-600 hover:bg-orange-700' : 'hover:bg-gray-700'
          }`}
          title={metronomeEnabled ? 'Metronome On' : 'Metronome Off'}
        >
          <Timer className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
