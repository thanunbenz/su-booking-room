'use client';

import { useEffect, useState } from 'react';
import MoonIcon from '@/components/icons/MoonIcon';
import SunIcon from '@/components/icons/SunIcon';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(()  => {
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme === 'dark';

    setIsDark(isDarkMode);

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-300 dark:border-gray-600"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <SunIcon className="w-5 h-5 text-yellow-500" />
      ) : (
        <MoonIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      )}
    </button>
  );
}
