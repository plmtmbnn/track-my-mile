import React, { createContext, useContext } from 'react';

export const ELITE_PALETTE = {
  background: '#000000',
  surface: 'rgba(28, 28, 30, 0.7)',
  glass: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.12)',
  text: {
    primary: '#FFFFFF',
    secondary: '#A1A1AA',
    muted: '#52525B',
  },
  accent: {
    blue: '#38BDF8',
    green: '#4ADE80',
    red: '#F87171',
    orange: '#FB923C',
    purple: '#A855F7',
  },
  intensity: {
    low: ['#0F172A', '#1E293B'], // Slate
    mid: ['#064E3B', '#065F46'], // Emerald
    high: ['#7F1D1D', '#991B1B'], // Red
    sprint: ['#4C1D95', '#5B21B6'], // Violet
  }
};

const ThemeContext = createContext({
  palette: ELITE_PALETTE,
  isDark: true,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeContext.Provider value={{ palette: ELITE_PALETTE, isDark: true }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
