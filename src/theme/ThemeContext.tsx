import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';

export const PREMIUM_PALETTE = {
  // Intensity based colors
  intensity: {
    low: ['#0F2027', '#203A43', '#2C5364'], // Deep Blue/Teal
    medium: ['#1e3c72', '#2a5298', '#2193b0'], // Blue
    high: ['#833ab4', '#fd1d1d', '#fcb045'], // Vibrant Purple/Red/Orange
    elite: ['#000000', '#434343', '#0f9b0f'], // Dark/Neon Green
  },
  glass: {
    background: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.25)',
    glow: 'rgba(33, 150, 243, 0.4)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    muted: 'rgba(255, 255, 255, 0.4)',
  },
  accent: {
    blue: '#00D2FF',
    green: '#00FF87',
    red: '#FF0055',
    orange: '#FFB800',
  }
};

const ThemeContext = createContext({
  palette: PREMIUM_PALETTE,
  isDark: true,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeContext.Provider value={{ palette: PREMIUM_PALETTE, isDark: true }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
