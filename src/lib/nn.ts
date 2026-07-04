// 纯 TypeScript 实现的多层感知机（MLP）神经网络
// 零外部依赖，本地推理，支持单隐藏层 + softmax 输出
// 含前向传播、反向传播（动量 SGD + mini-batch）、交叉熵损失、L2 正则化、
// 学习率衰减、早停机制、Xavier 初始化

/** 向量 softmax（数值稳定版） */
function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

/** Fisher-Yates 洗牌 */
function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Xavier 初始化权重矩阵 [rows × cols] */
function initWeights(rows: number, cols: number): number[][] {
  const limit = Math.sqrt(6 / (rows + cols));
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() * 2 - 1) * limit)
  );
}

/** 零矩阵 */
function zeros(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => new Array(cols).fill(0));
}

export interface MLPConfig {
  inputSize: number;
  hiddenSize: number;
  outputSize: number;
  learningRate?: number;
  /** L2 正则化系数（默认 0.001） */
  l2Reg?: number;
  /** 动量系数（默认 0.9） */
  momentum?: number;
  /** 学习率衰减率（默认 0.995，每轮 ×decay） */
  lrDecay?: number;
}

/** 神经网络权重（可序列化到 localStorage） */
export interface MLPWeights {
  W1: number[][];
  b1: number[];
  W2: number[][];
  b2: number[];
}

/** 训练选项 */
export interface TrainOptions {
  epochs?: number;
  /** mini-batch 大小（默认 8） */
  batchSize?: number;
  /** 早停耐心值（连续 N 轮无改善则停止，默认 0=禁用） */
  earlyStopPatience?: number;
  /** 验证集比例（从训练集中切分，默认 0=不切分） */
  validationSplit?: number;
  /** 是否打乱每轮样本顺序（默认 true） */
  shuffle?: boolean;
  /** 详细日志回调 */
  onEpoch?: (epoch: number, loss: number, valLoss?: number) => void;
}

export class MLP {
  private W1: number[][];
  private b1: number[];
  private W2: number[][];
  private b2: number[];
  private lr: number;
  private initialLr: number;
  private l2Reg: number;
  private momentum: number;
  private lrDecay: number;

  // 动量缓存（累积历史梯度方向）
  private vW1: number[][];
  private vb1: number[];
  private vW2: number[][];
  private vb2: number[];

  public readonly inputSize: number;
  public readonly hiddenSize: number;
  public readonly outputSize: number;

  constructor(config: MLPConfig) {
    this.inputSize = config.inputSize;
    this.hiddenSize = config.hiddenSize;
    this.outputSize = config.outputSize;
    this.initialLr = config.learningRate ?? 0.05;
    this.lr = this.initialLr;
    this.l2Reg = config.l2Reg ?? 0.001;
    this.momentum = config.momentum ?? 0.9;
    this.lrDecay = config.lrDecay ?? 0.995;

    this.W1 = initWeights(config.inputSize, config.hiddenSize);
    this.b1 = new Array(config.hiddenSize).fill(0);
    this.W2 = initWeights(config.hiddenSize, config.outputSize);
    this.b2 = new Array(config.outputSize).fill(0);

    // 初始化动量缓存
    this.vW1 = zeros(config.inputSize, config.hiddenSize);
    this.vb1 = new Array(config.hiddenSize).fill(0);
    this.vW2 = zeros(config.hiddenSize, config.outputSize);
    this.vb2 = new Array(config.outputSize).fill(0);
  }

  /** 前向传播，返回各层激活值供反向传播使用 */
  private forward(x: number[]) {
    // 隐藏层：z1 = x·W1 + b1，a1 = relu(z1)
    const z1 = new Array(this.hiddenSize).fill(0);
    for (let j = 0; j < this.hiddenSize; j++) {
      let sum = this.b1[j];
      for (let i = 0; i < this.inputSize; i++) {
        sum += x[i] * this.W1[i][j];
      }
      z1[j] = sum;
    }
    const a1 = z1.map((v) => (v > 0 ? v : 0)); // ReLU

    // 输出层：z2 = a1·W2 + b2，a2 = softmax(z2)
    const z2 = new Array(this.outputSize).fill(0);
    for (let j = 0; j < this.outputSize; j++) {
      let sum = this.b2[j];
      for (let i = 0; i < this.hiddenSize; i++) {
        sum += a1[i] * this.W2[i][j];
      }
      z2[j] = sum;
    }
    const a2 = softmax(z2);
    return { z1, a1, z2, a2 };
  }

