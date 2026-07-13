// 习惯优先级排序算法
// 优先用神经网络预测完成概率（在线学习），样本不足时回退到规则评分
// 推荐优先做哪个习惯，避免连续天数中断
import type { Habit, HabitLog } from '@/store/habitStore';
import { getLocalDateString } from '@/store/habitStore';
import {
  engine,
  extractSharedFeatures,
  extractHabitFeatures,
  type UserContext,
} from './intelligence';

export interface RankedHabit {
  habit: Habit;
  priority: number;    // 0-1，越高越优先
  streak: number;      // 当前连续天数
  isRecommended: boolean; // 是否为最高优先推荐
  usedNN: boolean;
}

/** 计算单个习惯的历史完成率 */
function calcHabitCompletionRate(habitId: string, logs: HabitLog[]): number {
  const habitLogs = logs.filter((l) => l.habitId === habitId);
  if (habitLogs.length === 0) return 0.5;
  const completed = habitLogs.filter((l) => l.completed).length;
  return completed / habitLogs.length;
}

/** 计算时段匹配分 */
function calcTimeMatchScore(reminderTimes: string[], currentHour: number): number {
  if (!reminderTimes || reminderTimes.length === 0) return 0.5;
  let minDiff = 12;
  for (const time of reminderTimes) {
    const reminderHour = parseInt(time.split(':')[0], 10);
    if (isNaN(reminderHour)) continue;
    let diff = Math.abs(currentHour - reminderHour);
    if (diff > 12) diff = 24 - diff;
    if (diff < minDiff) minDiff = diff;
  }
  return Math.max(0, 1 - minDiff / 12);
}

/** 计算单个习惯的连续天数 */
function calcStreak(habitId: string, logs: HabitLog[]): number {
  const habitLogs = logs
    .filter((l) => l.habitId === habitId && l.completed)
    .sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  let checkDate = new Date();
  for (const log of habitLogs) {
    const dateStr = getLocalDateString(checkDate);
    if (log.date === dateStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (log.date < dateStr) {
      break;
    }
  }
  return streak;
}

// 记录样本去重：每天每个习惯只记录一次
const recordedSet = new Set<string>();

/**
 * 对今日未完成的活跃习惯排序
 * 返回排序后的列表（已完成的排在最后），最高优先的标记 isRecommended
 * @param ctx 用户上下文（可选，提供时启用 NN 与样本记录）
 */
export function rankHabits(
  habits: Habit[],
  logs: HabitLog[],
  currentHour: number,
  ctx?: UserContext
): RankedHabit[] {
  const today = getLocalDateString();
  const todayLogs = logs.filter((l) => l.date === today);
  const activeHabits = habits.filter((h) => h.isActive);

  const stats = ctx ? engine.getStats() : null;
  const useNN = !!(stats?.habitTrained && ctx);

  // 计算每个习惯的评分
  const ranked: RankedHabit[] = activeHabits.map((habit) => {
    const todayLog = todayLogs.find((l) => l.habitId === habit.id);
    const isCompleted = todayLog?.completed || false;
    const streak = calcStreak(habit.id, logs);

    // 记录样本（每天每个习惯一次）
    if (ctx) {
      const key = `${today}:${habit.id}`;
      if (!recordedSet.has(key)) {
        recordedSet.add(key);
        const shared = extractSharedFeatures(ctx);
        const habitFeat = extractHabitFeatures(habit, logs, currentHour);
        engine.logHabitSample([...shared, ...habitFeat], isCompleted ? 1 : 0);
      }
    }

    let priority: number;
    let usedNN = false;

    if (useNN) {
      // NN 预测完成概率
      const shared = extractSharedFeatures(ctx!);
      const habitFeat = extractHabitFeatures(habit, logs, currentHour);
      const probs = engine.getHabitModel().predict([...shared, ...habitFeat]);
      const nnScore = probs[1]; // 完成概率
      // 融合：NN 权重 0.6 + 规则权重 0.4（已完成的归零）
      const streakScore = Math.min(streak / 14, 1);
      const timeScore = calcTimeMatchScore(habit.reminderTimes, currentHour);
      const lowCompletionScore = 1 - calcHabitCompletionRate(habit.id, logs);
      const ruleScore = streakScore * 0.4 + timeScore * 0.3 + lowCompletionScore * 0.3;
      priority = isCompleted ? 0 : nnScore * 0.6 + ruleScore * 0.4;
      usedNN = true;
    } else {
      // 纯规则
      const streakScore = Math.min(streak / 14, 1);
      const timeScore = calcTimeMatchScore(habit.reminderTimes, currentHour);
      const lowCompletionScore = 1 - calcHabitCompletionRate(habit.id, logs);
      priority = isCompleted ? 0 : (streakScore * 0.4 + timeScore * 0.3 + lowCompletionScore * 0.3);
    }

    return {
      habit,
      priority,
      streak,
      isRecommended: false,
      usedNN,
    };
  });

  // 按优先级降序排序
  ranked.sort((a, b) => b.priority - a.priority);

  // 标记最高优先（且未完成）的习惯
  const topUncompleted = ranked.find((r) => r.priority > 0);
  if (topUncompleted) {
    topUncompleted.isRecommended = true;
  }

  return ranked;
}
