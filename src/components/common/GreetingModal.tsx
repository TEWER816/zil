import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';

export function GreetingModal() {
  const { hasGreeted, userName, setUserName, setHasGreeted } = useSettingsStore();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  // 首次启动且未问候过时弹出
  useEffect(() => {
    if (!hasGreeted) {
      // 稍延迟以等待应用渲染完成
      const t = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(t);
    }
  }, [hasGreeted]);

  const handleSave = () => {
    const name = value.trim();
    if (name) {
      setUserName(name);
    }
    setHasGreeted(true);
    setOpen(false);
  };

  const handleSkip = () => {
    setHasGreeted(true);
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-dark-bg/80 backdrop-blur-md" />

      {/* 卡片 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="relative bg-dark-surface border border-dark-border rounded-2xl p-7 max-w-md w-full shadow-2xl"
      >
        {/* 图标 */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
        </div>

        <h2 className="font-display text-2xl text-center text-dark-muted font-bold mb-2">
          该如何称呼你？
        </h2>
        <p className="text-sm text-dark-muted/60 text-center mb-6 leading-relaxed">
          告诉我你的名字，Zil 会用你喜欢的称呼陪你度过每一天。
        </p>

        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="你的昵称"
          maxLength={20}
          className="input w-full text-center text-base py-3 mb-5"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 py-2.5 rounded-xl border border-dark-border text-dark-muted/70 hover:text-dark-muted hover:bg-white/5 transition-colors text-sm"
          >
            稍后再说
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-primary text-dark-bg font-medium hover:opacity-90 transition-opacity text-sm"
          >
            开始使用
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
