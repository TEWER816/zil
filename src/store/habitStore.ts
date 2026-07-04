import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 习惯数据结构
export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: string;
  reminderTimes: string[];
  createdAt: string;
  isActive: boolean;
}

// 打卡记录
export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt: string | null;
}

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, habit: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleComplete: (habitId: string, date: string) => void;
  getTodayLogs: () => HabitLog[];
  getHabitLogs: (habitId: string) => HabitLog[];
  getStreakDays: (habitId: string) => number;
}

// 获取本地日期字符串（避免时区问题）
export const getLocalDateString = (date?: Date) => {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 计算连续打卡天数
const calculateStreak = (logs: HabitLog[]): number => {
  const completedDates = logs
    .filter(log => log.completed)
    .map(log => log.date)
    .sort()
    .reverse();

  if (completedDates.length === 0) return 0;

  let streak = 0;
  const today = getLocalDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = getLocalDateString(yesterday);

  if (!completedDates.includes(today) && !completedDates.includes(yesterdayString)) {
    return 0;
  }

  const startFrom = completedDates.includes(today) ? today : yesterdayString;
  let currentDate = new Date(startFrom);

  for (const date of completedDates) {
    const dateString = getLocalDateString(currentDate);
    if (date === dateString) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

// 预设的习惯图标
export const habitIcons = [
  'Sun', 'Moon', 'BookOpen', 'Dumbbell', 'Heart', 'Leaf',
  'Coffee', 'Music', 'Pen', 'Zap', 'Star', 'Award'
];

// 预设的颜色
// 习惯可选色：全部从品牌调色板派生
// primary(薄荷青) secondary(奶油黄) tertiary(雾蓝) coral(珊瑚粉) + 各自 light 变体
export const habitColors = [
  '#5DCCC5', // primary
  '#FFC857', // secondary
  '#7BA8C9', // tertiary
  '#FF9FB2', // coral
  '#8DE3DE', // primaryLight
  '#A0C5DD', // tertiaryLight
  '#FFD980', // secondaryLight
  '#FFC2D0', // coralLight
];

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],

      addHabit: (habit) => set((state) => ({
        habits: [...state.habits, habit]
      })),

      updateHabit: (id, updatedHabit) => set((state) => ({
        habits: state.habits.map(h =>
          h.id === id ? { ...h, ...updatedHabit } : h
        )
      })),

      deleteHabit: (id) => set((state) => ({
        habits: state.habits.filter(h => h.id !== id),
        logs: state.logs.filter(l => l.habitId !== id)
      })),

      toggleComplete: (habitId, date) => set((state) => {
        const existingLog = state.logs.find(
          l => l.habitId === habitId && l.date === date
        );

        if (existingLog) {
          return {
            logs: state.logs.map(l =>
              l.id === existingLog.id
                ? {
                    ...l,
                    completed: !l.completed,
                    completedAt: !l.completed ? new Date().toISOString() : null
                  }
                : l
            )
          };
        }

        return {
          logs: [
            ...state.logs,
            {
              id: `${habitId}-${date}`,
              habitId,
              date,
              completed: true,
              completedAt: new Date().toISOString()
            }
          ]
        };
      }),

      getTodayLogs: () => {
        const today = getLocalDateString();
        return get().logs.filter(l => l.date === today);
      },

      getHabitLogs: (habitId) => {
        return get().logs.filter(l => l.habitId === habitId);
      },

      getStreakDays: (habitId) => {
        const logs = get().getHabitLogs(habitId);
        return calculateStreak(logs);
      }
    }),
    {
      name: 'zil-habits'
    }
  )
);