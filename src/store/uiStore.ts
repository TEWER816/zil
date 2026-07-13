import { create } from 'zustand';

interface UIState {
  // 沉浸专注模式（运行态，不持久化）
  focusMode: boolean;
  enterFocusMode: () => void;
  exitFocusMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  focusMode: false,
  enterFocusMode: () => set({ focusMode: true }),
  exitFocusMode: () => set({ focusMode: false }),
}));
