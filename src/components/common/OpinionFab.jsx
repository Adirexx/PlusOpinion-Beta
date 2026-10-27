import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useActions } from '../../context/ActionsContext';
import { useAuth } from '../../context/AuthContext';
import Icon from '../ui/Icon';

const vibrate = (ms) => {
    if (navigator.vibrate) navigator.vibrate(ms);
};

export default function OpinionFab() {
    const { isOpinionOpen, openOpinion, closeOpinion, isOtherOverlayOpen, openAuth } = useActions();
    const { isGuest } = useAuth();
    const location = useLocation();

    const [scrollVisible, setScrollVisible] = useState(true);

    useEffect(() => {
        const handler = (e) => {
            if (e.detail?.visible !== undefined) {
                setScrollVisible(e.detail.visible);
            }
        };
        window.addEventListener('nav:visibility', handler);
        return () => window.removeEventListener('nav:visibility', handler);
    }, []);

    // If ANY other modal or overlay is open (menu, inbox, auth, share, etc.), hide FAB completely
    if (isOtherOverlayOpen) return null;

    // Pages where idle FAB is displayed
    const isFabRoute = ['/', '/feed', '/bookmarks'].includes(location.pathname);

    // If modal is open, it MUST always be visible as the "X" button across any page
    // If modal is closed, only visible on fab routes
    const shouldRender = isOpinionOpen || isFabRoute;
    if (!shouldRender) return null;

    const isVisible = isOpinionOpen || scrollVisible;

    const handleClick = (e) => {
        e.stopPropagation();
        vibrate(10);
        if (isOpinionOpen) {
            closeOpinion();
        } else {
            if (isGuest) {
                openAuth();
            } else {
                openOpinion();
            }
        }
    };

    return ReactDOM.createPortal(
        <button
            id="opinion-fab-pill"
            type="button"
            onClick={handleClick}
            className={`
                fixed right-5 rounded-full flex items-center justify-center
                opinion-btn
                ${isOpinionOpen
                    ? 'is-active z-[100000] w-12 h-12 p-0 bg-white text-black scale-100 pointer-events-auto shadow-[0_0_25px_rgba(255,255,255,0.4)]'
                    : 'z-[60] h-12 pl-4 pr-5 w-auto bg-neon text-white shadow-lg shadow-neon/20 ' +
                      (isVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-16 opacity-0 pointer-events-none')
                }
            `}
            style={{
                bottom: isOpinionOpen ? '24px' : 'calc(var(--bottom-nav-total) + 12px)',
            }}
            title={isOpinionOpen ? "Close Opinion Composer" : "Create Opinion"}
        >
            <div className="opinion-icon">
                <Icon icon="Plus" size={20} className="stroke-[3px]" />
            </div>
            <span className="font-heading font-bold text-sm tracking-wide ml-2 opinion-text">
                OPINION
            </span>
        </button>,
        document.body
    );
}
