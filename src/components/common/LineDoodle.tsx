// 手绘线条空状态插画 — 用于空状态、引导页
// 全部用 SVG path + stroke 实现，零图片依赖
import { motion } from 'framer-motion';

interface LineDoodleProps {
  type: 'empty-habits' | 'empty-calendar' | 'welcome' | 'rest';
  size?: number;
  color?: string;
}

export function LineDoodle({ type, size = 140, color = '#5DCCC5' }: LineDoodleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="flex items-center justify-center"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        style={{ color }}
      >
        {type === 'empty-habits' && <EmptyHabits />}
        {type === 'empty-calendar' && <EmptyCalendar />}
        {type === 'welcome' && <Welcome />}
        {type === 'rest' && <Rest />}
      </svg>
    </motion.div>
  );
}

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
};

function EmptyHabits() {
  return (
    <g>
      {/* 笔记本 */}
      <motion.g
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="30" y="30" width="60" height="70" rx="4" {...stroke} />
        <line x1="30" y1="44" x2="90" y2="44" {...stroke} />
        {/* 装订环 */}
        <circle cx="36" cy="37" r="1.5" fill="currentColor" />
        <circle cx="60" cy="37" r="1.5" fill="currentColor" />
        <circle cx="84" cy="37" r="1.5" fill="currentColor" />
        {/* 待办线 */}
        <path d="M40 56 L48 56" {...stroke} />
        <path d="M52 56 L80 56" {...stroke} opacity={0.4} />
        <path d="M40 68 L48 68" {...stroke} />
        <path d="M52 68 L80 68" {...stroke} opacity={0.4} />
        <path d="M40 80 L48 80" {...stroke} />
        <path d="M52 80 L70 80" {...stroke} opacity={0.4} />
      </motion.g>
      {/* 加号气泡 */}
      <motion.g
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '92px 50px' }}
      >
        <circle cx="92" cy="50" r="14" stroke="#FFC857" strokeWidth={1.6} fill="rgba(255,200,87,0.12)" />
        <path d="M92 44 L92 56 M86 50 L98 50" stroke="#FFC857" strokeWidth={2} strokeLinecap="round" />
      </motion.g>
    </g>
  );
}

function EmptyCalendar() {
  return (
    <g>
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* 日历 */}
        <rect x="26" y="32" width="68" height="60" rx="6" {...stroke} />
        <line x1="26" y1="48" x2="94" y2="48" {...stroke} />
        <path d="M40 26 L40 38 M80 26 L40 26 M80 26 L80 38" {...stroke} />
        {/* 网格点 */}
        {[58, 70, 82].map((y) =>
          [38, 50, 62, 74, 86].map((x) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill="currentColor" opacity={0.3} />
          ))
        )}
        {/* 高亮某天 */}
        <circle cx="62" cy="70" r="6" stroke="#FFC857" strokeWidth={1.6} fill="rgba(255,200,87,0.15)" />
      </motion.g>
      {/* 小星星 */}
      <motion.g
        animate={{ opacity: [0.4, 1, 0.4], rotate: [0, 90, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '100px 30px' }}
      >
        <path d="M100 24 L102 28 L106 29 L102 30 L100 34 L98 30 L94 29 L98 28 Z" stroke="#FF9FB2" strokeWidth={1.2} fill="rgba(255,159,178,0.2)" />
      </motion.g>
    </g>
  );
}

function Welcome() {
  return (
    <g>
      {/* 小猫挥手 */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="60" cy="55" r="22" {...stroke} fill="rgba(93,204,197,0.06)" />
        <path d="M44 44 L40 32 L48 40" {...stroke} />
        <path d="M76 44 L80 32 L72 40" {...stroke} />
        {/* 笑眼 */}
        <path d="M50 52 Q53 49 56 52" {...stroke} />
        <path d="M64 52 Q67 49 70 52" {...stroke} />
        {/* 笑嘴 */}
        <path d="M54 62 Q60 67 66 62" {...stroke} />
        {/* 胡须 */}
        <path d="M44 58 L36 57" {...stroke} opacity={0.5} />
        <path d="M44 61 L36 62" {...stroke} opacity={0.5} />
        <path d="M76 58 L84 57" {...stroke} opacity={0.5} />
        <path d="M76 61 L84 62" {...stroke} opacity={0.5} />
      </motion.g>
      {/* 挥手 */}
      <motion.g
        animate={{ rotate: [0, 20, -10, 20, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '84px 40px' }}
      >
        <circle cx="84" cy="40" r="6" stroke="#FFC857" strokeWidth={1.6} fill="rgba(255,200,87,0.15)" />
      </motion.g>
      {/* 装饰星星 */}
      <motion.g
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <path d="M30 30 L32 34 L36 35 L32 36 L30 40 L28 36 L24 35 L28 34 Z" stroke="#FFC857" strokeWidth={1.2} fill="rgba(255,200,87,0.2)" />
      </motion.g>
    </g>
  );
}

function Rest() {
  return (
    <g>
      {/* 月亮 */}
      <motion.g
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '60px 50px' }}
      >
        <path
          d="M70 40 Q50 40 50 60 Q50 80 70 80 Q60 80 55 70 Q52 60 55 50 Q60 40 70 40 Z"
          {...stroke}
          fill="rgba(255,200,87,0.12)"
        />
      </motion.g>
      {/* Zzz */}
      <motion.g
        animate={{ opacity: [0, 1, 0], y: [-2, -8, -14] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
      >
        <text x="80" y="36" fill="currentColor" fontSize="11" fontFamily="ui-monospace" fontStyle="italic" opacity={0.7}>z</text>
      </motion.g>
      <motion.g
        animate={{ opacity: [0, 1, 0], y: [-2, -8, -14] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
      >
        <text x="88" y="42" fill="currentColor" fontSize="8" fontFamily="ui-monospace" fontStyle="italic" opacity={0.5}>z</text>
      </motion.g>
      {/* 小星星 */}
      <motion.g
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <path d="M30 50 L32 54 L36 55 L32 56 L30 60 L28 56 L24 55 L28 54 Z" stroke="#FF9FB2" strokeWidth={1.2} fill="rgba(255,159,178,0.2)" />
      </motion.g>
      <motion.g
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      >
        <circle cx="40" cy="80" r="1.5" fill="#FFC857" />
      </motion.g>
    </g>
  );
}
