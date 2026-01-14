import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type {
  MixerState,
  AudioFile,
  AudioClip,
  Track,
  Channel,
  TransportState,
  UIState,
} from '~/types/mixer';

const TRACK_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
];

const initialTransport: TransportState = {
  isPlaying: false,
  currentTime: 0,
  loopEnabled: false,
  loopStart: 0,
  loopEnd: 30,
  tempo: 120,
  metronomeEnabled: false,
};

const initialUI: UIState = {
  zoom: 50,
  scrollX: 0,
  selectedClipIds: [],
  selectedTrackId: null,
  snapToGrid: true,
};

export const useMixerStore = create<MixerState>()(
  immer((set, get) => ({
    audioFiles: {},
    clips: {},
    tracks: {},
    channels: {},
    transport: initialTransport,
    ui: initialUI,

    addAudioFile: (file: AudioFile) => {
      set((state) => {
        state.audioFiles[file.id] = file;
      });
    },

    removeAudioFile: (id: string) => {
      set((state) => {
        const clipsToRemove = Object.values(state.clips).filter(
          (clip) => clip.audioFileId === id
        );
        for (const clip of clipsToRemove) {
          delete state.clips[clip.id];
        }
        delete state.audioFiles[id];
      });
    },

    updateAudioFileTempo: (fileId: string, tempo: number | undefined) => {
      set((state) => {
        const file = state.audioFiles[fileId];
        if (file) {
          if (tempo === undefined) {
            file.tempo = undefined;
          } else {
            file.tempo = Math.max(20, Math.min(300, tempo));
          }
        }
      });
    },

    createClip: (audioFileId: string, trackId: string, startTime: number) => {
      const audioFile = get().audioFiles[audioFileId];
      if (!audioFile) return '';

      const clipId = nanoid();
      const clip: AudioClip = {
        id: clipId,
        audioFileId,
        trackId,
        startTime,
        offsetInFile: 0,
        duration: audioFile.duration,
      };

      set((state) => {
        state.clips[clipId] = clip;
      });

      return clipId;
    },

    moveClip: (clipId: string, newTrackId: string, newStartTime: number) => {
      set((state) => {
        const clip = state.clips[clipId];
        if (clip) {
          clip.trackId = newTrackId;
          clip.startTime = Math.max(0, newStartTime);
        }
      });
    },

    deleteClip: (clipId: string) => {
      set((state) => {
        delete state.clips[clipId];
        state.ui.selectedClipIds = state.ui.selectedClipIds.filter(
          (id) => id !== clipId
        );
      });
    },

    addChannel: () => {
      const channelId = nanoid();
      const channels = get().channels;
      const channelCount = Object.keys(channels).length;

      const channel: Channel = {
        id: channelId,
        name: `Channel ${channelCount + 1}`,
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        order: channelCount,
      };

      const trackId = nanoid();
      const trackCount = Object.keys(get().tracks).length;
      const track: Track = {
        id: trackId,
        channelId,
        name: `Channel ${channelCount + 1}`,
        color: TRACK_COLORS[trackCount % TRACK_COLORS.length],
        order: trackCount,
      };

      set((state) => {
        state.channels[channelId] = channel;
        state.tracks[trackId] = track;
      });

      return channelId;
    },

    removeChannel: (channelId: string) => {
      set((state) => {
        const tracksToRemove = Object.values(state.tracks).filter(
          (track) => track.channelId === channelId
        );

        for (const track of tracksToRemove) {
          const clipsToRemove = Object.values(state.clips).filter(
            (clip) => clip.trackId === track.id
          );
          for (const clip of clipsToRemove) {
            delete state.clips[clip.id];
          }
          delete state.tracks[track.id];
        }

        delete state.channels[channelId];
      });
    },

    updateChannelVolume: (channelId: string, volume: number) => {
      set((state) => {
        const channel = state.channels[channelId];
        if (channel) {
          channel.volume = Math.max(0, Math.min(1, volume));
        }
      });
    },

    updateChannelPan: (channelId: string, pan: number) => {
      set((state) => {
        const channel = state.channels[channelId];
        if (channel) {
          channel.pan = Math.max(-1, Math.min(1, pan));
        }
      });
    },

    toggleMute: (channelId: string) => {
      set((state) => {
        const channel = state.channels[channelId];
        if (channel) {
          channel.muted = !channel.muted;
        }
      });
    },

    toggleSolo: (channelId: string) => {
      set((state) => {
        const channel = state.channels[channelId];
        if (channel) {
          channel.solo = !channel.solo;
        }
      });
    },

    addTrack: (channelId: string) => {
      const trackId = nanoid();
      const trackCount = Object.keys(get().tracks).length;

      const track: Track = {
        id: trackId,
        channelId,
        name: `Channel ${trackCount + 1}`,
        color: TRACK_COLORS[trackCount % TRACK_COLORS.length],
        order: trackCount,
      };

      set((state) => {
        state.tracks[trackId] = track;
      });

      return trackId;
    },

    removeTrack: (trackId: string) => {
      set((state) => {
        const clipsToRemove = Object.values(state.clips).filter(
          (clip) => clip.trackId === trackId
        );
        for (const clip of clipsToRemove) {
          delete state.clips[clip.id];
        }
        delete state.tracks[trackId];
      });
    },

    renameTrack: (trackId: string, name: string) => {
      set((state) => {
        const track = state.tracks[trackId];
        if (track) {
          track.name = name;
          // Also update the associated channel name
          const channel = state.channels[track.channelId];
          if (channel) {
            channel.name = name;
          }
        }
      });
    },

    moveTrackToChannel: (trackId: string, newChannelId: string) => {
      set((state) => {
        const track = state.tracks[trackId];
        if (track) {
          track.channelId = newChannelId;
        }
      });
    },

    play: () => {
      set((state) => {
        state.transport.isPlaying = true;
      });
    },

    pause: () => {
      set((state) => {
        state.transport.isPlaying = false;
      });
    },

    stop: () => {
      set((state) => {
        state.transport.isPlaying = false;
        state.transport.currentTime = 0;
      });
    },

    seek: (time: number) => {
      set((state) => {
        state.transport.currentTime = Math.max(0, time);
      });
    },

    setCurrentTime: (time: number) => {
      set((state) => {
        state.transport.currentTime = Math.max(0, time);
      });
    },

    setLoop: (enabled: boolean, start?: number, end?: number) => {
      set((state) => {
        state.transport.loopEnabled = enabled;
        if (start !== undefined) {
          state.transport.loopStart = start;
        }
        if (end !== undefined) {
          state.transport.loopEnd = end;
        }
      });
    },

    setTempo: (tempo: number) => {
      set((state) => {
        state.transport.tempo = Math.max(20, Math.min(300, tempo));
      });
    },

    setMetronome: (enabled: boolean) => {
      set((state) => {
        state.transport.metronomeEnabled = enabled;
      });
    },

    setZoom: (zoom: number) => {
      set((state) => {
        state.ui.zoom = Math.max(10, Math.min(200, zoom));
      });
    },

    setScrollX: (scrollX: number) => {
      set((state) => {
        state.ui.scrollX = Math.max(0, scrollX);
      });
    },

    selectClip: (clipId: string, additive: boolean = false) => {
      set((state) => {
        if (additive) {
          if (state.ui.selectedClipIds.includes(clipId)) {
            state.ui.selectedClipIds = state.ui.selectedClipIds.filter(
              (id) => id !== clipId
            );
          } else {
            state.ui.selectedClipIds.push(clipId);
          }
        } else {
          state.ui.selectedClipIds = [clipId];
        }
      });
    },

    clearSelection: () => {
      set((state) => {
        state.ui.selectedClipIds = [];
        state.ui.selectedTrackId = null;
      });
    },

    toggleSnapToGrid: () => {
      set((state) => {
        state.ui.snapToGrid = !state.ui.snapToGrid;
      });
    },
  }))
);

export function getClipsForTrack(
  clips: Record<string, AudioClip>,
  trackId: string
): AudioClip[] {
  return Object.values(clips)
    .filter((clip) => clip.trackId === trackId)
    .sort((a, b) => a.startTime - b.startTime);
}

export function getTracksForChannel(
  tracks: Record<string, Track>,
  channelId: string
): Track[] {
  return Object.values(tracks)
    .filter((track) => track.channelId === channelId)
    .sort((a, b) => a.order - b.order);
}

export function getOrderedChannels(channels: Record<string, Channel>): Channel[] {
  return Object.values(channels).sort((a, b) => a.order - b.order);
}

export function getOrderedTracks(tracks: Record<string, Track>): Track[] {
  return Object.values(tracks).sort((a, b) => a.order - b.order);
}
