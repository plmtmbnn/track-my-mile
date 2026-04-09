import { Vibration, Platform } from 'react-native';

/**
 * HapticService provides tactile feedback for critical workout events.
 * Uses built-in Vibration API for platform-agnostic support.
 */
export class HapticService {
  
  public triggerStart() {
    // Single short pulse
    Vibration.vibrate(100);
  }

  public triggerPause() {
    // Double pulse
    Vibration.vibrate([0, 100, 50, 100]);
  }

  public triggerResume() {
    // Upwards pulse (approximation via pattern)
    Vibration.vibrate(200);
  }

  public triggerLap() {
    // Success pattern
    if (Platform.OS === 'ios') {
      Vibration.vibrate(100); // iOS Vibration is limited, typically use HapticEngine
    } else {
      Vibration.vibrate([0, 200, 100, 200]);
    }
  }

  public triggerPhaseChange() {
    Vibration.vibrate(150);
  }
}

export const hapticService = new HapticService();
