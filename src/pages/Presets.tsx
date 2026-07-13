import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { usePresetStore } from '@/store/presetStore';
import { ProgressRing } from '@/components/common/ProgressRing';
import { Button } from '@/components/common/Button';

export function Presets() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-5 md:space-y-6 max-w-3xl"
    >
      <div className="mb-2">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-muted">运动健身</h2>
        <p className="text-sm text-dark-muted/60 mt-1">设定每日锻炼目标，记录你的运动时长</p>
      </div>

      <FitnessSection />
    </motion.div>
  );
}

/** 7 天柱状图 */
function WeekBarChart({
  data,
  unit,
  maxVal,
  color,
}: {
  data: { date: string; value: number }[];
  unit: string;
  maxVal: number;
  color: string;
}) {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const today = new Date();
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const record = data.find((h) => h.date === dateStr);
    return {
      label: days[d.getDay()],
      value: record?.value || 0,
      isToday: i === 6,
    };
  });

  return (
    <div className="mt-4">
      <p className="text-xs text-dark-muted/50 mb-2 tracking-wider uppercase">最近 7 天</p>
      <div className="flex items-end justify-between gap-1.5 h-24">
        {weekData.map((d, i) => {
          const heightPct = maxVal > 0 ? Math.min((d.value / maxVal) * 100, 100) : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex-1 flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="w-full rounded-t-md relative group"
                  style={{ backgroundColor: color, minHeight: d.value > 0 ? '4px' : '0' }}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-dark-muted/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {d.value}{unit}
                  </span>
                </motion.div>
              </div>
              <span className={`text-[10px] ${d.isToday ? 'text-primary font-medium' : 'text-dark-muted/40'}`}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FitnessSection() {
  const {
    fitness,
    toggleFitness,
    addFitnessTime,
    resetFitnessToday,
  } = usePresetStore();
  const [expanded, setExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState(fitness.exerciseTypes[0]?.id || '');
  const [addMinutes, setAddMinutes] = useState(15);

  const progress = fitness.dailyTargetMinutes > 0
    ? Math.min((fitness.todayMinutes / fitness.dailyTargetMinutes) * 100, 100)
    : 0;
  const isCompleted = fitness.todayMinutes >= fitness.dailyTargetMinutes;

  return (
    <motion.section
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.05 }}
      className="card"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
          <Dumbbell className="w-[18px] h-[18px] text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg text-dark-muted">每日锻炼</h3>
          <p className="text-xs text-dark-muted/50">目标 {fitness.dailyTargetMinutes} 分钟</p>
        </div>
        <button
          type="button"
          onClick={toggleFitness}
          className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${
            fitness.enabled ? 'bg-primary' : 'bg-white/10 border border-white/10'
          }`}
        >
          <motion.div
            animate={fitness.enabled ? { x: 22 } : { x: 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-4 h-4 rounded-full bg-white absolute top-1"
          />
        </button>
      </div>

      {fitness.enabled && (
        <>
          {/* 进度环 + 数据 */}
          <div className="flex items-center gap-6">
            <ProgressRing
              progress={progress}
              size={88}
              strokeWidth={6}
              color={isCompleted ? '#5DCCC5' : '#8DE3DE'}
              glow={false}
            >
              <div className="text-center">
                <span className="text-lg font-display font-bold text-dark-muted tabular-nums">
                  {fitness.todayMinutes}
                </span>
                <span className="text-[10px] text-dark-muted/50 block">/ {fitness.dailyTargetMinutes}分</span>
              </div>
            </ProgressRing>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-muted/60">今日已练</span>
                <span className="text-sm font-medium text-secondary">{fitness.todayMinutes} 分钟</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-muted/60">还需完成</span>
                <span className="text-sm font-medium text-secondary">
                  {isCompleted ? '已完成目标' : `${fitness.dailyTargetMinutes - fitness.todayMinutes} 分钟`}
                </span>
              </div>
              {isCompleted && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-secondary flex items-center gap-1"
                >
                  <Dumbbell className="w-3 h-3" />
                  太棒了！今日锻炼目标已达成
                </motion.p>
              )}
            </div>
          </div>

          {/* 锻炼类型选择 */}
          <div className="mt-4">
            <p className="text-xs text-dark-muted/50 mb-2 tracking-wider uppercase">选择锻炼类型</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {fitness.exerciseTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedType === t.id
                      ? 'bg-secondary text-dark-bg'
                      : 'bg-white/5 text-dark-muted hover:bg-white/10'
                  }`}
                >
                  {t.name}
                  <span className="text-[10px] ml-1 opacity-60">{t.allocatedMinutes}分</span>
                </button>
              ))}
            </div>
            {/* 时间分配建议 */}
            <div className="rounded-xl bg-white/5 p-3 mb-3">
              <p className="text-xs text-dark-muted/50 mb-2">时间分配建议</p>
              <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                {fitness.exerciseTypes.map((t, i) => {
                  const colors = ['#5DCCC5', '#FFC857', '#7BA8C9', '#8DE3DE', '#FF9FB2'];
                  const pct = t.allocatedMinutes / fitness.exerciseTypes.reduce((a, b) => a + b.allocatedMinutes, 0) * 100;
                  return (
                    <div
                      key={t.id}
                      style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}
                      title={`${t.name}: ${t.allocatedMinutes}分`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {fitness.exerciseTypes.map((t, i) => {
                  const colors = ['#5DCCC5', '#FFC857', '#7BA8C9', '#8DE3DE', '#FF9FB2'];
                  return (
                    <span key={t.id} className="text-[10px] text-dark-muted/60 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                      {t.name}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 快速记录锻炼时间 */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1.5">
              {[5, 15, 30, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAddMinutes(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    addMinutes === m
                      ? 'bg-secondary text-dark-bg'
                      : 'bg-white/5 text-dark-muted hover:bg-white/10'
                  }`}
                >
                  +{m}分
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => addFitnessTime(addMinutes, selectedType)}>
              记录锻炼
            </Button>
            <Button size="sm" variant="secondary" onClick={resetFitnessToday}>
              重置今日
            </Button>
          </div>

          {/* 7 天柱状图 */}
          <WeekBarChart
            data={fitness.history.map((h) => ({ date: h.date, value: h.minutes }))}
            unit="分"
            maxVal={Math.max(fitness.dailyTargetMinutes, ...fitness.history.map((h) => h.minutes), 60)}
            color="#FFC857"
          />

          {/* 展开自定义 */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-4 text-xs text-dark-muted/50 hover:text-primary transition-colors flex items-center gap-1"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? '收起设置' : '展开自定义设置'}
          </button>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-white/5"
            >
              <FitnessCustomizer />
            </motion.div>
          )}
        </>
      )}
    </motion.section>
  );
}

function FitnessCustomizer() {
  const { fitness, setFitnessTarget, addExerciseType, removeExerciseType, updateExerciseType } = usePresetStore();
  const [newName, setNewName] = useState('');
  const [newMinutes, setNewMinutes] = useState(15);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-dark-muted/60 mb-2 block tracking-wider uppercase">每日目标（分钟）</label>
        <div className="flex gap-2 flex-wrap">
          {[30, 60, 90, 120].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFitnessTarget(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                fitness.dailyTargetMinutes === m
                  ? 'bg-secondary text-dark-bg'
                  : 'bg-white/5 text-dark-muted hover:bg-white/10'
              }`}
            >
              {m}分
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-dark-muted/60 mb-2 block tracking-wider uppercase">锻炼类型管理</label>
        <div className="space-y-2">
          {fitness.exerciseTypes.map((t) => (
            <div key={t.id} className="flex items-center gap-2">
              <input
                type="text"
                value={t.name}
                onChange={(e) => updateExerciseType(t.id, { name: e.target.value })}
                className="input flex-1 py-1.5 text-sm"
              />
              <input
                type="number"
                min={1}
                max={120}
                value={t.allocatedMinutes}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 1) updateExerciseType(t.id, { allocatedMinutes: v });
                }}
                className="w-16 input py-1.5 text-center text-sm"
              />
              <span className="text-xs text-dark-muted/50">分</span>
              <button
                type="button"
                onClick={() => removeExerciseType(t.id)}
                className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        {/* 添加新类型 */}
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="新类型名称"
            className="input flex-1 py-1.5 text-sm"
          />
          <input
            type="number"
            min={1}
            max={120}
            value={newMinutes}
            onChange={(e) => setNewMinutes(Number(e.target.value))}
            className="w-16 input py-1.5 text-center text-sm"
          />
          <span className="text-xs text-dark-muted/50">分</span>
          <Button
            size="sm"
            onClick={() => {
              if (newName.trim()) {
                addExerciseType(newName.trim(), newMinutes);
                setNewName('');
                setNewMinutes(15);
              }
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
