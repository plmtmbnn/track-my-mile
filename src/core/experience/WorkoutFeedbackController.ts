import { ProcessedData, Lap } from '../metrics/types';
import { PaceTrend, SessionSummary } from './types';
import { audioService } from './AudioService';
import { hapticService } from './HapticService';

/**
 * Controller that translates data metrics into user feedback (audio/haptic).
 */
export class WorkoutFeedbackController {
  private lastLapCount: number = 0;
  private paceHistory: number[] = [];
  private readonly paceTrendWindow = 5; // samples
  private bestPace: number = Infinity;
  
  // Settings
  private audioFeedbackIntervalMeters: number = 1000; // 1km
  private audioFeedbackIntervalSeconds: number = 300; // 5 mins
  private lastAudioFeedbackTime: number = 0;

  /**
   * Monitor real-time metrics and provide feedback signals.
   */
  public handleMetricsUpdate(processed: ProcessedData, currentLaps: Lap[]) {
    // 1. Lap Completion Detection
    if (currentLaps.length > this.lastLapCount) {
      const latestLap = currentLaps[currentLaps.length - 1];
      this.triggerLapFeedback(latestLap);
      this.lastLapCount = currentLaps.length;
    }

    // 2. Periodic Time-based Audio Feedback
    if (processed.duration - this.lastAudioFeedbackTime >= this.audioFeedbackIntervalSeconds) {
      this.triggerStatusUpdate(processed);
      this.lastAudioFeedbackTime = processed.duration;
    }

    // 3. Track Best Pace
    if (processed.speed > 0 && processed.pace < this.bestPace) {
      this.bestPace = processed.pace;
    }

    // 4. Update Pace History for Trend Analysis
    this.paceHistory.push(processed.pace);
    if (this.paceHistory.length > this.paceTrendWindow) {
      this.paceHistory.shift();
    }
  }

  public getPaceTrend(): PaceTrend {
    if (this.paceHistory.length < this.paceTrendWindow) return PaceTrend.STABLE;

    const first = this.paceHistory[0];
    const last = this.paceHistory[this.paceHistory.length - 1];
    const diff = last - first;

    if (Math.abs(diff) < 0.2) return PaceTrend.STABLE;
    return diff > 0 ? PaceTrend.DECREASING : PaceTrend.INCREASING; // Higher pace value means slower speed
  }

  private triggerLapFeedback(lap: Lap) {
    hapticService.triggerLap();
    const paceMessage = `Kilometer ${lap.lapNumber} complete. Pace: ${Math.floor(lap.avgPace)} minutes ${Math.round((lap.avgPace % 1) * 60)} seconds.`;
    audioService.speak(paceMessage);
  }

  private triggerStatusUpdate(processed: ProcessedData) {
    const distanceKm = (processed.distance / 1000).toFixed(1);
    const message = `Total distance: ${distanceKm} kilometers. Time: ${Math.floor(processed.duration / 60)} minutes.`;
    audioService.speak(message);
  }

  public getSessionSummary(processed: ProcessedData, laps: Lap[]): SessionSummary {
    return {
      totalDistance: processed.distance,
      totalTime: processed.duration,
      totalCalories: processed.calories,
      avgPace: processed.distance > 0 ? (processed.duration / 60) / (processed.distance / 1000) : 0,
      bestPace: this.bestPace === Infinity ? 0 : this.bestPace,
      laps: laps,
    };
  }

  public reset() {
    this.lastLapCount = 0;
    this.paceHistory = [];
    this.bestPace = Infinity;
    this.lastAudioFeedbackTime = 0;
  }
}
