import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 专注会话
export interface FocusSession {
  id: string;
  date: string;
  duration: number; // 分钟
  type: 'focus' | 'break';
  task?: string; // 本次专注的任务名称（可选）
  startedAt: string;
  endedAt: string | null;
}

interface FocusState {
  sessions: FocusSession[];
  focusDuration: number;
  breakDuration: number;
  currentSession: FocusSession | null;
  isRunning: boolean;
  isPaused: boolean;
  timeLeft: number;
  sessionType: 'focus' | 'break';
  completedPomodoros: number;

  startSession: (type: 'focus' | 'break', task?: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  tick: () => void;
  setFocusDuration: (duration: number) => void;
  setBreakDuration: (duration: number) => void;
  getTodaySessions: () => FocusSession[];
  getTodayFocusTime: () => number;
  getTodayPomodoros: () => number;
}

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      sessions: [],
      focusDuration: 25,
      breakDuration: 5,
      currentSession: null,
      isRunning: false,
      isPaused: false,
      timeLeft: 25 * 60,
      sessionType: 'focus',
      completedPomodoros: 0,

      startSession: (type, task) => {
        const duration = type === 'focus' ? get().focusDuration : get().breakDuration;
        const session: FocusSession = {
          id: `${Date.now()}`,
          date: getLocalDateString(),
          duration: duration,
          type: type,
          task: type === 'focus' ? (task?.trim() || undefined) : undefined,
          startedAt: new Date().toISOString(),
          endedAt: null
        };
        set({
          currentSession: session,
          isRunning: true,
          isPaused: false,
          timeLeft: duration * 60,
          sessionType: type
        });
      },

      pauseSession: () => set({ isRunning: false, isPaused: true }),

      resumeSession: () => set({ isRunning: true, isPaused: false }),

      endSession: () => {
        const current = get().currentSession;
        if (current) {
          const actualDuration = current.type === 'focus'
            ? get().focusDuration
            : get().breakDuration;
          const endedSession: FocusSession = {
            ...current,
            endedAt: new Date().toISOString(),
            duration: actualDuration
          };
          set((state) => ({
            sessions: [...state.sessions, endedSession],
            currentSession: null,
            isRunning: false,
            isPaused: false,
            timeLeft: state.focusDuration * 60,
            sessionType: 'focus',
            completedPomodoros: current.type === 'focus' ? state.completedPomodoros + 1 : state.completedPomodoros
          }));
        }
      },

      tick: () => {
        const { timeLeft, sessionType, currentSession } = get();
        if (timeLeft > 0) {
          set({ timeLeft: timeLeft - 1 });
        } else {
          // 时间结束，保存当前会话类型后重置
          const finishedType = sessionType;
          const finishedSession = currentSession;

          // 结束当前会话
          if (finishedSession) {
            const endedSession: FocusSession = {
              ...finishedSession,
              endedAt: new Date().toISOString(),
              duration: finishedType === 'focus' ? get().focusDuration : get().breakDuration
            };
            const nextType = finishedType === 'focus' ? 'break' : 'focus';
            const nextDuration = nextType === 'focus' ? get().focusDuration : get().breakDuration;
            const newSession: FocusSession = {
              id: `${Date.now()}`,
              date: getLocalDateString(),
              duration: nextDuration,
              type: nextType,
              startedAt: new Date().toISOString(),
              endedAt: null
            };
            set((state) => ({
              sessions: [...state.sessions, endedSession],
              currentSession: newSession,
              timeLeft: nextDuration * 60,
              sessionType: nextType,
              isRunning: true,
              isPaused: false,
              completedPomodoros: finishedType === 'focus' ? state.completedPomodoros + 1 : state.completedPomodoros
            }));
          }
        }
      },

      setFocusDuration: (duration) => set({
        focusDuration: duration,
        timeLeft: duration * 60
      }),

      setBreakDuration: (duration) => set({
        breakDuration: duration,
        timeLeft: get().sessionType === 'break' ? duration * 60 : get().timeLeft
      }),

      getTodaySessions: () => {
        const today = getLocalDateString();
        return get().sessions.filter(s => s.date === today && s.type === 'focus');
      },

      getTodayFocusTime: () => {
        const todaySessions = get().getTodaySessions();
        return todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
      },

      getTodayPomodoros: () => {
        return get().getTodaySessions().length;
      }
    }),
    {
      name: 'zil-focus',
      partialize: (state) => ({
        sessions: state.sessions,
        focusDuration: state.focusDuration,
        breakDuration: state.breakDuration,
        completedPomodoros: state.completedPomodoros,
        sessionType: state.sessionType,
        timeLeft: state.timeLeft
      })
    }
  )
);