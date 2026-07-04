// 数据分析与建议模块
// 用神经网络预测"下周中断风险"，结合统计数据给出个性化建议
import { MLP, type MLPWeights } from './nn';
import type { Habit, HabitLog } from '@/store/habitStore';

const RISK_STORAGE_KEY = 'zil-nn-risk-weights';
const RISK_INPUT = 4;
const RISK_HIDDEN = 8;
const RISK_OUTPUT = 2; // 0=低风险, 1=高风险

// ============ 风险预测神经网络 ============
let riskModel: MLP | null = null;

function generateRiskData(): { X: number[][]; Y: number[][] } {
  const X: number[][] = [];
  const Y: number[][] = [];
  for (let i = 0; i < 300; i++) {
    const weekRate = Math.random();
    const streakNorm = Math.random();
    const todayRate = Math.random();
    const habitNorm = Math.random();

    // 风险规则：完成率低 + 连续少 + 今日差 → 高风险
    const riskScore =
      (1 - weekRate) * 0.35 +
      (1 - streakNorm) * 0.3 +
      (1 - todayRate) * 0.25 +
      (1 - habitNorm) * 0.1;

    const label = riskScore > 0.5 ? 1 : 0;

    X.push([weekRate, streakNorm, todayRate, habitNorm]);
    Y.push(label === 1 ? [0, 1] : [1, 0]);
  }
  return { X, Y };
}

function getRiskModel(): MLP {
  if (riskModel) return riskModel;
  riskModel = new MLP({
    inputSize: RISK_INPUT,
    hiddenSize: RISK_HIDDEN,
    outputSize: RISK_OUTPUT,
    learningRate: 0.08,
  });

  try {
    const saved = localStorage.getItem(RISK_STORAGE_KEY);
    if (saved) {
      riskModel.setWeights(JSON.parse(saved) as MLPWeights);
      return riskModel;
    }
  } catch {
    // ignore
  }

  const { X, Y } = generateRiskData();
  riskModel.train(X, Y, { epochs: 150, batchSize: 8, earlyStopPatience: 15, validationSplit: 0.2 });
  try {
    localStorage.setItem(RISK_STORAGE_KEY, JSON.stringify(riskModel.getWeights()));
  } catch {
    // ignore
  }
  return riskModel;
}

// ============ 统计计算 ============
/** 计算过去 N 天的整体完成率 */
function calcCompletionRate(habits: Habit[], logs: HabitLog[], days: number): number {
  if (habits.length === 0) return 0;
  const today = new Date();
  let total = 0;
  let completed = 0;
  for (let d = 0; d < days; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    for (const habit of habits) {
      if (!habit.isActive) continue;
      total++;
      const log = logs.find((l) => l.habitId === habit.id && l.date === dateStr);
      if (log?.completed) completed++;
    }
  }
  return total > 0 ? completed / total : 0;
}

/** 找最坚持和最需关注的习惯 */
function analyzeHabits(habits: Habit[], logs: HabitLog[]): { top: string; weak: string } {
  const activeHabits = habits.filter((h) => h.isActive);
  if (activeHabits.length === 0) return { top: '暂无', weak: '暂无' };

  const stats = activeHabits.map((h) => {
    const hLogs = logs.filter((l) => l.habitId === h.id && l.completed);
    return { name: h.name, count: hLogs.length };
  });

  const sorted = [...stats].sort((a, b) => b.count - a.count);
  return {
    top: sorted[0]?.name || '暂无',
    weak: sorted[sorted.length - 1]?.name || '暂无',
  };
}

