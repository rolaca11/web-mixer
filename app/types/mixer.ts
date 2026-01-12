export interface AudioFile {
  id: string;
  name: string;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  audioBuffer: AudioBuffer;
  waveformPeaks: Float32Array;
}

export interface AudioClip {
  id: string;
  audioFileId: string;
  trackId: string;
  startTime: number;
  offsetInFile: number;
  duration: number;
}

export interface Track {
  id: string;
  channelId: string;
  name: string;
  color: string;
  order: number;
}

export interface Channel {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  order: number;
}

export interface TransportState {
  isPlaying: boolean;
  currentTime: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  tempo: number;
  metronomeEnabled: boolean;
}

export interface UIState {
  zoom: number;
  scrollX: number;
  selectedClipIds: string[];
  selectedTrackId: string | null;
  snapToGrid: boolean;
}

export interface DragState {
  type: 'clip' | 'clip-edge' | 'selection';
  clipId?: string;
  startX: number;
  startY: number;
  originalStartTime?: number;
  originalTrackId?: string;
}

export interface ScheduledClip {
  id: string;
  audioBuffer: AudioBuffer;
  channelId: string;
  startTime: number;
  offsetInFile: number;
  duration: number;
}

export interface MixerState {
  audioFiles: Record<string, AudioFile>;
  clips: Record<string, AudioClip>;
  tracks: Record<string, Track>;
  channels: Record<string, Channel>;
  transport: TransportState;
  ui: UIState;

  addAudioFile: (file: AudioFile) => void;
  removeAudioFile: (id: string) => void;

  createClip: (audioFileId: string, trackId: string, startTime: number) => string;
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => void;
  deleteClip: (clipId: string) => void;

  addChannel: () => string;
  removeChannel: (channelId: string) => void;
  updateChannelVolume: (channelId: string, volume: number) => void;
  updateChannelPan: (channelId: string, pan: number) => void;
  toggleMute: (channelId: string) => void;
  toggleSolo: (channelId: string) => void;

  addTrack: (channelId: string) => string;
  removeTrack: (trackId: string) => void;
  renameTrack: (trackId: string, name: string) => void;
  moveTrackToChannel: (trackId: string, newChannelId: string) => void;

  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setCurrentTime: (time: number) => void;
  setLoop: (enabled: boolean, start?: number, end?: number) => void;
  setTempo: (tempo: number) => void;
  setMetronome: (enabled: boolean) => void;

  setZoom: (zoom: number) => void;
  setScrollX: (scrollX: number) => void;
  selectClip: (clipId: string, additive?: boolean) => void;
  clearSelection: () => void;
  toggleSnapToGrid: () => void;
}
