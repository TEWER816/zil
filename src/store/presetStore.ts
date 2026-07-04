import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============ 类型定义 ============

/** 每日记录 */
interface DayRecord {
  date: string; // YYYY-MM-DD
  minutes: number;
}

/** 锻炼类型 */
interface ExerciseType {
  id: string;
  name: string;
  allocatedMinutes: number;
}

/** 运动健身预设 */
interface FitnessPreset {
  enabled: boolean;
  dailyTargetMinutes: number; // 每日目标（分钟）
  exerciseTypes: ExerciseType[];
  todayMinutes: number;
  todayTypeId: string | null;
  history: { date: string; minutes: number; typeId: string; completed: boolean }[];
}

// ============ Store ============

interface PresetState {
  fitness: FitnessPreset;

  toggleFitness: () => void;
  setFitnessTarget: (minutes: number) => void;
  addExerciseType: (name: string, allocatedMinutes: number) => void;
  removeExerciseType: (id: string) => void;
  updateExerciseType: (id: string, updates: Partial<ExerciseType>) => void;
  addFitnessTime: (minutes: number, typeId: string) => void;
  resetFitnessToday: () => void;
}

const getLocalDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      fitness: {
        enabled: false,
        dailyTargetMinutes: 60,
        exerciseTypes: [
          { id: 'cardio', name: '有氧运动', allocatedMinutes: 30 },
          { id: 'strength', name: '力量训练', allocatedMinutes: 20 },
          { id: 'stretch', name: '拉伸放松', allocatedMinutes: 10 },
        ],
        todayMinutes: 0,
        todayTypeId: null,
        history: [],
      },

      // ===== 运动健身 =====
      toggleFitness: () =>
        set((s) => ({ fitness: { ...s.fitness, enabled: !s.fitness.enabled } })),
      setFitnessTarget: (minutes) =>
        set((s) => ({ fitness: { ...s.fitness, dailyTargetMinutes: minutes } })),
      addExerciseType: (name, allocatedMinutes) =>
        set((s) => ({
          fitness: {
            ...s.fitness,
            exerciseTypes: [
              ...s.fitness.exerciseTypes,
              { id: genId(), name, allocatedMinutes },
            ],
          },
        })),
      removeExerciseType: (id) =>
        set((s) => ({
          fitness: {
            ...s.fitness,
            exerciseTypes: s.fitness.exerciseTypes.filter((t) => t.id !== id),
          },
        })),
      updateExerciseType: (id, updates) =>
        set((s) => ({
          fitness: {
            ...s.fitness,
            exerciseTypes: s.fitness.exerciseTypes.map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
          },
        })),
      addFitnessTime: (minutes, typeId) => {
        const f = get().fitness;
        const today = getLocalDateString();
        const completed = f.todayMinutes + minutes >= f.dailyTargetMinutes;
        const todayRecord = f.history.find((h) => h.date === today);
        let history;
        if (todayRecord) {
          history = f.history.map((h) =>
            h.date === today
              ? { ...h, minutes: h.minutes + minutes, completed }
              : h
          );
        } else {
          history = [...f.history, { date: today, minutes, typeId, completed }];
        }
        set((s) => ({
          fitness: {
            ...s.fitness,
            todayMinutes: s.fitness.todayMinutes + minutes,
            todayTypeId: typeId,
            history: history.slice(-30),
          },
        }));
      },
      resetFitnessToday: () =>
        set((s) => ({ fitness: { ...s.fitness, todayMinutes: 0, todayTypeId: null } })),
    }),
    {
      name: 'zil-presets',
      // 迁移：清理旧版本遗留的 screenTime / lifestyle 字段
      migrate: (persisted: unknown) => {
        const s = (persisted ?? {}) as Record<string, unknown>;
        const { screenTime: _s, lifestyle: _l, ...rest } = s;
        return rest;
      },
      version: 2,
    }
  )
);

// 保留 DayRecord 类型供外部引用
export type { DayRecord, ExerciseType, FitnessPreset };
