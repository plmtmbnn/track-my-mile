import Tts from 'react-native-tts';
import { AudioEvent } from './types';

/**
 * AudioQueue manages the sequential execution of TTS messages.
 * Prevents overlapping audio by waiting for 'tts-finish'.
 */
export class AudioQueue {
  private queue: AudioEvent[] = [];
  private isPlaying: boolean = false;
  private maxQueueSize: number = 5;

  constructor() {
    Tts.addEventListener('tts-finish', () => {
      this.isPlaying = false;
      this.processNext();
    });
    
    Tts.addEventListener('tts-cancel', () => {
      this.isPlaying = false;
      this.processNext();
    });
  }

  public enqueue(event: AudioEvent) {
    // 1. Avoid spam: Don't queue duplicate messages within 3 seconds
    const isDuplicate = this.queue.some(
      (e) => e.message === event.message && event.timestamp - e.timestamp < 3000
    );
    if (isDuplicate) return;

    // 2. Queue management: Drop lowest priority if full
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.sort((a, b) => a.priority - b.priority);
      this.queue.shift(); // Remove lowest priority
    }

    this.queue.push(event);
    this.queue.sort((a, b) => b.priority - a.priority); // Keep high priority at the front

    if (!this.isPlaying) {
      this.processNext();
    }
  }

  private processNext() {
    if (this.queue.length === 0 || this.isPlaying) return;

    const nextEvent = this.queue.shift();
    if (nextEvent) {
      this.isPlaying = true;
      Tts.speak(nextEvent.message);
      console.log(`[AudioQueue] Playing: "${nextEvent.message}"`);
    }
  }

  public clear() {
    this.queue = [];
    this.isPlaying = false;
    Tts.stop();
  }
}

export const audioQueue = new AudioQueue();
