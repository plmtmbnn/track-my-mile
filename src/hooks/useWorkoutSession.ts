import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TreadmillData } from '../utils/FTMSParser';
import { useWorkoutStore, WorkoutSession } from '../store/useWorkoutStore';
import { AudioController } from '../core/experience/AudioController';
import { WorkoutPoint } from '../utils/GPXGenerator';
import { DataProcessor } from '../core/metrics/DataProcessor';
import { ProcessedData } from '../core/metrics/types';

export enum SessionState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED',
}

export const useWorkoutSession = (liveData: TreadmillData | null, isConnected: boolean) => {
  const [state, setState] = useState<SessionState>(SessionState.IDLE);
  
  // Timer State
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const accumulatedTimeRef = useRef(0); // in ms
  const startTimeRef = useRef<number | null>(null); // in ms
  const workoutStartTimeRef = useRef<number | null>(null); // Persistence of start
  
  const processor = useMemo(() => new DataProcessor(), []);
  const [processedMetrics, setProcessedMetrics] = useState<ProcessedData | null>(null);

  const { addSession, addSessionPoint, clearSessionPoints, currentSessionPoints, goals, updateGoal } = useWorkoutStore();
  const recordingIntervalRef = useRef<any>(null);
  const displayTimerRef = useRef<any>(null);

  // Accurate timer calculation
  const getElapsedMs = useCallback(() => {
    if (state !== SessionState.RUNNING || !startTimeRef.current) {
      return accumulatedTimeRef.current;
    }
    return accumulatedTimeRef.current + (Date.now() - startTimeRef.current);
  }, [state]);

  // Update display every 200ms
  useEffect(() => {
    if (state === SessionState.RUNNING) {
      displayTimerRef.current = setInterval(() => {
        setDisplaySeconds(Math.floor(getElapsedMs() / 1000));
      }, 200);
    } else {
      if (displayTimerRef.current) clearInterval(displayTimerRef.current);
    }
    return () => {
      if (displayTimerRef.current) clearInterval(displayTimerRef.current);
    };
  }, [state, getElapsedMs]);

  const startSession = useCallback(() => {
    processor.reset();
    clearSessionPoints();
    workoutStartTimeRef.current = Date.now();
    accumulatedTimeRef.current = 0;
    startTimeRef.current = Date.now();
    setDisplaySeconds(0);
    setProcessedMetrics(null);
    setState(SessionState.RUNNING);
    AudioController.playImportant('Workout started.');
  }, [clearSessionPoints, processor]);

  const pauseSession = useCallback(() => {
    if (state === SessionState.RUNNING) {
      accumulatedTimeRef.current += Date.now() - (startTimeRef.current || Date.now());
      startTimeRef.current = null;
      setState(SessionState.PAUSED);
      AudioController.playImportant('Workout paused.');
    }
  }, [state]);

  const resumeSession = useCallback(() => {
    if (state === SessionState.PAUSED) {
      startTimeRef.current = Date.now();
      setState(SessionState.RUNNING);
      AudioController.playImportant('Workout resumed.');
    }
  }, [state]);

  const stopSession = useCallback(() => {
    if (state === SessionState.IDLE || state === SessionState.FINISHED) return;

    const finalElapsedMs = getElapsedMs();
    const finalSeconds = Math.floor(finalElapsedMs / 1000);

    const sessionStart = workoutStartTimeRef.current || Date.now();

    // Use current metrics from processor instead of liveData which might have reset
    const finalDistance = processedMetrics?.distance || 0;
    const finalCalories = processedMetrics?.calories || 0;
    const avgSpeed = currentSessionPoints.length > 0 
      ? currentSessionPoints.reduce((acc, p) => acc + p.speed, 0) / currentSessionPoints.length 
      : 0;
    const maxSpeed = currentSessionPoints.length > 0
      ? Math.max(...currentSessionPoints.map(p => p.speed))
      : 0;

    const session: WorkoutSession = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      duration: finalSeconds,
      distance: finalDistance,
      calories: finalCalories,
      avgSpeed: avgSpeed,
      maxSpeed: maxSpeed,
      samples: currentSessionPoints.map(p => ({ 
        time: Math.floor((p.timestamp.getTime() - sessionStart) / 1000), 
        speed: p.speed, 
        incline: p.incline,
        pace: p.speed > 0 ? 60 / p.speed : 0,
        distance: p.distance
      })),
    };

    addSession(session);
    setState(SessionState.FINISHED);
    startTimeRef.current = null;
    workoutStartTimeRef.current = null;
    AudioController.playImportant('Workout completed.');
  }, [state, getElapsedMs, processedMetrics, currentSessionPoints, addSession]);

  const resetSession = useCallback(() => {
    setState(SessionState.IDLE);
    accumulatedTimeRef.current = 0;
    startTimeRef.current = null;
    workoutStartTimeRef.current = null;
    setDisplaySeconds(0);
    clearSessionPoints();
    processor.reset();
    setProcessedMetrics(null);
  }, [clearSessionPoints, processor]);

  // Process live data and update metrics
  useEffect(() => {
    if (liveData) {
      const processed = processor.process({
        speed: liveData.speed || 0,
        distance: liveData.totalDistance || 0,
        incline: liveData.incline || 0,
        elapsedTime: Math.floor(getElapsedMs() / 1000),
        timestamp: Date.now(),
        heartRate: liveData.heartRate,
        power: liveData.powerOutput
      });
      setProcessedMetrics(processed);
    }
  }, [liveData, processor, getElapsedMs]);

  // 1Hz Recorder
  useEffect(() => {
    if (state === SessionState.RUNNING) {
      recordingIntervalRef.current = setInterval(() => {
        if (processedMetrics) {
          const point: WorkoutPoint = {
            timestamp: new Date(processedMetrics.timestamp),
            speed: processedMetrics.speed,
            distance: processedMetrics.distance,
            incline: processedMetrics.incline,
            power: liveData?.powerOutput || 0,
          };
          addSessionPoint(point);
          checkGoals(processedMetrics, processedMetrics.duration);
        }
      }, 1000);
    } else {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }

    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [state, processedMetrics, addSessionPoint, liveData]);

  const checkGoals = (data: ProcessedData, seconds: number) => {
    goals.forEach((goal) => {
      let currentVal = 0;
      if (goal.type === 'distance') currentVal = data.distance;
      if (goal.type === 'time') currentVal = seconds;
      if (goal.type === 'calories') currentVal = data.calories;

      if (currentVal >= goal.target && goal.current < goal.target) {
        AudioController.playImportant(`${goal.type} goal reached!`);
      }
      updateGoal({ ...goal, current: currentVal });
    });
  };

  const sessionStart = workoutStartTimeRef.current || Date.now();

  return {
    state,
    totalSeconds: displaySeconds,
    processedMetrics,
    samples: currentSessionPoints.map(p => ({ 
      time: Math.floor((p.timestamp.getTime() - sessionStart) / 1000), 
      speed: p.speed, 
      incline: p.incline,
      pace: p.speed > 0 ? 60 / p.speed : 0,
      distance: p.distance
    })),
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    resetSession,
  };
};
