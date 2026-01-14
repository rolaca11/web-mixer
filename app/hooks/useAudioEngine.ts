import { useEffect, useRef, useCallback } from 'react';
import { AudioEngine, extractWaveformPeaks } from '~/audio/AudioEngine';
import { useMixerStore } from '~/store/mixerStore';
import { nanoid } from 'nanoid';
import type { ScheduledClip, AudioFile } from '~/types/mixer';

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const {
    transport,
    clips,
    tracks,
    channels,
    audioFiles,
    play,
    pause,
    stop,
    seek,
    setCurrentTime,
    addAudioFile,
  } = useMixerStore();

  useEffect(() => {
    const engine = new AudioEngine();
    engine.initialize();
    engineRef.current = engine;

    return () => {
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    Object.values(channels).forEach((channel) => {
      engine.createChannel(channel.id);

      const hasSoloActive = Object.values(channels).some((ch) => ch.solo);
      const isEffectivelyMuted = channel.muted || (hasSoloActive && !channel.solo);

      engine.setChannelVolume(channel.id, isEffectivelyMuted ? 0 : channel.volume);
      engine.setChannelPan(channel.id, channel.pan);
    });
  }, [channels]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.setMetronomeEnabled(transport.metronomeEnabled);
  }, [transport.metronomeEnabled]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.setTempo(transport.tempo);
  }, [transport.tempo]);

  const prepareClipsForPlayback = useCallback((): ScheduledClip[] => {
    const result: ScheduledClip[] = [];

    Object.values(clips).forEach((clip) => {
      const audioFile = audioFiles[clip.audioFileId];
      const track = tracks[clip.trackId];

      if (!audioFile || !track) return;

      result.push({
        id: clip.id,
        audioBuffer: audioFile.audioBuffer,
        channelId: track.channelId,
        startTime: clip.startTime,
        offsetInFile: clip.offsetInFile,
        duration: clip.duration,
        clipTempo: audioFile.tempo,
        playbackTempo: transport.tempo,
      });
    });

    return result;
  }, [clips, audioFiles, tracks, transport.tempo]);

  const handlePlay = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.resume();

    const scheduledClips = prepareClipsForPlayback();
    engine.scheduleClips(
      scheduledClips,
      transport.currentTime,
      transport.loopEnabled,
      transport.loopStart,
      transport.loopEnd
    );

    play();

    const updatePlayhead = () => {
      const currentTime = engine.getCurrentTime();

      if (transport.loopEnabled && currentTime >= transport.loopEnd) {
        setCurrentTime(transport.loopStart);
      } else {
        setCurrentTime(currentTime);
      }

      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    };

    animationFrameRef.current = requestAnimationFrame(updatePlayhead);
  }, [prepareClipsForPlayback, transport, play, setCurrentTime]);

  const handlePause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const currentTime = engine.pause();
    setCurrentTime(currentTime);
    pause();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [pause, setCurrentTime]);

  const handleStop = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.stop();
    stop();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [stop]);

  const handleSeek = useCallback(
    (time: number) => {
      const engine = engineRef.current;
      if (!engine) return;

      engine.seek(time);
      seek(time);

      if (transport.isPlaying) {
        handlePause();
        setTimeout(() => {
          handlePlay();
        }, 50);
      }
    },
    [seek, transport.isPlaying, handlePause, handlePlay]
  );

  const handleFilesDropped = useCallback(
    async (files: File[]) => {
      const engine = engineRef.current;
      if (!engine) return;

      await engine.resume();

      for (const file of files) {
        try {
          const audioBuffer = await engine.decodeAudioFile(file);
          const waveformPeaks = extractWaveformPeaks(audioBuffer);

          const audioFile: AudioFile = {
            id: nanoid(),
            name: file.name.replace(/\.[^/.]+$/, ''),
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            numberOfChannels: audioBuffer.numberOfChannels,
            audioBuffer,
            waveformPeaks,
          };

          addAudioFile(audioFile);
        } catch (error) {
          console.error(`Failed to decode audio file: ${file.name}`, error);
        }
      }
    },
    [addAudioFile]
  );

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    handlePlay,
    handlePause,
    handleStop,
    handleSeek,
    handleFilesDropped,
  };
}
