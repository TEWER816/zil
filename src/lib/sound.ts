// Web Audio API 合成提示音 - 无需音频文件
// 打卡成功时播放一个清脆的"叮"和弦

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AC();
    } catch {
      return null;
    }
  }
  // 浏览器策略要求用户交互后才能播放
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

interface ToneOptions {
  frequency: number;
  duration?: number;
  delay?: number;
  type?: OscillatorType;
  gain?: number;
}

function playTone(ctx: AudioContext, opts: ToneOptions) {
  const { frequency, duration = 0.4, delay = 0, type = 'sine', gain = 0.15 } = opts;
  const start = ctx.currentTime + delay;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);

  // ADSR 包络：快速起音 + 指数衰减
  gainNode.gain.setValueAtTime(0, start);
  gainNode.gain.linearRampToValueAtTime(gain, start + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/**
 * 打卡成功提示音：C5 + E5 + G5 大调和弦，柔和清脆
 */
export function playCheckinSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // 三个音组成 C5 major chord，错开极短时间形成层次
  playTone(ctx, { frequency: 523.25, duration: 0.5, delay: 0,    gain: 0.12 }); // C5
  playTone(ctx, { frequency: 659.25, duration: 0.5, delay: 0.04, gain: 0.10 }); // E5
  playTone(ctx, { frequency: 783.99, duration: 0.5, delay: 0.08, gain: 0.08 }); // G5
}

/**
 * 取消打卡提示音：单音下行，轻柔
 */
export function playUncheckSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { frequency: 392, duration: 0.25, type: 'sine', gain: 0.08 }); // G4
}

/**
 * 通用轻提示音
 */
export function playTickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { frequency: 880, duration: 0.12, type: 'sine', gain: 0.06 });
}

/**
 * 专注完成提示音：柔和上行三音，带来结束感
 */
export function playFocusCompleteSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { frequency: 523.25, duration: 0.5, delay: 0,    type: 'sine', gain: 0.10 }); // C5
  playTone(ctx, { frequency: 659.25, duration: 0.5, delay: 0.12, type: 'sine', gain: 0.08 }); // E5
  playTone(ctx, { frequency: 783.99, duration: 0.6, delay: 0.24, type: 'sine', gain: 0.06 }); // G5
}
