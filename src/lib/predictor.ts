// 智能激励语预测器
// 用合成的训练数据训练 MLP，根据用户当前状态预测最适合的激励语类别
// 模型权重持久化到 localStorage，下次直接加载（无需重新训练）
import { MLP, type MLPWeights } from './nn';
import {
  QUOTE_CATEGORIES,
  QUOTES,
  extractFeatures,
  oneHot,
  type UserFeatures,
  type QuoteCategory,
} from './quotes';

const STORAGE_KEY = 'zil-nn-quotes-weights';
const INPUT_SIZE = 4;
const HIDDEN_SIZE = 10;
const OUTPUT_SIZE = QUOTE_CATEGORIES.length;

// ============ 合成训练数据 ============
// 根据规则生成 (特征, 类别) 样本，让模型学习状态→类别的映射
function generateTrainingData(): { X: number[][]; Y: number[][] } {
  const X: number[][] = [];
  const Y: number[][] = [];

  // 生成多样化的用户状态样本
  for (let i = 0; i < 400; i++) {
    const hour = Math.floor(Math.random() * 24);
    const streak = Math.floor(Math.random() * 30);
    const completionRate = Math.random();
    const consistency = Math.random();

    const features = extractFeatures({ hour, streak, completionRate, consistency });

    // 规则决定最适合的类别（带优先级）
    let category: number;

    if (hour >= 22 || hour <= 4) {
      category = 4; // rest 休息关怀（深夜）
    } else if (hour >= 5 && hour <= 11 && completionRate < 0.5) {
      category = 0; // morning 早安活力
    } else if (completionRate >= 0.8 && streak >= 5) {
      category = 1; // praise 肯定成就
    } else if (completionRate < 0.3 && streak < 3) {
      category = 2; // encourage 鼓励坚持
    } else if (completionRate < 0.7 && hour >= 18) {
      category = 3; // gentle 温柔提醒（傍晚未完成）
    } else if (streak >= 3 && streak <= 12 && completionRate >= 0.3 && completionRate <= 0.8) {
      category = 5; // persist 持续动力
    } else if (completionRate >= 0.8) {
      category = 1; // praise
    } else if (streak >= 10) {
      category = 5; // persist
    } else {
      category = 2; // encourage 默认鼓励
    }

    X.push(features);
    Y.push(oneHot(category, OUTPUT_SIZE));
  }

  return { X, Y };
}

// ============ 模型管理 ============
let model: MLP | null = null;
let lastUsedQuoteIdx: Record<string, number> = {};

/** 获取或训练模型 */
function getModel(): MLP {
  if (model) return model;

  model = new MLP({
    inputSize: INPUT_SIZE,
    hiddenSize: HIDDEN_SIZE,
    outputSize: OUTPUT_SIZE,
    learningRate: 0.08,
  });

  // 尝试加载已保存的权重
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const weights: MLPWeights = JSON.parse(saved);
      model.setWeights(weights);
      return model;
    }
  } catch {
    // 加载失败，重新训练
  }

  // 训练新模型
  const { X, Y } = generateTrainingData();
  model.train(X, Y, { epochs: 150, batchSize: 8, earlyStopPatience: 15, validationSplit: 0.2 });

  // 持久化权重
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model.getWeights()));
  } catch {
    // 存储失败忽略
  }

  return model;
}

/** 重新训练模型（清除缓存） */
export function retrainModel() {
  model = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  lastUsedQuoteIdx = {};
  return getModel();
}

/**
 * 智能预测激励语
 * 根据用户当前状态，用神经网络预测最适合的类别，返回该类别下一条语录
 */
export function predictQuote(features: UserFeatures): { quote: string; category: QuoteCategory; confidence: number } {
  const nn = getModel();
  const input = extractFeatures(features);
  const probs = nn.predict(input);

  // 选概率最高的类别
  let maxIdx = 0;
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > probs[maxIdx]) maxIdx = i;
  }

  const category = QUOTE_CATEGORIES[maxIdx];
  const confidence = probs[maxIdx];

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
    confidence,
  };
}

/** 获取所有类别的概率分布（用于展示"AI 思考过程"） */
export function predictDistribution(features: UserFeatures): { category: QuoteCategory; probability: number }[] {
  const nn = getModel();
  const input = extractFeatures(features);
  const probs = nn.predict(input);
  return QUOTE_CATEGORIES.map((category, i) => ({
    category,
    probability: probs[i],
  }));
}
