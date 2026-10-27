import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const SkeletonPost = ({ delay }) => (
            <div className="glass-panel rounded-2xl p-4 mb-4 animate-fade-in" style={{ animationDelay: delay }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full skeleton-bg"></div>
                    <div className="flex-1">
                        <div className="w-24 h-3 rounded skeleton-bg mb-2"></div>
                        <div className="w-16 h-2 rounded skeleton-bg"></div>
                    </div>
                </div>
                <div className="w-full h-3 rounded skeleton-bg mb-2"></div>
                <div className="w-3/4 h-3 rounded skeleton-bg mb-4"></div>
                <div className="w-full h-48 rounded-xl skeleton-bg"></div>
            </div>
        );

export default SkeletonPost;
