import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ListChecks, Timer, Brain, Check } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    icon: Sparkles,
    color: '#5DCCC5',
    title: '你好，我是 Zil',
    desc: '我会用舒服的方式陪你养成好习惯。不催不罚，只在你需要的时候出现。',
  },
  {
    icon: ListChecks,
    color: '#5DCCC5',
    title: '每天打卡，养成习惯',
    desc: '在「习惯」页面，添加你想坚持的小事——读书、运动、早睡都行。完成的那天点一下打卡，连续打卡会让小火苗越来越亮。',
  },
  {
    icon: Timer,
    color: '#FFC857',
    title: '想专心？用番茄钟',
    desc: '在「专注」页面，选一个时长开始计时，期间尽量不看手机。累了还能播放雨声、森林声帮你静下心来。点「开始专注」可以进入全屏沉浸模式。',
  },
  {
    icon: Brain,
    color: '#7BA8C9',
    title: '有个懂你的小助手',
    desc: '我会悄悄记住你的节奏，在合适的时候送上一句话、推荐一个时长、提醒你今天最该先做哪件事。这些都在本地完成，你的数据不会离开这台电脑。',
  },
  {
    icon: Check,
    color: '#FFC857',
    title: '准备好了吗？',
    desc: '不用一次全懂，慢慢用就熟了。随时可以在「设置」里换个昵称或切换深浅主题。',
  },
];

export function OnboardingGuide() {
  const { hasGreeted, hasOnboarded, setHasOnboarded } = useSettingsStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  // 问候完成后且未引导过时弹出
  useEffect(() => {
    if (hasGreeted && !hasOnboarded) {
      const t = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, [hasGreeted, hasOnboarded]);

  const handleFinish = (targetPath?: string) => {
    setHasOnboarded(true);
    setOpen(false);
    if (targetPath) navigate(targetPath);
  };

  if (!open) return null;

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

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
        {/* 步骤进度点 */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? 'w-6 bg-primary'
                  : i < step
                  ? 'w-1.5 bg-primary/50'
                  : 'w-1.5 bg-white/10'
              }`}
              aria-label={`第 ${i + 1} 步`}
            />
          ))}
        </div>

        {/* 内容区 - 切换动画 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="text-center"
          >
            {/* 图标 */}
            <div className="flex justify-center mb-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  backgroundColor: `${current.color}1A`,
                  border: `1px solid ${current.color}40`,
                }}
              >
                <Icon className="w-8 h-8" style={{ color: current.color }} strokeWidth={2} />
              </div>
            </div>

            <h2 className="font-display text-2xl text-dark-muted font-bold mb-3">
              {current.title}
            </h2>
            <p className="text-sm text-dark-muted/70 leading-relaxed mb-7">
              {current.desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* 按钮区 */}
        <div className="flex items-center gap-3">
          {!isLast && (
            <button
              type="button"
              onClick={() => handleFinish()}
              className="px-4 py-2.5 rounded-xl text-dark-muted/60 hover:text-dark-muted text-sm transition-colors"
            >
              跳过
            </button>
          )}
          <div className="flex-1" />
          {!isLast && (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-xl bg-primary text-dark-bg font-medium hover:opacity-90 transition-opacity text-sm"
            >
              下一步
            </button>
          )}
          {isLast && (
            <button
              type="button"
              onClick={() => handleFinish('/habits')}
              className="px-6 py-2.5 rounded-xl bg-primary text-dark-bg font-medium hover:opacity-90 transition-opacity text-sm"
            >
              去添加第一个习惯
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
