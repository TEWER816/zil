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
  const baseStyles = 'font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 border-hand';

  const variants = {
    primary: 'bg-primaryLight text-[#1f2a30] border-primary/70 radius-hand hover:bg-primary hover:-translate-x-px hover:-translate-y-px shadow-hand-sm hover:shadow-hand',
    secondary: 'bg-dark-bg/85 text-dark-muted border-primary/35 radius-hand hover:border-primary/60 hover:text-primary hover:-translate-x-px hover:-translate-y-px shadow-hand-sm',
    ghost: 'bg-transparent text-dark-muted hover:text-primary hover:bg-primary/10 radius-hand-sm',
    danger: 'bg-red-500/90 text-white border-red-500/40 radius-hand hover:bg-red-600 hover:-translate-x-px hover:-translate-y-px shadow-hand-sm'
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