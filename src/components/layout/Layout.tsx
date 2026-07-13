import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/store/uiStore';
import { useSettingsStore } from '@/store/settingsStore';

/** hex 转 "R G B" 空格分隔格式（供 CSS 变量使用） */
function hexToRgbStr(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** 将颜色变亮/变暗，返回 hex */
function adjustColor(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  let r = parseInt(h.substring(0, 2), 16);
  let g = parseInt(h.substring(2, 4), 16);
  let b = parseInt(h.substring(4, 6), 16);
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function Layout() {
  const focusMode = useUIStore((s) => s.focusMode);
  const focusBgColor = useSettingsStore((s) => s.focusBgColor);
  const customPrimaryColor = useSettingsStore((s) => s.customPrimaryColor);
  const backgroundImage = useSettingsStore((s) => s.backgroundImage);
  const bgOverlayOpacity = useSettingsStore((s) => s.bgOverlayOpacity);
  const bgBlur = useSettingsStore((s) => s.bgBlur);

  // 注入自定义主色到 CSS 变量
  useEffect(() => {
    const root = document.documentElement;
    if (customPrimaryColor) {
      root.style.setProperty('--color-primary', hexToRgbStr(customPrimaryColor));
      root.style.setProperty('--color-primary-light', hexToRgbStr(adjustColor(customPrimaryColor, 40)));
      root.style.setProperty('--color-primary-dark', hexToRgbStr(adjustColor(customPrimaryColor, -30)));
    } else {
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-primary-light');
      root.style.removeProperty('--color-primary-dark');
    }
  }, [customPrimaryColor]);

  // 注入背景遮罩不透明度
  useEffect(() => {
    document.documentElement.style.setProperty('--bg-overlay-opacity', String(bgOverlayOpacity / 100));
  }, [bgOverlayOpacity]);

  const hasCustomBg = !focusMode && backgroundImage;

  return (
    <div
      className="min-h-screen transition-colors duration-500 relative"
      style={focusMode ? { backgroundColor: focusBgColor } : undefined}
    >
      {/* 自定义背景图（专注模式下隐藏） */}
      {hasCustomBg && (
        <>
          <div
            className="custom-bg"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              filter: bgBlur > 0 ? `blur(${bgBlur}px)` : undefined,
              transform: bgBlur > 0 ? 'scale(1.05)' : undefined,
            }}
          />
          <div className="custom-bg-overlay" />
        </>
      )}

      {/* 全局背景氛围（专注模式或有自定义背景时隐藏） */}
      {!focusMode && !backgroundImage && (
        <>
          <div className="aurora-bg" />
          <div className="aurora-bg-extra" />
        </>
      )}

      {/* 侧边栏在专注模式下隐藏 */}
      <AnimatePresence>
        {!focusMode && <Sidebar />}
      </AnimatePresence>

      <main className={`min-h-screen pb-24 md:pb-0 relative z-10 transition-all duration-300 ${focusMode ? '' : 'md:ml-[252px]'}`}>
        <div className={`mx-auto ${focusMode ? 'p-4 md:p-6 max-w-3xl' : 'p-4 md:p-10 max-w-5xl'}`}>
          {/* 移动端 Logo（专注模式下隐藏） */}
          {!focusMode && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="md:hidden flex items-center justify-center gap-2 mb-6 pt-2"
            >
              <div className="w-8 h-8 radius-hand-sm bg-primary/15 border-hand border-primary/30 flex items-center justify-center filter-hand">
                <Sparkles className="w-4 h-4 text-primary" strokeWidth={2.2} />
              </div>
              <h1 className="font-display text-2xl text-gradient-amber font-bold tracking-tight">Zil Desktop</h1>
            </motion.div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
