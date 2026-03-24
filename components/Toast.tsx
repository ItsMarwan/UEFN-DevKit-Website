'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps extends ToastMessage {
  onClose: (id: string) => void;
}

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Trigger mount animation
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  const typeStyles = {
    success: {
      bg: 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10',
      border: 'border-emerald-500/30',
      icon: '✓',
      iconColor: 'text-emerald-400',
      titleColor: 'text-emerald-300',
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500/10 to-rose-500/10',
      border: 'border-red-500/30',
      icon: '⚠',
      iconColor: 'text-red-400',
      titleColor: 'text-red-300',
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10',
      border: 'border-blue-500/30',
      icon: 'ℹ',
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-300',
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/30',
      icon: '!',
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-300',
    },
  };

  const style = typeStyles[type];

  return (
    <div
      className={`transform transition-all duration-300 ${
        !isMounted ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      } ${
        isExiting ? 'opacity-0 translate-x-full' : ''
      }`}
    >
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(24px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes toastSlideOut {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(24px) scale(0.95);
          }
        }
        .toast-enter {
          animation: toastSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .toast-exit {
          animation: toastSlideOut 0.3s cubic-bezier(0.36, 0, 0.66, -0.56) forwards;
        }
      `}</style>
      <div
        className={`${!isMounted ? '' : isExiting ? 'toast-exit' : 'toast-enter'}`}
      >
        <div
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm ${style.bg} ${style.border}`}
        >
          <div className={`flex-shrink-0 font-bold text-lg ${style.iconColor}`}>
            {style.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm ${style.titleColor}`}>{title}</h3>
            {message && <p className="text-white/60 text-xs mt-1 break-words">{message}</p>}
          </div>
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(() => onClose(id), 300);
            }}
            className="flex-shrink-0 text-white/40 hover:text-white/70 transition-colors"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastMessage[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
