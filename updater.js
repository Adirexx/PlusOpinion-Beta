/**
 * UPDATER.JS - Professional Update & Maintenance System
 * Logic:
 * 1. Register Service Worker.
 * 2. Periodically check version.json.
 * 3. Handle Clean Redirects for Maintenance.
 * 4. Silent updates for minor patches.
 * 5. Prompted updates for major releases.
 */

(function () {
    const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
    const VERSION_FILE = '/version.json';
    let currentVersion = localStorage.getItem('plusopinion_v_id');
    console.log('📦 Initial Local Version:', currentVersion);
    let swRegistration = null;

    console.log('🚀 PlusOpinion Updater Initialized');

    // 1. REGISTER SERVICE WORKER
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => {
                    swRegistration = reg;
                    console.log('✅ SW Registered');
                })
                .catch(err => console.error('❌ SW Registration Failed', err));
        });
    }

    // 2. PERIODIC VERSION CHECK
    async function checkVersion() {
        try {
            const response = await fetch(`${VERSION_FILE}?t=${Date.now()}`, { cache: 'no-store' });
            if (!response.ok) return;

            const data = await response.json();
            console.log(`🔍 Version Check: Local=${currentVersion}, Remote=${data.version}, Major=${data.major}`);

            // Handle Maintenance Mode
            if (data.maintenance === true) {
                console.log('🚧 Maintenance mode active');
                if (!window.location.pathname.includes('maintenance.html')) {
                    window.location.href = 'maintenance.html';
                }
                return;
            }

            // Handle Version Change
            if (!currentVersion) {
                // First time visit - just record the version
                localStorage.setItem('plusopinion_v_id', data.version);
                currentVersion = data.version;
            } else if (currentVersion !== data.version) {
                if (data.major) {
                    showUpdateToast(data.version);
                } else {
                    // Internal/Silent Update
                    if (swRegistration) swRegistration.update();
                    console.log('🤫 Silent update triggered in background');
                    localStorage.setItem('plusopinion_v_id', data.version);
                    currentVersion = data.version;
                }
            }

            // Expose globally for other scripts to use
            window.PLUSOPINION_VERSION = data.version;
            syncVersionDisplays(data.version);
        } catch (err) {
            console.warn('⚠️ Update check failed', err);
        }
    }

    // Helper to sync all version labels on the page
    function syncVersionDisplays(version) {
        const elements = document.querySelectorAll('.app-version, #app-version');
        elements.forEach(el => {
            if (el.innerText !== version) {
                el.innerText = version;
            }
        });
    }

    function showUpdateToast(newVersion) {
        if (document.getElementById('po-updater-toast')) return;

        const toast = document.createElement('div');
        toast.id = 'po-updater-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 18px;
            padding: 10px 18px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 92%;
            max-width: 480px;
            gap: 12px;
            animation: slideInUp 0.6s cubic-bezier(0.19, 1, 0.22, 1);
            color: white;
            font-family: 'Inter', sans-serif;
        `;

        toast.innerHTML = `
            <div style="font-size: 13px; font-weight: 500; letter-spacing: -0.2px; opacity: 0.9;">
                A new version of PlusOpinion is available
            </div>
            <button id="po-update-btn" style="background: white; color: black; border: none; border-radius: 12px; padding: 8px 16px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                Update Now
            </button>
            <style>
                @keyframes slideInUp { 
                    from { transform: translate(-50%, 40px); opacity: 0; } 
                    to { transform: translate(-50%, 0); opacity: 1; } 
                }
                #po-update-btn:hover { background: #f1f5f9; transform: translateY(-1px); }
                #po-update-btn:active { transform: translateY(0); }
            </style>
        `;

        document.body.appendChild(toast);

        document.getElementById('po-update-btn').onclick = () => {
            // Update version ID before reload so toast doesn't reappear
            localStorage.setItem('plusopinion_v_id', newVersion);

            if (swRegistration && swRegistration.waiting) {
                swRegistration.waiting.postMessage({ action: 'skipWaiting' });
            }

            // Subtle fade before reload
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';

            setTimeout(() => {
                window.location.reload();
            }, 300);
        };
    }

    // Start checking
    checkVersion();
    setInterval(checkVersion, CHECK_INTERVAL);

})();
