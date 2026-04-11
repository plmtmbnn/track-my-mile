import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'ui-storage' });

const mmkvStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.remove(name),
};

export enum AudioMode {
  MUTE = 'MUTE',
  IMPORTANT = 'IMPORTANT',
  FULL = 'FULL',
}

interface UIState {
  audioMode: AudioMode;
  isFocusMode: boolean;
  autoPauseEnabled: boolean;
  targetPace: number; // min/km
  setAudioMode: (mode: AudioMode) => void;
  toggleFocusMode: () => void;
  setTargetPace: (pace: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      audioMode: AudioMode.IMPORTANT,
      isFocusMode: false,
      autoPauseEnabled: true,
      targetPace: 6.0,
      setAudioMode: (audioMode) => set({ audioMode }),
      toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
      setTargetPace: (targetPace) => set({ targetPace }),
    }),
    {
      name: 'ui-preferences',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
