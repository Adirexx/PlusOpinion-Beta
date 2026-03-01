/* pwa_installer.js - Handles PWA installation prompt */

let deferredPrompt;

// Only run in browser environment
if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;

        // Check if user has dismissed it recently (e.g., in the last 24 hours)
        const lastDismissed = localStorage.getItem('pwa_prompt_dismissed');
        if (lastDismissed) {
            const timeSince = Date.now() - parseInt(lastDismissed);
            // 24 hours = 86400000 ms
            if (timeSince < 86400000) {
                console.log('PWA prompt dismissed recently.');
                return;
            }
        }

        // Show the custom install prompt with a slight delay
        setTimeout(showInstallPromotion, 3000);
    });

    window.addEventListener('appinstalled', () => {
        // Hide the app-provided install promotion
        const toast = document.getElementById('pwa-install-toast');
        if (toast) toast.remove();
        // Clear the deferredPrompt
        deferredPrompt = null;
        console.log('PWA was installed');
    });
}

function showInstallPromotion() {
    // Check if valid page to show (optional extra check, though script inclusion controls this)
    if (document.getElementById('pwa-install-toast')) return;

    // Create the toast element
    const toast = document.createElement('div');
    toast.id = 'pwa-install-toast';

    // FIX: Use inline styles instead of Tailwind classes (Tailwind may not be loaded on all pages)
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '75px',
        left: '50%',
        transform: 'translateX(-50%) translateY(80px)',
        zIndex: '9999',
        width: '90%',
        maxWidth: '384px',
        background: 'rgba(26, 28, 46, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
        opacity: '0',
        fontFamily: "'Inter', -apple-system, sans-serif",
    });

    toast.innerHTML = `
        <div style="width:48px;height:48px;background:rgba(47,139,255,0.1);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:1px solid rgba(255,255,255,0.05);">
             <img src="./icon-192.png" style="width:100%;height:100%;object-fit:cover;" alt="App Icon" onerror="this.onerror=null;this.parentNode.innerHTML='<svg style=\\'width:24px;height:24px;color:#2F8BFF\\' fill=\\'none\\' stroke=\\'%232F8BFF\\' viewBox=\\'0 0 24 24\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z\\'></path></svg>'"/>
        </div>
        <div style="flex:1;min-width:0;">
            <h3 style="color:#fff;font-weight:700;font-size:14px;margin:0 0 2px 0;letter-spacing:-0.2px;">Install App</h3>
            <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Get the best experience</p>
        </div>
        <button id="pwa-install-btn" style="background:linear-gradient(135deg,#2F8BFF,#1972de);color:#fff;border:none;padding:8px 16px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;box-shadow:0 0 15px rgba(47,139,255,0.3);flex-shrink:0;">
            Install
        </button>
        <button id="pwa-dismiss-btn" style="background:none;border:none;color:rgba(255,255,255,0.4);cursor:pointer;padding:8px;display:flex;align-items:center;border-radius:8px;flex-shrink:0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });
    });

    // Handle Install Click
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            // Hide the custom toast
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(80px)';
            setTimeout(() => toast.remove(), 500);

            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
            }
        });
    }

    // Handle Dismiss Click
    const dismissBtn = document.getElementById('pwa-dismiss-btn');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(80px)';
            setTimeout(() => toast.remove(), 500);
            // Save dismissal timestamp
            localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
        });
    }
}
