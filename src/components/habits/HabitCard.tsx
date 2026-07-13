import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Flame, Sun, Moon, BookOpen, Dumbbell, Heart, Leaf, Coffee, Music, Pen, Zap, Star, Award } from 'lucide-react';
import { Habit as HabitType } from '@/store/habitStore';
import { playCheckinSound, playUncheckSound } from '@/lib/sound';
import { useCompanionStore } from '@/store/companionStore';
import { GrowthTree } from './GrowthTree';
import { CheckInParticles } from '@/components/common/CheckInParticles';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun, Moon, BookOpen, Dumbbell, Heart, Leaf, Coffee, Music, Pen, Zap, Star, Award
};

interface HabitCardProps {
  habit: HabitType;
  isCompleted: boolean;
  streak?: number;
  onToggle: () => void;
}

export function HabitCard({ habit, isCompleted, streak = 0, onToggle }: HabitCardProps) {
  const IconComponent = iconMap[habit.icon] || Sun;
  const [justCompleted, setJustCompleted] = useState(false);
  const [particleKey, setParticleKey] = useState(0);
  const triggerPulse = useCompanionStore((s) => s.triggerPulse);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 完成时播放提示音并触发视觉反馈，取消时播放轻提示
    if (!isCompleted) {
      playCheckinSound();
      setJustCompleted(true);
      setParticleKey((k) => k + 1);
      triggerPulse(); // 触发小猫伙伴反馈
      setTimeout(() => setJustCompleted(false), 600);
    } else {
      playUncheckSound();
    }
    onToggle();
  };

  return (
    <motion.div
      className="card group relative overflow-visible"
      animate={justCompleted ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-3 md:gap-4">
        {/* 成长树（左侧，替代纯图标） */}
        <div className="relative shrink-0">
          <GrowthTree streak={streak} size={40} color={habit.color} />
          {/* 粒子特效（从树位置飞出） */}
          <CheckInParticles triggerKey={particleKey} color={habit.color} />
        </div>

        {/* 习惯图标（小，叠在成长树上方角落） */}
        <motion.div
          className="w-8 h-8 radius-hand-sm flex items-center justify-center shrink-0 -ml-1"
          animate={justCompleted ? { rotate: [0, -8, 8, 0], scale: [1, 1.12, 1] } : {}}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            backgroundColor: `${habit.color}${isCompleted ? '25' : '15'}`,
            border: `1.6px solid ${habit.color}${isCompleted ? '60' : '30'}`,
          }}
        >
          <IconComponent
            className={`w-4 h-4 transition-colors ${isCompleted ? '' : 'text-dark-muted/70'}`}
            style={isCompleted ? { color: habit.color } : undefined}
          />
        </motion.div>

        {/* 习惯信息 */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium truncate transition-colors ${isCompleted ? '' : 'text-dark-muted'}`}
            style={isCompleted ? { color: habit.color } : undefined}
          >
            {habit.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-dark-muted/60">
              {habit.frequency === 'daily' ? '每日' : habit.frequency === 'weekly' ? '每周' : habit.frequency}
            </p>
            {streak > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-primary">
                <Flame className="w-3 h-3" />
                <span>{streak}</span>
              </span>
            )}
            {isCompleted && (
              <span className="text-xs text-secondary">· 今日已完成</span>
            )}
          </div>
        </div>

        {/* 明确的打卡按钮 */}
        <motion.button
          type="button"
          onClick={handleToggle}
          whileTap={{ scale: 0.92 }}
          className="shrink-0 px-3.5 md:px-4 py-1.5 md:py-2 radius-hand-sm text-xs md:text-sm font-medium transition-all hover:-translate-x-px hover:-translate-y-px"
          style={
            isCompleted
              ? {
                  backgroundColor: habit.color,
                  color: '#FFFFFF',
                  boxShadow: `2px 2px 0 ${habit.color}55`,
                  border: `1.6px solid ${habit.color}80`,
                }
              : {
                  backgroundColor: 'transparent',
                  color: habit.color,
                  border: `1.6px dashed ${habit.color}80`,
                }
          }
        >
          <span className="flex items-center gap-1">
            {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            {isCompleted ? '已完成' : '打卡'}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}
