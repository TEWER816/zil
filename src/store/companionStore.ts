// 小猫伙伴 store — 跟踪打卡事件，触发小猫反馈
import { create } from 'zustand';

interface CompanionState {
  /** 打卡触发 key（变化时小猫跳动） */
  pulseKey: number;
  triggerPulse: () => void;
}

export const useCompanionStore = create<CompanionState>((set) => ({
  pulseKey: 0,
  triggerPulse: () => set((s) => ({ pulseKey: s.pulseKey + 1 })),
}));
