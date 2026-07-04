// 智能专注时长推荐器
// 神经网络根据时段、今日已完成番茄钟数、历史专注时长，推荐最佳专注时长档位
import { MLP, type MLPWeights } from './nn';
import type { FocusSession } from '@/store/focusStore';

const STORAGE_KEY = 'zil-nn-focus-recommender';
const INPUT_SIZE = 3;
const HIDDEN_SIZE = 8;
const OUTPUT_SIZE = 3; // 0=短(15分), 1=中(25分), 2=长(45分)

export const FOCUS_OPTIONS = [15, 25, 45]; // 对应输出类别

let model: MLP | null = null;

// ============ 合成训练数据 ============
function generateData(): { X: number[][]; Y: number[][] } {
  const X: number[][] = [];
  const Y: number[][] = [];
  const oneHot = (i: number) => {
    const v = [0, 0, 0];
    v[i] = 1;
    return v;
  };

  for (let i = 0; i < 300; i++) {
    const hour = Math.floor(Math.random() * 24);
    const todayPomodoros = Math.floor(Math.random() * 8);
    const avgDuration = 15 + Math.random() * 35; // 15-50分钟

    const hourNorm = hour / 24;
    const pomoNorm = Math.min(todayPomodoros / 8, 1);
    const avgNorm = Math.min(avgDuration / 60, 1);

    X.push([hourNorm, pomoNorm, avgNorm]);

    // 推荐规则
    let label: number;
    const isMorning = hour >= 5 && hour <= 11;
    const isAfternoon = hour >= 12 && hour <= 17;
    const isEvening = hour >= 18;

    if (isMorning && todayPomodoros < 3 && avgDuration >= 30) {
      label = 2; // 长 - 早晨精力好且未疲劳
    } else if (isMorning && todayPomodoros >= 4) {
      label = 1; // 中 - 早晨已做不少
    } else if (isAfternoon && todayPomodoros < 3) {
      label = 1; // 中 - 下午刚开始
    } else if (isAfternoon && todayPomodoros >= 4) {
      label = 0; // 短 - 下午已疲劳
    } else if (isEvening && todayPomodoros >= 5) {
      label = 0; // 短 - 夜晚已累
    } else if (isEvening && todayPomodoros < 2) {
      label = 1; // 中 - 夜晚刚开始
    } else if (avgDuration >= 40) {
      label = 2; // 历史偏好长
    } else if (avgDuration <= 18) {
      label = 0; // 历史偏好短
    } else {
      label = 1; // 默认中
    }

    Y.push(oneHot(label));
  }

  return { X, Y };
}

function getModel(): MLP {
  if (model) return model;
  model = new MLP({
    inputSize: INPUT_SIZE,
    hiddenSize: HIDDEN_SIZE,
    outputSize: OUTPUT_SIZE,
    learningRate: 0.08,
  });

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      model.setWeights(JSON.parse(saved) as MLPWeights);
      return model;
    }
  } catch {
    // ignore
  }

  const { X, Y } = generateData();
  model.train(X, Y, { epochs: 150, batchSize: 8, earlyStopPatience: 15, validationSplit: 0.2 });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model.getWeights()));
  } catch {
    // ignore
  }
  return model;
}

/** 计算历史平均专注时长 */
function calcAvgFocusDuration(sessions: FocusSession[]): number {
  const focusSessions = sessions.filter((s) => s.type === 'focus' && s.duration > 0);
  if (focusSessions.length === 0) return 25;
  return focusSessions.reduce((sum, s) => sum + s.duration, 0) / focusSessions.length;
}

export interface FocusRecommendation {
  duration: number;       // 推荐时长（分钟）
  label: string;          // 短/中/长
  confidence: number;     // 置信度 0-1
  reason: string;         // 推荐理由
}

/**
 * 智能推荐专注时长
 * @param hour 当前时段 0-23
 * @param todayPomodoros 今日已完成番茄钟数
 * @param sessions 历史专注会话
 */
export function recommendFocusDuration(
  hour: number,
  todayPomodoros: number,
  sessions: FocusSession[]
): FocusRecommendation {
  const avgDuration = calcAvgFocusDuration(sessions);
  const features = [
    hour / 24,
    Math.min(todayPomodoros / 8, 1),
    Math.min(avgDuration / 60, 1),
  ];

  const nn = getModel();
  const probs = nn.predict(features);
  let maxIdx = 0;
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > probs[maxIdx]) maxIdx = i;
  }

  const duration = FOCUS_OPTIONS[maxIdx];
  const labels = ['短时', '中时', '长时'];

  // 生成推荐理由
  let reason: string;
  if (todayPomodoros >= 5) {
    reason = '今日已完成较多专注，建议短时保持节奏避免疲劳';
  } else if (hour >= 5 && hour <= 11 && todayPomodoros < 3) {
    reason = '早晨精力充沛，适合较长专注';
  } else if (hour >= 18 && todayPomodoros < 2) {
    reason = '夜晚刚开始，中等时长平衡效率与休息';
  } else if (avgDuration >= 35) {
    reason = '根据你的历史偏好，推荐较长专注';
  } else if (avgDuration <= 20) {
    reason = '根据你的历史偏好，推荐较短专注';
  } else {
    reason = '当前时段适合标准番茄钟';
  }

  return {
    duration,
    label: labels[maxIdx],
    confidence: probs[maxIdx],
    reason,
  };
}
