import { useState, useEffect, useCallback, useRef } from 'react';
import { TreadmillData } from '../utils/FTMSParser';
import { useWorkoutStore, WorkoutSession } from '../store/useWorkoutStore';
import { ttsManager } from '../services/TTSManager';

export const useWorkoutSession = (liveData: TreadmillData | null, isConnected: boolean) => {
  const [isActive, setIsActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [samples, setSamples] = useState<Array<{ time: number; speed: number; incline: number }>>([]);
  const [stats, setStats] = useState({
    avgSpeed: 0,
    maxSpeed: 0,
    pace: 0, // min/km
    caloriesPerMin: 0,
  });

  const { addSession, goals, updateGoal } = useWorkoutStore();
  const lastSpeedRef = useRef(0);
  const pauseTimerRef = useRef<any>(null);

  // Auto-start / Auto-pause logic
  useEffect(() => {
    if (!isConnected) {
      if (isActive) endSession();
      return;
    }

    const currentSpeed = liveData?.speed || 0;

    if (currentSpeed > 0 && !isActive) {
      startSession();
    } else if (currentSpeed === 0 && isActive) {
      // Auto-pause after 5 seconds of 0 speed
      if (!pauseTimerRef.current) {
        pauseTimerRef.current = setTimeout(() => {
          setIsActive(false);
          ttsManager.speak('Workout paused');
        }, 5000);
      }
    } else if (currentSpeed > 0 && pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
      if (!isActive) {
        setIsActive(true);
        ttsManager.speak('Workout resumed');
      }
    }

    lastSpeedRef.current = currentSpeed;
  }, [liveData?.speed, isConnected, isActive]);

  const startSession = () => {
    setIsActive(true);
    setSessionStartTime(Date.now());
    setSamples([]);
    ttsManager.speak('Workout started. Have a great run!');
  };

  const endSession = () => {
    if (!isActive || samples.length === 0) return;

    const lastSample = samples[samples.length - 1];
    const session: WorkoutSession = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      duration: liveData?.elapsedTime || 0,
      distance: liveData?.totalDistance || 0,
      calories: liveData?.totalEnergy || 0,
      avgSpeed: stats.avgSpeed,
      maxSpeed: stats.maxSpeed,
      samples,
    };

    addSession(session);
    setIsActive(false);
    setSessionStartTime(null);
    ttsManager.speak(`Workout completed. You ran ${session.distance} meters.`);
  };

  // Real-time stats and samples recording
  useEffect(() => {
    if (!isActive || !liveData) return;

    const interval = setInterval(() => {
      const currentSpeed = liveData.speed || 0;
      const currentIncline = liveData.incline || 0;
      const time = liveData.elapsedTime || 0;

      setSamples((prev) => [...prev, { time, speed: currentSpeed, incline: currentIncline }]);

      // Calculate stats
      setStats((prev) => {
        const newMax = Math.max(prev.maxSpeed, currentSpeed);
        const newPace = currentSpeed > 0 ? 60 / currentSpeed : 0;
        return {
          ...prev,
          maxSpeed: newMax,
          pace: newPace,
          avgSpeed: samples.length > 0 
            ? (samples.reduce((acc, s) => acc + s.speed, 0) + currentSpeed) / (samples.length + 1)
            : currentSpeed,
        };
      });

      // Goal tracking checks
      checkGoals(liveData);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, liveData, samples.length]);

  const checkGoals = (data: TreadmillData) => {
    goals.forEach((goal) => {
      let currentVal = 0;
      if (goal.type === 'distance') currentVal = data.totalDistance || 0;
      if (goal.type === 'time') currentVal = data.elapsedTime || 0;
      if (goal.type === 'calories') currentVal = data.totalEnergy || 0;

      if (currentVal >= goal.target && goal.current < goal.target) {
        ttsManager.speak(`Goal reached! You have completed your ${goal.type} goal.`);
      } else if (currentVal >= goal.target * 0.9 && goal.current < goal.target * 0.9) {
        ttsManager.speak(`Almost there! 90 percent of your ${goal.type} goal completed.`);
      }

      updateGoal({ ...goal, current: currentVal });
    });
  };

  return {
    isActive,
    stats,
    samples,
    startSession,
    endSession,
  };
};
