/**
 * WSOLA-style Time Stretching (Waveform Similarity Overlap-Add)
 *
 * High-quality time stretching without pitch change using:
 * - COLA-compliant windowing (Constant Overlap-Add)
 * - Waveform similarity matching to reduce phase artifacts
 * - Proper normalization for transparent sound
 */

/**
 * Find the best offset within a search range to minimize discontinuities
 * This is the key to reducing artifacts - we find where waveforms align best
 */
function findBestOffset(
  inputData: Float32Array,
  prevEnd: number,
  targetPos: number,
  windowSize: number,
  searchRange: number
): number {
  if (prevEnd < 0 || targetPos < 0) return 0;

  let bestOffset = 0;
  let bestCorrelation = -Infinity;

  const compareLength = Math.min(windowSize / 4, 512);

  for (let offset = -searchRange; offset <= searchRange; offset++) {
    const pos = targetPos + offset;
    if (pos < 0 || pos + compareLength >= inputData.length) continue;
    if (prevEnd + compareLength >= inputData.length) continue;

    // Cross-correlation to find best match
    let correlation = 0;
    for (let i = 0; i < compareLength; i++) {
      correlation += inputData[prevEnd + i] * inputData[pos + i];
    }

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  return bestOffset;
}

/**
 * Time-stretch an AudioBuffer using WSOLA algorithm
 *
 * @param inputBuffer - Source audio buffer
 * @param stretchFactor - Factor > 1 = longer/slower, < 1 = shorter/faster
 * @param context - AudioContext for creating output buffer
 * @returns Time-stretched AudioBuffer with preserved pitch
 */
export function timeStretchPSOLA(
  inputBuffer: AudioBuffer,
  stretchFactor: number,
  context: AudioContext
): AudioBuffer {
  // No stretching needed
  if (Math.abs(stretchFactor - 1) < 0.001) {
    return inputBuffer;
  }

  const sampleRate = inputBuffer.sampleRate;
  const numChannels = inputBuffer.numberOfChannels;
  const inputLength = inputBuffer.length;
  const outputLength = Math.round(inputLength * stretchFactor);

  // Window size - ~23ms at 44.1kHz (1024 samples) works well for music
  const windowSize = 1024;

  // 50% overlap for perfect COLA with Hann window
  const hopSize = windowSize / 2;

  // Search range for WSOLA alignment (in samples)
  const searchRange = Math.round(windowSize / 4);

  // Pre-compute Hann window (COLA-compliant at 50% overlap)
  const window = new Float32Array(windowSize);
  for (let i = 0; i < windowSize; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / windowSize));
  }

  // Create output buffer
  const outputBuffer = context.createBuffer(numChannels, outputLength, sampleRate);

  // Process each channel
  for (let channel = 0; channel < numChannels; channel++) {
    const inputData = inputBuffer.getChannelData(channel);
    const outputData = outputBuffer.getChannelData(channel);

    let inputPos = 0;
    let outputPos = 0;
    let prevInputEnd = -1;

    while (outputPos < outputLength - windowSize) {
      // Target position in input based on stretch factor
      const targetInputPos = Math.round(outputPos / stretchFactor);

      // Find best alignment to reduce artifacts (WSOLA)
      let actualInputPos = targetInputPos;
      if (prevInputEnd >= 0 && stretchFactor !== 1) {
        const offset = findBestOffset(
          inputData,
          prevInputEnd,
          targetInputPos,
          windowSize,
          searchRange
        );
        actualInputPos = targetInputPos + offset;
      }

      // Clamp to valid range
      actualInputPos = Math.max(0, Math.min(inputLength - windowSize, actualInputPos));

      // Apply window and add to output
      for (let i = 0; i < windowSize; i++) {
        if (outputPos + i < outputLength) {
          outputData[outputPos + i] += inputData[actualInputPos + i] * window[i];
        }
      }

      // Track where this grain ended for next alignment
      prevInputEnd = actualInputPos + hopSize;

      // Move to next frame
      outputPos += hopSize;
    }
  }

  return outputBuffer;
}

/**
 * Calculate the stretch factor needed to match tempos
 */
export function calculateStretchFactor(
  clipTempo: number | undefined,
  targetTempo: number
): number {
  if (!clipTempo || clipTempo <= 0 || !targetTempo || targetTempo <= 0) {
    return 1;
  }
  return clipTempo / targetTempo;
}

/**
 * Calculate the new duration after tempo adjustment
 */
export function calculateStretchedDuration(
  originalDuration: number,
  clipTempo: number | undefined,
  targetTempo: number
): number {
  const stretchFactor = calculateStretchFactor(clipTempo, targetTempo);
  return originalDuration * stretchFactor;
}

// Cache for time-stretched buffers
const stretchCache = new Map<string, AudioBuffer>();

/**
 * Get a time-stretched buffer, using cache when possible
 */
export function getTimeStretchedBuffer(
  inputBuffer: AudioBuffer,
  clipTempo: number | undefined,
  targetTempo: number,
  context: AudioContext,
  cacheKey: string
): AudioBuffer {
  const stretchFactor = calculateStretchFactor(clipTempo, targetTempo);

  if (Math.abs(stretchFactor - 1) < 0.001) {
    return inputBuffer;
  }

  const fullKey = `${cacheKey}-${stretchFactor.toFixed(4)}`;
  const cached = stretchCache.get(fullKey);
  if (cached) {
    return cached;
  }

  const stretchedBuffer = timeStretchPSOLA(inputBuffer, stretchFactor, context);

  // Limit cache size
  if (stretchCache.size > 50) {
    const firstKey = stretchCache.keys().next().value;
    if (firstKey) stretchCache.delete(firstKey);
  }
  stretchCache.set(fullKey, stretchedBuffer);

  return stretchedBuffer;
}

/**
 * Clear the stretch cache
 */
export function clearStretchCache(): void {
  stretchCache.clear();
}
