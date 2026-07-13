import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Trash2,
  X,
  Clock,
  Tag,
} from 'lucide-react';
import {
  useScheduleStore,
  categoryConfig,
  ScheduleEvent,
} from '@/store/scheduleStore';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { LineDoodle } from '@/components/common/LineDoodle';

const weekDayLabels = ['日', '一', '二', '三', '四', '五', '六'];
const monthNames = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];

const getLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function Calendar() {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

  const { events, addEvent, deleteEvent, toggleDone } = useScheduleStore();

  // 生成月历网格（6 行 7 列，覆盖整月）
  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 周日为 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];

    // 上月尾部
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      cells.push({ date: d, inMonth: false });
    }
    // 本月
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ date: new Date(year, month, i), inMonth: true });
    }
    // 下月头部补齐到 42 格
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last);
      next.setDate(next.getDate() + 1);
      cells.push({ date: next, inMonth: false });
    }
    return cells;
  }, [viewDate]);

  const selectedDateString = getLocalDateString(selectedDate);

  const selectedDayEvents = useMemo(
    () =>
      events
        .filter((e) => e.date === selectedDateString)
        .sort((a, b) => {
          if (a.done !== b.done) return a.done ? 1 : -1;
          const ta = a.time || '99:99';
          const tb = b.time || '99:99';
          return ta.localeCompare(tb);
        }),
    [events, selectedDateString]
  );

  const goToPrevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };
  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    setSelectedDate(today);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 md:space-y-8"
    >
      {/* 页面标题 */}
      <section className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl md:text-2xl font-semibold text-dark-muted">
                日程安排
              </h1>
              <p className="text-xs text-dark-muted/50">规划你每一天要做的事</p>
            </div>
          </div>
          <Button onClick={() => { setEditingEvent(null); setShowAddModal(true); }} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">新建日程</span>
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5">
        {/* 月历网格 */}
        <section className="card lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-dark-muted">
              {viewDate.getFullYear()} · {monthNames[viewDate.getMonth()]}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-muted/50 hover:text-dark-muted hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="px-3 h-8 rounded-lg text-xs font-medium text-dark-muted/70 hover:text-dark-muted hover:bg-white/5 transition-colors"
              >
                今天
              </button>
              <button
                type="button"
                onClick={goToNextMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-muted/50 hover:text-dark-muted hover:bg-white/5 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 mb-2">
            {weekDayLabels.map((d) => (
              <div key={d} className="text-center text-[11px] text-dark-muted/50 py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* 日期格子 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => {
              const dateStr = getLocalDateString(cell.date);
              const isSelected = isSameDay(cell.date, selectedDate);
              const isToday = isSameDay(cell.date, new Date());
              const dayEvents = events.filter((e) => e.date === dateStr);
              const undoneCount = dayEvents.filter((e) => !e.done).length;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(cell.date)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all ${
                    isSelected
                      ? 'bg-primary/15 border border-primary/30'
                      : 'border border-transparent hover:bg-white/5'
                  } ${cell.inMonth ? '' : 'opacity-30'}`}
                >
                  <span
                    className={`text-sm font-medium ${
                      isToday
                        ? 'w-6 h-6 flex items-center justify-center rounded-full bg-primary text-dark-bg'
                        : isSelected
                          ? 'text-dark-muted'
                          : 'text-dark-muted/70'
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1.5 flex items-center gap-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className="w-1 h-1 rounded-full"
                          style={{
                            backgroundColor: e.done
                              ? 'rgba(255,255,255,0.2)'
                              : categoryConfig[e.category].color,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {undoneCount > 0 && (
                    <span className="absolute top-1 right-1 text-[9px] text-secondary/80 leading-none">
                      {undoneCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 选中日详情看板 */}
        <section className="card lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
            <div>
              <h3 className="font-display text-base text-dark-muted">
                {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
              </h3>
              <p className="text-[11px] text-dark-muted/50 mt-0.5">
                周{weekDayLabels[selectedDate.getDay()]}
                {isSameDay(selectedDate, new Date()) && ' · 今天'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setEditingEvent(null); setShowAddModal(true); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
              title="为这一天添加日程"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-h-[200px]">
            <AnimatePresence mode="wait">
              {selectedDayEvents.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <LineDoodle type="empty-calendar" size={110} />
                  <p className="text-sm text-dark-muted/50 mt-2">这一天还没有日程</p>
                  <p className="text-xs text-dark-muted/40 mt-1">点击 + 新建一个吧</p>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedDateString}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {selectedDayEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onToggle={() => toggleDone(event.id)}
                      onDelete={() => deleteEvent(event.id)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 当日统计 */}
          {selectedDayEvents.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-3 text-xs text-dark-muted/50">
              <span>共 {selectedDayEvents.length} 项</span>
              <span>·</span>
              <span className="text-secondary">
                待办 {selectedDayEvents.filter((e) => !e.done).length}
              </span>
              <span>·</span>
              <span className="text-primary">
                已完成 {selectedDayEvents.filter((e) => e.done).length}
              </span>
            </div>
          )}
        </section>
      </div>

      {/* 新建/编辑日程弹窗 */}
      <AddEventModal
        isOpen={showAddModal}
        date={selectedDateString}
        editingEvent={editingEvent}
        onClose={() => { setShowAddModal(false); setEditingEvent(null); }}
        onSave={(data) => {
          if (editingEvent) {
            // 编辑模式：暂未提供编辑入口，预留
          } else {
            addEvent(data);
          }
          setShowAddModal(false);
          setEditingEvent(null);
        }}
      />
    </motion.div>
  );
}

// 单条日程卡片
function EventCard({
  event,
  onToggle,
  onDelete,
}: {
  event: ScheduleEvent;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const cat = categoryConfig[event.category];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="group relative rounded-xl border p-3 transition-colors"
      style={{
        backgroundColor: cat.bg,
        borderColor: `${cat.color}30`,
      }}
    >
      <div className="flex items-start gap-2.5">
        {/* 完成勾选 */}
        <button
          type="button"
          onClick={onToggle}
          className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
            event.done
              ? 'bg-primary border-primary text-dark-bg'
              : 'border-white/20 hover:border-primary/50'
          }`}
        >
          {event.done && <Check className="w-3 h-3" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              event.done ? 'text-dark-muted/40 line-through' : 'text-dark-muted'
            }`}
          >
            {event.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
            >
              <Tag className="w-2.5 h-2.5" />
              {cat.label}
            </span>
            {event.time && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-dark-muted/50">
                <Clock className="w-2.5 h-2.5" />
                {event.time}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md flex items-center justify-center text-dark-muted/40 hover:text-red-400 hover:bg-red-500/10"
          title="删除"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// 添加日程弹窗
function AddEventModal({
  isOpen,
  date,
  editingEvent,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  date: string;
  editingEvent: ScheduleEvent | null;
  onClose: () => void;
  onSave: (data: Omit<ScheduleEvent, 'id' | 'createdAt' | 'done'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<ScheduleEvent['category']>('work');

  // 弹窗打开时初始化表单
  useEffect(() => {
    if (!isOpen) return;
    if (editingEvent) {
      setTitle(editingEvent.title);
      setTime(editingEvent.time || '');
      setCategory(editingEvent.category);
    } else {
      setTitle('');
      setTime('');
      setCategory('work');
    }
  }, [isOpen, editingEvent]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      date,
      title: title.trim(),
      time: time.trim() || undefined,
      category,
    });
    setTitle('');
    setTime('');
    setCategory('work');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingEvent ? '编辑日程' : '新建日程'}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm text-dark-muted mb-2 block">日程内容</label>
          <input
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
            placeholder="例如：完成季度汇报、整理读书笔记…"
            className="input w-full"
            maxLength={50}
          />
        </div>

        <div>
          <label className="text-sm text-dark-muted mb-2 block">时间（可选）</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="input w-full"
          />
        </div>

        <div>
          <label className="text-sm text-dark-muted mb-2 block">分类</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(categoryConfig) as ScheduleEvent['category'][]).map((key) => {
              const cat = categoryConfig[key];
              const active = category === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    active ? 'border-transparent' : 'border-white/10 hover:border-white/20'
                  }`}
                  style={
                    active
                      ? { backgroundColor: cat.color, color: '#1A1A1F' }
                      : { backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)' }
                  }
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            取消
          </Button>
          <Button onClick={handleSave} className="flex-1" disabled={!title.trim()}>
            {editingEvent ? '保存' : '添加'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
