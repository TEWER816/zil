// 心情打卡 store — 每日记录心情，数据进入神经网络特征工程
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Mood = 'great' | 'good' | 'okay' | 'bad' | 'awful';

export interface MoodRecord {
  date: string; // YYYY-MM-DD
  mood: Mood;
  ts: string;   // ISO
}

interface MoodState {
  records: MoodRecord[];
  setTodayMood: (mood: Mood) => void;
  getTodayMood(): Mood | null;
  getByDate(date: string): Mood | null;
  clearAll(): void;
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const moodConfig: Record<Mood, { label: string; color: string; emoji: string; value: number }> = {
  great:  { label: '很棒', color: '#5DCCC5', emoji: '٩(◕‿◕)۶', value: 5 },
  good:   { label: '不错', color: '#8DE3DE', emoji: '(◕‿◕)',   value: 4 },
  okay:   { label: '一般', color: '#FFC857', emoji: '(•‿•)',    value: 3 },
  bad:    { label: '不太好', color: '#FF9FB2', emoji: '(˘･_･˘)', value: 2 },
  awful:  { label: '糟糕',  color: '#E07A8B', emoji: '(╥﹏╥)',   value: 1 },
};

export const useMoodStore = create<MoodState>()(
  persist(
    (set, get) => ({
      records: [],
      setTodayMood: (mood) => {
        const today = todayStr();
        const filtered = get().records.filter((r) => r.date !== today);
        set({ records: [...filtered, { date: today, mood, ts: new Date().toISOString() }] });
      },
      getTodayMood: () => {
        const today = todayStr();
        return get().records.find((r) => r.date === today)?.mood ?? null;
      },
      getByDate: (date) => get().records.find((r) => r.date === date)?.mood ?? null,
      clearAll: () => set({ records: [] }),
    }),
    { name: 'zil-mood' }
  )
);
