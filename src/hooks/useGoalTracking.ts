import { useMemo } from 'react';
import { useUIStore } from '../store/useUIStore';

export type GoalStatus = 'AHEAD' | 'BEHIND' | 'ON_TRACK';

export const useGoalTracking = (currentDistanceMeters: number, elapsedSeconds: number) => {
  const { targetPace } = useUIStore();

  return useMemo(() => {
    if (elapsedSeconds < 10) return { status: 'ON_TRACK' as GoalStatus, deltaMeters: 0 };

    // targetPace is min/km. Convert to m/s: 1000 / (targetPace * 60)
    const targetSpeedMPS = 1000 / (targetPace * 60);
    const expectedDistance = targetSpeedMPS * elapsedSeconds;
    
    const delta = currentDistanceMeters - expectedDistance;
    
    let status: GoalStatus = 'ON_TRACK';
    if (delta > 30) status = 'AHEAD';
    else if (delta < -30) status = 'BEHIND';

    return {
      status,
      deltaMeters: Math.round(delta),
      expectedDistance,
    };
  }, [currentDistanceMeters, elapsedSeconds, targetPace]);
};
