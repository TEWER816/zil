// 统一智能引擎
// 共享特征工程 + 行为日志 + 在线学习器
// 三个模型（语录预测 / 专注推荐 / 习惯排序）共享用户上下文特征，
// 基于真实行为数据在线微调，权重持久化到 localStorage
import { MLP, type MLPWeights } from './nn';
import type { Habit, HabitLog } from '@/store/habitStore';
import { getLocalDateString } from '@/store/habitStore';
import type { FocusSession } from '@/store/focusStore';

// ============ 用户上下文 ============

export interface UserContext {
  hour: number;            // 0-23
  dayOfWeek: number;       // 0-6
  isWeekend: number;       // 0 / 1
  streak: number;          // 活跃习惯总连续天数
  completionRate: number;  // 今日完成率 0-1
  consistency7d: number;   // 过去 7 天平均完成率 0-1
  recent3dTrend: number;   // 最近 3 天完成率相对前 4 天的趋势 (-1 ~ 1)
  todayPomodoros: number;  // 今日番茄数
  avgFocusDuration: number;// 历史平均专注时长（分钟）
  lastFocusDuration: number; // 上一次专注时长（分钟）
}

/** 从全局状态构建用户上下文 */
export function buildUserContext(
  habits: Habit[],
  logs: HabitLog[],
  sessions: FocusSession[]
): UserContext {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;

  const activeHabits = habits.filter((h) => h.isActive);
  const today = getLocalDateString();

  // 今日完成率
  const todayLogs = logs.filter((l) => l.date === today);
  const completedToday = activeHabits.filter(
    (h) => todayLogs.find((l) => l.habitId === h.id && l.completed)
  ).length;
  const completionRate = activeHabits.length > 0 ? completedToday / activeHabits.length : 0;

  // 总连续天数
  const streak = activeHabits.reduce((acc, h) => {
    const habitLogs = logs.filter((l) => l.habitId === h.id && l.completed);
    return acc + calcStreak(habitLogs);
  }, 0);

  // 过去 7 天平均完成率 + 最近 3 天趋势
  const dayRates: number[] = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = getLocalDateString(date);
    const dayLogs = logs.filter((l) => l.date === dateStr);
    const done = activeHabits.filter(
      (h) => dayLogs.find((l) => l.habitId === h.id && l.completed)
    ).length;
    dayRates.push(activeHabits.length > 0 ? done / activeHabits.length : 0);
  }
  // dayRates[0]=今天, [6]=7天前
  const consistency7d = dayRates.reduce((a, b) => a + b, 0) / 7;
  const recent3Avg = (dayRates[0] + dayRates[1] + dayRates[2]) / 3;
  const prev4Avg = (dayRates[3] + dayRates[4] + dayRates[5] + dayRates[6]) / 4;
  const recent3dTrend = Math.max(-1, Math.min(1, recent3Avg - prev4Avg));

  // 专注数据
  const focusSessions = sessions.filter((s) => s.type === 'focus' && s.duration > 0);
  const todayFocusSessions = focusSessions.filter((s) => s.date === today);
  const todayPomodoros = todayFocusSessions.length;
  const avgFocusDuration = focusSessions.length > 0
    ? focusSessions.reduce((a, s) => a + s.duration, 0) / focusSessions.length
    : 25;
  const lastFocus = focusSessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const lastFocusDuration = lastFocus?.duration ?? 25;

  return {
    hour,
    dayOfWeek,
    isWeekend,
    streak,
    completionRate,
    consistency7d,
    recent3dTrend,
    todayPomodoros,
    avgFocusDuration,
    lastFocusDuration,
  };
}

/** 计算单个习惯的连续天数 */
function calcStreak(habitLogs: HabitLog[]): number {
  const dates = habitLogs
    .map((l) => l.date)
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .sort()
    .reverse();
  if (dates.length === 0) return 0;
  const today = getLocalDateString();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getLocalDateString(yesterdayDate);
  if (!dates.includes(today) && !dates.includes(yesterday)) return 0;
  const start = dates.includes(today) ? today : yesterday;
  let streak = 0;
  let cursor = new Date(start);
  for (const d of dates) {
    const ds = getLocalDateString(cursor);
    if (d === ds) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (d < ds) {
      break;
    }
  }
  return streak;
}

