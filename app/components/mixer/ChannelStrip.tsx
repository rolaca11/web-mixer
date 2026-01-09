import { Slider } from '~/components/ui/Slider';
import { Knob } from '~/components/ui/Knob';
import { useMixerStore } from '~/store/mixerStore';
import type { Channel } from '~/types/mixer';

interface ChannelStripProps {
  channel: Channel;
}

export function ChannelStrip({ channel }: ChannelStripProps) {
  const {
    updateChannelVolume,
    updateChannelPan,
    toggleMute,
    toggleSolo,
    removeChannel,
    channels,
  } = useMixerStore();

  const canDelete = Object.keys(channels).length > 1;

  const hasSoloActive = Object.values(channels).some((ch) => ch.solo);
  const isEffectivelyMuted = channel.muted || (hasSoloActive && !channel.solo);

  return (
    <div
      className={`flex flex-col items-center gap-3 p-3 bg-gray-800 border-r transition-colors ${
        isEffectivelyMuted ? 'border-gray-700 opacity-60' : 'border-gray-600'
      }`}
    >
      <div className="text-sm font-medium text-gray-300 truncate w-full text-center">
        {channel.name}
      </div>

      <Knob
        value={channel.pan}
        min={-1}
        max={1}
        onChange={(value) => updateChannelPan(channel.id, value)}
        label="Pan"
        size={36}
      />

      <Slider
        value={channel.volume}
        min={0}
        max={1}
        onChange={(value) => updateChannelVolume(channel.id, value)}
        orientation="vertical"
        label="Vol"
      />

      <div className="flex gap-1">
        <button
          onClick={() => toggleMute(channel.id)}
          className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
            channel.muted
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
          title="Mute"
        >
          M
        </button>
        <button
          onClick={() => toggleSolo(channel.id)}
          className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
            channel.solo
              ? 'bg-yellow-500 text-black'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
          title="Solo"
        >
          S
        </button>
      </div>

      {canDelete && (
        <button
          onClick={() => removeChannel(channel.id)}
          className="text-gray-500 hover:text-red-400 transition-colors"
          title="Remove Channel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
