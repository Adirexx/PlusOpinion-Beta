import React, { useState, useEffect, useRef } from "react";
import Icon from "./Icon";
// --- MAIN APP ---
// --- TOAST COMPONENT ---
const Toast = ({
  message,
  icon,
  isSuccess,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-max max-w-[90vw]">
                    <div className="animate-slide-up">
                        <div className={`glass-panel border-white/20 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-2xl ${isSuccess ? 'bg-accent-green/10' : 'bg-white/5'}`}>
                            <div className={`p-2 rounded-xl ${isSuccess ? 'bg-accent-green/20' : 'bg-white/10'}`}>
                                <Icon icon={icon || (isSuccess ? 'Check' : 'AlertTriangle')} size={18} className={isSuccess ? 'text-accent-green' : 'text-white'} />
                            </div>
                            <p className="text-sm font-bold text-white pr-2 whitespace-nowrap">{message}</p>
                        </div>
                    </div>
                </div>;
};
export default Toast;