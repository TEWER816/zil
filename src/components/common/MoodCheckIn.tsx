// 心情打卡 — 每日首次打开应用时弹出，记录今日心情
// 数据进入神经网络特征工程，让 AI 更懂你的状态
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useMoodStore, moodConfig, type Mood } from '@/store/moodStore';

const moods: Mood[] = ['great', 'good', 'okay', 'bad', 'awful'];

export function MoodCheckIn() {
  const { getTodayMood, setTodayMood } = useMoodStore();
  const [show, setShow] = useState(false);

  // 每日首次打开：若今天还没记录心情，5 秒后弹出
  useEffect(() => {
    if (getTodayMood()) return;
    const t = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(t);
  }, [getTodayMood]);

  const handlePick = (mood: Mood) => {
    setTodayMood(mood);
    setShow(false);
  };

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-dark-bg/70 backdrop-blur-sm"
            onClick={() => setShow(false)}
          />
          {/* 卡片 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="relative bg-dark-surface border border-dark-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="text-center mb-1">
              <p className="text-[10px] tracking-[0.25em] text-primary/70 uppercase font-medium">每日心情</p>
            </div>
            <h2 className="font-display text-lg text-dark-muted text-center mb-1">
              今天感觉怎么样？
            </h2>
            <p className="text-xs text-dark-muted/50 text-center mb-5">
              记录心情，让 Zili 更懂你
            </p>

            <div className="flex justify-between gap-2">
              {moods.map((m) => {
                const cfg = moodConfig[m];
                return (
                  <motion.button
                    key={m}
                    type="button"
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handlePick(m)}
                    className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border border-white/5 hover:border-current transition-colors"
                    style={{ color: cfg.color }}
                  >
                    <span className="text-xl font-mono">{cfg.emoji}</span>
                    <span className="text-[10px] text-dark-muted/70">{cfg.label}</span>
                  </motion.button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShow(false)}
              className="mt-4 w-full text-center text-[11px] text-dark-muted/40 hover:text-dark-muted/70 transition-colors"
            >
              稍后再说
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
