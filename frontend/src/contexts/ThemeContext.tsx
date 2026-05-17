'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Dark mode disabled — theme is locked to 'light'. Implementation kept for future re-enable.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.remove('dark');
    // Original logic preserved below for future re-enable:
    // const savedTheme = localStorage.getItem('theme') as Theme | null;
    // if (savedTheme) {
    //   setTheme(savedTheme);
    //   if (savedTheme === 'dark') {
    //     document.documentElement.classList.add('dark');
    //   } else {
    //     document.documentElement.classList.remove('dark');
    //   }
    // } else {
    //   const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    //   const initialTheme = prefersDark ? 'dark' : 'light';
    //   setTheme(initialTheme);
    //   if (prefersDark) {
    //     document.documentElement.classList.add('dark');
    //   } else {
    //     document.documentElement.classList.remove('dark');
    //   }
    // }
  }, []);

  const toggleTheme = () => {
    // No-op while dark mode is disabled.
    // Original logic preserved below for future re-enable:
    // const newTheme = theme === 'light' ? 'dark' : 'light';
    // setTheme(newTheme);
    // localStorage.setItem('theme', newTheme);
    // if (newTheme === 'dark') {
    //   document.documentElement.classList.add('dark');
    // } else {
    //   document.documentElement.classList.remove('dark');
    // }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
