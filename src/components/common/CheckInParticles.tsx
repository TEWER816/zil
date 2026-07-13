// 打卡粒子特效 — 打卡成功时从按钮位置飞出的线条星星/爱心粒子
// 通过 triggerKey 触发，自动消失
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

interface CheckInParticlesProps {
  triggerKey: number;
  color?: string;
}

const PARTICLE_COUNT = 8;

interface Particle {
  id: number;
  angle: number;
  distance: number;
  shape: 'star' | 'heart' | 'sparkle';
  delay: number;
  size: number;
}

export function CheckInParticles({ triggerKey, color = '#5DCCC5' }: CheckInParticlesProps) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      angle: (360 / PARTICLE_COUNT) * i + Math.random() * 30,
      distance: 32 + Math.random() * 28,
      shape: (['star', 'heart', 'sparkle'] as const)[i % 3],
      delay: Math.random() * 0.1,
      size: 8 + Math.random() * 6,
    }));
  }, [triggerKey]);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <AnimatePresence>
        {triggerKey > 0 && (
          <div key={triggerKey} className="relative">
            {particles.map((p) => {
              const rad = (p.angle * Math.PI) / 180;
              const x = Math.cos(rad) * p.distance;
              const y = Math.sin(rad) * p.distance;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 0.3, rotate: 0 }}
                  animate={{
                    opacity: 0,
                    x,
                    y,
                    scale: [0.3, 1, 0.6],
                    rotate: Math.random() * 180 - 90,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.9,
                    delay: p.delay,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="absolute"
                  style={{ width: p.size, height: p.size, left: -p.size / 2, top: -p.size / 2 }}
                >
                  <ParticleShape shape={p.shape} color={color} />
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ParticleShape({ shape, color }: { shape: Particle['shape']; color: string }) {
  if (shape === 'star') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path
          d="M12 3 L14.5 9.5 L21 10 L16 14.5 L17.5 21 L12 17.5 L6.5 21 L8 14.5 L3 10 L9.5 9.5 Z"
          stroke={color}
          strokeWidth={1.6}
          strokeLinejoin="round"
          fill={`${color}30`}
        />
      </svg>
    );
  }
  if (shape === 'heart') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <path
          d="M12 21 C12 21 4 14 4 8.5 C4 5.5 6.5 3 9.5 3 C11 3 12 4 12 4 C12 4 13 3 14.5 3 C17.5 3 20 5.5 20 8.5 C20 14 12 21 12 21 Z"
          stroke="#FF9FB2"
          strokeWidth={1.6}
          strokeLinejoin="round"
          fill="rgba(255,159,178,0.2)"
        />
      </svg>
    );
  }
  // sparkle
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <path d="M12 2 L13 10 L21 12 L13 14 L12 22 L11 14 L3 12 L11 10 Z" stroke="#FFC857" strokeWidth={1.4} strokeLinejoin="round" fill="rgba(255,200,87,0.2)" />
    </svg>
  );
}