  /** 单样本反向传播，累加梯度到 grad 对象（用于 mini-batch） */
  private backward(
    x: number[],
    target: number[],
    grad: {
      gW1: number[][];
      gb1: number[];
      gW2: number[][];
      gb2: number[];
    }
  ) {
    const { z1, a1, a2 } = this.forward(x);

    // 输出层梯度（softmax + 交叉熵）：dz2 = a2 - target
    const dz2 = a2.map((v, i) => v - target[i]);

    // 隐藏层梯度：da1 = dz2·W2^T，dz1 = da1 ⊙ relu'(z1)
    const dz1 = new Array(this.hiddenSize).fill(0);
    for (let i = 0; i < this.hiddenSize; i++) {
      let da1 = 0;
      for (let j = 0; j < this.outputSize; j++) {
        da1 += dz2[j] * this.W2[i][j];
      }
      dz1[i] = z1[i] > 0 ? da1 : 0;
    }

    // 累加梯度（含 L2 正则化项）
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        grad.gW2[i][j] += a1[i] * dz2[j] + this.l2Reg * this.W2[i][j];
      }
    }
    for (let j = 0; j < this.outputSize; j++) {
      grad.gb2[j] += dz2[j];
    }
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        grad.gW1[i][j] += x[i] * dz1[j] + this.l2Reg * this.W1[i][j];
      }
    }
    for (let j = 0; j < this.hiddenSize; j++) {
      grad.gb1[j] += dz1[j];
    }
  }

  /** 应用梯度更新（带动量 SGD） */
  private applyGradients(
    grad: {
      gW1: number[][];
      gb1: number[];
      gW2: number[][];
      gb2: number[];
    },
    batchSize: number
  ) {
    const scale = this.lr / batchSize;

    // 更新 W2, b2（动量）
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        this.vW2[i][j] = this.momentum * this.vW2[i][j] - scale * grad.gW2[i][j];
        this.W2[i][j] += this.vW2[i][j];
      }
    }
    for (let j = 0; j < this.outputSize; j++) {
      this.vb2[j] = this.momentum * this.vb2[j] - scale * grad.gb2[j];
      this.b2[j] += this.vb2[j];
    }

    // 更新 W1, b1（动量）
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        this.vW1[i][j] = this.momentum * this.vW1[i][j] - scale * grad.gW1[i][j];
        this.W1[i][j] += this.vW1[i][j];
      }
    }
    for (let j = 0; j < this.hiddenSize; j++) {
      this.vb1[j] = this.momentum * this.vb1[j] - scale * grad.gb1[j];
      this.b1[j] += this.vb1[j];
    }
  }

  /** 计算数据集上的平均交叉熵损失 */
  private computeLoss(X: number[][], Y: number[][]): number {
    let totalLoss = 0;
    for (let s = 0; s < X.length; s++) {
      const { a2 } = this.forward(X[s]);
      for (let i = 0; i < this.outputSize; i++) {
        if (Y[s][i] > 0) {
          totalLoss -= Math.log(a2[i] + 1e-8);
        }
      }
    }
    // 加入 L2 正则化项到损失
    let l2Penalty = 0;
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) l2Penalty += this.W1[i][j] ** 2;
    }
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) l2Penalty += this.W2[i][j] ** 2;
    }
    return totalLoss / X.length + 0.5 * this.l2Reg * l2Penalty / X.length;
  }

  /** 训练：mini-batch 动量 SGD + L2 正则化 + 学习率衰减 + 早停 */
  train(X: number[][], Y: number[][], options: TrainOptions = {}): number[] {
    const epochs = options.epochs ?? 100;
    const batchSize = Math.min(options.batchSize ?? 8, X.length);
    const patience = options.earlyStopPatience ?? 0;
    const valSplit = options.validationSplit ?? 0;
    const shouldShuffle = options.shuffle ?? true;
    const onEpoch = options.onEpoch;

    // 切分验证集
    let trainX = X, trainY = Y;
    let valX: number[][] = [], valY: number[][] = [];
    if (valSplit > 0 && X.length >= 4) {
      const valCount = Math.max(1, Math.floor(X.length * valSplit));
      const indices = shuffleIndices(X.length);
      const valSet = new Set(indices.slice(0, valCount));
      trainX = []; trainY = []; valX = []; valY = [];
      for (let i = 0; i < X.length; i++) {
        if (valSet.has(i)) { valX.push(X[i]); valY.push(Y[i]); }
        else { trainX.push(X[i]); trainY.push(Y[i]); }
      }
    }

    const losses: number[] = [];
    let bestValLoss = Infinity;
    let bestWeights: MLPWeights | null = null;
    let patienceCounter = 0;

    for (let e = 0; e < epochs; e++) {
      // 学习率衰减
      this.lr = this.initialLr * Math.pow(this.lrDecay, e);

      // 打乱训练顺序
      const order = shouldShuffle ? shuffleIndices(trainX.length) : Array.from({ length: trainX.length }, (_, i) => i);

      // Mini-batch 训练
      for (let start = 0; start < order.length; start += batchSize) {
        const batch = order.slice(start, start + batchSize);

        // 累加梯度
        const grad = {
          gW1: zeros(this.inputSize, this.hiddenSize),
          gb1: new Array(this.hiddenSize).fill(0),
          gW2: zeros(this.hiddenSize, this.outputSize),
          gb2: new Array(this.outputSize).fill(0),
        };

        for (const idx of batch) {
          this.backward(trainX[idx], trainY[idx], grad);
        }

        this.applyGradients(grad, batch.length);
      }

      // 计算训练损失
      const trainLoss = this.computeLoss(trainX, trainY);
      losses.push(trainLoss);

      // 计算验证损失（如有）
      let valLoss: number | undefined;
      if (valX.length > 0) {
        valLoss = this.computeLoss(valX, valY);
      }

      onEpoch?.(e, trainLoss, valLoss);

      // 早停逻辑
      if (patience > 0 && valX.length > 0) {
        if (valLoss! < bestValLoss) {
          bestValLoss = valLoss!;
          bestWeights = this.getWeights();
          patienceCounter = 0;
        } else {
          patienceCounter++;
          if (patienceCounter >= patience) {
            // 恢复最佳权重
            if (bestWeights) this.setWeights(bestWeights);
            break;
          }
        }
      }
    }

    // 恢复学习率到初始值（供后续增量训练）
    this.lr = this.initialLr;
    return losses;
  }

  /** 推理：返回 softmax 概率分布 */
  predict(x: number[]): number[] {
    return this.forward(x).a2;
  }

  /** 预测类别（argmax） */
  predictClass(x: number[]): number {
    const probs = this.predict(x);
    let maxIdx = 0;
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > probs[maxIdx]) maxIdx = i;
    }
    return maxIdx;
  }

  /** 导出权重（持久化） */
  getWeights(): MLPWeights {
    return {
      W1: this.W1.map((row) => [...row]),
      b1: [...this.b1],
      W2: this.W2.map((row) => [...row]),
      b2: [...this.b2],
    };
  }

  /** 加载权重 */
  setWeights(w: MLPWeights) {
    this.W1 = w.W1.map((row) => [...row]);
    this.b1 = [...w.b1];
    this.W2 = w.W2.map((row) => [...row]);
    this.b2 = [...w.b2];
    // 重置动量缓存
    this.vW1 = zeros(this.inputSize, this.hiddenSize);
    this.vb1 = new Array(this.hiddenSize).fill(0);
    this.vW2 = zeros(this.hiddenSize, this.outputSize);
    this.vb2 = new Array(this.outputSize).fill(0);
  }
}
