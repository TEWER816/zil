import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============ 类型定义 ============

/** 每日记录（通用） */
interface DayRecord {
  date: string; // YYYY-MM-DD
  minutes: number;
}

/** 屏幕时间管理 */
interface ScreenTimePreset {
  enabled: boolean;
  dailyLimitMinutes: number;       // 每日限额（分钟）
  todayMinutes: number;            // 今日已用
  reminderEnabled: boolean;        // 使用提醒
  reminderIntervalMinutes: number; // 每 N 分钟提醒一次
  history: DayRecord[];
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

/** 规律作息 */
interface SleepReminder {
  enabled: boolean;
  bedtime: string;  // "23:00"
  wakeTime: string; // "07:00"
}

/** 饮水提醒 */
interface WaterReminder {
  enabled: boolean;
  intervalMinutes: number; // 提醒间隔
  targetCups: number;      // 每日目标杯数
  todayCups: number;
  history: { date: string; cups: number }[];
}

/** 工作休息分配 */
interface WorkRest {
  enabled: boolean;
  workMinutes: number;
  restMinutes: number;
}

/** 自定义提醒 */
interface CustomReminder {
  id: string;
  name: string;
  time: string; // "HH:MM"
  enabled: boolean;
}

/** 人性化生活预设 */
interface LifestylePreset {
  sleep: SleepReminder;
  water: WaterReminder;
  workRest: WorkRest;
  customReminders: CustomReminder[];
}

// ============ Store ============

interface PresetState {
  screenTime: ScreenTimePreset;
  fitness: FitnessPreset;
  lifestyle: LifestylePreset;

  // 屏幕时间
  toggleScreenTime: () => void;
  setScreenTimeLimit: (minutes: number) => void;
  addScreenTime: (minutes: number) => void;
  resetScreenTimeToday: () => void;
  toggleScreenTimeReminder: () => void;
  setScreenTimeReminderInterval: (minutes: number) => void;

  // 运动健身
  toggleFitness: () => void;
  setFitnessTarget: (minutes: number) => void;
  addExerciseType: (name: string, allocatedMinutes: number) => void;
  removeExerciseType: (id: string) => void;
  updateExerciseType: (id: string, updates: Partial<ExerciseType>) => void;
  addFitnessTime: (minutes: number, typeId: string) => void;
  resetFitnessToday: () => void;

  // 生活方式
  toggleSleep: () => void;
  setBedtime: (time: string) => void;
  setWakeTime: (time: string) => void;

  toggleWater: () => void;
  setWaterInterval: (minutes: number) => void;
  setWaterTarget: (cups: number) => void;
  addWaterCup: () => void;
  resetWaterToday: () => void;

  toggleWorkRest: () => void;
  setWorkMinutes: (minutes: number) => void;
  setRestMinutes: (minutes: number) => void;

  addCustomReminder: (name: string, time: string) => void;
  removeCustomReminder: (id: string) => void;
  toggleCustomReminder: (id: string) => void;
}

const getLocalDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      screenTime: {
        enabled: false,
        dailyLimitMinutes: 60,
        todayMinutes: 0,
        reminderEnabled: false,
        reminderIntervalMinutes: 15,
        history: [],
      },
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
      lifestyle: {
        sleep: { enabled: false, bedtime: '23:00', wakeTime: '07:00' },
        water: {
          enabled: false,
          intervalMinutes: 60,
          targetCups: 8,
          todayCups: 0,
          history: [],
        },
        workRest: { enabled: false, workMinutes: 50, restMinutes: 10 },
        customReminders: [],
      },

