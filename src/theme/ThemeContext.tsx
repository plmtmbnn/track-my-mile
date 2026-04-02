import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export const COLORS = {
  primary: '#2196F3',
  secondary: '#FF4081',
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#F44336',
  card: '#FFFFFF',
  text: '#333333',
  subtext: '#666666',
  border: '#DDDDDD',
  background: '#F5F5F5',
};

export const DARK_COLORS = {
  primary: '#2196F3',
  secondary: '#FF4081',
  success: '#81C784',
  warning: '#FFD54F',
  danger: '#E57373',
  card: '#1E1E1E',
  text: '#E0E0E0',
  subtext: '#B0B0B0',
  border: '#333333',
  background: '#121212',
};

interface ThemeContextType {
  theme: typeof COLORS;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  const theme = isDark ? DARK_COLORS : COLORS;

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
