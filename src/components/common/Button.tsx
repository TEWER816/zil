import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className,
  disabled
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-xl transition-all duration-300 inline-flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-primary text-dark-bg hover:bg-primaryLight hover:shadow-glow',
    secondary: 'bg-white/5 text-dark-muted border border-white/10 hover:border-primary/40 hover:text-primary backdrop-blur-md',
    ghost: 'bg-transparent text-dark-muted hover:text-primary hover:bg-primary/10',
    danger: 'bg-red-500/90 text-white hover:bg-red-600 border border-red-500/30'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      type="button"
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}