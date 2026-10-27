import React from 'react';
import Icon from '../ui/Icon';

const NavItem = ({ id, icon, label, isActive, onClick, isMySpace, badge }) => (
    <button
        id={id}
        onClick={(e) => {
            e.stopPropagation();
            onClick();
        }}
        className="relative group flex items-center justify-center w-12 h-12 rounded-xl transition-transform active:scale-90"
        aria-label={label}
    >
        <div className={`relative ${isMySpace ? 'myspace-trigger' : ''} p-2 rounded-xl transition-colors ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}>
            <Icon icon={icon} size={22} className={`${isActive ? 'text-white glow-white stroke-[2.2px]' : 'text-slate-400 group-hover:text-white stroke-[1.6px]'}`} />

            {/* Badge Logic */}
            {badge > 0 && (
                <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] bg-[#ef4444] rounded-full border border-[#020205] z-50 animate-pulse-subtle shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                    <span className="relative text-[9px] font-bold text-white px-1 leading-none">
                        {badge > 99 ? '99+' : badge}
                    </span>
                </div>
            )}
        </div>
    </button>
);

export default NavItem;
