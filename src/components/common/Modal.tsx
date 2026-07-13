import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Escape 关闭 + 锁定背景滚动
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 - 带模糊效果 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-dark-bg/70 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* 模态框 - 居中 + 柔和动画 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="bg-dark-surface border-hand border-primary/40 radius-hand-lg p-5 md:p-7 max-w-md w-full max-h-[85vh] overflow-y-auto pointer-events-auto shadow-hand relative"
            >
              {/* 手绘装饰：右上角小星星 */}
              <svg className="corner-doodle top-1 right-1 w-7 h-7" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M16 4 L17.5 8 L21.5 9 L17.5 10 L16 14 L14.5 10 L10.5 9 L14.5 8 Z" stroke="#FFC857" strokeWidth="1.4" strokeLinejoin="round" fill="rgba(255,200,87,0.15)" />
              </svg>

              {/* 标题栏 */}
              {title && (
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-2xl text-primary underline-hand">{title}</h2>
                  <button
                    onClick={onClose}
                    className="w-9 h-9 radius-hand-sm flex items-center justify-center text-dark-muted hover:text-primary hover:bg-primary/12 border-hand border-transparent hover:border-primary/30 transition-colors"
                  >
                    <X className="w-4 h-4" strokeWidth={2.2} />
                  </button>
                </div>
              )}

              {/* 内容 */}
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}