// ============ 共享特征向量 ============

export const SHARED_FEATURE_SIZE = 10;

/** 将用户上下文归一化为共享特征向量（10 维） */
export function extractSharedFeatures(ctx: UserContext): number[] {
  return [
    ctx.hour / 23,
    ctx.dayOfWeek / 6,
    ctx.isWeekend,
    Math.min(ctx.streak / 30, 1),
    clamp01(ctx.completionRate),
    clamp01(ctx.consistency7d),
    (ctx.recent3dTrend + 1) / 2,
    Math.min(ctx.todayPomodoros / 8, 1),
    Math.min(ctx.avgFocusDuration / 60, 1),
    Math.min(ctx.lastFocusDuration / 60, 1),
  ];
}

// ============ 习惯特定特征 ============

export const HABIT_FEATURE_SIZE = 4;

/** 计算习惯特定特征（4 维）：streak / completionRate / timeMatch / daysSinceCreated */
export function extractHabitFeatures(
  habit: Habit,
  logs: HabitLog[],
  currentHour: number
): number[] {
  const habitLogs = logs.filter((l) => l.habitId === habit.id);
  const streak = calcStreak(habitLogs.filter((l) => l.completed));
  const completed = habitLogs.filter((l) => l.completed).length;
  const completionRate = habitLogs.length > 0 ? completed / habitLogs.length : 0.5;

  // 时段匹配分
  let timeMatch = 0.5;
  if (habit.reminderTimes && habit.reminderTimes.length > 0) {
    let minDiff = 12;
    for (const t of habit.reminderTimes) {
      const rh = parseInt(t.split(':')[0], 10);
      if (isNaN(rh)) continue;
      let diff = Math.abs(currentHour - rh);
      if (diff > 12) diff = 24 - diff;
      if (diff < minDiff) minDiff = diff;
    }
    timeMatch = Math.max(0, 1 - minDiff / 12);
  }

  // 创建天数归一化（90 天封顶）
  const created = new Date(habit.createdAt);
  const daysSince = Math.max(0, (Date.now() - created.getTime()) / 86400000);
  const daysSinceNorm = Math.min(daysSince / 90, 1);

  return [
    Math.min(streak / 14, 1),
    completionRate,
    timeMatch,
    daysSinceNorm,
  ];
}

// ============ 行为样本 ============

export interface QuoteSample {
  f: number[];       // 共享特征
  category: number;  // 展示的语录类别 0-5
  feedback: number;  // 1=有用, -1=没用, 0=未反馈
  ts: number;
}

export interface FocusSample {
  f: number[];       // 共享特征
  label: number;     // 用户实际选择档位 0=短 1=中 2=长
  accepted: number;  // 是否采纳推荐 1/0
  ts: number;
}

export interface HabitSample {
  f: number[];       // 共享特征 + 习惯特定特征（14 维）
  completed: number; // 当天是否完成 1/0
  ts: number;
}

// ============ 工具 ============

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function oneHot(idx: number, size: number): number[] {
  const v = new Array(size).fill(0);
  v[idx] = 1;
  return v;
}

// ============ 智能引擎 ============

const QUOTE_SIZE = 6;
const FOCUS_SIZE = 3;

class IntelligenceEngine {
  private quoteModel: MLP | null = null;
  private focusModel: MLP | null = null;
  private habitModel: MLP | null = null;

  private quoteSamples: QuoteSample[] = [];
  private focusSamples: FocusSample[] = [];
  private habitSamples: HabitSample[] = [];

  private quoteWeights: MLPWeights | null = null;
  private focusWeights: MLPWeights | null = null;
  private habitWeights: MLPWeights | null = null;

