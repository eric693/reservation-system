'use client';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType; }

const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let nextId = 0;

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const colors = { success: '#10B981', error: '#EF4444', info: '#3B82F6' };

  const ToastIcon = ({ type }: { type: ToastType }) => {
    if (type === 'success') return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
    if (type === 'error') return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg pointer-events-auto animate-in slide-in-from-right-4"
            style={{ background: colors[t.type], minWidth: '200px', maxWidth: '320px' }}>
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <ToastIcon type={t.type} />
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
