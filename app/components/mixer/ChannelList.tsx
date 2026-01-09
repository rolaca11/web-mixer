import { ChannelStrip } from './ChannelStrip';
import { useMixerStore, getOrderedChannels } from '~/store/mixerStore';

export function ChannelList() {
  const { channels, addChannel } = useMixerStore();
  const orderedChannels = getOrderedChannels(channels);

  return (
    <div className="flex items-stretch gap-3 h-full">
      {orderedChannels.map((channel) => (
        <ChannelStrip key={channel.id} channel={channel} />
      ))}

      <button
        onClick={() => addChannel()}
        className="px-4 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 flex-shrink-0"
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
      </button>
    </div>
  );
}
