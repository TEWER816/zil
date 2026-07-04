// 同步逻辑：在本地 store（zustand + localStorage）与后端之间同步数据
// 策略：localStorage 为主存储保证离线可用，后端为云端备份/多设备同步
import { useHabitStore } from '@/store/habitStore';
import { useFocusStore } from '@/store/focusStore';
import { useSettingsStore } from '@/store/settingsStore';
import { fetchSyncState, pushSyncState, type SyncState } from './api';

/** 收集本地三个 store 的数据，组装成同步 payload */
export function getLocalState(): SyncState {
  const habitStore = useHabitStore.getState();
  const focusStore = useFocusStore.getState();
  const settingsStore = useSettingsStore.getState();

  return {
    habits: habitStore.habits,
    logs: habitStore.logs,
    focusSessions: focusStore.sessions,
    settings: {
      userName: settingsStore.userName,
      theme: settingsStore.theme,
      showMotivationalQuotes: settingsStore.showMotivationalQuotes,
      focusDuration: focusStore.focusDuration,
      breakDuration: focusStore.breakDuration,
    },
    syncedAt: new Date().toISOString(),
  };
}

/** 将远程数据应用到本地 store（保留运行态：currentSession/isRunning/isPaused） */
export function applyRemoteState(state: SyncState) {
  // 习惯 store
  useHabitStore.setState({
    habits: state.habits,
    logs: state.logs,
  });

  // 专注 store：只覆盖 sessions 和配置，保留运行态
  useFocusStore.setState({
    sessions: state.focusSessions,
    focusDuration: state.settings.focusDuration,
    breakDuration: state.settings.breakDuration,
  });

  // 设置 store
  useSettingsStore.setState({
    userName: state.settings.userName,
    theme: state.settings.theme,
    showMotivationalQuotes: state.settings.showMotivationalQuotes,
  });
}

/**
 * 推送本地数据到云端（覆盖服务器）
 */
export async function syncToServer(): Promise<{ syncedAt: string; counts: { habits: number; logs: number; focusSessions: number } }> {
  const local = getLocalState();
  const result = await pushSyncState(local);
  return { syncedAt: result.syncedAt, counts: result.counts };
}

/**
 * 从云端拉取数据并覆盖本地
 */
export async function restoreFromServer(): Promise<{ syncedAt: string }> {
  const remote = await fetchSyncState();
  applyRemoteState(remote);
  return { syncedAt: remote.syncedAt };
}

/**
 * 检查后端是否可用
 */
export async function checkServerAvailable(): Promise<boolean> {
  try {
    await fetchSyncState();
    return true;
  } catch {
    return false;
  }
}
