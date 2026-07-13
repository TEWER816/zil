// Zili — 线条小猫伙伴
// 手绘风 SVG 线条小猫，住在侧边栏陪伴用户
// 根据今日完成率切换 4 种状态，打卡时触发眨眼/跳跃反馈
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export type ZiliMood = 'sleeping' | 'idle' | 'happy' | 'celebrate';

interface ZiliCatProps {
  /** 今日完成率 0-100 */
  progress: number;
  /** 是否活跃（有习惯） */
  hasHabits: boolean;
  /** 触发打卡反馈（key 变化时跳动一下） */
  pulseKey?: number;
  size?: number;
}

export function ZiliCat({ progress, hasHabits, pulseKey = 0, size = 64 }: ZiliCatProps) {
  const mood: ZiliMood = !hasHabits
    ? 'idle'
    : progress >= 100
    ? 'celebrate'
    : progress >= 50
    ? 'happy'
    : progress <= 0
    ? 'sleeping'
    : 'idle';

  const [bubble, setBubble] = useState<string | null>(null);

  // 打卡反馈：跳动 + 气泡
  useEffect(() => {
    if (pulseKey === 0) return;
    const phrases = ['好棒！', '继续加油~', '陪你一起', '喵~', '又近一步'];
    setBubble(phrases[Math.floor(Math.random() * phrases.length)]);
    const t = setTimeout(() => setBubble(null), 1800);
    return () => clearTimeout(t);
  }, [pulseKey]);

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* 对话气泡 */}
      <AnimatePresence>
        {bubble && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="absolute -top-7 px-2.5 py-1 radius-hand-sm bg-dark-surface border-hand border-primary/40 text-[11px] text-primary whitespace-nowrap shadow-hand-sm z-10"
          >
            {bubble}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-dark-surface border-r border-b border-primary/40" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        key={pulseKey}
        initial={pulseKey > 0 ? { scale: 0.85, y: 4 } : false}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      >
        <ZiliSvg mood={mood} size={size} />
      </motion.div>

      <p className="mt-1 text-[10px] text-dark-muted/50 tracking-wide">
        {mood === 'sleeping' && 'Zili 在打盹…'}
        {mood === 'idle' && 'Zili 陪着你'}
        {mood === 'happy' && 'Zili 很开心'}
        {mood === 'celebrate' && 'Zili 为你欢呼！'}
      </p>
    </div>
  );
}

function ZiliSvg({ mood, size }: { mood: ZiliMood; size: number }) {
  const stroke = '#5DCCC5';
  const sw = 2;
  // 跳跃/呼吸动画容器
  const breathe = mood === 'sleeping'
    ? { animate: { y: [0, 1, 0] }, transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }
    : mood === 'celebrate'
    ? { animate: { y: [0, -3, 0], rotate: [0, -3, 3, 0] }, transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } }
    : { animate: { y: [0, -1.5, 0] }, transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      {...breathe}
    >
      {/* 尾巴 */}
      <motion.path
        d="M62 52 Q70 48 68 40 Q66 34 60 36"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        animate={mood === 'celebrate' ? { rotate: [0, 8, 0] } : {}}
        style={{ transformOrigin: '62px 52px' }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* 身体（椭圆）*/}
      <ellipse cx="40" cy="52" rx="20" ry="16" stroke={stroke} strokeWidth={sw} fill="rgba(93,204,197,0.06)" />

      {/* 前腿 */}
      <path d="M34 64 Q34 70 32 72" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <path d="M46 64 Q46 70 48 72" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />

      {/* 头 */}
      <circle cx="40" cy="32" r="16" stroke={stroke} strokeWidth={sw} fill="rgba(93,204,197,0.06)" />

      {/* 耳朵（三角）*/}
      <path d="M28 22 L26 12 L34 18 Z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" fill="rgba(93,204,197,0.06)" />
      <path d="M52 22 L54 12 L46 18 Z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" fill="rgba(93,204,197,0.06)" />

      {/* 眼睛 */}
      {mood === 'sleeping' ? (
        <>
          <path d="M32 30 Q34 32 36 30" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <path d="M44 30 Q46 32 48 30" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </>
      ) : mood === 'happy' || mood === 'celebrate' ? (
        <>
          <path d="M32 30 Q34 27 36 30" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <path d="M44 30 Q46 27 48 30" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="34" cy="30" r="1.6" fill={stroke} />
          <circle cx="46" cy="30" r="1.6" fill={stroke} />
        </>
      )}

      {/* 鼻子 */}
      <path d="M38.5 35 L40 36.5 L41.5 35" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />

      {/* 嘴 */}
      {mood === 'happy' || mood === 'celebrate' ? (
        <path d="M36 39 Q40 43 44 39" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      ) : mood === 'sleeping' ? (
        <path d="M38 39 L42 39" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      ) : (
        <path d="M37 38.5 Q40 40.5 43 38.5" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      )}

      {/* 胡须 */}
      <path d="M26 34 L20 33" stroke={stroke} strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />
      <path d="M26 36 L20 37" stroke={stroke} strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />
      <path d="M54 34 L60 33" stroke={stroke} strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />
      <path d="M54 36 L60 37" stroke={stroke} strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />

      {/* 睡觉 Zzz */}
      {mood === 'sleeping' && (
        <motion.g
          animate={{ opacity: [0, 1, 0], y: [-2, -6, -10] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
        >
          <text x="58" y="18" fill={stroke} fontSize="9" fontFamily="ui-monospace" fontStyle="italic">z</text>
        </motion.g>
      )}

      {/* 庆祝星星 */}
      {mood === 'celebrate' && (
        <>
          <motion.g animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }} transition={{ duration: 1.4, repeat: Infinity }}>
            <path d="M16 18 L18 22 L22 23 L18 24 L16 28 L14 24 L10 23 L14 22 Z" stroke="#FFC857" strokeWidth={1.2} fill="rgba(255,200,87,0.2)" />
          </motion.g>
          <motion.g animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.7 }}>
            <path d="M64 14 L65 17 L68 18 L65 19 L64 22 L63 19 L60 18 L63 17 Z" stroke="#FF9FB2" strokeWidth={1.2} fill="rgba(255,159,178,0.2)" />
          </motion.g>
        </>
      )}
    </motion.svg>
  );
}
