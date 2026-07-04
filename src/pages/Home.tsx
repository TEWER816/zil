import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Flame, CheckCircle2, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHabitStore, getLocalDateString } from '@/store/habitStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { HabitCard } from '@/components/habits/HabitCard';
import { HabitForm } from '@/components/habits/HabitForm';
import { ProgressRing } from '@/components/common/ProgressRing';
import { predictQuote } from '@/lib/predictor';
import { rankHabits } from '@/lib/habitRanker';

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
  const { userName, showMotivationalQuotes, homeProgressImage } = useSettingsStore();
  const { enterFocusMode } = useUIStore();
  const navigate = useNavigate();

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

  // 过去7天完成率（用于神经网络特征）
  const weekRate = useMemo(() => {
    if (activeHabits.length === 0) return 0;
    const today = new Date();
    let total = 0, done = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateStr = getLocalDateString(date);
      for (const h of activeHabits) {
        total++;
        const log = logs.find(l => l.habitId === h.id && l.date === dateStr);
        if (log?.completed) done++;
      }
    }
    return total > 0 ? done / total : 0;
  }, [activeHabits, logs]);

  // 神经网络智能激励语：根据时段/连续天数/完成率/一致性预测最合适的语录
  const aiQuote = useMemo(
    () => predictQuote({
      hour: new Date().getHours(),
      streak: totalStreak,
      completionRate: activeHabits.length > 0 ? completedCount / activeHabits.length : 0,
      consistency: weekRate,
    }),
    [totalStreak, completedCount, activeHabits.length, weekRate]
  );

  // 算法排序：按中断风险/时段匹配/历史完成率对习惯排序，推荐优先做哪个
  const rankedHabits = useMemo(
    () => rankHabits(habits, logs, new Date().getHours()),
    [habits, logs]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 md:space-y-8"
    >
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-dark-bg font-medium text-sm shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Maximize2 className="w-4 h-4" />
                开始自律
              </button>
              <p className="text-xs text-dark-muted/40 mt-2">
                小提示：按 F11 / ESC 可退出全屏模式
              </p>
            </div>

            {/* 统计胶囊 */}
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20">
                <Flame className="w-3.5 h-3.5 text-secondary" />
                <span className="text-xs text-secondary font-medium">
                  连续 <span className="font-bold">{totalStreak}</span> 天
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-primary font-medium">
                  已完成 <span className="font-bold">{completedCount}</span> / {activeHabits.length}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-primary font-medium">
                  进度 <span className="font-bold">{Math.round(progress)}</span>%
                </span>
              </div>
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
            <h3 className="text-lg md:text-xl font-display font-semibold text-dark-muted">今日习惯</h3>
            <span className="text-xs text-dark-muted/50">{activeHabits.length} 项</span>
          </div>
          <HabitForm />
        </div>

        {activeHabits.length === 0 ? (
          <div className="card text-center py-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-3">
              <Sparkles className="w-6 h-6 text-primary/70" />
            </div>
            <p className="text-dark-muted mb-1">还没有添加任何习惯</p>
            <p className="text-sm text-dark-muted/60">点击上方加号开始培养你的第一个习惯吧</p>
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
                    <div className="absolute -top-2 left-3 z-10 px-2 py-0.5 rounded-full bg-primary text-dark-bg text-[10px] font-medium tracking-wider shadow-lg">
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

      {/* AI 智能语录 */}
      {showMotivationalQuotes && (
        <div className="text-center pt-4">
          <p className="font-mono italic text-dark-muted/60 text-sm">
            "{aiQuote.quote}"
          </p>
        </div>
      )}
    </motion.div>
  );
}
