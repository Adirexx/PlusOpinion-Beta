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
    // Using fixed positioning and high z-index
    // Tailwind classes matching the design system
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm bg-[#1A1C2E]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 transition-all duration-500 ease-out transform translate-y-20 opacity-0';

    toast.innerHTML = `
        <div class="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
             <img src="./icon-192.png" class="w-full h-full object-cover" alt="App Icon" onerror="this.onerror=null;this.parentNode.innerHTML='<svg class=\'w-6 h-6 text-neon\' fill=\'none\' stroke=\'currentColor\' viewBox=\'0 0 24 24\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z\'></path></svg>'"/>
        </div>
        <div class="flex-1 min-w-0">
            <h3 class="text-white font-heading font-bold text-sm tracking-wide">Install App</h3>
            <p class="text-white/60 text-xs truncate">Get the best experience</p>
        </div>
        <button id="pwa-install-btn" class="bg-neon text-white px-4 py-2 rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(47,139,255,0.3)] whitespace-nowrap hover:bg-neon/80 transition-colors">
            Install
        </button>
        <button id="pwa-dismiss-btn" class="p-2 text-white/40 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
    });

    // Handle Install Click
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            // Hide the custom toast
            toast.classList.add('translate-y-20', 'opacity-0');
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
            toast.classList.add('translate-y-20', 'opacity-0');
            setTimeout(() => toast.remove(), 500);
            // Save dismissal timestamp
            localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
        });
    }
}
