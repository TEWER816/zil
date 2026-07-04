import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export function useTheme() {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  return { theme };
}