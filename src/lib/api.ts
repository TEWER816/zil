// 前端 API 客户端 - 与 Zil 后端通信
// 开发环境通过 Vite proxy（/api → http://localhost:3001）
// 前后端字段存在差异，此处统一做映射转换
import type { Habit, HabitLog } from '@/store/habitStore';
import type { FocusSession } from '@/store/focusStore';

// 后端地址：开发与 Electron 均通过此绝对地址访问（后端已开启 CORS）
// 开发时也可用 Vite proxy，但绝对地址让 Web / Electron 行为一致
const API_BASE = 'http://localhost:3001/api';

// ============ 后端数据类型 ============
interface BackendHabit {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  frequency: string;
  reminderTime: string | null;
  isActive: number | boolean;
  createdAt: string;
  updatedAt: string;
}

interface BackendLog {
  id: string;
  habitId: string;
  date: string;
  completed: number | boolean;
  note: string | null;
  createdAt: string;
}

interface BackendFocusSession {
  id: string;
  sessionType: string;
  plannedDuration: number;
  actualDuration: number;
  completed: number | boolean;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
}

interface BackendSettings {
  id: string;
  userName: string;
  theme: string;
  showMotivationalQuotes: number | boolean;
  focusDuration: number;
  breakDuration: number;
  updatedAt: string;
}

export interface SyncState {
  habits: Habit[];
  logs: HabitLog[];
  focusSessions: FocusSession[];
  settings: {
    userName: string;
    theme: 'dark' | 'light';
    showMotivationalQuotes: boolean;
    focusDuration: number;
    breakDuration: number;
  };
  syncedAt: string;
}

// ============ 字段映射：后端 → 前端 ============
function mapHabitFromBackend(h: BackendHabit): Habit {
  return {
    id: h.id,
    name: h.name,
    icon: h.icon,
    color: h.color,
    frequency: h.frequency,
    reminderTimes: h.reminderTime ? [h.reminderTime] : [],
    createdAt: h.createdAt,
    isActive: !!h.isActive,
  };
}

function mapLogFromBackend(l: BackendLog): HabitLog {
  return {
    id: l.id,
    habitId: l.habitId,
    date: l.date,
    completed: !!l.completed,
    completedAt: l.createdAt,
  };
}

function mapFocusFromBackend(s: BackendFocusSession): FocusSession {
  return {
    id: s.id,
    date: s.createdAt,
    duration: s.actualDuration || s.plannedDuration,
    type: s.sessionType === 'break' ? 'break' : 'focus',
    startedAt: s.startedAt,
    endedAt: s.endedAt,
  };
}

// ============ 字段映射：前端 → 后端 ============
function mapHabitToBackend(h: Habit): BackendHabit {
  const now = new Date().toISOString();
  return {
    id: h.id,
    name: h.name,
    description: null,
    icon: h.icon,
    color: h.color,
    frequency: h.frequency,
    reminderTime: h.reminderTimes?.[0] ?? null,
    isActive: h.isActive,
    createdAt: h.createdAt,
    updatedAt: now,
  };
}

function mapLogToBackend(l: HabitLog): BackendLog {
  return {
    id: l.id,
    habitId: l.habitId,
    date: l.date,
    completed: l.completed,
    note: null,
    createdAt: l.completedAt || new Date().toISOString(),
  };
}

function mapFocusToBackend(s: FocusSession): BackendFocusSession {
  return {
    id: s.id,
    sessionType: s.type,
    plannedDuration: s.duration,
    actualDuration: s.duration,
    completed: true,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    createdAt: s.date,
  };
}

// ============ HTTP 请求封装 ============
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || errBody.error || `请求失败 (${res.status})`);
  }

  return res.json();
}

// ============ API 方法 ============

/** 健康检查 */
export function checkHealth() {
  return request<{ status: string }>('/health');
}

/** 拉取全量数据 */
export async function fetchSyncState(): Promise<SyncState> {
  const data = await request<{
    habits: BackendHabit[];
    logs: BackendLog[];
    focusSessions: BackendFocusSession[];
    settings: BackendSettings;
    syncedAt: string;
  }>('/sync');

  return {
    habits: data.habits.map(mapHabitFromBackend),
    logs: data.logs.map(mapLogFromBackend),
    focusSessions: data.focusSessions.map(mapFocusFromBackend),
    settings: {
      userName: data.settings.userName,
      theme: data.settings.theme === 'light' ? 'light' : 'dark',
      showMotivationalQuotes: !!data.settings.showMotivationalQuotes,
      focusDuration: data.settings.focusDuration,
      breakDuration: data.settings.breakDuration,
    },
    syncedAt: data.syncedAt,
  };
}

/** 推送全量数据到后端 */
export function pushSyncState(payload: {
  habits: Habit[];
  logs: HabitLog[];
  focusSessions: FocusSession[];
  settings: SyncState['settings'];
}) {
  return request<{ success: boolean; syncedAt: string; counts: { habits: number; logs: number; focusSessions: number } }>(
    '/sync',
    {
      method: 'POST',
      body: JSON.stringify({
        habits: payload.habits.map(mapHabitToBackend),
        logs: payload.logs.map(mapLogToBackend),
        focusSessions: payload.focusSessions.map(mapFocusToBackend),
        settings: payload.settings,
      }),
    }
  );
}
