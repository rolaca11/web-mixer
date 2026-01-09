# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
pnpm dev          # Start dev server with HMR at http://localhost:5173
pnpm build        # Production build (outputs to build/client and build/server)
pnpm typecheck    # Run TypeScript type checking (generates react-router types first)
pnpm start        # Start production server
```

This project uses **pnpm** as the package manager.

## Git Workflow

Use **Graphite** (`gt`) for all Git operations instead of raw git commands:
- `gt create -m "message"` to create a new branch and commit
- `gt modify -m "message"` to amend the current commit
- `gt submit` to push and create/update PRs
- `gt sync` to sync with trunk

## Architecture Overview

Web Mixer is a browser-based digital audio workstation (DAW) built with React Router v7 (SPA mode, SSR disabled) and the Web Audio API.

### Core Data Flow

The app follows a unidirectional data flow:
1. **State** → Zustand store (`app/store/mixerStore.ts`) holds all application state using Immer for immutable updates
2. **Audio** → `AudioEngine` class (`app/audio/AudioEngine.ts`) manages Web Audio API nodes and playback scheduling
3. **Bridge** → `useAudioEngine` hook (`app/hooks/useAudioEngine.ts`) syncs store state with the audio engine

### Key Concepts

- **Channel**: Audio routing destination with volume, pan, mute, and solo controls
- **Track**: Visual lane in timeline, belongs to a Channel, holds clips
- **Clip**: A placed segment of an audio file on a track (can have offset and trimmed duration)
- **AudioFile**: Decoded audio data with pre-computed waveform peaks for visualization

### Directory Structure

```
app/
├── audio/          # AudioEngine class - Web Audio API wrapper
├── components/
│   ├── mixer/      # DAW UI components (Timeline, TrackLane, ChannelStrip, etc.)
│   └── ui/         # Reusable controls (Knob, Slider, DropZone)
├── hooks/          # useAudioEngine - bridge between store and audio engine
├── store/          # Zustand store with all state and actions
├── types/          # TypeScript interfaces for mixer domain
└── routes/         # React Router route components
```

### State Management Pattern

The Zustand store uses Immer middleware. Actions mutate draft state directly:

```typescript
updateChannelVolume: (channelId: string, volume: number) => {
  set((state) => {
    state.channels[channelId].volume = Math.max(0, Math.min(1, volume));
  });
}
```

Helper functions (`getOrderedChannels`, `getClipsForTrack`, etc.) are pure functions exported alongside the store for deriving sorted/filtered views.

### Audio Engine Architecture

`AudioEngine` maintains a per-channel audio graph:
- Each channel has its own `GainNode` → `StereoPannerNode` → master gain → destination
- Clip playback uses `AudioBufferSourceNode` scheduled via `scheduleClips()`
- Loop playback is handled via setTimeout callbacks that re-schedule clips at loop boundaries

### Path Aliases

TypeScript paths are configured: `~/` maps to `./app/` (e.g., `import { useMixerStore } from '~/store/mixerStore'`)
