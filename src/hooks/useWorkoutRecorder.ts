import { useState, useEffect, useRef, useCallback } from 'react';
import { WorkoutPoint } from '../utils/GPXGenerator';
import { WorkoutService } from '../services/WorkoutService';

export const useWorkoutRecorder = (isRecording: boolean, currentSpeed: number, currentDistance: number) => {
  const [points, setPoints] = useState<WorkoutPoint[]>([]);
  const pointsRef = useRef<WorkoutPoint[]>([]);

  // 1Hz Recorder
  useEffect(() => {
    let interval: any;

    if (isRecording) {
      interval = setInterval(() => {
        const newPoint: WorkoutPoint = {
          timestamp: new Date(),
          speed: currentSpeed,
          distance: currentDistance,
          incline: 0, // Placeholder if not provided
          power: 0,   // Placeholder if not provided
        };
        
        pointsRef.current = [...pointsRef.current, newPoint];
        setPoints(pointsRef.current);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, currentSpeed, currentDistance]);

  const resetPoints = useCallback(() => {
    pointsRef.current = [];
    setPoints([]);
  }, []);

  const saveAndShare = async () => {
    if (pointsRef.current.length < 2) {
      console.warn('Not enough points to export GPX');
      return;
    }

    try {
      const path = await WorkoutService.saveGPX(pointsRef.current);
      await WorkoutService.shareGPX(path);
      resetPoints();
    } catch (error) {
      console.error('Save and Share failed:', error);
    }
  };

  return {
    pointsCount: points.length,
    saveAndShare,
    resetPoints,
  };
};
