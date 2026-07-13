import { useMemo, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Flame, CheckCircle2, Maximize2, ThumbsUp, ThumbsDown, Plus, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHabitStore, getLocalDateString } from '@/store/habitStore';
import { useFocusStore } from '@/store/focusStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { useMoodStore, moodConfig } from '@/store/moodStore';
import { HabitCard } from '@/components/habits/HabitCard';
import { HabitForm } from '@/components/habits/HabitForm';
import { ProgressRing } from '@/components/common/ProgressRing';
import { MoodCheckIn } from '@/components/common/MoodCheckIn';
import { LineDoodle } from '@/components/common/LineDoodle';
import { predictQuote, recordQuoteShow, recordQuoteFeedback } from '@/lib/predictor';
import { rankHabits } from '@/lib/habitRanker';
import { buildUserContext } from '@/lib/intelligence';

// 获取问候语
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早安';
  if (hour < 18) return '午安';
  return '晚安';
};

// 时段副标题
const getSubGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return '愿你这个夜晚温柔而宁静';
  if (hour < 12) return '新的一天，从一份温柔开始';
  if (hour < 18) return '午后的阳光，刚好适合前行';
  return '今天辛苦了，明天会更好';
};

export function Home() {
  const { habits, logs, toggleComplete, getTodayLogs, getStreakDays } = useHabitStore();
  const sessions = useFocusStore((s) => s.sessions);
  const { userName, showMotivationalQuotes, homeProgressImage } = useSettingsStore();
  const { enterFocusMode } = useUIStore();
  const todayMood = useMoodStore((s) => s.getTodayMood());
  const navigate = useNavigate();
  const [feedbackKey, setFeedbackKey] = useState(0);

  const handleStartDiscipline = async () => {
    enterFocusMode();
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // 全屏失败不阻塞，仍进入沉浸模式并跳转
    }
    navigate('/focus');
  };

  const todayLogs = getTodayLogs();
  const activeHabits = habits.filter(h => h.isActive);
  const completedCount = activeHabits.filter(h =>
    todayLogs.find(l => l.habitId === h.id && l.completed)
  ).length;

  const progress = activeHabits.length > 0
    ? (completedCount / activeHabits.length) * 100
    : 0;

  // 总连续打卡天数（仅活跃习惯）
  const totalStreak = activeHabits.reduce((acc, h) => acc + getStreakDays(h.id), 0);

  const isAllDone = activeHabits.length > 0 && completedCount === activeHabits.length;

  // 统一智能引擎：从全局状态构建用户上下文（共享特征工程）
  const ctx = useMemo(
    () => buildUserContext(habits, logs, sessions),
    [habits, logs, sessions]
  );

  // 神经网络智能激励语：基于真实上下文预测，在线学习用户反馈
  const aiQuote = useMemo(
    () => predictQuote(ctx),
    [ctx, feedbackKey]
  );

  // 展示语录后记录样本（用于在线学习）
  useEffect(() => {
    if (showMotivationalQuotes) {
      recordQuoteShow(ctx, aiQuote.categoryIdx);
    }
  }, [ctx, aiQuote.categoryIdx, showMotivationalQuotes]);

  const handleFeedback = useCallback((useful: boolean) => {
    recordQuoteFeedback(aiQuote.categoryIdx, useful);
    // 反馈后换一条新语录
    setFeedbackKey((k) => k + 1);
  }, [aiQuote.categoryIdx]);

  // 算法排序：神经网络预测完成概率 + 规则融合，推荐优先做哪个
  const rankedHabits = useMemo(
    () => rankHabits(habits, logs, new Date().getHours(), ctx),
    [habits, logs, ctx]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 md:space-y-8"
    >
      {/* 心情打卡弹窗 */}
      <MoodCheckIn />

      {/* Hero 今日概览 */}
      <section className="card">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs uppercase tracking-[0.2em] text-primary/80 font-medium">
                {getGreeting()}
              </span>
            </div>

            <h1 className="font-display text-2xl md:text-4xl font-bold leading-tight mb-2">
              <span className="text-gradient-amber">{userName ? `Hi, ${userName}` : 'Hi！'}</span>
            </h1>

            <p className="text-sm text-dark-muted/70 mb-5">
              {isAllDone
                ? '今天的习惯都已圆满完成，为自己鼓掌吧'
                : `${getSubGreeting()}，还有 ${activeHabits.length - completedCount} 个习惯等待你`}
            </p>

            {/* 开始自律 */}
            <div className="mb-5">
              <button
                type="button"
                onClick={handleStartDiscipline}
                className="inline-flex items-center gap-2 px-5 py-2.5 radius-hand bg-primaryLight border-hand border-primary/70 text-[#1f2a30] font-medium text-sm shadow-hand-sm hover:bg-primary hover:-translate-x-px hover:-translate-y-px hover:shadow-hand transition-all"
              >
                <Maximize2 className="w-4 h-4" strokeWidth={2.2} />
                开始自律
              </button>
              <p className="text-xs text-dark-muted/40 mt-2 italic">
                小提示：按 F11 / ESC 可退出全屏模式
              </p>
            </div>

            {/* 全部完成庆祝 */}
            <AnimatePresence>
              {isAllDone && activeHabits.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 radius-hand-sm bg-secondary/10 border-hand border-secondary/30 text-secondary text-sm"
                >
                  <PartyPopper className="w-4 h-4" />
                  <span>今日习惯全部完成，太棒了！</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 统计胶囊 */}
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 radius-hand-sm bg-secondary/10 border-hand border-secondary/25">
                <Flame className="w-3.5 h-3.5 text-secondary" />
                <span className="text-xs text-secondary font-medium">
                  连续 <span className="font-bold">{totalStreak}</span> 天
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 radius-hand-sm bg-primary/10 border-hand border-primary/25 filter-hand">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-primary font-medium">
                  已完成 <span className="font-bold">{completedCount}</span> / {activeHabits.length}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 radius-hand-sm bg-primary/10 border-hand border-primary/25">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-primary font-medium">
                  进度 <span className="font-bold">{Math.round(progress)}</span>%
                </span>
              </div>

              {/* 今日心情 */}
              {todayMood && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 radius-hand-sm border-hand"
                  style={{
                    backgroundColor: `${moodConfig[todayMood].color}15`,
                    borderColor: `${moodConfig[todayMood].color}40`,
                  }}
                  title={`今日心情：${moodConfig[todayMood].label}`}
                >
                  <span className="text-sm font-mono leading-none">{moodConfig[todayMood].emoji}</span>
                  <span className="text-xs font-medium" style={{ color: moodConfig[todayMood].color }}>
                    {moodConfig[todayMood].label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 进度环 */}
          <div className="shrink-0">
            <ProgressRing
              progress={progress}
              size={92}
              strokeWidth={6}
              color={isAllDone ? '#FFC857' : '#5DCCC5'}
              glow={false}
            >
              {homeProgressImage ? (
                <img
                  src={homeProgressImage}
                  alt="自定义进度图"
                  className="rounded-full object-cover ring-1 ring-white/10"
                  style={{ width: 72, height: 72 }}
                />
              ) : (
                <span className="font-display font-bold text-dark-muted tabular-nums leading-none">
                  <span style={{ fontSize: progress >= 100 ? '1rem' : '1.25rem' }}>
                    {Math.round(progress)}
                  </span>
                  <span className="text-xs text-dark-muted/50 ml-0.5">%</span>
                </span>
              )}
            </ProgressRing>
          </div>
        </div>
      </section>
      {/* 习惯卡片列表 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-xl md:text-2xl font-display font-semibold text-dark-muted underline-hand">今日习惯</h3>
            <span className="text-xs text-dark-muted/50">{activeHabits.length} 项</span>
          </div>
          <HabitForm />
        </div>

        {activeHabits.length === 0 ? (
          <div className="card text-center py-12">
            <LineDoodle type="empty-habits" size={140} />
            <h4 className="text-xl font-display font-medium text-dark-muted mb-1 mt-2">从这里开始</h4>
            <p className="text-sm text-dark-muted/60 mb-5 max-w-xs mx-auto">
              培养一个习惯最好的时间是现在。写下你想坚持的第一件事。
            </p>
            <HabitForm>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 radius-hand bg-primaryLight border-hand border-primary/70 text-[#1f2a30] font-medium text-sm hover:bg-primary transition-colors shadow-hand-sm"
              >
                <Plus className="w-4 h-4" strokeWidth={2.4} />
                添加第一个习惯
              </button>
            </HabitForm>
          </div>
        ) : (
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {rankedHabits.map(({ habit, isRecommended }) => {
              const todayLog = todayLogs.find(l => l.habitId === habit.id);
              const isCompleted = todayLog?.completed || false;

              return (
                <div
                  key={habit.id}
                  className="relative"
                >
                  {isRecommended && !isCompleted && (
                    <div className="absolute -top-2 left-3 z-10 px-2 py-0.5 radius-hand-sm bg-primary border-hand border-primary/70 text-dark-bg text-[10px] font-medium tracking-wider shadow-hand-sm">
                      建议优先
                    </div>
                  )}
                  <HabitCard
                    habit={habit}
                    isCompleted={isCompleted}
                    streak={getStreakDays(habit.id)}
                    onToggle={() => toggleComplete(habit.id, getLocalDateString())}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* AI 智能语录（在线学习用户反馈） */}
      {showMotivationalQuotes && (
        <div className="text-center pt-4">
          <p className="font-mono italic text-dark-muted/60 text-sm">
            "{aiQuote.quote}"
          </p>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-[10px] text-dark-muted/30">
              {aiQuote.usedNN ? 'AI 已学习你的反馈' : 'AI 规则模式'}
            </span>
            <button
              type="button"
              onClick={() => handleFeedback(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 radius-hand-sm bg-white/5 hover:bg-primary/10 text-dark-muted/50 hover:text-primary transition-colors text-[11px] border-hand border-primary/15 hover:border-primary/40"
              title="这条有用，多推荐类似的"
            >
              <ThumbsUp className="w-3 h-3" />
              有用
            </button>
            <button
              type="button"
              onClick={() => handleFeedback(false)}
              className="inline-flex items-center gap-1 px-2 py-0.5 radius-hand-sm bg-white/5 hover:bg-red-500/10 text-dark-muted/50 hover:text-red-400 transition-colors text-[11px] border-hand border-primary/15 hover:border-red-400/40"
              title="这条没用，少推荐"
            >
              <ThumbsDown className="w-3 h-3" />
              没用
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
