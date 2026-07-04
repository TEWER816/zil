import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

interface SettingsState {
  theme: ThemeMode;
  showMotivationalQuotes: boolean;
  userName: string;
  hasGreeted: boolean;
  focusBgColor: string;

  // 个性化：自定义主色（null 表示用默认薄荷青）
  customPrimaryColor: string | null;
  // 个性化：自定义背景图（base64 data URL，null 表示无）
  backgroundImage: string | null;
  // 个性化：背景遮罩不透明度 (0-100，数值越大背景图越淡)
  bgOverlayOpacity: number;
  // 个性化：背景模糊度 (px)
  bgBlur: number;
  // 个性化：主页进度环中心自定义图片（base64 data URL，null 表示无）
  homeProgressImage: string | null;

  // AI：智谱 GLM API Key（空字符串表示未配置）
  glmApiKey: string;

  setTheme: (theme: ThemeMode) => void;
  setShowMotivationalQuotes: (show: boolean) => void;
  setUserName: (name: string) => void;
  setHasGreeted: (v: boolean) => void;
  setFocusBgColor: (c: string) => void;
  setCustomPrimaryColor: (c: string | null) => void;
  setBackgroundImage: (img: string | null) => void;
  setBgOverlayOpacity: (n: number) => void;
  setBgBlur: (n: number) => void;
  setHomeProgressImage: (img: string | null) => void;
  setGlmApiKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      showMotivationalQuotes: true,
      userName: '',
      hasGreeted: false,
      focusBgColor: '#1A1A1F',

      customPrimaryColor: null,
      backgroundImage: null,
      bgOverlayOpacity: 70,
      bgBlur: 0,
      homeProgressImage: null,

      glmApiKey: '',

      setTheme: (theme) => set({ theme }),
      setShowMotivationalQuotes: (show) => set({ showMotivationalQuotes: show }),
      setUserName: (name) => set({ userName: name }),
      setHasGreeted: (v) => set({ hasGreeted: v }),
      setFocusBgColor: (c) => set({ focusBgColor: c }),
      setCustomPrimaryColor: (c) => set({ customPrimaryColor: c }),
      setBackgroundImage: (img) => set({ backgroundImage: img }),
      setBgOverlayOpacity: (n) => set({ bgOverlayOpacity: n }),
      setBgBlur: (n) => set({ bgBlur: n }),
      setHomeProgressImage: (img) => set({ homeProgressImage: img }),
      setGlmApiKey: (key) => set({ glmApiKey: key }),
    }),
    {
      name: 'zil-settings'
    }
  )
);
