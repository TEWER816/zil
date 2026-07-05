import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sun, Moon, BookOpen, Dumbbell, Heart, Leaf, Coffee, Music, Pen, Zap, Star, Award } from 'lucide-react';
import { useHabitStore, habitIcons, habitColors } from '@/store/habitStore';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun, Moon, BookOpen, Dumbbell, Heart, Leaf, Coffee, Music, Pen, Zap, Star, Award
};

interface HabitFormProps {
  children?: React.ReactNode;
}

export function HabitForm({ children }: HabitFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Sun');
  const [selectedColor, setSelectedColor] = useState('#5DCCC5');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState('');
  const [reminder, setReminder] = useState('');

  const { addHabit } = useHabitStore();

  const resetForm = () => {
    setName('');
    setSelectedIcon('Sun');
    setSelectedColor('#5DCCC5');
    setFrequency('daily');
    setCustomDays('');
    setReminder('');
  };

  const handleClose = () => {
    resetForm();
    setIsOpen(false);
  };

  const handleAdd = () => {
    if (!name.trim()) return;

    const frequencyDesc = frequency === 'custom' && customDays.trim()
      ? customDays.trim()
      : frequency;

    addHabit({
      id: `habit-${Date.now()}`,
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      frequency: frequencyDesc,
      reminderTimes: reminder.trim() ? [reminder.trim()] : [],
      createdAt: new Date().toISOString(),
      isActive: true
    });

    resetForm();
    setIsOpen(false);
  };

  return (
    <>
      {/* 添加按钮：支持自定义触发器 */}
      {children ? (
        <button type="button" onClick={() => setIsOpen(true)} className="contents">
          {children}
        </button>
      ) : (
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-dark-bg font-medium text-sm hover:bg-primaryLight transition-colors shadow-lg shadow-primary/15"
        >
          <Plus className="w-4 h-4" />
          <span>添加习惯</span>
        </motion.button>
      )}

      {/* 添加习惯模态框 */}
      <Modal isOpen={isOpen} onClose={handleClose} title="添加新习惯">
        <div className="space-y-4">
          {/* 习惯名称 */}
          <div>
            <label className="text-sm text-dark-muted mb-2 block">习惯名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) handleAdd();
              }}
              placeholder="例如：早起、阅读、运动..."
              className="input w-full"
              autoFocus
            />
          </div>

          {/* 选择图标 */}
          <div>
            <label className="text-sm text-dark-muted mb-2 block">选择图标</label>
            <div className="flex gap-2 flex-wrap">
              {habitIcons.map((icon) => {
                const IconComponent = iconMap[icon];
                return (
                  <motion.button
                    key={icon}
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedIcon(icon)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                      selectedIcon === icon
                        ? 'border-primary bg-primary/20'
                        : 'border-dark-border bg-dark-surface'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 ${selectedIcon === icon ? 'text-primary' : 'text-dark-muted'}`} />
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* 选择颜色 */}
          <div>
            <label className="text-sm text-dark-muted mb-2 block">选择颜色</label>
            <div className="flex gap-2 flex-wrap">
              {habitColors.map((color) => (
                <motion.button
                  key={color}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor === color ? 'border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* 选择频率 */}
          <div>
            <label className="text-sm text-dark-muted mb-2 block">频率</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'custom'] as const).map((f) => (
                <motion.button
                  key={f}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFrequency(f)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    frequency === f
                      ? 'bg-primary text-dark-bg'
                      : 'bg-dark-surface text-dark-muted border border-dark-border'
                  }`}
                >
                  {f === 'daily' ? '每日' : f === 'weekly' ? '每周' : '自定义'}
                </motion.button>
              ))}
            </div>
            {/* 自定义频率输入 */}
            {frequency === 'custom' && (
              <motion.input
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                type="text"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="例如：每周一三五 / 工作日 / 每3天一次"
                className="input w-full mt-3"
              />
            )}
          </div>

          {/* 提醒时间 */}
          <div>
            <label className="text-sm text-dark-muted mb-2 block">提醒时间（可选）</label>
            <input
              type="text"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              placeholder="例如：早上 8:00"
              className="input w-full"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={handleClose} className="flex-1">
              取消
            </Button>
            <Button onClick={handleAdd} className="flex-1" disabled={!name.trim()}>
              添加
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}