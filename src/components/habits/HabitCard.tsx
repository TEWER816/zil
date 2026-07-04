import { Check, Flame, Sun, Moon, BookOpen, Dumbbell, Heart, Leaf, Coffee, Music, Pen, Zap, Star, Award } from 'lucide-react';
import { Habit as HabitType } from '@/store/habitStore';
import { playCheckinSound, playUncheckSound } from '@/lib/sound';

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

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 完成时播放提示音，取消时播放轻提示
    if (!isCompleted) {
      playCheckinSound();
    } else {
      playUncheckSound();
    }
    onToggle();
  };

  return (
    <div className="card group">
      <div className="flex items-center gap-3 md:gap-4">
        {/* 图标 */}
        <div
          className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors"
          style={{
            backgroundColor: `${habit.color}${isCompleted ? '25' : '15'}`,
            border: `1px solid ${habit.color}${isCompleted ? '60' : '30'}`,
          }}
        >
          <IconComponent
            className={`w-5 h-5 transition-colors ${isCompleted ? '' : 'text-dark-muted/70'}`}
            style={isCompleted ? { color: habit.color } : undefined}
          />
        </div>

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
        <button
          type="button"
          onClick={handleToggle}
          className="shrink-0 px-3.5 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all active:scale-95"
          style={
            isCompleted
              ? {
                  backgroundColor: habit.color,
                  color: '#FFFFFF',
                }
              : {
                  backgroundColor: 'transparent',
                  color: habit.color,
                  border: `1px solid ${habit.color}50`,
                }
          }
        >
          <span className="flex items-center gap-1">
            {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            {isCompleted ? '已完成' : '打卡'}
          </span>
        </button>
      </div>
    </div>
  );
}
