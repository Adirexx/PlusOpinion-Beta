/**
 * PLUSOPINION INBOX — Main Inbox Panel
 * =====================================
 * Full inbox system: gesture toggle, conversations list, chat view,
 * message requests, floating search, real-time messaging, E2EE.
 * Vanilla JS — no framework dependency.
 */
(function () {
    'use strict';

    // ─── STATE ───────────────────────────────────────────────────────
    const S = {
        isOpen: false,
        view: 'list',          // 'list' | 'chat' | 'search'
        currentConv: null,     // { id, otherId, otherName, otherAvatar, otherUsername }
        currentUser: null,
        conversations: [],
        requests: [],
        messages: [],
        realtimeChannel: null,
        searchDebounce: null,
        gestureStartY: 0,
        gestureStartX: 0,
        isGesturePullingUp: false,
        isGesturePullingDown: false,
        inboxScrollTop: 0,
    };

    // ─── CSS ─────────────────────────────────────────────────────────
    function injectCSS() {
        const style = document.createElement('style');
        style.id = 'inbox-styles';
        style.textContent = `
/* ── PANEL ── */
#inbox-panel {
    position:fixed; inset:0; z-index:5000;
    background:var(--bg-deep, #020205);
    transform:translateY(100%);
    transition:transform 0.45s cubic-bezier(0.32,0.72,0,1);
    display:flex; flex-direction:column;
    max-width:450px; left:50%; margin-left:-225px;
    will-change:transform; overscroll-behavior:none;
    overflow:hidden;
    border-left:1px solid var(--border-glass, rgba(255,255,255,0.08));
    border-right:1px solid var(--border-glass, rgba(255,255,255,0.08));
}
@media(max-width:450px){#inbox-panel{left:0;margin-left:0;max-width:100%;border:none;}}
#inbox-panel.open{transform:translateY(0);}
#inbox-panel.no-transition{transition:none!important;}

/* ── DRAG HANDLE ── */
.inbox-handle-bar {
    flex-shrink:0; display:flex; flex-direction:column;
    align-items:center; padding:0 20px; cursor:grab;
    touch-action:none; user-select:none;
    border-bottom:1px solid rgba(255,255,255,0.06);
    background: #020205;
    z-index: 10;
    height: 60px; justify-content: center;
}
.inbox-handle-pill {
    width:36px; height:4px; border-radius:2px;
    background:rgba(255,255,255,0.2); margin-top: 4px; margin-bottom: 2px;
}
.inbox-handle-title {
    width:100%; display:flex; align-items:center; justify-content:space-between;
}
.inbox-handle-title h2 {
    font-family:'Space Grotesk',system-ui,sans-serif;
    font-weight:700; font-size:24px; color:#fff; margin:0;
}
.inbox-handle-close {
    width:36px; height:36px; border-radius:50%; border:none;
    background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.6);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; font-size:22px; transition:all 0.2s;
    transform: rotate(-90deg);
}
.inbox-handle-close:active{background:rgba(255,255,255,0.12);}

/* ── SCROLL BODY ── */
.inbox-body {
    flex:1; overflow-y:auto; overflow-x:hidden;
    -webkit-overflow-scrolling:touch;
    overscroll-behavior-y:contain;
    scrollbar-width:none;
}
.inbox-body::-webkit-scrollbar{display:none;}

/* ── REQUESTS SECTION ── */
.inbox-requests-btn {
    margin:12px 16px; padding:14px 18px; border-radius:14px;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    display:flex; align-items:center; justify-content:space-between;
    cursor:pointer; transition:background 0.2s;
}
.inbox-requests-btn:active{background:rgba(255,255,255,0.08);}
.inbox-req-label {
    display:flex; align-items:center; gap:10px;
    font-size:14px; font-weight:600; color:#fff;
}
.inbox-req-badge {
    background:#2f8bff; color:#fff; font-size:11px; font-weight:700;
    width:20px; height:20px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    min-width:20px;
}
.inbox-req-arrow { color:rgba(255,255,255,0.4); font-size:16px; }

/* ── CONVERSATION ROW ── */
.inbox-conv-list { padding:0 0 120px; }
.inbox-conv-row {
    display:flex; align-items:center; gap:16px;
    padding:14px 20px; cursor:pointer; transition:all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    border-bottom:1px solid rgba(255,255,255,0.03);
}
.inbox-conv-row:hover{background:rgba(255,255,255,0.02);}
.inbox-conv-row:active{background:rgba(255,255,255,0.05); transform:scale(0.98);}
.inbox-conv-avatar {
    width:56px; height:56px; border-radius:50%; object-fit:cover;
    flex-shrink:0; border:2px solid rgba(255,255,255,0.05);
    background:#0d1220; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}
.inbox-conv-info { flex:1; min-width:0; }
.inbox-conv-name-wrapper { display:flex; align-items:center; gap:8px; }
.inbox-conv-name {
    font-size:16px; font-weight:600; color:#fff;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    transition:all 0.2s;
}
.inbox-conv-preview {
    font-size:13.5px; color:rgba(255,255,255,0.5);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:4px;
    transition:all 0.2s;
}
.inbox-conv-row.unread { background:transparent; }
.inbox-conv-row.unread .inbox-conv-name {
    font-weight:700; color:#fff;
}
.inbox-conv-row.unread .inbox-conv-preview {
    color:#fff; font-weight:600;
}
.inbox-conv-row.unread .inbox-conv-time {
    color:#2f8bff; font-weight:700;
}
.inbox-conv-meta {
    display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0;
}
.inbox-conv-time { font-size:12px; color:rgba(255,255,255,0.4); transition:all 0.2s; }
.inbox-unread-badge {
    min-width: 18px; height: 18px; border-radius: 50%;
    background: #2f8bff; box-shadow: 0 0 10px rgba(47,139,255,0.6);
    color: #fff; font-size: 10.5px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    margin-left: 6px; flex-shrink: 0;
    padding: 0 4px;
}

/* ── EMPTY STATE ── */
.inbox-empty {
    display:flex; flex-direction:column; align-items:center;
    justify-content:center; padding:60px 32px; text-align:center; gap:12px;
}
.inbox-empty-icon { font-size:48px; opacity:0.3; }
.inbox-empty-title { font-size:16px; font-weight:600; color:rgba(255,255,255,0.6); }
.inbox-empty-sub { font-size:13px; color:rgba(255,255,255,0.35); line-height:1.5; }

/* ── CHAT VIEW ── */
#inbox-chat {
    position:absolute; inset:0; background:rgba(2,2,5,0.97);
    display:flex; flex-direction:column;
    transform:translateX(100%);
    transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);
    z-index:10;
}
#inbox-chat.open{transform:translateX(0);}

.chat-header {
    flex-shrink:0; display:flex; align-items:center; gap:12px;
    padding:0 20px; border-bottom:1px solid rgba(255,255,255,0.06);
    background: #020205;
    height: 60px;
}
.chat-back-btn {
    width:36px; height:36px; border-radius:50%; background:transparent; border:none;
    color:rgba(255,255,255,0.7); display:flex; align-items:center; justify-content:center;
    cursor:pointer; flex-shrink:0; font-size:20px;
}
.chat-back-btn:active{background:rgba(255,255,255,0.08);}
.chat-header-avatar {
    width:38px; height:38px; border-radius:50%; object-fit:cover;
    border:1.5px solid rgba(255,255,255,0.12); background:#0d1220; flex-shrink:0;
}
.chat-header-info { flex:1; min-width:0; }
.chat-header-name {
    font-size:14px; font-weight:700; color:#fff;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.chat-header-username { font-size:11px; color:rgba(255,255,255,0.4); }
/* .chat-e2ee-badge removed */

/* ── E2EE NOTICE BANNER ── */
.e2ee-banner {
    margin: 24px 16px 40px; padding: 0; border-radius: 0;
    background: transparent; border: none;
    display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center;
}
.e2ee-banner-row {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: 10px; color: rgba(74, 222, 128, 0.5); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;
}
.e2ee-banner-sub {
    font-size: 10px; color: rgba(255,255,255,0.25); line-height: 1.4; max-width: 80%;
}
.e2ee-key-warning {
    display: flex; align-items: flex-start; justify-content: center; gap: 6px; margin-top: 4px;
    padding-top: 0; border-top: none; font-weight: 400;
    font-size: 10px; color: rgba(250, 204, 21, 0.5); line-height: 1.4; max-width: 80%;
}

/* ── MESSAGES LIST ── */
.chat-messages {
    flex:1; overflow-y:auto; padding:16px 16px 8px;
    display:flex; flex-direction:column; gap:6px;
    overscroll-behavior-y:contain; scrollbar-width:none;
}
.chat-messages::-webkit-scrollbar{display:none;}

.chat-msg {
    max-width: 78%; padding: 8px 14px; border-radius: 20px;
    font-size: 14.5px; line-height: 1.4; word-break: break-word;
    animation: msgPop 0.2s ease; position: relative;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    transition: transform 0.2s cubic-bezier(0.1, 0.9, 0.2, 1);
    transform: translateX(0);
}
@keyframes msgPop{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}
.chat-reply-icon {
    position: absolute; top: 50%; width: 28px; height: 28px;
    border-radius: 50%; background: rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    color: #fff; opacity: 0; transform: translateY(-50%) scale(0.5);
    transition: all 0.2s cubic-bezier(0.1, 0.9, 0.2, 1); pointer-events: none;
}
.chat-msg.mine .chat-reply-icon { right: calc(100% + 12px); }
.chat-msg.theirs .chat-reply-icon { left: calc(100% + 12px); }
.chat-msg.reply-active .chat-reply-icon { opacity: 1; transform: translateY(-50%) scale(1); background: rgba(255,255,255,0.2); }

.chat-reply-banner {
    display: flex; align-items: center; gap: 8px; padding: 10px 14px;
    background: rgba(47, 139, 255, 0.08); border-top: 1px solid rgba(255,255,255,0.06);
    border-left: 3px solid #2f8bff; position: relative;
}
.chat-reply-banner-content { flex: 1; min-width: 0; }
.chat-reply-banner-name { font-size: 11px; font-weight: 800; color: #2f8bff; margin-bottom: 2px; }
.chat-reply-banner-text { font-size: 12px; color: rgba(255,255,255,0.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
.chat-reply-close {
    width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.1);
    border: none; color: #fff; display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0; padding: 0;
}
.chat-reply-close:active { background: rgba(255,255,255,0.2); }
.chat-msg.mine {
    align-self: flex-end; 
    background: linear-gradient(135deg, #007AFF 0%, #0056b3 100%);
    color: #fff; border-bottom-right-radius: 4px;
}
.chat-msg.theirs {
    align-self: flex-start; 
    background: rgba(255,255,255,0.09); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    color: #fff; border-bottom-left-radius: 4px; border: 1px solid rgba(255,255,255,0.05);
}
.chat-msg.direct-img,
.chat-msg.shared-post-only {
    padding: 0 !important;
    background: none !important;
    border: none !important;
    box-shadow: none !important;
}
.chat-msg.shared-post-only {
    max-width: 90%;
}
.chat-msg.direct-img .chat-msg-time,
.chat-msg.shared-post-only .chat-msg-time {
    position: absolute;
    bottom: 8px;
    right: 12px;
    color: #fff;
    text-shadow: 0 1px 4px rgba(0,0,0,0.8);
    background: rgba(0,0,0,0.3);
    padding: 2px 6px;
    border-radius: 10px;
    z-index: 10;
}
.chat-msg.direct-img img {
    border-radius: 12px !important;
    width: 240px;
    max-width: 100%;
    display: block;
    cursor: pointer;
}
.shared-post-container {
    width: 100%; border-radius: 12px; overflow: hidden;
    background: none !important; border: none !important;
}
.chat-msg.shared-post-only .shared-post-container {
    margin-bottom: 0 !important;
    border: none !important;
    border-radius: 12px !important;
}
.chat-msg-time {
    font-size:10px; opacity:0.5; margin-top:3px; text-align:right;
}
.chat-day-divider {
    text-align:center; font-size:11px; color:rgba(255,255,255,0.3);
    margin:8px 0; padding:0 16px;
}

/* ── CHAT INPUT ── */
.chat-input-bar {
    flex-shrink:0; display:flex; align-items:flex-end; gap:8px;
    padding:10px 12px 14px; border-top:1px solid rgba(255,255,255,0.06);
    background:rgba(3,4,18,0.95); backdrop-filter:blur(16px);
}
.chat-attach-btn {
    width:40px; height:40px; border-radius:50%; border:none;
    background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.6);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; flex-shrink:0; font-size:18px; transition:background 0.2s;
}
.chat-attach-btn:active{background:rgba(255,255,255,0.12);}
.chat-text-input {
    flex:1; min-height:40px; max-height:120px; overflow-y:auto;
    background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1);
    border-radius:20px; padding:10px 14px; color:#fff; font-size:14px;
    font-family:'Inter',system-ui,sans-serif; resize:none; outline:none;
    line-height:1.4; scrollbar-width:none;
}
.chat-text-input::-webkit-scrollbar{display:none;}
.chat-text-input::placeholder{color:rgba(255,255,255,0.3);}
.chat-send-btn {
    width:40px; height:40px; border-radius:50%; border:none;
    background:#2f8bff; color:#fff; display:flex; align-items:center;
    justify-content:center; cursor:pointer; flex-shrink:0;
    font-size:16px; transition:all 0.2s; box-shadow:0 0 16px rgba(47,139,255,0.35);
}
.chat-send-btn:active{transform:scale(0.9);}
.chat-send-btn:disabled{background:rgba(255,255,255,0.1);box-shadow:none;cursor:default;}
.chat-image-preview-bar {
    display:flex; gap:8px; padding:8px 12px;
    border-top:1px solid rgba(255,255,255,0.06); overflow-x:auto;
    background:rgba(3,4,18,0.95); scrollbar-width:none;
}
.chat-image-preview-bar::-webkit-scrollbar{display:none;}
.chat-img-thumb {
    position:relative; flex-shrink:0;
}
.chat-img-thumb img {
    width:64px; height:64px; object-fit:cover; border-radius:10px;
    border:1.5px solid rgba(255,255,255,0.12);
}
.chat-img-thumb-remove {
    position:absolute; top:-6px; right:-6px; width:18px; height:18px;
    border-radius:50%; background:#ff4444; color:#fff; border:none;
    font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center;
}

/* ── VIDEO NOT SUPPORTED NOTICE ── */
.video-not-supported {
    margin:0 16px; padding:12px 14px; border-radius:12px;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
    font-size:12px; color:rgba(255,255,255,0.45); text-align:center; line-height:1.5;
}

/* ── FLOATING SEARCH ── */
#inbox-search-fab {
    position:absolute; bottom:28px; right:20px;
    width:56px; height:56px; border-radius:50%; border:none;
    background:rgba(255,255,255,0.08); border:1.5px solid rgba(255,255,255,0.15);
    color:#fff; display:flex; align-items:center; justify-content:center;
    cursor:pointer; font-size:20px; z-index:5;
    box-shadow:0 8px 32px rgba(0,0,0,0.4);
    backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
    transition:all 0.2s;
}
#inbox-search-fab svg {
    width: 24px; height: 24px;
    stroke-width: 2.5;
    filter: drop-shadow(0 0 6px rgba(255,255,255,0.6));
}
#inbox-search-fab:active{transform:scale(0.92);background:rgba(255,255,255,0.15);}

/* ── SEARCH OVERLAY ── */
#inbox-search-overlay {
    position:absolute; inset:0; z-index:20;
    background:rgba(2,2,5,0.97); backdrop-filter:blur(20px);
    display:flex; flex-direction:column;
    transform:translateY(100%);
    transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);
}
#inbox-search-overlay.open{transform:translateY(0);}

.search-overlay-header {
    flex-shrink:0; display:flex; align-items:center; gap:10px;
    padding:14px 16px; border-bottom:1px solid rgba(255,255,255,0.06);
}
.search-input-wrapper {
    flex:1; display:flex; align-items:center; gap:10px;
    background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1);
    border-radius:14px; padding:10px 14px;
}
.search-input-wrapper svg { flex-shrink:0; opacity:0.5; }
.search-main-input {
    flex:1; background:none; border:none; outline:none;
    color:#fff; font-size:15px; font-family:'Inter',system-ui,sans-serif;
}
.search-main-input::placeholder{color:rgba(255,255,255,0.3);}
.search-cancel-btn {
    background:none; border:none; color:#2f8bff;
    font-size:14px; font-weight:600; cursor:pointer; flex-shrink:0; padding:4px;
}
.search-results { flex:1; overflow-y:auto; scrollbar-width:none; }
.search-results::-webkit-scrollbar{display:none;}
.search-section-label {
    padding:12px 16px 6px; font-size:11px; font-weight:700;
    color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.1em;
}
.search-user-row {
    display:flex; align-items:center; gap:12px; padding:12px 16px;
    cursor:pointer; transition:background 0.15s; border-bottom:1px solid rgba(255,255,255,0.03);
}
.search-user-row:active{background:rgba(255,255,255,0.04);}
.search-user-avatar {
    width:42px; height:42px; border-radius:50%; object-fit:cover;
    background:#0d1220; border:1.5px solid rgba(255,255,255,0.08); flex-shrink:0;
}
.search-user-info .search-user-name {
    font-size:14px; font-weight:600; color:#fff;
}
.search-user-info .search-user-handle {
    font-size:12px; color:rgba(255,255,255,0.4);
}
.search-no-results {
    padding:48px 32px; text-align:center;
    font-size:14px; color:rgba(255,255,255,0.3);
}

/* ── REQUESTS VIEW ── */
#inbox-requests-view {
    position:absolute; inset:0; background:rgba(2,2,5,0.98);
    display:flex; flex-direction:column; z-index:10;
    transform:translateX(100%);
    transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);
}
#inbox-requests-view.open{transform:translateX(0);}

.req-view-header {
    display:flex; align-items:center; gap:12px;
    padding:0 20px; border-bottom:1px solid rgba(255,255,255,0.06);
    background:rgba(3,4,18,0.95); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
    height: 60px;
}
.req-view-title {
    font-family:'Space Grotesk',system-ui,sans-serif;
    font-size:18px; font-weight:700; color:#fff;
}
.req-card {
    display:flex; align-items:flex-start; gap:12px; padding:16px;
    border-bottom:1px solid rgba(255,255,255,0.06); cursor:pointer;
}
.req-card:active{background:rgba(255,255,255,0.03);}
.req-card-avatar {
    width:46px; height:46px; border-radius:50%; object-fit:cover;
    background:#0d1220; border:1.5px solid rgba(255,255,255,0.08); flex-shrink:0;
}
.req-card-body { flex:1; min-width:0; }
.req-card-name { font-size:14px; font-weight:600; color:#fff; }
.req-card-preview {
    font-size:12px; color:rgba(255,255,255,0.5); margin-top:2px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.req-card-actions { display:flex; gap:8px; margin-top:10px; }
.req-btn {
    flex:1; padding:8px 0; border-radius:20px; border:none;
    font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s;
}
.req-btn.accept { background:#2f8bff; color:#fff; }
.req-btn.accept:active{background:#1a70e0;}
.req-btn.decline { background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.6); }
.req-btn.decline:active{background:rgba(255,255,255,0.14);}

/* ── INLINE LOADER ── */
.inbox-loader {
    display:flex; justify-content:center; align-items:center; padding:32px;
}
.inbox-spinner {
    width:28px; height:28px; border-radius:50%;
    border:2.5px solid rgba(255,255,255,0.1); border-top-color:#2f8bff;
    animation:spin 0.7s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg);}}

/* ── PERMANENT E2EE BAR ── */
.chat-e2ee-bar {
    flex-shrink:0; display:flex; align-items:center; justify-content:center; gap:6px;
    padding:5px 16px; background:rgba(74,222,128,0.05);
    border-bottom:1px solid rgba(74,222,128,0.12);
    font-size:10px; font-weight:600; color:rgba(74,222,128,0.7);
    letter-spacing:0.04em; text-transform:uppercase; user-select:none;
}
.chat-e2ee-bar svg { flex-shrink:0; }
.chat-e2ee-bar-dot {
    width:5px; height:5px; border-radius:50%; background:#4ade80;
    animation:e2eePulse 2.5s ease-in-out infinite;
}
@keyframes e2eePulse{
    0%,100%{opacity:1;} 50%{opacity:0.3;}
}

/* ── CHAT MORE BUTTON ── */
.chat-more-btn {
    width:36px; height:36px; border-radius:50%; border:none;
    background:transparent; color:rgba(255,255,255,0.7);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; flex-shrink:0; font-size:20px; transition:all 0.2s;
    letter-spacing:1px;
}
.chat-more-btn:active{background:rgba(255,255,255,0.08);}

/* ── BOTTOM SHEET (shared base) ── */
.inbox-bottom-sheet {
    position:fixed; inset:0; z-index:9000;
    display:flex; flex-direction:column; justify-content:flex-end;
    pointer-events:none; opacity:0; transition:opacity 0.25s;
    max-width: 450px; left: 0; right: 0; margin: 0 auto; width: 100%;
}
.inbox-bottom-sheet.open { pointer-events:all; opacity:1; }
.inbox-bottom-sheet-overlay {
    position:absolute; inset:0;
    background:rgba(0,0,0,0.55); backdrop-filter:blur(4px);
}
.inbox-bottom-sheet-body {
    position:relative; background:#0d1220; border-radius:20px 20px 0 0;
    padding:0 0 28px; max-height:75vh; overflow-y:auto;
    transform:translateY(100%); transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);
    border-top:1px solid rgba(255,255,255,0.08);
}
.inbox-bottom-sheet.open .inbox-bottom-sheet-body { transform:translateY(0); }
.inbox-sheet-pill {
    width:36px; height:4px; border-radius:2px;
    background:rgba(255,255,255,0.15); margin:10px auto 0;
}
.inbox-sheet-title {
    font-size:13px; font-weight:600; color:rgba(255,255,255,0.45);
    text-align:center; padding:10px 0 14px; letter-spacing:0.02em;
}
.inbox-sheet-item {
    display:flex; align-items:center; gap:14px;
    padding:15px 24px; cursor:pointer; transition:background 0.15s;
    font-size:15px; color:#fff; font-weight:500;
}
.inbox-sheet-item:active{background:rgba(255,255,255,0.05);}
.inbox-sheet-item svg { opacity:0.7; flex-shrink:0; }
.inbox-sheet-item.danger { color:#ff4f4f; }
.inbox-sheet-item.danger svg { opacity:0.8; }
.inbox-sheet-sep {
    height:1px; background:rgba(255,255,255,0.06); margin:4px 0;
}

/* ── EMOJI REACTION PICKER ── */
.msg-reaction-picker {
    position:absolute; z-index:200;
    background:#141928; border:1px solid rgba(255,255,255,0.12);
    border-radius:32px; padding:6px 10px;
    display:flex; gap:4px; align-items:center;
    box-shadow:0 8px 32px rgba(0,0,0,0.6);
    animation:reactionPop 0.2s cubic-bezier(0.34,1.56,0.64,1);
    pointer-events:all;
}
@keyframes reactionPop{from{opacity:0;transform:scale(0.6);}to{opacity:1;transform:scale(1);}}
.msg-reaction-emoji {
    width:36px; height:36px; display:flex; align-items:center; justify-content:center;
    font-size:20px; border-radius:50%; cursor:pointer; transition:transform 0.15s;
    user-select:none;
}
.msg-reaction-emoji:hover{transform:scale(1.3);}
.msg-reaction-emoji:active{transform:scale(1.1);}

/* ── REACTION CHIPS BELOW BUBBLE ── */
.chat-msg-reactions {
    display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;
}
.chat-reaction-chip {
    display:inline-flex; align-items:center; gap:3px;
    background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1);
    border-radius:20px; padding:2px 8px; font-size:12px; cursor:pointer;
    transition:all 0.15s; user-select:none;
}
.chat-reaction-chip.mine { border-color:rgba(47,139,255,0.4); background:rgba(47,139,255,0.12); }
.chat-reaction-chip:active{transform:scale(0.92);}
.chip-count { font-size:11px; color:rgba(255,255,255,0.6); font-weight:600; }

/* ── BOOKMARK ICON ON MESSAGE ── */
.msg-bookmark-icon {
    position:absolute; top:-6px; right:-6px;
    width:20px; height:20px; border-radius:50%;
    background:#facc15; display:flex; align-items:center; justify-content:center;
    box-shadow:0 2px 8px rgba(250,204,21,0.4); pointer-events:none;
    animation:bookmarkPop 0.25s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes bookmarkPop{from{opacity:0;transform:scale(0);}to{opacity:1;transform:scale(1);}}
.chat-msg { position:relative !important; }

/* ── LONG PRESS VISUAL INDICATOR ── */
.chat-msg.long-pressing {
    transform:scale(0.97) !important;
    transition:transform 0.15s !important;
}

/* ── SEARCH DEFAULT STATE ── */
.search-default-state { padding:0; }
.search-default-section { padding:0 0 8px; }
.search-default-empty {
    padding:60px 32px; text-align:center;
    font-size:14px; color:rgba(255,255,255,0.3);
    display:flex; flex-direction:column; align-items:center; gap:12px;
}
.search-default-empty-icon { font-size:40px; opacity:0.5; }

/* ── TOP PAGINATION LOADER ── */
.chat-top-loader {
    display:flex; justify-content:center; padding:10px 0 4px;
    opacity:0; pointer-events:none; transition:opacity 0.2s;
}
.chat-top-loader.visible { opacity:1; }
.chat-top-spinner {
    width:20px; height:20px; border-radius:50%;
    border:2px solid rgba(255,255,255,0.08); border-top-color:#2f8bff;
    animation:spin 0.6s linear infinite;
}

/* ── CLICKABLE AVATARS ── */
.inbox-conv-avatar, .chat-header-avatar, .req-card-avatar {
    cursor:pointer !important;
    transition:opacity 0.15s, transform 0.15s !important;
}
.inbox-conv-avatar:active, .chat-header-avatar:active, .req-card-avatar:active {
    opacity:0.7; transform:scale(0.93);
}

/* ── DAY DIVIDER IMPROVED ── */
.chat-day-divider {
    display:flex; align-items:center; gap:8px;
    margin:12px 16px; user-select:none;
}
.chat-day-divider-line {
    flex:1; height:1px;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);
}
.chat-day-divider-label {
    font-size:10.5px; font-weight:600; color:rgba(255,255,255,0.3);
    text-transform:uppercase; letter-spacing:0.08em; white-space:nowrap;
    background:rgba(255,255,255,0.04); border-radius:20px;
    padding:3px 10px; border:1px solid rgba(255,255,255,0.06);
}

/* ── CONV ROW CONTEXT MENU TRIGGER ── */
.inbox-conv-row { transition:all 0.2s cubic-bezier(0.25,0.46,0.45,0.94); }
.inbox-conv-row.long-pressing {
    background:rgba(255,255,255,0.05) !important;
    transform:scale(0.98) !important;
}

/* ── SCROLL ANCHOR ── */
.chat-scroll-anchor { height:1px; flex-shrink:0; }
        `;
        document.head.appendChild(style);
    }

    // ─── HTML SHELL ──────────────────────────────────────────────────
    function injectHTML() {
        const DEFAULT_AVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='%23090e1a'/%3E%3Cpath d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' stroke='%23326bcb' stroke-width='0.8'/%3E%3Ccircle cx='12' cy='9' r='4' stroke='%23326bcb' stroke-width='0.8'/%3E%3C/svg%3E`;

        const el = document.createElement('div');
        el.id = 'inbox-panel';
        el.innerHTML = `
            <div class="inbox-handle-bar" id="inbox-drag-handle">
                <div class="inbox-handle-pill"></div>
                <div class="inbox-handle-title">
                    <h2>Inbox</h2>
                    <button class="inbox-handle-close" id="inbox-close-btn" aria-label="Close inbox">&#x2039;</button>
                </div>
            </div>
            <div class="inbox-body" id="inbox-body">
                <div id="inbox-list-view">
                    <div id="inbox-requests-btn-container"></div>
                    <div class="inbox-conv-list" id="inbox-conv-list">
                        <div class="inbox-loader"><div class="inbox-spinner"></div></div>
                    </div>
                </div>
            </div>
            <!-- Floating Search -->
            <button id="inbox-search-fab" aria-label="Search messages or users">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
            <!-- Requests View -->
            <div id="inbox-requests-view">
                <div class="req-view-header">
                    <button class="chat-back-btn" id="req-back-btn">&#8592;</button>
                    <span class="req-view-title">Message Requests</span>
                </div>
                <div class="inbox-body" id="req-list-container"></div>
            </div>
            <!-- Chat View -->
            <div id="inbox-chat">
                <div class="chat-header" id="chat-header">
                    <button class="chat-back-btn" id="chat-back-btn">&#8592;</button>
                    <img class="chat-header-avatar" id="chat-hdr-avatar" src="${DEFAULT_AVG}" alt="Avatar">
                    <div class="chat-header-info">
                        <div class="chat-header-name" id="chat-hdr-name"></div>
                        <div class="chat-header-username" id="chat-hdr-username"></div>
                    </div>
                    <button class="chat-more-btn" id="chat-more-btn" aria-label="More options">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                    </button>
                </div>

                <div class="chat-messages" id="chat-messages-list"></div>
                <div id="chat-img-preview-bar" style="display:none;" class="chat-image-preview-bar"></div>
                <div id="inbox-reply-banner-container" style="display:none;">
                    <div class="chat-reply-banner">
                        <div class="chat-reply-banner-content">
                            <div class="chat-reply-banner-name" id="chat-reply-name"></div>
                            <div class="chat-reply-banner-text" id="chat-reply-text"></div>
                        </div>
                        <button class="chat-reply-close" id="chat-reply-close-btn" aria-label="Cancel reply">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
                <div class="chat-input-bar">
                    <button class="chat-attach-btn" id="chat-attach-btn" aria-label="Attach image">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/></svg>
                    </button>
                    <input type="file" id="chat-file-input" accept="image/*" style="display:none;" multiple>
                    <textarea class="chat-text-input" id="chat-text-input" placeholder="Message…" rows="1"></textarea>
                    <button class="chat-send-btn" id="chat-send-btn" disabled aria-label="Send">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                </div>
            </div>
            <!-- Search Overlay -->
            <div id="inbox-search-overlay">
                <div class="search-overlay-header">
                    <div class="search-input-wrapper">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        <input class="search-main-input" id="inbox-search-input" placeholder="Search messages or people…" autocomplete="off">
                    </div>
                    <button class="search-cancel-btn" id="search-cancel-btn">Cancel</button>
                </div>
                <div class="search-results" id="search-results-container"></div>
            </div>
        `;
        document.body.appendChild(el);

        // ── CHAT MORE MENU (bottom sheet) ──
        const moreSheet = document.createElement('div');
        moreSheet.id = 'chat-more-sheet';
        moreSheet.className = 'inbox-bottom-sheet';
        moreSheet.innerHTML = `
            <div class="inbox-bottom-sheet-overlay" id="chat-more-overlay"></div>
            <div class="inbox-bottom-sheet-body">
                <div class="inbox-sheet-pill"></div>
                <div class="inbox-sheet-title" id="chat-more-sheet-title">Options</div>
                <div class="inbox-sheet-item" id="sheet-remove-user">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    <span id="sheet-remove-label">Remove User</span>
                </div>
                <div class="inbox-sheet-sep"></div>
                <div class="inbox-sheet-item danger" id="sheet-delete-chat">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    <span>Delete Chat</span>
                </div>
                <div class="inbox-sheet-item danger" id="sheet-block-user">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    <span id="sheet-block-label">Block User</span>
                </div>
            </div>
        `;
        document.body.appendChild(moreSheet);

        // ── MESSAGE OPTIONS SHEET ──
        const msgSheet = document.createElement('div');
        msgSheet.id = 'msg-options-sheet';
        msgSheet.className = 'inbox-bottom-sheet';
        msgSheet.innerHTML = `
            <div class="inbox-bottom-sheet-overlay" id="msg-options-overlay"></div>
            <div class="inbox-bottom-sheet-body">
                <div class="inbox-sheet-pill"></div>
                <div style="padding:12px 16px 8px; display:flex; justify-content:center;">
                    <div id="msg-reaction-picker" class="msg-reaction-picker" style="position:relative;">
                        <div class="msg-reaction-emoji" data-emoji="👍">👍</div>
                        <div class="msg-reaction-emoji" data-emoji="❤️">❤️</div>
                        <div class="msg-reaction-emoji" data-emoji="😂">😂</div>
                        <div class="msg-reaction-emoji" data-emoji="😮">😮</div>
                        <div class="msg-reaction-emoji" data-emoji="😢">😢</div>
                        <div class="msg-reaction-emoji" data-emoji="🔥">🔥</div>
                    </div>
                </div>
                <div class="inbox-sheet-sep"></div>
                <div class="inbox-sheet-item" id="sheet-msg-bookmark">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    <span id="sheet-bookmark-label">Bookmark</span>
                </div>
                <div class="inbox-sheet-item" id="sheet-msg-edit" style="display:none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <span>Edit Message</span>
                </div>
                <div class="inbox-sheet-item danger" id="sheet-msg-delete" style="display:none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                    <span>Delete Message</span>
                </div>
            </div>
        `;
        document.body.appendChild(msgSheet);

        // ── CONVERSATION CONTEXT MENU ──
        const convSheet = document.createElement('div');
        convSheet.id = 'conv-context-sheet';
        convSheet.className = 'inbox-bottom-sheet';
        convSheet.innerHTML = `
            <div class="inbox-bottom-sheet-overlay" id="conv-ctx-overlay"></div>
            <div class="inbox-bottom-sheet-body">
                <div class="inbox-sheet-pill"></div>
                <div class="inbox-sheet-title" id="conv-ctx-title">Options</div>
                <div class="inbox-sheet-item" id="conv-ctx-remove">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                    <span id="conv-ctx-remove-label">Remove User</span>
                </div>
                <div class="inbox-sheet-sep"></div>
                <div class="inbox-sheet-item danger" id="conv-ctx-delete">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                    <span>Delete Chat</span>
                </div>
                <div class="inbox-sheet-item danger" id="conv-ctx-block">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    <span id="conv-ctx-block-label">Block User</span>
                </div>
            </div>
        `;
        document.body.appendChild(convSheet);
    }

    // ─── PANEL OPEN / CLOSE ───────────────────────────────────────────
    function openInbox() {
        if (S.isOpen) return;
        S.isOpen = true;
        const panel = document.getElementById('inbox-panel');
        panel.classList.add('open');
        // Disable pull-to-refresh when inbox is open
        if (window.PullToRefresh) window.PullToRefresh.setEnabled(false);
        // Load data if logged in
        if (S.currentUser && window._inboxBootPhase2 && window._inboxBootPhase2.loadConversations) {
            window._inboxBootPhase2.loadConversations();
        }
    }

    function closeInbox() {
        if (!S.isOpen) return;
        S.isOpen = false;
        const panel = document.getElementById('inbox-panel');
        panel.classList.add('no-transition');
        requestAnimationFrame(() => {
            panel.classList.remove('no-transition');
            panel.classList.remove('open');
        });
        // Re-enable pull-to-refresh
        if (window.PullToRefresh) window.PullToRefresh.setEnabled(true);
        // Clean up realtime subscription
        if (S.realtimeChannel) {
            window.supabase.removeChannel(S.realtimeChannel);
            S.realtimeChannel = null;
        }
        // Return to list view
        closeChatView();
        closeSearchOverlay();
        closeRequestsView();
    }

    // ─── GESTURE ENGINE ───────────────────────────────────────────────
    // SWIPE UP from bottom nav bar → open inbox
    function initGestureEngine() {
        // Helper to get unified Y coordinate
        const getY = (e) => e.touches ? e.touches[0].clientY : e.clientY;
        const getX = (e) => e.touches ? e.touches[0].clientX : e.clientX;
        const getEndY = (e) => e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        // --- Swipe UP from nav bar ---
        const navBar = document.getElementById('bottom-nav-bar');
        if (!navBar) {
            // Retry once the nav bar appears
            setTimeout(initGestureEngine, 800);
            return;
        }

        let startY = 0, startX = 0, tracking = false;

        const onNavDown = (e) => {
            if (S.isOpen) return;
            startY = getY(e);
            startX = getX(e);
            tracking = true;
        };
        const onNavMove = (e) => {
            if (!tracking || S.isOpen) return;
            const dy = startY - getY(e);
            const dx = Math.abs(getX(e) - startX);
            if (dy < 10) return;
            if (dx > dy * 1.2) { tracking = false; return; } // predominantly horizontal
            if (dy > 0) {
                const panel = document.getElementById('inbox-panel');
                const pct = Math.max(0, 100 - (dy / window.innerHeight * 100));
                panel.classList.add('no-transition');
                panel.style.transform = `translateY(${pct}%)`;
            }
        };
        const onNavUp = (e) => {
            if (!tracking) return;
            tracking = false;
            const panel = document.getElementById('inbox-panel');
            panel.classList.remove('no-transition');
            panel.style.transform = '';
            const dy = startY - getEndY(e);
            if (dy > window.innerHeight * 0.18) openInbox();
            else panel.style.transform = ''; // snap back (transition handles it)
        };

        navBar.addEventListener('touchstart', onNavDown, { passive: true });
        navBar.addEventListener('mousedown', onNavDown, { passive: true });
        document.addEventListener('touchmove', onNavMove, { passive: true });
        document.addEventListener('mousemove', onNavMove, { passive: true });
        document.addEventListener('touchend', onNavUp, { passive: true });
        document.addEventListener('mouseup', onNavUp, { passive: true });

        // --- PULL DOWN from handle to close ---
        const handle = document.getElementById('inbox-drag-handle');
        let hdlStart = 0, hdlTracking = false;

        const onHandleDown = (e) => {
            hdlStart = getY(e);
            hdlTracking = true;
        };
        const onHandleMove = (e) => {
            if (!hdlTracking || !S.isOpen) return;
            const dy = getY(e) - hdlStart; // positive = pulling down
            if (dy > 0) {
                const panel = document.getElementById('inbox-panel');
                panel.classList.add('no-transition');
                panel.style.transform = `translateY(${dy}px)`;
            }
        };
        const onHandleUp = (e) => {
            if (!hdlTracking) return;
            hdlTracking = false;
            const panel = document.getElementById('inbox-panel');
            panel.classList.remove('no-transition');
            panel.style.transform = '';
            const dy = getEndY(e) - hdlStart;
            if (dy > 80) closeInbox();
        };

        handle.addEventListener('touchstart', onHandleDown, { passive: true });
        handle.addEventListener('mousedown', onHandleDown, { passive: true });
        document.addEventListener('touchmove', onHandleMove, { passive: true });
        document.addEventListener('mousemove', onHandleMove, { passive: true });
        document.addEventListener('touchend', onHandleUp, { passive: true });
        document.addEventListener('mouseup', onHandleUp, { passive: true });

        // --- SMART PULL DOWN in bottom half of inbox body (when scrolled to top) ---
        const body = document.getElementById('inbox-body');
        let bdyStart = 0, bdyTracking = false;

        const onBodyDown = (e) => {
            const y = getY(e);
            const isBottomHalf = y > window.innerHeight * 0.5;
            const isAtTop = body.scrollTop === 0;
            if (isBottomHalf && isAtTop && S.isOpen && S.view === 'list') {
                bdyStart = y;
                bdyTracking = true;
            }
        };
        const onBodyMove = (e) => {
            if (!bdyTracking) return;
            const dy = getY(e) - bdyStart;
            if (dy > 0 && body.scrollTop === 0) {
                const panel = document.getElementById('inbox-panel');
                panel.classList.add('no-transition');
                panel.style.transform = `translateY(${dy * 0.4}px)`;
            }
        };
        const onBodyUp = (e) => {
            if (!bdyTracking) return;
            bdyTracking = false;
            const panel = document.getElementById('inbox-panel');
            panel.classList.remove('no-transition');
            panel.style.transform = '';
            const dy = getEndY(e) - bdyStart;
            if (dy > 100) closeInbox();
        };

        body.addEventListener('touchstart', onBodyDown, { passive: true });
        body.addEventListener('mousedown', onBodyDown, { passive: true });
        document.addEventListener('touchmove', onBodyMove, { passive: true });
        document.addEventListener('mousemove', onBodyMove, { passive: true });
        document.addEventListener('touchend', onBodyUp, { passive: true });
        document.addEventListener('mouseup', onBodyUp, { passive: true });

        console.log('✅ Inbox gesture engine ready');
    }

    // ─── CLOSE BUTTON ─────────────────────────────────────────────────
    function initButtons() {
        document.getElementById('inbox-close-btn').addEventListener('click', closeInbox);
        document.getElementById('chat-back-btn').addEventListener('click', closeChatView);
        document.getElementById('req-back-btn').addEventListener('click', closeRequestsView);
        document.getElementById('inbox-search-fab').addEventListener('click', openSearchOverlay);
        document.getElementById('search-cancel-btn').addEventListener('click', closeSearchOverlay);
    }

    // ─── VIEW TRANSITIONS ─────────────────────────────────────────────
    function openChatView(conv) {
        S.currentConv = conv;
        S.view = 'chat';
        const chatEl = document.getElementById('inbox-chat');
        document.getElementById('chat-hdr-name').textContent = conv.otherName;
        document.getElementById('chat-hdr-username').textContent = '@' + conv.otherUsername;
        document.getElementById('chat-hdr-avatar').src = conv.otherAvatar || getDefaultAvatar();
        chatEl.classList.add('open');
        if (window._inboxBootPhase2) {
            window._inboxBootPhase2.loadMessages(conv.id);
            if (window._inboxBootPhase2.subscribeToMessages) {
                window._inboxBootPhase2.subscribeToMessages(conv.id);
            }
        }
    }

    function closeChatView() {
        S.view = 'list';
        document.getElementById('inbox-chat').classList.remove('open');
        if (S.realtimeChannel) {
            window.supabase.removeChannel(S.realtimeChannel);
            S.realtimeChannel = null;
        }
        S.messages = [];
        if (window._inboxBootPhase2 && window._inboxBootPhase2.clearImagePreviews) {
            window._inboxBootPhase2.clearImagePreviews();
        }
    }

    function openRequestsView() {
        document.getElementById('inbox-requests-view').classList.add('open');
        if (window._inboxBootPhase2 && window._inboxBootPhase2.renderRequestsView) {
            window._inboxBootPhase2.renderRequestsView();
        }
    }

    function closeRequestsView() {
        document.getElementById('inbox-requests-view').classList.remove('open');
    }

    function openSearchOverlay() {
        document.getElementById('inbox-search-overlay').classList.add('open');
        setTimeout(() => document.getElementById('inbox-search-input').focus(), 350);
    }

    function closeSearchOverlay() {
        document.getElementById('inbox-search-overlay').classList.remove('open');
        document.getElementById('inbox-search-input').value = '';
        document.getElementById('search-results-container').innerHTML = '';
    }

    function getDefaultAvatar() {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='%23090e1a'/%3E%3Cpath d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' stroke='%23326bcb' stroke-width='0.8'/%3E%3Ccircle cx='12' cy='9' r='4' stroke='%23326bcb' stroke-width='0.8'/%3E%3C/svg%3E`;
    }

    // Expose open for external calls (e.g., from a future icon button)
    window.openInbox = openInbox;
    window.closeInbox = closeInbox;

    // ─── BOOT ─────────────────────────────────────────────────────────
    // DATA LAYER + RENDERING + CHAT will be attached by inbox_panel.js
    // This file is continued in inbox_panel.js
    window._inboxBootPhase1 = {
        S, openInbox, closeInbox, openChatView, closeChatView,
        openRequestsView, closeRequestsView, openSearchOverlay, closeSearchOverlay,
        getDefaultAvatar, injectCSS, injectHTML, initGestureEngine, initButtons
    };

})();
