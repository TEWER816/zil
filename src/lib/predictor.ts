// 智能激励语预测器
// 基于用户上下文预测最适合的激励语类别
// 优先使用神经网络（在线学习真实反馈），样本不足时回退到规则
import { engine, extractSharedFeatures, type UserContext } from './intelligence';
import { QUOTE_CATEGORIES, QUOTES, type QuoteCategory } from './quotes';

let lastUsedQuoteIdx: Record<string, number> = {};

/** 规则兜底：样本不足时根据上下文规则选择类别 */
function rulePredict(ctx: UserContext): number {
  const { hour, completionRate, streak, consistency7d } = ctx;
  if (hour >= 22 || hour <= 4) return 4; // rest
  if (hour >= 5 && hour <= 11 && completionRate < 0.5) return 0; // morning
  if (completionRate >= 0.8 && streak >= 5) return 1; // praise
  if (completionRate < 0.3 && streak < 3) return 2; // encourage
  if (completionRate < 0.7 && hour >= 18) return 3; // gentle
  if (streak >= 3 && streak <= 12 && completionRate >= 0.3 && completionRate <= 0.8) return 5; // persist
  if (completionRate >= 0.8) return 1; // praise
  if (streak >= 10) return 5; // persist
  if (consistency7d >= 0.7) return 5; // persist
  return 2; // encourage
}

/**
 * 智能预测激励语
 * 优先用神经网络（基于真实反馈训练），无权重时用规则兜底
 */
export function predictQuote(ctx: UserContext): {
  quote: string;
  category: QuoteCategory;
  categoryIdx: number;
  confidence: number;
  usedNN: boolean;
} {
  const features = extractSharedFeatures(ctx);
  const stats = engine.getStats();

  let categoryIdx: number;
  let confidence: number;
  let usedNN = false;

  // 已有训练权重或足够样本时用 NN
  if (stats.quoteTrained) {
    const model = engine.getQuoteModel();
    const probs = model.predict(features);
    let maxIdx = 0;
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > probs[maxIdx]) maxIdx = i;
    }
    categoryIdx = maxIdx;
    confidence = probs[maxIdx];
    usedNN = true;
  } else {
    categoryIdx = rulePredict(ctx);
    confidence = 1;
  }

  const category = QUOTE_CATEGORIES[categoryIdx];

  // 从该类别语录库中选一条（避免连续重复）
  const pool = QUOTES[category];
  const lastIdx = lastUsedQuoteIdx[category] ?? -1;
  let idx = Math.floor(Math.random() * pool.length);
  if (pool.length > 1) {
    while (idx === lastIdx) {
      idx = Math.floor(Math.random() * pool.length);
    }
  }
  lastUsedQuoteIdx[category] = idx;

  return {
    quote: pool[idx],
    category,
    categoryIdx,
    confidence,
    usedNN,
  };
}

/** 记录展示了一条某类别语录（用于在线学习） */
export function recordQuoteShow(ctx: UserContext, categoryIdx: number) {
  const features = extractSharedFeatures(ctx);
  engine.logQuoteSample(features, categoryIdx);
}

/** 记录用户对语录的反馈（有用/没用） */
export function recordQuoteFeedback(categoryIdx: number, useful: boolean) {
  engine.logQuoteFeedback(categoryIdx, useful ? 1 : -1);
}

/** 获取各类别概率分布（用于展示 AI 思考过程） */
export function predictDistribution(ctx: UserContext): {
  category: QuoteCategory;
  probability: number;
}[] {
  const features = extractSharedFeatures(ctx);
  const stats = engine.getStats();
  let probs: number[];
  if (stats.quoteTrained) {
    probs = engine.getQuoteModel().predict(features);
  } else {
    const ruleIdx = rulePredict(ctx);
    probs = QUOTE_CATEGORIES.map((_, i) => (i === ruleIdx ? 1 : 0));
  }
  return QUOTE_CATEGORIES.map((category, i) => ({
    category,
    probability: probs[i],
  }));
}

/** 重置模型（清空样本与权重，重新开始学习） */
export function retrainModel() {
  lastUsedQuoteIdx = {};
  // 注意：清空操作由调用方通过 engine 完成
}
