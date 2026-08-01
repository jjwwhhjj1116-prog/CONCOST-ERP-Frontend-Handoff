'use client';

import { useEffect } from 'react';
import { useUiStore } from '@/store/uiStore';

export function ThemeProvider() {
  const { isDarkMode } = useUiStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return null;
}
