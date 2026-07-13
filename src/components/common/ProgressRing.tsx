interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
  glow?: boolean;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#5DCCC5',        // primary
  bgColor = 'rgba(184, 184, 194, 0.2)', // dark.muted 20%
  children,
  glow = true
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, progress)) / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        filter: glow ? `drop-shadow(0 0 6px ${color}40)` : undefined,
      }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 absolute top-0 left-0"
      >
        {/* 背景环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* 进度环 - 纯 stroke，无 filter */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>

      {/* 中心内容 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children ?? (
          <span className="text-lg font-medium text-dark-muted">
            {Math.round(progress)}%
          </span>
        )}
      </div>
    </div>
  );
}
