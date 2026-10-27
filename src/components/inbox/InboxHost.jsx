import React, { useEffect, useRef } from 'react';

export default function InboxHost() {
    const containerRef = useRef(null);

    useEffect(() => {
        // According to Phase 0 audit and Phase 6 instructions,
        // this is a thin wrapper that mounts the legacy vanilla inbox.
        // It should avoid double-init of inbox_crypto.js.
        
        // This relies on the global functions defined in inbox.js and inbox_panel.js
        if (window.initInboxUI) {
            window.initInboxUI(containerRef.current);
        }

        return () => {
            if (window.destroyInboxUI) {
                window.destroyInboxUI();
            }
        };
    }, []);

    return <div id="inbox-host" ref={containerRef} className="w-full h-full" />;
}
