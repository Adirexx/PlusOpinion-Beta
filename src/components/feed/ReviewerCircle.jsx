import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';

const ReviewerCircle = ({ user, isEnd }) => {
            if (isEnd) return (
                <div className="flex-shrink-0 w-20 flex flex-col items-center justify-center gap-2 snap-start" onClick={() => vibrate(5)}>
                    <div className="w-14 h-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-neon hover:bg-white/10 transition-colors shadow-lg"><Icon icon="ArrowRight" size={20} /></div>
                    <span className="text-[10px] text-neon font-medium tracking-wide">Explore More</span>
                </div>
            );
            return (
                <div className="flex-shrink-0 w-16 flex flex-col items-center gap-2 snap-start" onClick={() => vibrate(5)}>
                    <div className="relative">
                        <Avatar
                            src={user.avatar}
                            className="w-14 h-14 rounded-full border border-white/10 object-cover shrink-0"
                            fallbackSize={24}
                        />
                        <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 shadow-lg">
                            <div className="rqs-pill px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white">{user.rqs}</div>
                        </div>
                    </div>
                    <span className="text-[10px] text-gray-300 font-medium truncate w-full text-center">{user.handle}</span>
                </div>
            );
        };;

export default ReviewerCircle;
