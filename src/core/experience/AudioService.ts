import Tts from 'react-native-tts';

/**
 * AudioService provides a managed Text-to-Speech queue.
 * Ensures workout announcements don't overlap and can be canceled.
 */
export class AudioService {
  private initialized: boolean = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      await Tts.getInitStatus();
      this.initialized = true;
      Tts.setDefaultRate(0.5); // Natural speaking rate
    } catch (e) {
      console.warn('[AudioService] Failed to initialize TTS:', e);
    }
  }

  public speak(message: string, interrupt: boolean = false) {
    if (!this.initialized) return;

    if (interrupt) {
      Tts.stop();
    }
    
    Tts.speak(message);
    console.log(`[AudioService] Speaking: "${message}"`);
  }

  public stop() {
    if (this.initialized) {
      Tts.stop();
    }
  }

  public clearQueue() {
    this.stop();
  }
}

export const audioService = new AudioService();
