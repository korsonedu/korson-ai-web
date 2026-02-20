import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SystemState {
  theme: 'light' | 'dark';
  primaryColor: string;
  pageTitle: string;
  pageSubtitle: string;
  setTheme: (theme: 'light' | 'dark') => void;
  setPrimaryColor: (color: string) => void;
  setPageHeader: (title: string, subtitle: string) => void;
}

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      theme: 'light',
      primaryColor: '#000000',
      pageTitle: '',
      pageSubtitle: '',
      setTheme: (theme) => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme });
      },
      setPrimaryColor: (color) => {
        // 直接修改 document 变量以确保立即生效
        document.documentElement.style.setProperty('--primary-override', color);
        set({ primaryColor: color });
      },
      setPageHeader: (title, subtitle) => set({ pageTitle: title, pageSubtitle: subtitle }),
    }),
    {
      name: 'system-storage',
    }
  )
);
