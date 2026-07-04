import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIHabitSuggestion } from '@/lib/glm';

interface RecommendationState {
  // 当前展示给用户的单条推荐
  currentSuggestion: AIHabitSuggestion | null;
  // 当前推荐的 ID（用于去重），用 name 作为简单 ID
  currentId: string | null;
  // 上次生成日期 YYYY-MM-DD
  generatedAt: string | null;
  // 用户关闭过的推荐 ID（避免重复推送同一习惯）
  dismissedIds: string[];
  // 用户采纳过的推荐 ID
  adoptedIds: string[];

  isGenerating: boolean;

  setGenerating: (v: boolean) => void;
  setSuggestion: (suggestion: AIHabitSuggestion) => void;
  markGeneratedToday: () => void;
  dismissCurrent: () => void;
  adoptCurrent: () => void;
  clear: () => void;
}

const getLocalDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useRecommendStore = create<RecommendationState>()(
  persist(
    (set, get) => ({
      currentSuggestion: null,
      currentId: null,
      generatedAt: null,
      dismissedIds: [],
      adoptedIds: [],
      isGenerating: false,

      setGenerating: (v) => set({ isGenerating: v }),

      setSuggestion: (suggestion) => {
        const id = `${suggestion.name}`;
        set({
          currentSuggestion: suggestion,
          currentId: id,
          generatedAt: getLocalDateString(),
          isGenerating: false,
        });
      },

      markGeneratedToday: () =>
        set({
          generatedAt: getLocalDateString(),
          currentSuggestion: null,
          currentId: null,
          isGenerating: false,
        }),

      dismissCurrent: () => {
        const { currentId } = get();
        set((s) => ({
          currentSuggestion: null,
          currentId: null,
          dismissedIds: currentId
            ? [...new Set([...s.dismissedIds, currentId])].slice(-50)
            : s.dismissedIds,
        }));
      },

      adoptCurrent: () => {
        const { currentId } = get();
        set((s) => ({
          currentSuggestion: null,
          currentId: null,
          adoptedIds: currentId
            ? [...new Set([...s.adoptedIds, currentId])].slice(-50)
            : s.adoptedIds,
        }));
      },

      clear: () =>
        set({
          currentSuggestion: null,
          currentId: null,
          generatedAt: null,
          dismissedIds: [],
          adoptedIds: [],
          isGenerating: false,
        }),
    }),
    {
      name: 'zil-recommendations',
    }
  )
);
