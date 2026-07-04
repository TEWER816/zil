import { NavLink } from 'react-router-dom';
import { Home, List, Timer, HeartPulse, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/habits', icon: List, label: '习惯' },
  { path: '/focus', icon: Timer, label: '专注' },
  { path: '/presets', icon: HeartPulse, label: '预设' },
  { path: '/settings', icon: Settings, label: '设置' },
];

export function Sidebar() {
  return (
    <>
      {/* 桌面端侧边栏 - 现代极简 */}
      <motion.aside
        initial={{ x: -16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -16, opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="sidebar-aside hidden md:flex fixed left-0 top-0 h-full w-60 border-r border-white/5 flex-col z-20"
      >
        {/* Logo 区 - 极简品牌标识 */}
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 text-primary">
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
            <h1 className="font-display text-lg text-dark-muted font-semibold tracking-tight leading-none">
              Zil
            </h1>
          </div>
        </div>

        {/* 导航菜单 - 现代极简，左侧色条指示器 */}
        <nav className="flex-1 px-3 pt-2">
          <p className="px-3 pb-2 text-[11px] font-medium text-dark-muted/40 tracking-wider uppercase">菜单</p>
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                {({ isActive }) => (
                  <div className="flex items-center gap-3 w-full relative">
                    {/* 左侧色条指示器 - 极简现代 */}
                    {isActive && (
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary" />
                    )}
                    <item.icon
                      className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-dark-muted/60'}`}
                      strokeWidth={isActive ? 2.25 : 1.75}
                    />
                    <span className={`tracking-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </motion.aside>

      {/* 移动端底部导航 - 液态玻璃现代风 */}
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 safe-area-pb pointer-events-none"
      >
        <div className="pointer-events-auto rounded-2xl border border-white/15 backdrop-blur-xl bg-dark-bg/85 shadow-xl">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors duration-200 ${
                    isActive
                      ? 'text-primary'
                      : 'text-dark-muted hover:text-dark-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className="flex flex-col items-center gap-1 relative"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-bg"
                        className="absolute inset-0 -m-1 rounded-xl bg-primary/12"
                      />
                    )}
                    <item.icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2.4 : 2} />
                    <span className={`text-[11px] relative z-10 ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
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
