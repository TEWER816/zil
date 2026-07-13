import { NavLink } from 'react-router-dom';
import { Home, List, Timer, HeartPulse, CalendarDays, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '@/store/settingsStore';
import { useHabitStore, getLocalDateString } from '@/store/habitStore';
import { useCompanionStore } from '@/store/companionStore';
import { ZiliCat } from '@/components/companion/ZiliCat';

const navGroups = [
  {
    label: '主要',
    items: [
      { path: '/', icon: Home, label: '首页' },
      { path: '/habits', icon: List, label: '习惯' },
      { path: '/calendar', icon: CalendarDays, label: '日程' },
    ],
  },
  {
    label: '工具',
    items: [
      { path: '/focus', icon: Timer, label: '专注' },
      { path: '/presets', icon: HeartPulse, label: '预设' },
      { path: '/settings', icon: Settings, label: '设置' },
    ],
  },
];

const allItems = navGroups.flatMap((g) => g.items);

export function Sidebar() {
  const userName = useSettingsStore((s) => s.userName);
  const { habits, logs } = useHabitStore();
  const pulseKey = useCompanionStore((s) => s.pulseKey);

  // 今日完成率（驱动小猫表情）
  const today = getLocalDateString();
  const activeHabits = habits.filter((h) => h.isActive);
  const completedToday = activeHabits.filter((h) =>
    logs.find((l) => l.habitId === h.id && l.date === today && l.completed)
  ).length;
  const progress = activeHabits.length > 0 ? (completedToday / activeHabits.length) * 100 : 0;

  return (
    <>
      {/* 桌面端：浮动玻璃侧栏 */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="sidebar-aside hidden md:flex fixed left-3 top-3 bottom-3 w-60 flex-col z-20 radius-hand-lg bg-dark-bg/70 backdrop-blur-xl shadow-hand border-hand border-primary/25 overflow-hidden"
      >
        {/* 顶部 Logo 区 */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 radius-hand bg-primary/12 border-hand border-primary/30 flex items-center justify-center shrink-0 text-primary filter-hand">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <path
                  d="M16 6.5c-1.5 2.5-4 4-4 7.5 0 3.5 2.5 6.5 6 8.5 3.5-2 6-5 6-8.5 0-3.5-2.5-5-4-7.5"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.5 18.5l2.5 2.5 4.5-5"
                  stroke="#FFC857"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="leading-none">
              <h1 className="font-display text-2xl text-dark-muted font-semibold tracking-tight">
                Zil
              </h1>
              <p className="text-[11px] text-dark-muted/40 mt-0.5 tracking-wide">自律助手</p>
            </div>
          </div>
        </div>

        {/* 导航菜单 - 分组 + 动画指示器 */}
        <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[11px] font-medium text-dark-muted/40 tracking-wider uppercase">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className="block"
                  >
                    {({ isActive }) => (
                      <div className="relative">
                        {/* 活跃背景 - layoutId 动画 */}
                        {isActive && (
                          <motion.div
                            layoutId="nav-active-bg"
                            className="absolute inset-0 radius-hand-sm bg-primary/14 border-hand border-primary/35 shadow-hand-sm filter-hand"
                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                          />
                        )}
                        <div
                          className={`relative flex items-center gap-3 px-3 py-2.5 radius-hand-sm transition-colors ${
                            isActive
                              ? 'text-primary'
                              : 'text-dark-muted/60 hover:text-dark-muted hover:bg-white/4'
                          }`}
                        >
                          <item.icon
                            className="w-[18px] h-[18px] shrink-0"
                            strokeWidth={isActive ? 2.3 : 1.75}
                          />
                          <span className={`text-sm tracking-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>
                            {item.label}
                          </span>
                        </div>
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* 底部用户区 */}
        <div className="px-3 pb-3 pt-2 border-t border-primary/15">
          {/* Zili 小猫伙伴 */}
          <div className="flex justify-center pb-3 pt-1">
            <ZiliCat
              progress={progress}
              hasHabits={activeHabits.length > 0}
              pulseKey={pulseKey}
              size={56}
            />
          </div>
          <NavLink
            to="/settings"
            className="block"
          >
            {({ isActive }) => (
              <div className="flex items-center gap-3 px-3 py-2.5 radius-hand-sm transition-colors hover:bg-white/4">
                <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 text-primary text-xs font-semibold">
                  {(userName || 'Z')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 leading-tight">
                  <p className="text-sm text-dark-muted font-medium truncate">
                    {userName || '未设置昵称'}
                  </p>
                  <p className={`text-[10px] ${isActive ? 'text-primary' : 'text-dark-muted/40'}`}>
                    {isActive ? '正在设置' : '点击设置'}
                  </p>
                </div>
              </div>
            )}
          </NavLink>
        </div>
      </motion.aside>

      {/* 移动端：底部浮动玻璃导航 */}
      <motion.nav
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="md:hidden fixed bottom-3 left-3 right-3 z-30 safe-area-pb pointer-events-none"
      >
        <div className="pointer-events-auto radius-hand-lg backdrop-blur-xl bg-dark-bg/80 shadow-hand border-hand border-primary/25">
          <div className="flex items-center justify-around px-1.5 py-1.5">
            {allItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative"
              >
                {({ isActive }) => (
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 radius-hand-sm"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-bg"
                        className="absolute inset-0 radius-hand-sm bg-primary/14 border-hand border-primary/35 shadow-hand-sm filter-hand"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <item.icon
                      className="w-[18px] h-[18px] relative z-10"
                      strokeWidth={isActive ? 2.4 : 1.8}
                      style={{ color: isActive ? 'var(--color-primary)' : 'rgba(90,107,122,0.65)' }}
                    />
                    <span
                      className={`text-[10px] relative z-10 ${isActive ? 'font-semibold' : 'font-medium'}`}
                      style={{ color: isActive ? 'var(--color-primary)' : 'rgba(90,107,122,0.65)' }}
                    >
                      {item.label}
                    </span>
                  </motion.div>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </motion.nav>
    </>
  );
}
