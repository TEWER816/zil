import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 日程事件
export interface ScheduleEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  time?: string; // HH:MM（可选）
  category: 'work' | 'life' | 'study' | 'health' | 'other';
  done: boolean;
  createdAt: string;
}

interface ScheduleState {
  events: ScheduleEvent[];
  addEvent: (event: Omit<ScheduleEvent, 'id' | 'createdAt' | 'done'>) => void;
  updateEvent: (id: string, patch: Partial<ScheduleEvent>) => void;
  deleteEvent: (id: string) => void;
  toggleDone: (id: string) => void;
  getEventsByDate: (date: string) => ScheduleEvent[];
}

export const categoryConfig: Record<
  ScheduleEvent['category'],
  { label: string; color: string; bg: string }
> = {
  work: { label: '工作', color: '#5DCCC5', bg: 'rgba(93,204,197,0.12)' },
  life: { label: '生活', color: '#FFC857', bg: 'rgba(255,200,87,0.12)' },
  study: { label: '学习', color: '#7BA8C9', bg: 'rgba(123,168,201,0.12)' },
  health: { label: '健康', color: '#FF9FB2', bg: 'rgba(255,159,178,0.12)' },
  other: { label: '其他', color: '#8DE3DE', bg: 'rgba(141,227,222,0.12)' },
};

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      events: [],

      addEvent: (event) =>
        set((state) => ({
          events: [
            ...state.events,
            {
              ...event,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              done: false,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateEvent: (id, patch) =>
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        })),

      toggleDone: (id) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, done: !e.done } : e
          ),
        })),

      getEventsByDate: (date) =>
        get().events.filter((e) => e.date === date),
    }),
    {
      name: 'zil-schedule',
    }
  )
);