  private readonly QUOTE_KEY = 'zil-nn-quote-engine';
  private readonly FOCUS_KEY = 'zil-nn-focus-engine';
  private readonly HABIT_KEY = 'zil-nn-habit-engine';
  private readonly QUOTE_SAMPLE_KEY = 'zil-samples-quote';
  private readonly FOCUS_SAMPLE_KEY = 'zil-samples-focus';
  private readonly HABIT_SAMPLE_KEY = 'zil-samples-habit';

  private readonly MAX_SAMPLES = 200;
  private readonly MIN_SAMPLES_TO_TRAIN = 8;

  // ---- 模型懒加载 ----

  getQuoteModel(): MLP {
    if (!this.quoteModel) {
      this.quoteModel = new MLP({
        inputSize: SHARED_FEATURE_SIZE,
        hiddenSize: 12,
        outputSize: QUOTE_SIZE,
        learningRate: 0.06,
      });
      const w = this.loadWeights(this.QUOTE_KEY);
      if (w) {
        this.quoteWeights = w;
        this.quoteModel.setWeights(w);
      }
    }
    return this.quoteModel;
  }

  getFocusModel(): MLP {
    if (!this.focusModel) {
      this.focusModel = new MLP({
        inputSize: SHARED_FEATURE_SIZE,
        hiddenSize: 10,
        outputSize: FOCUS_SIZE,
        learningRate: 0.06,
      });
      const w = this.loadWeights(this.FOCUS_KEY);
      if (w) {
        this.focusWeights = w;
        this.focusModel.setWeights(w);
      }
    }
    return this.focusModel;
  }

  getHabitModel(): MLP {
    if (!this.habitModel) {
      this.habitModel = new MLP({
        inputSize: SHARED_FEATURE_SIZE + HABIT_FEATURE_SIZE,
        hiddenSize: 12,
        outputSize: 2, // 0=未完成 1=完成
        learningRate: 0.06,
      });
      const w = this.loadWeights(this.HABIT_KEY);
      if (w) {
        this.habitWeights = w;
        this.habitModel.setWeights(w);
      }
    }
    return this.habitModel;
  }

  // ---- 权重持久化 ----

