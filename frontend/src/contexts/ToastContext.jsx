import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import { useTheme } from './ThemeContext';

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: { icon: Check, bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', iconColor: 'text-emerald-400' },
  error: { icon: AlertCircle, bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', iconColor: 'text-red-400' },
  info: { icon: Info, bg: 'bg-indigo-500/10 border-indigo-500/30', text: 'text-indigo-400', iconColor: 'text-indigo-400' },
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.addToast;
}

function ToastContainer({ toasts, removeToast }) {
  const { dark } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
          const Icon = style.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg ${style.bg} ${dark ? 'bg-slate-800/90' : 'bg-white/90'}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${style.iconColor}`} />
              <span className={`text-sm font-medium flex-1 ${dark ? 'text-slate-200' : 'text-slate-700'}`}>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className={`p-1 rounded-lg hover:bg-slate-700/50 transition-colors ${dark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
