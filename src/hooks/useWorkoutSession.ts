import { useState, useEffect, useRef, useCallback } from 'react';
import { TreadmillData } from '../utils/FTMSParser';
import { useWorkoutStore, WorkoutSession } from '../store/useWorkoutStore';
import { ttsManager } from '../services/TTSManager';
import { WorkoutPoint } from '../utils/GPXGenerator';

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
  
  const [stats, setStats] = useState({
    avgSpeed: 0,
    maxSpeed: 0,
    pace: 0,
  });

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
    setState(SessionState.RUNNING);
    accumulatedTimeRef.current = 0;
    startTimeRef.current = Date.now();
    setDisplaySeconds(0);
    clearSessionPoints();
    setStats({ avgSpeed: 0, maxSpeed: 0, pace: 0 });
    ttsManager.speak('Workout started.');
  }, [clearSessionPoints]);

  const pauseSession = useCallback(() => {
    if (state === SessionState.RUNNING) {
      accumulatedTimeRef.current += Date.now() - (startTimeRef.current || Date.now());
      startTimeRef.current = null;
      setState(SessionState.PAUSED);
      ttsManager.speak('Workout paused.');
    }
  }, [state]);

  const resumeSession = useCallback(() => {
    if (state === SessionState.PAUSED) {
      startTimeRef.current = Date.now();
      setState(SessionState.RUNNING);
      ttsManager.speak('Workout resumed.');
    }
  }, [state]);

  const stopSession = useCallback(() => {
    if (state === SessionState.IDLE || state === SessionState.FINISHED) return;

    const finalElapsedMs = getElapsedMs();
    const finalSeconds = Math.floor(finalElapsedMs / 1000);

    const session: WorkoutSession = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      duration: finalSeconds,
      distance: liveData?.totalDistance || 0,
      calories: liveData?.totalEnergy || 0,
      avgSpeed: stats.avgSpeed,
      maxSpeed: stats.maxSpeed,
      samples: currentSessionPoints.map(p => ({ 
        time: Math.floor((p.timestamp.getTime() - (currentSessionPoints[0]?.timestamp.getTime() || 0)) / 1000), 
        speed: p.speed, 
        incline: p.incline,
        pace: p.speed > 0 ? 60 / p.speed : 0,
        distance: p.distance
      })),
    };

    addSession(session);
    setState(SessionState.FINISHED);
    startTimeRef.current = null;
    ttsManager.speak('Workout completed.');
  }, [state, getElapsedMs, liveData, stats, currentSessionPoints, addSession]);

  const resetSession = useCallback(() => {
    setState(SessionState.IDLE);
    accumulatedTimeRef.current = 0;
    startTimeRef.current = null;
    setDisplaySeconds(0);
    clearSessionPoints();
  }, [clearSessionPoints]);

  // 1Hz Recorder
  useEffect(() => {
    if (state === SessionState.RUNNING) {
      recordingIntervalRef.current = setInterval(() => {
        if (liveData) {
          const point: WorkoutPoint = {
            timestamp: new Date(),
            speed: liveData.speed || 0,
            distance: liveData.totalDistance || 0,
            incline: liveData.incline || 0,
            power: liveData.powerOutput || 0,
          };
          addSessionPoint(point);

          // Update real-time stats
          setStats((prev) => {
            const newMax = Math.max(prev.maxSpeed, point.speed);
            const newPace = point.speed > 0 ? 60 / point.speed : 0;
            const newAvg = (currentSessionPoints.length * prev.avgSpeed + point.speed) / (currentSessionPoints.length + 1);
            return {
              avgSpeed: newAvg,
              maxSpeed: newMax,
              pace: newPace,
            };
          });

          checkGoals(liveData, Math.floor(getElapsedMs() / 1000));
        }
      }, 1000);
    } else {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }

    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [state, liveData, addSessionPoint, currentSessionPoints.length, getElapsedMs]);

  const checkGoals = (data: TreadmillData, seconds: number) => {
    goals.forEach((goal) => {
      let currentVal = 0;
      if (goal.type === 'distance') currentVal = data.totalDistance || 0;
      if (goal.type === 'time') currentVal = seconds;
      if (goal.type === 'calories') currentVal = data.totalEnergy || 0;

      if (currentVal >= goal.target && goal.current < goal.target) {
        ttsManager.speak(`${goal.type} goal reached!`);
      }
      updateGoal({ ...goal, current: currentVal });
    });
  };

  return {
    state,
    totalSeconds: displaySeconds,
    stats,
    samples: currentSessionPoints.map(p => ({ 
      time: Math.floor((p.timestamp.getTime() - (currentSessionPoints[0]?.timestamp.getTime() || p.timestamp.getTime())) / 1000), 
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