  private loadWeights(key: string): MLPWeights | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as MLPWeights;
    } catch {
      // ignore
    }
    return null;
  }

  private saveWeights(key: string, model: MLP) {
    try {
      localStorage.setItem(key, JSON.stringify(model.getWeights()));
    } catch {
      // ignore
    }
  }

  // ---- 样本加载 ----

  private loadSamples<T>(key: string): T[] {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T[];
    } catch {
      // ignore
    }
    return [];
  }

  private saveSamples<T>(key: string, samples: T[]) {
    try {
      localStorage.setItem(key, JSON.stringify(samples.slice(-this.MAX_SAMPLES)));
    } catch {
      // ignore
    }
  }

  /** 初始化：从 localStorage 加载历史样本 */
  init() {
    this.quoteSamples = this.loadSamples<QuoteSample>(this.QUOTE_SAMPLE_KEY);
    this.focusSamples = this.loadSamples<FocusSample>(this.FOCUS_SAMPLE_KEY);
    this.habitSamples = this.loadSamples<HabitSample>(this.HABIT_SAMPLE_KEY);
  }

  // ---- 语录样本 + 在线训练 ----

  /** 记录语录展示样本（用户看到某类语录） */
  logQuoteSample(features: number[], category: number) {
    this.quoteSamples.push({ f: features, category, feedback: 0, ts: Date.now() });
    if (this.quoteSamples.length > this.MAX_SAMPLES) {
      this.quoteSamples = this.quoteSamples.slice(-this.MAX_SAMPLES);
    }
    this.saveSamples(this.QUOTE_SAMPLE_KEY, this.quoteSamples);
  }

  /** 更新语录反馈（有用/没用） */
  logQuoteFeedback(category: number, feedback: number) {
    // 找到最近一条该类别的未反馈样本
    for (let i = this.quoteSamples.length - 1; i >= 0; i--) {
      if (this.quoteSamples[i].category === category && this.quoteSamples[i].feedback === 0) {
        this.quoteSamples[i].feedback = feedback;
        break;
      }
    }
    this.saveSamples(this.QUOTE_SAMPLE_KEY, this.quoteSamples);
    this.trainQuoteModel();
  }

  /** 语录在线训练：把"有用"的样本作为正样本强化该类别 */
  trainQuoteModel() {
    const labeled = this.quoteSamples.filter((s) => s.feedback !== 0);
    if (labeled.length < this.MIN_SAMPLES_TO_TRAIN) return;
    const model = this.getQuoteModel();
    const X: number[][] = [];
    const Y: number[][] = [];
    for (const s of labeled) {
      X.push(s.f);
      // feedback=1 → 目标分布偏向该类别；feedback=-1 → 偏离该类别（均匀分布）
      const target = new Array(QUOTE_SIZE).fill(s.feedback === -1 ? 1 / QUOTE_SIZE : 0.05);
      if (s.feedback === 1) target[s.category] = 0.9;
      Y.push(target);
    }
    model.train(X, Y, { epochs: 20, batchSize: 4, shuffle: true });
    this.saveWeights(this.QUOTE_KEY, model);
  }

  // ---- 专注样本 + 在线训练 ----

  /** 记录专注会话样本（用户实际选择的时长档位 + 是否采纳推荐） */
  logFocusSample(features: number[], label: number, accepted: number) {
    this.focusSamples.push({ f: features, label, accepted, ts: Date.now() });
    if (this.focusSamples.length > this.MAX_SAMPLES) {
      this.focusSamples = this.focusSamples.slice(-this.MAX_SAMPLES);
    }
    this.saveSamples(this.FOCUS_SAMPLE_KEY, this.focusSamples);
    this.trainFocusModel();
  }

  /** 专注在线训练：用真实选择档位作为标签 */
  trainFocusModel() {
    if (this.focusSamples.length < this.MIN_SAMPLES_TO_TRAIN) return;
    const model = this.getFocusModel();
    const X = this.focusSamples.map((s) => s.f);
    const Y = this.focusSamples.map((s) => oneHot(s.label, FOCUS_SIZE));
    model.train(X, Y, { epochs: 25, batchSize: 8, shuffle: true });
    this.saveWeights(this.FOCUS_KEY, model);
  }

  // ---- 习惯样本 + 在线训练 ----

  /** 记录习惯打卡样本（每天结束时该习惯是否完成） */
  logHabitSample(features: number[], completed: number) {
    this.habitSamples.push({ f: features, completed, ts: Date.now() });
    if (this.habitSamples.length > this.MAX_SAMPLES) {
      this.habitSamples = this.habitSamples.slice(-this.MAX_SAMPLES);
    }
    this.saveSamples(this.HABIT_SAMPLE_KEY, this.habitSamples);
    this.trainHabitModel();
  }

  /** 习惯在线训练：预测完成概率 */
  trainHabitModel() {
    if (this.habitSamples.length < this.MIN_SAMPLES_TO_TRAIN) return;
    const model = this.getHabitModel();
    const X = this.habitSamples.map((s) => s.f);
    const Y = this.habitSamples.map((s) => oneHot(s.completed, 2));
    model.train(X, Y, { epochs: 25, batchSize: 8, shuffle: true });
    this.saveWeights(this.HABIT_KEY, model);
  }

  // ---- 统计信息 ----

  getStats() {
    return {
      quoteSamples: this.quoteSamples.length,
      focusSamples: this.focusSamples.length,
      habitSamples: this.habitSamples.length,
      quoteTrained: !!this.quoteWeights || this.quoteSamples.length >= this.MIN_SAMPLES_TO_TRAIN,
      focusTrained: !!this.focusWeights || this.focusSamples.length >= this.MIN_SAMPLES_TO_TRAIN,
      habitTrained: !!this.habitWeights || this.habitSamples.length >= this.MIN_SAMPLES_TO_TRAIN,
    };
  }
}

// 单例
export const engine = new IntelligenceEngine();

// 首次导入时初始化样本
try {
  engine.init();
} catch {
  // ignore
}
