import { ChannelStrip } from './ChannelStrip';
import { useMixerStore, getOrderedChannels } from '~/store/mixerStore';

export function ChannelList() {
  const { channels, addChannel } = useMixerStore();
  const orderedChannels = getOrderedChannels(channels);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Channels
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {orderedChannels.map((channel) => (
          <ChannelStrip key={channel.id} channel={channel} />
        ))}
      </div>

      <div className="p-3 border-t border-gray-700">
        <button
          onClick={() => addChannel()}
          className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Channel
        </button>
      </div>
    </div>
  );
}
