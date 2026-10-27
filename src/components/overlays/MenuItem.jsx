import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Icon from '../ui/Icon';

const MenuItem = ({ icon, label, subLabel, hasAction = false, onClick, className = "" }) => {
            return (
                <button
                    onClick={() => { vibrate(5); onClick(); }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border border-transparent active:bg-white/5 transition-all duration-150 group text-left relative overflow-hidden touch-manipulation ${className}`}
                >
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="text-muted group-active:text-neon transition-colors">
                            <Icon icon={icon} size={22} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-300 text-base font-medium tracking-wide group-active:text-white transition-colors font-body">{label}</span>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-3">
                        {subLabel && <span className="text-muted text-xs font-medium hidden sm:block group-active:text-neon/70">{subLabel}</span>}
                        <div className="text-muted group-active:text-neon transition-colors">
                            <Icon icon="ChevronRight" size={18} />
                        </div>
                    </div>
                </button>
            );
        };;

export default MenuItem;
