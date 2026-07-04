// 习惯优先级排序算法
// 对今日未完成的习惯按"中断风险 + 时段匹配 + 历史完成率"加权评分排序
// 推荐优先做哪个习惯，避免连续天数中断
import type { Habit, HabitLog } from '@/store/habitStore';
import { getLocalDateString } from '@/store/habitStore';

export interface RankedHabit {
  habit: Habit;
  priority: number;    // 0-1，越高越优先
  streak: number;      // 当前连续天数
  isRecommended: boolean; // 是否为最高优先推荐
}

/** 计算单个习惯的历史完成率 */
function calcHabitCompletionRate(habitId: string, logs: HabitLog[]): number {
  const habitLogs = logs.filter((l) => l.habitId === habitId);
  if (habitLogs.length === 0) return 0.5; // 无数据给中等
  const completed = habitLogs.filter((l) => l.completed).length;
  return completed / habitLogs.length;
}

/** 计算时段匹配分：reminderTimes 与当前小时的接近程度 */
function calcTimeMatchScore(reminderTimes: string[], currentHour: number): number {
  if (!reminderTimes || reminderTimes.length === 0) return 0.5; // 无提醒时间给中等
  // 取所有提醒时间中与当前小时差距最小的
  let minDiff = 12;
  for (const time of reminderTimes) {
    const reminderHour = parseInt(time.split(':')[0], 10);
    if (isNaN(reminderHour)) continue;
    let diff = Math.abs(currentHour - reminderHour);
    if (diff > 12) diff = 24 - diff; // 跨午夜
    if (diff < minDiff) minDiff = diff;
  }
  // 差距 0 → 1.0，差距 12 → 0.0
  return Math.max(0, 1 - minDiff / 12);
}

/**
 * 对今日未完成的活跃习惯排序
 * 返回排序后的列表（已完成的排在最后），最高优先的标记 isRecommended
 */
export function rankHabits(
  habits: Habit[],
  logs: HabitLog[],
  currentHour: number
): RankedHabit[] {
  const today = getLocalDateString();
  const todayLogs = logs.filter((l) => l.date === today);
  const activeHabits = habits.filter((h) => h.isActive);

  // 计算每个习惯的评分
  const ranked: RankedHabit[] = activeHabits.map((habit) => {
    const todayLog = todayLogs.find((l) => l.habitId === habit.id);
    const isCompleted = todayLog?.completed || false;

    // 连续天数（从 logs 计算）
    let streak = 0;
    const habitLogs = logs
      .filter((l) => l.habitId === habit.id && l.completed)
      .sort((a, b) => b.date.localeCompare(a.date));
    let checkDate = new Date();
    for (const log of habitLogs) {
      const dateStr = getLocalDateString(checkDate);
      if (log.date === dateStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (log.date < dateStr) {
        break; // 断了
      }
    }

    // 三个维度评分
    const streakScore = Math.min(streak / 14, 1);        // 14天封顶，权重 0.4
    const timeScore = calcTimeMatchScore(habit.reminderTimes, currentHour); // 权重 0.3
    const completionRate = calcHabitCompletionRate(habit.id, logs);
    const lowCompletionScore = 1 - completionRate;        // 完成率低更需关注，权重 0.3

    // 已完成的习惯优先级归零
    const priority = isCompleted ? 0 : (streakScore * 0.4 + timeScore * 0.3 + lowCompletionScore * 0.3);

    return {
      habit,
      priority,
      streak,
      isRecommended: false,
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
