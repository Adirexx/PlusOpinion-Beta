import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavItem from './NavItem';
import { useAuth } from '../../context/AuthContext';
import { useUnreadCount } from '../../context/UnreadContext';

// BottomNav — persistent tab bar
// Unread notification count is sourced from UnreadContext (single Supabase
// subscription for the whole app). Previously BottomNav had its own duplicate
// subscription — this caused desync between the badge here and the
// Notifications page.

const BottomNav = ({ activeTab, setActiveTab, isVisible = true, isGuest, onAuthRequired }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const unreadCount = useUnreadCount(); // ← single source of truth, no duplicate subscription
    const [scrollVisible, setScrollVisible] = useState(true);

    // Listen for scroll-hide events dispatched by Feed/Categories/etc.
    useEffect(() => {
        const handler = (e) => {
            if (e.detail !== undefined && e.detail.visible !== undefined) {
                setScrollVisible(e.detail.visible);
            }
        };
        window.addEventListener('nav:visibility', handler);
        return () => window.removeEventListener('nav:visibility', handler);
    }, []);

    // Reset visibility when tab changes (e.g. user taps a nav item)
    useEffect(() => {
        setScrollVisible(true);
    }, [activeTab]);

    const handleTabClick = (tabKey, targetPath, requiresAuth = false) => {
        if (requiresAuth && isGuest) {
            onAuthRequired?.();
            return;
        }
        if (activeTab === tabKey) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
            window.dispatchEvent(new CustomEvent('nav_tab_reclick', { detail: { tab: tabKey } }));
        } else {
            navigate(targetPath);
        }
    };

    // Visible if no overlay says to hide AND we haven't scrolled down
    const finalVisible = isVisible && scrollVisible;

    return (
        <div
            id="bottom-nav-bar"
            className={`nav-glass fixed bottom-0 left-0 w-full z-[50] transition-transform duration-400 ease-out ${finalVisible ? 'translate-y-0' : 'translate-y-full'}`}
        >
            <div className="w-full h-14 max-w-md mx-auto flex items-center justify-around px-2">
                <NavItem id="bottom-nav-home" icon="Home" label="Home" isActive={activeTab === 'home'} onClick={() => handleTabClick('home', '/feed')} />
                <NavItem id="bottom-nav-categories" icon="Grid" label="Categories" isActive={activeTab === 'categories'} onClick={() => handleTabClick('categories', '/categories')} />
                <NavItem id="bottom-nav-myspace" icon="MySpaceLogo" label="My Space" isActive={activeTab === 'myspace'} isMySpace={true} onClick={() => handleTabClick('myspace', '/myspace', true)} />
                <NavItem
                    id="bottom-nav-notifications"
                    icon="Bell"
                    label="Notifications"
                    isActive={activeTab === 'notifications'}
                    onClick={() => handleTabClick('notifications', '/notifications', true)}
                    badge={!isGuest ? unreadCount : 0}
                />
                <NavItem id="bottom-nav-profile" icon="User" label="Profile" isActive={activeTab === 'profile'} onClick={() => handleTabClick('profile', '/myprofile', true)} />
            </div>
        </div>
    );
};
export default BottomNav;
