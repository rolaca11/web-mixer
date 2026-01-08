import type { ScheduledClip } from '~/types/mixer';

interface ChannelNodes {
  gain: GainNode;
  panner: StereoPannerNode;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private channelNodes: Map<string, ChannelNodes> = new Map();
  private scheduledSources: Map<string, AudioBufferSourceNode[]> = new Map();

  private startContextTime: number = 0;
  private startPlaybackTime: number = 0;
  private isPlaying: boolean = false;

  private loopEnabled: boolean = false;
  private loopStart: number = 0;
  private loopEnd: number = 0;
  private loopTimeoutId: number | null = null;

  async initialize(): Promise<void> {
    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
  }

  async resume(): Promise<void> {
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  getContext(): AudioContext | null {
    return this.context;
  }

  createChannel(channelId: string): void {
    if (!this.context || !this.masterGain) return;
    if (this.channelNodes.has(channelId)) return;

    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();

    gain.connect(panner);
    panner.connect(this.masterGain);

    this.channelNodes.set(channelId, { gain, panner });
  }

  removeChannel(channelId: string): void {
    const nodes = this.channelNodes.get(channelId);
    if (nodes) {
      nodes.gain.disconnect();
      nodes.panner.disconnect();
      this.channelNodes.delete(channelId);
    }
  }

  setChannelVolume(channelId: string, volume: number): void {
    const nodes = this.channelNodes.get(channelId);
    if (nodes && this.context) {
      nodes.gain.gain.setValueAtTime(volume, this.context.currentTime);
    }
  }

  setChannelPan(channelId: string, pan: number): void {
    const nodes = this.channelNodes.get(channelId);
    if (nodes && this.context) {
      nodes.panner.pan.setValueAtTime(pan, this.context.currentTime);
    }
  }

  setChannelMuted(channelId: string, muted: boolean, volume: number): void {
    const nodes = this.channelNodes.get(channelId);
    if (nodes && this.context) {
      nodes.gain.gain.setValueAtTime(muted ? 0 : volume, this.context.currentTime);
    }
  }

  scheduleClips(
    clips: ScheduledClip[],
    fromTime: number,
    loopEnabled: boolean = false,
    loopStart: number = 0,
    loopEnd: number = 0
  ): void {
    this.stopAllClips();

    if (!this.context) return;

    this.isPlaying = true;
    this.startContextTime = this.context.currentTime;
    this.startPlaybackTime = fromTime;
    this.loopEnabled = loopEnabled;
    this.loopStart = loopStart;
    this.loopEnd = loopEnd;

    for (const clip of clips) {
      this.scheduleClip(clip, fromTime);
    }

    if (loopEnabled && loopEnd > loopStart) {
      this.scheduleLoopCallback(fromTime, loopStart, loopEnd, clips);
    }
  }

  private scheduleClip(clip: ScheduledClip, fromTime: number): void {
    if (!this.context) return;

    const channelNodes = this.channelNodes.get(clip.channelId);
    if (!channelNodes) return;

    const source = this.context.createBufferSource();
    source.buffer = clip.audioBuffer;
    source.connect(channelNodes.gain);

    const clipEnd = clip.startTime + clip.duration;
    const now = this.context.currentTime;

    if (clipEnd <= fromTime) {
      return;
    }

    const clipStartInPlayback = clip.startTime - fromTime;

    if (clipStartInPlayback >= 0) {
      const duration = clip.duration;
      source.start(now + clipStartInPlayback, clip.offsetInFile, duration);
    } else {
      const offsetIntoClip = -clipStartInPlayback;
      const remainingDuration = clip.duration - offsetIntoClip;
      if (remainingDuration > 0) {
        source.start(now, clip.offsetInFile + offsetIntoClip, remainingDuration);
      }
    }

    const sources = this.scheduledSources.get(clip.id) || [];
    sources.push(source);
    this.scheduledSources.set(clip.id, sources);
  }

  private scheduleLoopCallback(
    fromTime: number,
    loopStart: number,
    loopEnd: number,
    clips: ScheduledClip[]
  ): void {
    if (!this.context) return;

    const timeUntilLoopEnd = loopEnd - fromTime;
    if (timeUntilLoopEnd <= 0) {
      this.scheduleClips(clips, loopStart, true, loopStart, loopEnd);
      return;
    }

    this.loopTimeoutId = window.setTimeout(() => {
      if (this.isPlaying && this.loopEnabled) {
        this.scheduleClips(clips, loopStart, true, loopStart, loopEnd);
      }
    }, timeUntilLoopEnd * 1000);
  }

  getCurrentTime(): number {
    if (!this.context || !this.isPlaying) {
      return this.startPlaybackTime;
    }
    return this.startPlaybackTime + (this.context.currentTime - this.startContextTime);
  }

  stopAllClips(): void {
    this.isPlaying = false;

    if (this.loopTimeoutId !== null) {
      window.clearTimeout(this.loopTimeoutId);
      this.loopTimeoutId = null;
    }

    for (const sources of this.scheduledSources.values()) {
      for (const source of sources) {
        try {
          source.stop();
          source.disconnect();
        } catch {
          // Source may have already stopped
        }
      }
    }
    this.scheduledSources.clear();
  }

  pause(): number {
    const currentTime = this.getCurrentTime();
    this.stopAllClips();
    this.startPlaybackTime = currentTime;
    return currentTime;
  }

  stop(): void {
    this.stopAllClips();
    this.startPlaybackTime = 0;
  }

  seek(time: number): void {
    this.startPlaybackTime = time;
    if (!this.isPlaying && this.context) {
      this.startContextTime = this.context.currentTime;
    }
  }

  async decodeAudioFile(file: File): Promise<AudioBuffer> {
    if (!this.context) {
      throw new Error('AudioEngine not initialized');
    }

    const arrayBuffer = await file.arrayBuffer();
    return await this.context.decodeAudioData(arrayBuffer);
  }

  dispose(): void {
    this.stopAllClips();
    this.channelNodes.forEach((nodes) => {
      nodes.gain.disconnect();
      nodes.panner.disconnect();
    });
    this.channelNodes.clear();

    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }

    if (this.context) {
      this.context.close();
      this.context = null;
    }
  }
}

export function extractWaveformPeaks(
  audioBuffer: AudioBuffer,
  targetSamples: number = 4000
): Float32Array {
  const channelData = audioBuffer.getChannelData(0);
  const samplesPerPeak = Math.max(1, Math.floor(channelData.length / targetSamples));
  const actualSamples = Math.ceil(channelData.length / samplesPerPeak);
  const peaks = new Float32Array(actualSamples);

  for (let i = 0; i < actualSamples; i++) {
    const start = i * samplesPerPeak;
    const end = Math.min(start + samplesPerPeak, channelData.length);

    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > max) max = abs;
    }
    peaks[i] = max;
  }

  return peaks;
}
