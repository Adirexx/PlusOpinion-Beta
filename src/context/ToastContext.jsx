/**
 * ToastContext.jsx — Toast notification system
 *
 * Replaces the window 'toast' CustomEvent from the old app.
 * legacyGlobals.js adds a window listener that calls showToast() so
 * not-yet-ported code dispatching the old event still works.
 */

import { createContext, useCallback, useContext, useState, useEffect } from 'react'
import Icon from '../components/ui/Icon'

const ToastContext = createContext(null)

let _toastCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback(({ message, icon = 'Bell', isSuccess = false, action = null, duration = 4000 }) => {
    const id = ++_toastCounter
    setToasts(prev => [...prev, { id, message, icon, isSuccess, action }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Global event listener for legacy CustomEvent('toast')
  useEffect(() => {
    const handler = (e) => {
      if (e.detail) {
        showToast({
          message: e.detail.message,
          icon: e.detail.icon,
          isSuccess: e.detail.isSuccess,
          action: e.detail.action,
          duration: e.detail.duration || 4000
        });
      }
    };
    window.addEventListener('toast', handler);
    return () => window.removeEventListener('toast', handler);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, toasts, hideToast }}>
      {children}
      <div
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className="bg-slate-800/95 backdrop-blur border border-white/10 px-5 py-3 rounded-full text-xs font-bold text-white shadow-xl tracking-wide flex items-center gap-4 pointer-events-auto transition-all animate-in fade-in slide-in-from-top-4 duration-300"
          >
            <div className="flex items-center gap-2">
              {t.icon && <Icon icon={t.icon} size={16} className={t.isSuccess ? 'text-[#6BFFB6]' : 'text-neon'} />}
              <span>{t.message}</span>
            </div>
            {t.action && (
              <>
                <div className="w-[1px] h-4 bg-white/20" />
                <button 
                  onClick={(e) => { e.stopPropagation(); if(window.vibrate) window.vibrate(10); t.action.onClick(); }}
                  className="text-neon hover:text-white transition-colors uppercase"
                >
                  {t.action.label}
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