      // ===== 屏幕时间 =====
      toggleScreenTime: () =>
        set((s) => ({ screenTime: { ...s.screenTime, enabled: !s.screenTime.enabled } })),
      setScreenTimeLimit: (minutes) =>
        set((s) => ({ screenTime: { ...s.screenTime, dailyLimitMinutes: minutes } })),
      addScreenTime: (minutes) => {
        const st = get().screenTime;
        const today = getLocalDateString();
        const todayRecord = st.history.find((h) => h.date === today);
        let history: DayRecord[];
        if (todayRecord) {
          history = st.history.map((h) =>
            h.date === today ? { ...h, minutes: h.minutes + minutes } : h
          );
        } else {
          history = [...st.history, { date: today, minutes }];
        }
        set((s) => ({
          screenTime: {
            ...s.screenTime,
            todayMinutes: s.screenTime.todayMinutes + minutes,
            history: history.slice(-30), // 保留最近 30 天
          },
        }));
      },
      resetScreenTimeToday: () =>
        set((s) => ({ screenTime: { ...s.screenTime, todayMinutes: 0 } })),
      toggleScreenTimeReminder: () =>
        set((s) => ({
          screenTime: { ...s.screenTime, reminderEnabled: !s.screenTime.reminderEnabled },
        })),
      setScreenTimeReminderInterval: (minutes) =>
        set((s) => ({ screenTime: { ...s.screenTime, reminderIntervalMinutes: minutes } })),

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

      // ===== 生活方式 =====
      toggleSleep: () =>
        set((s) => ({
          lifestyle: { ...s.lifestyle, sleep: { ...s.lifestyle.sleep, enabled: !s.lifestyle.sleep.enabled } },
        })),
      setBedtime: (time) =>
        set((s) => ({ lifestyle: { ...s.lifestyle, sleep: { ...s.lifestyle.sleep, bedtime: time } } })),
      setWakeTime: (time) =>
        set((s) => ({ lifestyle: { ...s.lifestyle, sleep: { ...s.lifestyle.sleep, wakeTime: time } } })),

      toggleWater: () =>
        set((s) => ({
          lifestyle: { ...s.lifestyle, water: { ...s.lifestyle.water, enabled: !s.lifestyle.water.enabled } },
        })),
      setWaterInterval: (minutes) =>
        set((s) => ({ lifestyle: { ...s.lifestyle, water: { ...s.lifestyle.water, intervalMinutes: minutes } } })),
      setWaterTarget: (cups) =>
        set((s) => ({ lifestyle: { ...s.lifestyle, water: { ...s.lifestyle.water, targetCups: cups } } })),
      addWaterCup: () => {
        const w = get().lifestyle.water;
        const today = getLocalDateString();
        const todayRecord = w.history.find((h) => h.date === today);
        let history;
        if (todayRecord) {
          history = w.history.map((h) => (h.date === today ? { ...h, cups: h.cups + 1 } : h));
        } else {
          history = [...w.history, { date: today, cups: 1 }];
        }
        set((s) => ({
          lifestyle: {
            ...s.lifestyle,
            water: {
              ...s.lifestyle.water,
              todayCups: s.lifestyle.water.todayCups + 1,
              history: history.slice(-30),
            },
          },
        }));
      },
      resetWaterToday: () =>
        set((s) => ({ lifestyle: { ...s.lifestyle, water: { ...s.lifestyle.water, todayCups: 0 } } })),

      toggleWorkRest: () =>
        set((s) => ({
          lifestyle: { ...s.lifestyle, workRest: { ...s.lifestyle.workRest, enabled: !s.lifestyle.workRest.enabled } },
        })),
      setWorkMinutes: (minutes) =>
        set((s) => ({ lifestyle: { ...s.lifestyle, workRest: { ...s.lifestyle.workRest, workMinutes: minutes } } })),
      setRestMinutes: (minutes) =>
        set((s) => ({ lifestyle: { ...s.lifestyle, workRest: { ...s.lifestyle.workRest, restMinutes: minutes } } })),

      addCustomReminder: (name, time) =>
        set((s) => ({
          lifestyle: {
            ...s.lifestyle,
            customReminders: [...s.lifestyle.customReminders, { id: genId(), name, time, enabled: true }],
          },
        })),
      removeCustomReminder: (id) =>
        set((s) => ({
          lifestyle: {
            ...s.lifestyle,
            customReminders: s.lifestyle.customReminders.filter((r) => r.id !== id),
          },
        })),
      toggleCustomReminder: (id) =>
        set((s) => ({
          lifestyle: {
            ...s.lifestyle,
            customReminders: s.lifestyle.customReminders.map((r) =>
              r.id === id ? { ...r, enabled: !r.enabled } : r
            ),
          },
        })),
    }),
    {
      name: 'zil-presets',
    }
  )
);
