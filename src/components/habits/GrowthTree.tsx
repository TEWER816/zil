// 习惯成长树 — 根据连续打卡天数显示不同形态的线条小树
// 阶段：种子(0) → 嫩芽(1-2) → 小树(3-6) → 大树(7-29) → 开花(30+)
import { motion } from 'framer-motion';

interface GrowthTreeProps {
  streak: number;
  size?: number;
  color?: string;
}

type Stage = 'seed' | 'sprout' | 'small' | 'big' | 'bloom';

function getStage(streak: number): Stage {
  if (streak === 0) return 'seed';
  if (streak <= 2) return 'sprout';
  if (streak <= 6) return 'small';
  if (streak <= 29) return 'big';
  return 'bloom';
}

const stageLabels: Record<Stage, string> = {
  seed: '种子',
  sprout: '嫩芽',
  small: '小树',
  big: '大树',
  bloom: '开花',
};

export function GrowthTree({ streak, size = 36, color = '#5DCCC5' }: GrowthTreeProps) {
  const stage = getStage(streak);

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <motion.div
        key={stage}
        initial={{ scale: 0.7, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <TreeSvg stage={stage} size={size} color={color} />
      </motion.div>
      {streak > 0 && (
        <span className="text-[9px] text-dark-muted/50 tracking-wide">{stageLabels[stage]}</span>
      )}
    </div>
  );
}

function TreeSvg({ stage, size, color }: { stage: Stage; size: number; color: string }) {
  const sw = 1.8;

  if (stage === 'seed') {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        {/* 土壤 */}
        <path d="M8 32 Q20 30 32 32" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.5} />
        <path d="M10 34 L14 34" stroke={color} strokeWidth={1} strokeLinecap="round" opacity={0.3} />
        <path d="M26 34 L30 34" stroke={color} strokeWidth={1} strokeLinecap="round" opacity={0.3} />
        {/* 种子 */}
        <motion.ellipse
          cx="20"
          cy="28"
          rx="4"
          ry="5"
          stroke={color}
          strokeWidth={sw}
          fill="rgba(93,204,197,0.1)"
          animate={{ scaleY: [1, 0.96, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '20px 28px' }}
        />
      </svg>
    );
  }

  if (stage === 'sprout') {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M8 32 Q20 30 32 32" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.5} />
        {/* 茎 */}
        <motion.path
          d="M20 32 L20 20"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          animate={{ scaleY: [1, 1.03, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '20px 32px' }}
        />
        {/* 两片叶子 */}
        <path d="M20 24 Q14 22 12 26 Q16 28 20 26" stroke={color} strokeWidth={sw} strokeLinejoin="round" fill="rgba(93,204,197,0.1)" />
        <path d="M20 24 Q26 22 28 26 Q24 28 20 26" stroke={color} strokeWidth={sw} strokeLinejoin="round" fill="rgba(93,204,197,0.1)" />
      </svg>
    );
  }

  if (stage === 'small') {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M8 34 Q20 32 32 34" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.5} />
        {/* 树干 */}
        <path d="M20 34 L20 18" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        {/* 树冠 */}
        <motion.g
          animate={{ rotate: [0, 1.5, -1.5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '20px 16px' }}
        >
          <circle cx="20" cy="14" r="7" stroke={color} strokeWidth={sw} fill="rgba(93,204,197,0.12)" />
          <circle cx="14" cy="17" r="4" stroke={color} strokeWidth={sw} fill="rgba(93,204,197,0.12)" />
          <circle cx="26" cy="17" r="4" stroke={color} strokeWidth={sw} fill="rgba(93,204,197,0.12)" />
        </motion.g>
      </svg>
    );
  }

  if (stage === 'big') {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M6 34 Q20 32 34 34" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.5} />
        {/* 树干 + 分枝 */}
        <path d="M20 34 L20 14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        <path d="M20 22 L15 18" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        <path d="M20 22 L25 18" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        {/* 大树冠 */}
        <motion.g
          animate={{ rotate: [0, 1, -1, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '20px 12px' }}
        >
          <circle cx="20" cy="12" r="9" stroke={color} strokeWidth={sw} fill="rgba(93,204,197,0.12)" />
          <circle cx="12" cy="15" r="5" stroke={color} strokeWidth={sw} fill="rgba(93,204,197,0.12)" />
          <circle cx="28" cy="15" r="5" stroke={color} strokeWidth={sw} fill="rgba(93,204,197,0.12)" />
          <circle cx="20" cy="18" r="5" stroke={color} strokeWidth={sw} fill="rgba(93,204,197,0.12)" />
        </motion.g>
      </svg>
    );
  }

  // bloom
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M6 34 Q20 32 34 34" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={0.5} />
      <path d="M20 34 L20 14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <path d="M20 22 L15 18" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <path d="M20 22 L25 18" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <motion.g
        animate={{ rotate: [0, 1, -1, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '20px 12px' }}
      >
        <circle cx="20" cy="12" r="9" stroke={color} strokeWidth={sw} fill="rgba(93,204,197,0.12)" />
        <circle cx="12" cy="15" r="5" stroke={color} strokeWidth={sw} fill="rgba(93,204,197,0.12)" />
        <circle cx="28" cy="15" r="5" stroke={color} strokeWidth={sw} fill="rgba(93,204,197,0.12)" />
        <circle cx="20" cy="18" r="5" stroke={color} strokeWidth={sw} fill="rgba(93,204,197,0.12)" />
      </motion.g>
      {/* 花朵 */}
      <motion.g animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2.2, repeat: Infinity }}>
        <circle cx="14" cy="10" r="1.6" fill="#FFC857" />
      </motion.g>
      <motion.g animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.7 }}>
        <circle cx="26" cy="10" r="1.6" fill="#FF9FB2" />
      </motion.g>
      <motion.g animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2.2, repeat: Infinity, delay: 1.4 }}>
        <circle cx="20" cy="6" r="1.6" fill="#FFC857" />
      </motion.g>
      {/* 飘落的花瓣 */}
      <motion.circle
        cx="22"
        cy="14"
        r="1"
        fill="#FF9FB2"
        animate={{ y: [0, 12, 18], opacity: [0, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      />
    </svg>
  );
}
