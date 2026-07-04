import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, BarChart3, Trash2, Sun, Moon, BookOpen, Dumbbell, Heart, Leaf, Coffee, Music, Pen, Zap, Star, Award, ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react';
import { useHabitStore, getLocalDateString } from '@/store/habitStore';
import { Button } from '@/components/common/Button';
import { HabitForm } from '@/components/habits/HabitForm';
import { Modal } from '@/components/common/Modal';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun, Moon, BookOpen, Dumbbell, Heart, Leaf, Coffee, Music, Pen, Zap, Star, Award
};

export function Habits() {
  const { habits, deleteHabit, getHabitLogs, getStreakDays } = useHabitStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const activeHabits = habits.filter(h => h.isActive);

  // 获取选中习惯的日志
  const selectedHabit = selectedHabitId ? habits.find(h => h.id === selectedHabitId) : null;
  const selectedLogs = selectedHabitId ? getHabitLogs(selectedHabitId) : [];

  // 生成日历数据
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const days: (Date | null)[] = [];

    // 前置空格
    for (let i = 0; i < startWeekday; i++) {
      days.push(null);
    }

    // 月内日期
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push(date);
    }

    return days;
  }, [currentMonth]);

  // 判断某日期是否打卡
  const isDayCompleted = (date: Date) => {
    if (!selectedHabitId) return false;
    const dateString = getLocalDateString(date);
    return selectedLogs.some(l => l.date === dateString && l.completed);
  };

  // 判断是否是今天
  const isToday = (date: Date) => {
    return getLocalDateString(date) === getLocalDateString();
  };

  // 判断是否是未来日期
  const isFuture = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  // 上个月
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  // 下个月
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // 回到今天
  const goToday = () => {
    setCurrentMonth(new Date());
  };

  // 月统计
  const monthStats = useMemo(() => {
    if (!selectedHabitId) return { completed: 0, total: 0 };

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let completed = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = getLocalDateString(date);
      if (selectedLogs.some(l => l.date === dateStr && l.completed)) {
        completed++;
      }
    }

    return { completed, total: daysInMonth };
  }, [currentMonth, selectedHabitId, selectedLogs]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 md:space-y-8"
    >
      {/* 习惯列表 */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <div className="flex items-baseline gap-3">
            <h3 className="text-xl md:text-2xl font-display font-semibold text-dark-muted">习惯列表</h3>
            <span className="text-xs text-dark-muted/50">{activeHabits.length} 项</span>
          </div>
          <HabitForm />
        </div>

        {activeHabits.length === 0 ? (
          <div className="card text-center py-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <Calendar className="w-7 h-7 text-primary/70" />
            </div>
            <p className="text-dark-muted mb-2">还没有添加任何习惯</p>
            <p className="text-sm text-dark-muted/60">点击右上角“添加习惯”开始培养你的第一个习惯吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeHabits.map((habit, index) => {
              const IconComponent = iconMap[habit.icon] || Sun;
              const streak = getStreakDays(habit.id);
              const isSelected = selectedHabitId === habit.id;

              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedHabitId(habit.id)}
                  className={`card flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'border-primary/40' : ''
                  }`}
                  style={isSelected ? { borderColor: 'rgba(245, 158, 11, 0.4)' } : undefined}
                >
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div
                      className="w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        backgroundColor: `${habit.color}20`,
                        border: `1px solid ${habit.color}40`,
                      }}
                    >
                      <IconComponent className="w-5 h-5" style={{ color: habit.color }} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-dark-muted truncate">{habit.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-dark-muted/60">
                          连续 <span className="text-primary font-medium">{streak}</span> 天 · {habit.frequency === 'daily' ? '每日' : habit.frequency === 'weekly' ? '每周' : habit.frequency}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(habit.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* 日历视图 */}
      {selectedHabit && (
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-5 md:mb-6 gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${selectedHabit.color}20`, border: `1px solid ${selectedHabit.color}40` }}
              >
                <Calendar className="w-4 h-4" style={{ color: selectedHabit.color }} />
              </div>
              <h3 className="font-display text-base md:text-lg text-dark-muted truncate font-semibold">{selectedHabit.name}</h3>
            </div>

            {/* 月份切换 */}
            <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
              <Button variant="ghost" size="sm" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-dark-muted text-sm whitespace-nowrap font-medium min-w-[90px] text-center">
                {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
              </span>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={goToday}>
                <CalendarCheck className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 统计 */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 mb-4 md:mb-6">
            <BarChart3 className="w-3.5 h-3.5 text-secondary" />
            <span className="text-xs text-secondary font-medium">
              本月完成 <span className="font-bold">{monthStats.completed}</span> / {monthStats.total} 天
            </span>
          </div>

          {/* 日历网格 */}
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {/* 星期标题 */}
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <div key={day} className="text-center text-xs text-dark-muted/50 py-2 font-medium tracking-wider">
                {day}
              </div>
            ))}

            {/* 日期 */}
            {calendarDays.map((date, index) => {
              if (date === null) {
                return <div key={index} />;
              }
              const completed = isDayCompleted(date);
              const today = isToday(date);
              const future = isFuture(date);

              return (
                <motion.div
                  key={index}
                  whileHover={!future ? { scale: 1.1 } : {}}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xs md:text-sm relative transition-all ${
                    completed
                      ? ''
                      : future
                        ? 'text-dark-muted/20'
                        : 'bg-white/5 text-dark-muted/50 border border-white/5'
                  } ${today ? 'ring-2 ring-primary/60' : ''}`}
                  style={completed ? {
                    backgroundColor: `${selectedHabit.color}25`,
                    color: selectedHabit.color,
                    border: `1px solid ${selectedHabit.color}50`,
                    boxShadow: `0 0 12px ${selectedHabit.color}20`,
                  } : undefined}
                >
                  <span className="relative z-10 font-medium">{date.getDate()}</span>
                  {completed && (
                    <div
                      className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: selectedHabit.color, boxShadow: `0 0 6px ${selectedHabit.color}` }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* 删除确认模态框 */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="确认删除"
      >
        <p className="text-dark-muted mb-6">删除后无法恢复，所有打卡记录将永久丢失。确定要删除这个习惯吗？</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">
            取消
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (deleteConfirm) {
                deleteHabit(deleteConfirm);
                if (selectedHabitId === deleteConfirm) setSelectedHabitId(null);
                setDeleteConfirm(null);
              }
            }}
            className="flex-1"
          >
            删除
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}