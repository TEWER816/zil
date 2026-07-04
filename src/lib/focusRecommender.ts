// 智能专注时长推荐器
// 基于用户上下文预测最佳专注时长档位
// 优先使用神经网络（在线学习真实选择），样本不足时回退到规则
import { engine, extractSharedFeatures, type UserContext } from './intelligence';

export const FOCUS_OPTIONS = [15, 25, 45]; // 0=短 1=中 2=长

export interface FocusRecommendation {
  duration: number;       // 推荐时长（分钟）
  label: string;          // 短/中/长
  confidence: number;     // 置信度 0-1
  reason: string;         // 推荐理由
  usedNN: boolean;
}

/** 时长 → 档位索引 */
export function durationToLabel(duration: number): number {
  if (duration < 20) return 0;
  if (duration < 35) return 1;
  return 2;
}

/** 规则兜底 */
function ruleRecommend(ctx: UserContext): number {
  const { hour, todayPomodoros, avgFocusDuration } = ctx;
  const isMorning = hour >= 5 && hour <= 11;
  const isAfternoon = hour >= 12 && hour <= 17;
  const isEvening = hour >= 18;

  if (isMorning && todayPomodoros < 3 && avgFocusDuration >= 30) return 2;
  if (isMorning && todayPomodoros >= 4) return 1;
  if (isAfternoon && todayPomodoros < 3) return 1;
  if (isAfternoon && todayPomodoros >= 4) return 0;
  if (isEvening && todayPomodoros >= 5) return 0;
  if (isEvening && todayPomodoros < 2) return 1;
  if (avgFocusDuration >= 40) return 2;
  if (avgFocusDuration <= 18) return 0;
  return 1;
}

function buildReason(ctx: UserContext): string {
  const { hour, todayPomodoros, avgFocusDuration } = ctx;
  if (todayPomodoros >= 5) return '今日已完成较多专注，建议短时保持节奏避免疲劳';
  if (hour >= 5 && hour <= 11 && todayPomodoros < 3) return '早晨精力充沛，适合较长专注';
  if (hour >= 18 && todayPomodoros < 2) return '夜晚刚开始，中等时长平衡效率与休息';
  if (avgFocusDuration >= 35) return '根据你的历史偏好，推荐较长专注';
  if (avgFocusDuration <= 20) return '根据你的历史偏好，推荐较短专注';
  return '当前时段适合标准番茄钟';
}

/**
 * 智能推荐专注时长
 */
export function recommendFocusDuration(ctx: UserContext): FocusRecommendation {
  const features = extractSharedFeatures(ctx);
  const stats = engine.getStats();

  let idx: number;
  let confidence: number;
  let usedNN = false;

  if (stats.focusTrained) {
    const model = engine.getFocusModel();
    const probs = model.predict(features);
    let maxIdx = 0;
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > probs[maxIdx]) maxIdx = i;
    }
    idx = maxIdx;
    confidence = probs[maxIdx];
    usedNN = true;
  } else {
    idx = ruleRecommend(ctx);
    confidence = 1;
  }

  const labels = ['短时', '中时', '长时'];
  return {
    duration: FOCUS_OPTIONS[idx],
    label: labels[idx],
    confidence,
    reason: buildReason(ctx),
    usedNN,
  };
}

/**
 * 记录用户专注时长选择（用于在线学习）
 * @param ctx 用户上下文
 * @param actualDuration 用户实际选择的专注时长
 * @param recommendedDuration 推荐的时长（用于判断是否采纳）
 */
export function recordFocusChoice(
  ctx: UserContext,
  actualDuration: number,
  recommendedDuration: number
) {
  const features = extractSharedFeatures(ctx);
  const label = durationToLabel(actualDuration);
  const accepted = actualDuration === recommendedDuration ? 1 : 0;
  engine.logFocusSample(features, label, accepted);
}
