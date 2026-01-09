import { ChannelStrip } from './ChannelStrip';
import { useMixerStore, getOrderedChannels } from '~/store/mixerStore';

export function ChannelList() {
  const { channels } = useMixerStore();
  const orderedChannels = getOrderedChannels(channels);

  return (
    <div className="flex items-stretch gap-3 h-full">
      {orderedChannels.map((channel) => (
        <ChannelStrip key={channel.id} channel={channel} />
      ))}
    </div>
  );
}
