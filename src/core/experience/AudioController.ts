import { AudioMode, AudioCategory, AudioEvent } from './types';
import { audioQueue } from './AudioQueue';
import { useUIStore } from '../../store/useUIStore';

/**
 * AudioController acts as the smart filter layer for all workout audio.
 * It classifies and routes events based on the current user preference.
 */
export class AudioController {
  
  /**
   * Central entry point for all audio feedback.
   * Filters events based on AudioMode without modifying the source trigger.
   */
  public static play(message: string, category: AudioCategory = AudioCategory.NORMAL, priority: number = 0) {
    const { audioMode } = useUIStore.getState();

    // 1. Filter: MUTE blocks everything
    if (audioMode === AudioMode.MUTE) {
      console.log(`[AudioController] Blocked (MUTE): ${message}`);
      return;
    }

    // 2. Filter: IMPORTANT blocks NORMAL
    if (audioMode === AudioMode.IMPORTANT && category === AudioCategory.NORMAL) {
      console.log(`[AudioController] Blocked (IMPORTANT-ONLY): ${message}`);
      return;
    }

    // 3. Create Event and Queue
    const event: AudioEvent = {
      id: Math.random().toString(36).substring(7),
      message,
      category,
      priority: category === AudioCategory.IMPORTANT ? priority + 10 : priority,
      timestamp: Date.now()
    };

    audioQueue.enqueue(event);
  }

  /**
   * Helper to classify common workout events
   */
  public static playImportant(message: string, priority: number = 5) {
    this.play(message, AudioCategory.IMPORTANT, priority);
  }

  public static playInfo(message: string) {
    this.play(message, AudioCategory.NORMAL, 0);
  }

  public static pause() {
    audioQueue.clear();
  }

  public static resume() {
    // No specific logic needed for resume, queue is ready for new events
  }
}
