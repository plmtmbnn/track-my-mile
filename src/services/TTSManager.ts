import Tts from 'react-native-tts';

class TTSManager {
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;
    try {
      await Tts.getInitStatus();
      this.isInitialized = true;
      Tts.setDefaultLanguage('en-US');
      Tts.setDefaultRate(0.5);
    } catch (e) {
      console.warn('TTS Initialization failed', e);
    }
  }

  speak(text: string) {
    if (!this.isInitialized) {
      this.init().then(() => Tts.speak(text));
    } else {
      Tts.speak(text);
    }
  }

  stop() {
    Tts.stop();
  }
}

export const ttsManager = new TTSManager();