/** 找最佳打卡时段 */
function findBestTimeSlot(logs: HabitLog[]): string {
  const slots = { 早晨: 0, 上午: 0, 下午: 0, 晚上: 0 };
  for (const log of logs) {
    if (!log.completed || !log.completedAt) continue;
    const hour = new Date(log.completedAt).getHours();
    if (hour >= 5 && hour < 9) slots.早晨++;
    else if (hour >= 9 && hour < 12) slots.上午++;
    else if (hour >= 12 && hour < 18) slots.下午++;
    else slots.晚上++;
  }
  const max = Math.max(...Object.values(slots));
  if (max === 0) return '尚未有数据';
  return Object.entries(slots).find(([, v]) => v === max)?.[0] || '晚上';
}

// ============ 建议库 ============
const SUGGESTIONS = {
  high: [
    '最近坚持有些吃力，不妨把习惯难度降低，从5分钟开始。',
    '中断不可怕，重要的是重新开始。今天先完成最容易的一个习惯。',
    '试试把习惯绑定到已有的日常行为上，比如刷牙后立刻冥想。',
    '意志力是有限的资源，优先保证最重要的1-2个习惯即可。',
    '设定一个"最低标准"——哪怕只做1分钟也算完成，先建立节奏。',
  ],
  medium: [
    '保持现在的节奏，稳定比完美更重要。',
    '你已经建立了不错的惯性，注意劳逸结合避免倦怠。',
    '如果感到疲惫，允许自己有一天"低配版"打卡，别轻易断掉。',
    '试着找出最容易中断的时段，提前做好应对准备。',
    '回顾一下本周哪些习惯完成得最轻松，把经验迁移到困难的习惯上。',
  ],
  low: [
    '状态很好！可以考虑增加一个新挑战，拓展舒适区。',
    '你的坚持令人印象深刻，是时候奖励自己一下了。',
    '现在正是把习惯难度提升一个台阶的好时机。',
    '保持这个节奏，你正在进入自律的"自动模式"。',
    '优秀的状态值得记录，写下你现在的秘诀，留作低谷时的参考。',
  ],
};

// ============ 分析接口 ============
export interface AnalysisResult {
  riskLevel: 'low' | 'medium' | 'high';
  riskProbability: number;
  suggestions: string[];
  stats: {
    weekCompletionRate: number;
    bestTimeSlot: string;
    topHabit: string;
    weakHabit: string;
    totalCheckins: number;
    activeHabitCount: number;
  };
}

/** 综合分析：统计数据 + 风险预测 + 建议 */
export function analyzeHabitsData(habits: Habit[], logs: HabitLog[], currentStreak: number): AnalysisResult {
  const activeHabits = habits.filter((h) => h.isActive);
  const weekRate = calcCompletionRate(habits, logs, 7);
  const todayRate = calcCompletionRate(habits, logs, 1);
  const { top, weak } = analyzeHabits(habits, logs);
  const bestTimeSlot = findBestTimeSlot(logs);
  const totalCheckins = logs.filter((l) => l.completed).length;

  // 神经网络预测风险
  const features = [
    weekRate,
    Math.min(currentStreak / 30, 1),
    todayRate,
    Math.min(activeHabits.length / 10, 1),
  ];
  const probs = getRiskModel().predict(features);
  const riskProb = probs[1]; // 高风险概率

  let riskLevel: 'low' | 'medium' | 'high';
  if (riskProb < 0.35) riskLevel = 'low';
  else if (riskProb < 0.65) riskLevel = 'medium';
  else riskLevel = 'high';

  // 根据风险等级选 2 条建议（避免连续重复）
  const pool = SUGGESTIONS[riskLevel];
  const suggestions: string[] = [];
  const used = new Set<number>();
  while (suggestions.length < 2 && used.size < pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    if (!used.has(idx)) {
      used.add(idx);
      suggestions.push(pool[idx]);
    }
  }

  return {
    riskLevel,
    riskProbability: riskProb,
    suggestions,
    stats: {
      weekCompletionRate: weekRate,
      bestTimeSlot,
      topHabit: top,
      weakHabit: weak,
      totalCheckins,
      activeHabitCount: activeHabits.length,
    },
  };
}
