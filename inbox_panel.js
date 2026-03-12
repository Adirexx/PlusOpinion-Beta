/**
 * PLUSOPINION INBOX — Panel Data Layer & Rendering (Part 2)
 * ==========================================================
 * Data fetching, conversations list, chat view, message requests,
 * floating search, real-time messaging, image attach, E2EE integration.
 * Requires inbox.js (Part 1) and inbox_crypto.js to be loaded first.
 */
(function () {
    'use strict';

    // Wait for Part 1 to be ready
    function waitForPart1(cb) {
        if (window._inboxBootPhase1) { cb(); return; }
        setTimeout(() => waitForPart1(cb), 50);
    }

    waitForPart1(main);

    function main() {
        const {
            S, openInbox, closeInbox, openChatView, closeChatView,
            openRequestsView, closeRequestsView,
            openSearchOverlay, closeSearchOverlay,
            getDefaultAvatar, injectCSS, injectHTML,
            initGestureEngine, initButtons
        } = window._inboxBootPhase1;

        // ─── HELPERS ─────────────────────────────────────────────────
        function fmtTime(iso) {
            if (!iso) return '';
            const d = new Date(iso);
            const now = new Date();
            const sameDay = d.toDateString() === now.toDateString();
            const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
            const isYesterday = d.toDateString() === yesterday.toDateString();
            const diffMs = now - d;
            const diffDays = Math.floor(diffMs / 86400000);
            const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (sameDay) return timeStr;
            if (isYesterday) return timeStr; // show just time for yesterday too in chat list (Yesterday shown in day divider)
            if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
            return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }

        function fmtConvTime(iso) {
            // For inbox list: Today → HH:MM, Yesterday → Yesterday, week → day name, older → date
            if (!iso) return '';
            const d = new Date(iso);
            const now = new Date();
            const sameDay = d.toDateString() === now.toDateString();
            const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
            const isYesterday = d.toDateString() === yesterday.toDateString();
            const diffDays = Math.floor((now - d) / 86400000);
            if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (isYesterday) return 'Yesterday';
            if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
            return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }

        function fmtDayDivider(iso) {
            const d = new Date(iso);
            const now = new Date();
            const sameDay = d.toDateString() === now.toDateString();
            const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
            const isYesterday = d.toDateString() === yesterday.toDateString();
            const diffDays = Math.floor((now - d) / 86400000);
            if (sameDay) return 'Today';
            if (isYesterday) return 'Yesterday';
            if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
            return d.toLocaleDateString([], { weekday: 'short', month: 'long', day: 'numeric' });
        }

        function escHtml(s) {
            return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        function extractFirstUrl(text) {
            const match = text.match(/https?:\/\/[^\s]+/);
            return match ? match[0] : null;
        }

        function linkifyText(text) {
            const escaped = escHtml(text);
            return escaped.replace(/https?:\/\/[^\s]+/g, (url) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2f8bff; text-decoration: underline;">${url}</a>`;
            });
        }

        // ─── DATA LAYER ──────────────────────────────────────────────

        async function loadConversations() {
            if (!S.currentUser) return;
            const uid = S.currentUser.id;
            const { data, error } = await window.supabase
                .from('conversations')
                .select(`
                    id, accepted_by_p1, accepted_by_p2,
                    last_message_at, last_message_preview,
                    participant_1_id, participant_2_id,
                    is_deleted_by_p1, is_deleted_by_p2,
                    removed_by_p1, removed_by_p2
                `)
                .or(`participant_1_id.eq.${uid},participant_2_id.eq.${uid}`)
                .order('last_message_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('[Inbox] Load convs error:', error);
                document.getElementById('inbox-conv-list').innerHTML = `
                    <div class="inbox-empty">
                        <div class="inbox-empty-icon">⚠️</div>
                        <div class="inbox-empty-title">Couldn't load messages</div>
                        <div class="inbox-empty-sub">Please check your connection and try again.</div>
                    </div>`;
                return;
            }

            // Separate accepted vs requests
            S.conversations = [];
            S.requests = [];

            // Gather all other-user IDs to batch-fetch their profiles
            const otherIds = data.map(c => c.participant_1_id === uid ? c.participant_2_id : c.participant_1_id);
            const { data: profiles } = await window.supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url')
                .in('id', [...new Set(otherIds)]);

            const profileMap = {};
            (profiles || []).forEach(p => { profileMap[p.id] = p; });
            
            data.forEach(c => {
                const isP1 = c.participant_1_id === uid;
                const isDeletedByMe = isP1 ? c.is_deleted_by_p1 : c.is_deleted_by_p2;
                const isRemovedByMe = isP1 ? c.removed_by_p1 : c.removed_by_p2;

                if (isDeletedByMe || isRemovedByMe) return;

                const otherId = isP1 ? c.participant_2_id : c.participant_1_id;
                const p = profileMap[otherId] || {};
                const conv = {
                    id: c.id,
                    otherId,
                    otherName: p.full_name || 'Unknown',
                    otherUsername: p.username || '?',
                    otherAvatar: window.rewriteMediaUrl ? window.rewriteMediaUrl(p.avatar_url) : p.avatar_url,
                    preview: c.last_message_preview || '',
                    time: c.last_message_at,
                    accepted: (c.participant_1_id === uid ? c.accepted_by_p1 : c.accepted_by_p2)
                        && (c.participant_1_id === uid ? c.accepted_by_p2 : c.accepted_by_p1),
                    isRequest: c.participant_1_id === uid
                        ? !c.accepted_by_p2  // we sent, receiver hasn't accepted
                        : !c.accepted_by_p1 && c.accepted_by_p2 === false && c.participant_2_id === uid,
                };

                // For recipient: if accepted_by_p2 is false and we are participant_2, it's a request to us
                const isRecipient = c.participant_2_id === uid;
                const weAccepted = isRecipient ? c.accepted_by_p2 : c.accepted_by_p1;
                const theyAccepted = isRecipient ? c.accepted_by_p1 : c.accepted_by_p2;

                if (isRecipient && !theyAccepted) {
                    // This shouldn't happen (sender always accepted)
                    return;
                }
                if (isRecipient && !weAccepted) {
                    S.requests.push(conv);
                } else {
                    S.conversations.push(conv);
                }
            });

            // Fetch unread messages count for these conversations
            const convIds = [...S.conversations, ...S.requests].map(c => c.id);
            if (convIds.length > 0) {
                const { data: unreadMsgs } = await window.supabase
                    .from('messages')
                    .select('conversation_id')
                    .in('conversation_id', convIds)
                    .is('read_at', null)
                    .neq('sender_id', uid);

                const unreadCounts = {};
                (unreadMsgs || []).forEach(m => {
                    unreadCounts[m.conversation_id] = (unreadCounts[m.conversation_id] || 0) + 1;
                });

                S.conversations.forEach(c => c.unreadCount = unreadCounts[c.id] || 0);
                S.requests.forEach(c => c.unreadCount = unreadCounts[c.id] || 0);
            }

            renderConversationsList();
            renderRequestsButton();
        }

        let msgPageOldestId = null;
        let msgPageLoading = false;
        let msgAllLoaded = false;
        const MSG_PAGE_SIZE = 30;

        async function loadMessages(convId) {
            msgPageOldestId = null;
            msgPageLoading = false;
            msgAllLoaded = false;

            const msgList = document.getElementById('chat-messages-list');
            // Show top loader while loading
            msgList.innerHTML = `<div class="chat-top-loader visible" id="chat-top-loader"><div class="chat-top-spinner"></div></div>`;

            const { data, error } = await window.supabase
                .from('messages')
                .select('id, sender_id, content, content_iv, message_type, media_url, created_at, read_at')
                .eq('conversation_id', convId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(MSG_PAGE_SIZE);

            if (error) { console.error('[Inbox] Load msgs error:', error); return; }

            const msgs = (data || []).reverse();
            if (msgs.length < MSG_PAGE_SIZE) msgAllLoaded = true;
            if (msgs.length > 0) msgPageOldestId = msgs[0].id;

            S.messages = msgs;

            // Fetch reactions and bookmarks for this batch
            const msgIds = msgs.map(m => m.id);
            const [reactionsRes, bookmarksRes] = await Promise.all([
                msgIds.length ? window.supabase.from('message_reactions').select('*').in('message_id', msgIds) : { data: [] },
                msgIds.length ? window.supabase.from('bookmarks').select('message_id').in('message_id', msgIds).eq('user_id', S.currentUser.id) : { data: [] }
            ]);
            const reactionsMap = {};
            (reactionsRes.data || []).forEach(r => {
                if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = [];
                reactionsMap[r.message_id].push(r);
            });
            const bookmarkedSet = new Set((bookmarksRes.data || []).map(b => b.message_id));

            await renderMessages(msgs, reactionsMap, bookmarkedSet);

            // Mark unread messages as read
            const uid = S.currentUser.id;
            const unreadIds = msgs.filter(m => m.sender_id !== uid && !m.read_at).map(m => m.id);
            if (unreadIds.length > 0) {
                window.supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds).then(() => {});
            }
            if (S.currentConv) {
                S.currentConv.unreadCount = 0;
                renderConversationsList();
            }

            // Init scroll-up pagination
            initMsgScrollPagination(convId);
        }

        function initMsgScrollPagination(convId) {
            const msgList = document.getElementById('chat-messages-list');
            if (!msgList) return;
            const onScroll = async () => {
                if (msgList.scrollTop > 60 || msgPageLoading || msgAllLoaded) return;
                msgPageLoading = true;
                // Show top loader
                let loader = document.getElementById('chat-top-loader');
                if (!loader) {
                    loader = document.createElement('div');
                    loader.id = 'chat-top-loader';
                    loader.className = 'chat-top-loader visible';
                    loader.innerHTML = '<div class="chat-top-spinner"></div>';
                    msgList.insertBefore(loader, msgList.firstChild);
                } else { loader.classList.add('visible'); }

                const { data } = await window.supabase
                    .from('messages')
                    .select('id, sender_id, content, content_iv, message_type, media_url, created_at, read_at')
                    .eq('conversation_id', convId)
                    .is('deleted_at', null)
                    .lt('created_at', S.messages.length ? S.messages[0].created_at : new Date().toISOString())
                    .order('created_at', { ascending: false })
                    .limit(MSG_PAGE_SIZE);

                const oldMsgs = (data || []).reverse();
                if (oldMsgs.length < MSG_PAGE_SIZE) msgAllLoaded = true;
                if (oldMsgs.length === 0) { loader?.classList.remove('visible'); msgPageLoading = false; return; }

                // Prepend without losing scroll position
                const prevHeight = msgList.scrollHeight;
                const prevTop = msgList.scrollTop;

                // Fetch reactions/bookmarks for older messages
                const oldIds = oldMsgs.map(m => m.id);
                const [rRes, bRes] = await Promise.all([
                    window.supabase.from('message_reactions').select('*').in('message_id', oldIds),
                    window.supabase.from('bookmarks').select('message_id').in('message_id', oldIds).eq('user_id', S.currentUser.id)
                ]);
                const rMap = {};
                (rRes.data || []).forEach(r => { if (!rMap[r.message_id]) rMap[r.message_id] = []; rMap[r.message_id].push(r); });
                const bSet = new Set((bRes.data || []).map(b => b.message_id));

                // Render older messages into a temp fragment
                const uid = S.currentUser.id;
                let html = '';
                let lastDay = null;
                for (const msg of oldMsgs) {
                    if (msg.deleted_at) continue;
                    const day = new Date(msg.created_at).toDateString();
                    if (day !== lastDay) {
                        html += renderDayDivider(msg.created_at);
                        lastDay = day;
                    }
                    html += renderMessageBubble(msg, uid, rMap[msg.id] || [], bSet.has(msg.id));
                }

                const frag = document.createElement('div');
                frag.innerHTML = html;

                // Remove old top loader
                loader?.remove();
                // Insert new top loader + new messages before existing messages
                const newLoader = document.createElement('div');
                newLoader.id = 'chat-top-loader';
                newLoader.className = 'chat-top-loader';
                newLoader.innerHTML = '<div class="chat-top-spinner"></div>';
                msgList.insertBefore(newLoader, msgList.firstChild);
                msgList.insertBefore(frag, newLoader.nextSibling);

                // Restore scroll so user stays in place
                msgList.scrollTop = prevTop + (msgList.scrollHeight - prevHeight);

                S.messages = [...oldMsgs, ...S.messages];
                if (oldMsgs.length > 0) msgPageOldestId = oldMsgs[0].id;

                // Decrypt new cipher elements
                decryptCipherElements(msgList, uid);
                resolveImageElements(msgList);
                attachMessageLongPress(msgList);
                msgPageLoading = false;
            };
            msgList.addEventListener('scroll', onScroll, { passive: true });
        }

        async function sendMessage(convId, plaintext, imageFiles, extraPayload = {}) {
            const uid = S.currentUser.id;
            const otherId = S.currentConv?.otherId;

            if (!otherId) return;

            // Block check: verify if either user has blocked the other
            const { data: blockData } = await window.supabase
                .from('profile_blocks')
                .select('id')
                .or(`and(blocker_id.eq.${uid},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${uid})`)
                .maybeSingle();

            if (blockData) {
                alert("You cannot send messages due to a block.");
                return;
            }

            // Handle image files first
            if (imageFiles && imageFiles.length > 0) {
                for (const file of imageFiles) {
                    try {
                        const compressed = await window.InboxCrypto.compressImage(file);
                        const path = await window.InboxCrypto.uploadChatImage(compressed, convId, uid);
                        const signedUrl = await window.InboxCrypto.getChatImageUrl(path);
                        await window.supabase.from('messages').insert({
                            conversation_id: convId, sender_id: uid,
                            content: '[image]', content_iv: null,
                            message_type: 'image', media_url: path
                        });
                        // Optimistic UI
                        appendMessageUI({
                            sender_id: uid, content: signedUrl,
                            message_type: 'image', created_at: new Date().toISOString()
                        });
                    } catch (e) { console.error('[Inbox] Image send error:', e); }
                }
                // Update conversation preview
                await window.supabase.from('conversations').update({
                    last_message_preview: '📷 Image',
                    last_message_at: new Date().toISOString()
                }).eq('id', convId);
            }

            // Handle text or extra payload
            if (!plaintext.trim() && Object.keys(extraPayload).length === 0) return;

            let ogData = null;
            const firstUrl = extractFirstUrl(plaintext);
            if (firstUrl && !extraPayload.og_data) {
                try {
                    const { data, error } = await window.supabase.functions.invoke('opengraph-proxy', {
                        body: { url: firstUrl }
                    });
                    if (!error && data && !data.error) {
                        ogData = data;
                    }
                } catch (e) {
                    console.warn("OG proxy failed:", e);
                }
            }

            const payloadObj = { text: plaintext.trim(), ...extraPayload };
            if (ogData) payloadObj.og_data = ogData;
            const payloadStr = JSON.stringify(payloadObj);

            // Optimistic UI
            appendMessageUI({
                sender_id: uid, content: payloadStr,
                content_iv: null, message_type: 'text', created_at: new Date().toISOString()
            });

            // Encrypt
            const { content, content_iv } = await window.InboxCrypto.encryptForUser(payloadStr, uid, otherId);

            // Preview logic
            let previewText = plaintext.trim();
            if (!previewText && extraPayload.share_post_id) previewText = 'Shared a post';
            else if (!previewText) previewText = 'Sent a message';
            else if (previewText.length > 40) previewText = previewText.substring(0, 40) + '…';

            // Ensure conversation is active and not removed for the receiver
            const { data: convCheck } = await window.supabase.from('conversations').select('*').eq('id', convId).single();
            if (convCheck) {
                const isOtherP1 = convCheck.participant_1_id !== uid;
                const otherRemoved = isOtherP1 ? convCheck.removed_by_p1 : convCheck.removed_by_p2;
                const otherDeleted = isOtherP1 ? convCheck.is_deleted_by_p1 : convCheck.is_deleted_by_p2;

                if (otherRemoved || otherDeleted) {
                    const updateObj = isOtherP1 
                        ? { removed_by_p1: false, is_deleted_by_p1: false, accepted_by_p1: false } 
                        : { removed_by_p2: false, is_deleted_by_p2: false, accepted_by_p2: false };
                    await window.supabase.from('conversations').update(updateObj).eq('id', convId);
                }
            }

            await window.supabase.from('messages').insert({
                conversation_id: convId, sender_id: uid,
                content, content_iv, message_type: 'text'
            });

            await window.supabase.from('conversations').update({
                last_message_preview: previewText,
                last_message_at: new Date().toISOString()
            }).eq('id', convId);
        }

        async function startConversation(otherId) {
            const uid = S.currentUser.id;
            // Check if conversation already exists (either direction)
            const { data: existing } = await window.supabase
                .from('conversations')
                .select('id')
                .or(
                    `and(participant_1_id.eq.${uid},participant_2_id.eq.${otherId}),and(participant_1_id.eq.${otherId},participant_2_id.eq.${uid})`
                )
                .maybeSingle();

            let convId = existing?.id;
            if (!convId) {
                const { data: newConv, error } = await window.supabase
                    .from('conversations')
                    .insert({
                        participant_1_id: uid,
                        participant_2_id: otherId,
                        accepted_by_p1: true,
                        accepted_by_p2: false
                    })
                    .select('id').single();
                if (error) { console.error('[Inbox] Create conv error:', error); return; }
                convId = newConv.id;
            }

            // Fetch other user profile
            const { data: profile } = await window.supabase
                .from('profiles')
                .select('full_name, username, avatar_url')
                .eq('id', otherId).single();

            const conv = {
                id: convId, otherId,
                otherName: profile?.full_name || 'Unknown',
                otherUsername: profile?.username || '?',
                otherAvatar: window.rewriteMediaUrl ? window.rewriteMediaUrl(profile?.avatar_url) : profile?.avatar_url,
            };

            // Ensure inbox is open before showing chat
            if (openInbox) openInbox();
            
            closeSearchOverlay();
            openChatView(conv);
            // Ensure InboxCrypto keys are ready
            await window.InboxCrypto.ensureKeys(uid);
            return convId;
        }

        async function acceptRequest(convId) {
            const uid = S.currentUser.id;
            const { error } = await window.supabase
                .from('conversations')
                .update({ accepted_by_p2: true })
                .eq('id', convId)
                .eq('participant_2_id', uid);
            if (!error) {
                S.requests = S.requests.filter(r => r.id !== convId);
                loadConversations(); // refresh
                closeRequestsView();
            }
        }

        async function declineRequest(convId) {
            await window.supabase.from('conversations').update({
                is_deleted_by_p2: true
            }).eq('id', convId);
            S.requests = S.requests.filter(r => r.id !== convId);
            renderRequestsView();
            renderRequestsButton();
        }

        // ─── REALTIME ────────────────────────────────────────────────
        function subscribeToMessages(convId) {
            if (S.realtimeChannel) {
                window.supabase.removeChannel(S.realtimeChannel);
            }
            S.realtimeChannel = window.supabase
                .channel(`inbox-msgs-${convId}`)
                .on('postgres_changes', {
                    event: 'INSERT', schema: 'public', table: 'messages',
                    filter: `conversation_id=eq.${convId}`
                }, async (payload) => {
                    const msg = payload.new;
                    // Don't duplicate our own optimistic messages
                    if (msg.sender_id === S.currentUser.id) return;
                    // Decrypt if needed
                    if (msg.message_type === 'text' && msg.content_iv) {
                        msg.content = await window.InboxCrypto.decryptFromUser(
                            msg.content, msg.content_iv, S.currentUser.id, S.currentConv.otherId
                        );
                        msg.content_iv = null;
                    }
                    if (msg.message_type === 'image' && msg.media_url) {
                        msg.content = await window.InboxCrypto.getChatImageUrl(msg.media_url);
                    }
                    appendMessageUI(msg);
                    // Mark as read immediately
                    window.supabase.from('messages')
                        .update({ read_at: new Date().toISOString() })
                        .eq('id', msg.id).then(() => { });
                })
                .subscribe();
        }

        let globalChannel = null;
        function subscribeGlobalRealtime() {
            if (globalChannel) return;
            const uid = S.currentUser?.id;
            if (!uid) return;

            globalChannel = window.supabase
                .channel('inbox-global-channel')
                .on('postgres_changes', {
                    event: 'UPDATE', schema: 'public', table: 'conversations'
                }, (payload) => {
                    if (S.isOpen && S.view === 'list') {
                        loadConversations();
                    }
                })
                .on('postgres_changes', {
                    event: 'INSERT', schema: 'public', table: 'messages'
                }, (payload) => {
                    if (S.isOpen && S.view === 'list') {
                        loadConversations();
                    }
                })
                .subscribe();
        }

        // ─── RENDERING: CONVERSATIONS LIST ───────────────────────────
        function renderConversationsList() {
            const container = document.getElementById('inbox-conv-list');
            
            // Calculate total unread count for badge
            let totalUnread = 0;
            S.conversations.forEach(c => totalUnread += c.unreadCount || 0);
            window.dispatchEvent(new CustomEvent('inbox_unread_changed', { detail: totalUnread }));

            if (S.conversations.length === 0) {
                container.innerHTML = `
                    <div class="inbox-empty">
                        <div class="inbox-empty-icon">💬</div>
                        <div class="inbox-empty-title">No messages yet</div>
                        <div class="inbox-empty-sub">Use the search button below to find people and start a conversation.</div>
                    </div>`;
                return;
            }
            container.innerHTML = S.conversations.map(conv => {
                const isUnread = conv.unreadCount > 0;
                const badge = isUnread ? `<div class="inbox-unread-badge">${conv.unreadCount > 99 ? '99+' : conv.unreadCount}</div>` : '';
                return `
                <div class="inbox-conv-row ${isUnread ? 'unread' : ''}" data-id="${conv.id}" data-other="${conv.otherId}" data-name="${escHtml(conv.otherName)}">
                    <img class="inbox-conv-avatar" src="${escHtml(conv.otherAvatar || getDefaultAvatar())}"
                         alt="${escHtml(conv.otherName)}" loading="lazy"
                         onerror="this.src='${getDefaultAvatar()}'" data-uid="${conv.otherId}" style="cursor: pointer;">
                    <div class="inbox-conv-info">
                        <div class="inbox-conv-name-wrapper">
                            <div class="inbox-conv-name" data-uid="${conv.otherId}" style="cursor: pointer;">${escHtml(conv.otherName)}</div>
                        </div>
                        <div class="inbox-conv-preview">${escHtml(conv.preview || 'Say hello 👋')}</div>
                    </div>
                <div class="inbox-conv-meta">
                    <span class="inbox-conv-time" data-iso="${conv.time || ''}">${fmtConvTime(conv.time)}</span>
                    ${badge}
                </div>
                </div>`;
            }).join('');

            container.innerHTML += `
                <div style="padding: 40px 20px 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; user-select: none;">
                    <div style="width: 60px; height: 1px; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);"></div>
                    <span style="font-family: 'Inter', sans-serif; font-size: 9px; font-weight: 500; letter-spacing: 0.4em; text-transform: uppercase; color: rgba(255,255,255,0.3); opacity: 0.8;">
                        END OF CONVERSATIONS
                    </span>
                    <div style="width: 60px; height: 1px; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);"></div>
                </div>
            `;

            container.querySelectorAll('.inbox-conv-row').forEach(row => {
                // Click to open chat
                row.addEventListener('click', () => {
                    const conv = S.conversations.find(c => c.id === row.dataset.id);
                    if (conv) openChatView(conv);
                });
                // Avatar click → profile
                const avatar = row.querySelector('.inbox-conv-avatar');
                if (avatar) {
                    avatar.addEventListener('click', (e) => {
                        e.stopPropagation();
                        navigateToProfile(avatar.dataset.uid);
                    });
                }
                // Name click → profile
                const nameLink = row.querySelector('.inbox-conv-name');
                if (nameLink) {
                    nameLink.addEventListener('click', (e) => {
                        e.stopPropagation();
                        navigateToProfile(nameLink.dataset.uid);
                    });
                }
                // Long-press context menu
                attachConvLongPress(row);
            });
        }

        function renderRequestsButton() {
            const container = document.getElementById('inbox-requests-btn-container');
            const count = S.requests.length;
            const badgeHtml = count > 0
                ? `<span class="inbox-req-badge">${count > 99 ? '99+' : count}</span>`
                : `<span class="inbox-req-badge" style="background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);">${count}</span>`;

            container.innerHTML = `
                <div class="inbox-requests-btn" id="inbox-req-btn">
                    <div class="inbox-req-label">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Message Requests
                        ${badgeHtml}
                    </div>
                    <span class="inbox-req-arrow">›</span>
                </div>`;
            document.getElementById('inbox-req-btn').addEventListener('click', openRequestsView);
        }

        function renderRequestsView() {
            const container = document.getElementById('req-list-container');
            if (S.requests.length === 0) {
                container.innerHTML = `<div class="inbox-empty"><div class="inbox-empty-icon">✉️</div><div class="inbox-empty-title">No requests</div></div>`;
                return;
            }
            container.innerHTML = S.requests.map(req => `
                <div class="req-card" data-id="${req.id}">
                    <img class="req-card-avatar" src="${escHtml(req.otherAvatar || getDefaultAvatar())}" alt=""
                        onerror="this.src='${getDefaultAvatar()}'" data-uid="${req.otherId}" style="cursor:pointer">
                    <div class="req-card-body">
                        <div class="req-card-name" data-uid="${req.otherId}" style="cursor:pointer">${escHtml(req.otherName)}</div>
                        <div class="req-card-preview">${escHtml(req.preview || 'Wants to message you')}</div>
                        <div class="req-card-actions">
                            <button class="req-btn accept" data-id="${req.id}">Accept</button>
                            <button class="req-btn decline" data-id="${req.id}">Delete</button>
                        </div>
                    </div>
                </div>`).join('');

            container.querySelectorAll('.req-btn.accept').forEach(btn => {
                btn.addEventListener('click', e => { e.stopPropagation(); acceptRequest(btn.dataset.id); });
            });
            container.querySelectorAll('.req-btn.decline').forEach(btn => {
                btn.addEventListener('click', e => { e.stopPropagation(); declineRequest(btn.dataset.id); });
            });
            // Avatar click → profile
            container.querySelectorAll('.req-card-avatar').forEach(av => {
                av.addEventListener('click', e => { e.stopPropagation(); navigateToProfile(av.dataset.uid); });
            });
            // Name click → profile
            container.querySelectorAll('.req-card-name').forEach(name => {
                name.addEventListener('click', e => { e.stopPropagation(); navigateToProfile(name.dataset.uid); });
            });
        }

        // ─── RENDERING: CHAT MESSAGES ────────────────────────────────

        function renderDayDivider(iso) {
            return `<div class="chat-day-divider">
                <div class="chat-day-divider-line"></div>
                <div class="chat-day-divider-label">${fmtDayDivider(iso)}</div>
                <div class="chat-day-divider-line"></div>
            </div>`;
        }

        async function renderMessages(msgs, reactionsMap = {}, bookmarkedSet = new Set(), prepend = false) {
            const msgList = document.getElementById('chat-messages-list');
            const uid = S.currentUser.id;
            let html = '';
            let lastDay = null;

            // Add original E2EE banner at the very top of the chat history
            if (msgAllLoaded && !prepend) {
                html += `
                    <div style="text-align: center; padding: 24px 16px; margin: 20px 0 30px; border-radius: 12px; background: rgba(74, 222, 128, 0.05); border: 1px solid rgba(74, 222, 128, 0.1);">
                        <div style="color: #4ade80; font-size: 13px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; letter-spacing: 0.5px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            MESSAGES ARE END-TO-END ENCRYPTED
                        </div>
                        <div style="color: rgba(255,255,255,0.8); font-size: 13px; font-weight: 500; line-height: 1.5; margin-bottom: 12px;">
                            Only you and the person you're chatting with can read your messages. Not even PlusOpinion can read them.
                        </div>
                        <div style="color: rgba(255,255,255,0.5); font-size: 11px; line-height: 1.5; display: flex; align-items: flex-start; gap: 6px; text-align: left;">
                            <span style="color: #eab308; flex-shrink: 0; margin-top: 1px;">⚠</span>
                            <span style="color: #ca8a04;">Your encryption keys are stored only on this device. If you clear your browser data for PlusOpinion, previous messages will become permanently unreadable.</span>
                        </div>
                    </div>`;
            }

            // Add top loader placeholder (hidden by default when all loaded)
            html += `<div class="chat-top-loader" id="chat-top-loader"><div class="chat-top-spinner"></div></div>`;

            for (const msg of msgs) {
                if (msg.deleted_at) continue;
                const day = new Date(msg.created_at).toDateString();
                if (day !== lastDay) {
                    html += renderDayDivider(msg.created_at);
                    lastDay = day;
                }
                html += renderMessageBubble(msg, uid, reactionsMap[msg.id] || [], bookmarkedSet.has(msg.id));
            }

            // scroll anchor at bottom — guarantees scrollIntoView works
            if (!prepend) {
                html += `<div class="chat-scroll-anchor" id="chat-scroll-anchor"></div>`;
            }

            if (prepend) {
                msgList.insertAdjacentHTML('afterbegin', html);
            } else {
                msgList.innerHTML = html;
            }

            await decryptCipherElements(msgList, uid);
            await resolveImageElements(msgList);
            attachMessageLongPress(msgList);

            // Hide top loader if all loaded (less than a full page)
            if (msgAllLoaded) {
                const topLoader = document.getElementById('chat-top-loader');
                if (topLoader) topLoader.style.display = 'none';
            }

            scrollChatToBottom();
        }

        async function decryptCipherElements(container, uid) {
            const cipherEls = Array.from(container.querySelectorAll('[data-cipher]'));
            if (cipherEls.length === 0) return;
            await Promise.all(cipherEls.map(async (el) => {
                try {
                    const plain = await window.InboxCrypto.decryptFromUser(
                        el.dataset.cipher, el.dataset.iv,
                        uid, S.currentConv.otherId
                    );
                    let parsed;
                    try { parsed = JSON.parse(plain); } catch (e) { parsed = { text: plain }; }
                    if (parsed.share_post_id && !parsed.text && !parsed.og_data) {
                        const chatMsg = el.closest('.chat-msg');
                        if (chatMsg) chatMsg.classList.add('shared-post-only');
                    }
                    el.innerHTML = renderDecryptedPayload(parsed);
                    el.removeAttribute('data-cipher');
                } catch (e) {
                    el.innerHTML = `<span style="opacity:0.4;font-size:12px">[Encrypted — decryption failed]</span>`;
                }
            }));
        }

        async function resolveImageElements(container) {
            const imgEls = Array.from(container.querySelectorAll('[data-media-path]'));
            if (imgEls.length === 0) return;
            await Promise.all(imgEls.map(async (el) => {
                try {
                    const url = await window.InboxCrypto.getChatImageUrl(el.dataset.mediaPath);
                    const img = el.querySelector('img');
                    if (img) img.src = url;
                } catch (e) {}
            }));
        }

        function renderMessageBubble(msg, myUid, reactions = [], isBookmarked = false) {
            const isMine = msg.sender_id === myUid;
            const cls = isMine ? 'mine' : 'theirs';
            const time = fmtTime(msg.created_at);

            // Build reaction chips
            let reactionHtml = '';
            if (reactions.length > 0) {
                const grouped = {};
                reactions.forEach(r => {
                    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, mine: false };
                    grouped[r.emoji].count++;
                    if (r.user_id === myUid) grouped[r.emoji].mine = true;
                });
                reactionHtml = `<div class="chat-msg-reactions">` +
                    Object.entries(grouped).map(([emoji, d]) =>
                        `<div class="chat-reaction-chip${d.mine ? ' mine' : ''}" data-emoji="${emoji}" data-msg-id="${msg.id}">${emoji}<span class="chip-count">${d.count}</span></div>`
                    ).join('') + `</div>`;
            }

            const bookmarkIcon = isBookmarked ? `<div class="msg-bookmark-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></div>` : '';

            if (msg.message_type === 'image') {
                const isLoaded = msg.content !== '[image]';
                const imgSrc = isLoaded ? escHtml(msg.content) : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                const loadingStyle = isLoaded ? '' : 'background:rgba(255,255,255,0.05);min-height:150px;min-width:200px;';
                return `<div class="chat-msg ${cls} direct-img" data-msg-id="${msg.id}" data-is-mine="${isMine}" data-msg-type="image" ${msg.media_url ? `data-media-path="${escHtml(msg.media_url)}"` : ''}>
                    ${bookmarkIcon}
                    <img src="${imgSrc}" alt="Image" style="max-width:200px;border-radius:12px;display:block;${loadingStyle}"
                        onload="this.style.minHeight='';this.style.minWidth='';this.style.background='';"
                        onerror="if(!this.src.startsWith('data:')) this.style.opacity='0.5'">
                    <div class="chat-msg-time">${time}</div>
                    ${reactionHtml}
                </div>`;
            }

            // Text message
            const needsDecrypt = !!msg.content_iv;
            let displayText = '…';
            let extraCls = '';

            if (!needsDecrypt) {
                let parsedPayload;
                try { parsedPayload = JSON.parse(msg.content || '{}'); } catch (e) { parsedPayload = { text: msg.content || '' }; }
                displayText = renderDecryptedPayload(parsedPayload);
                if (parsedPayload.share_post_id && !parsedPayload.text && !parsedPayload.og_data) extraCls = ' shared-post-only';
            }

            const decryptAttrs = needsDecrypt
                ? `data-cipher="${escHtml(msg.content)}" data-iv="${escHtml(msg.content_iv)}" data-sender="${escHtml(msg.sender_id)}"`
                : '';

            return `<div class="chat-msg ${cls}${extraCls}" data-msg-id="${msg.id}" data-is-mine="${isMine}" data-msg-type="text">
                ${bookmarkIcon}
                <div class="chat-reply-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg></div>
                <div ${decryptAttrs} class="chat-msg-payload">${displayText}</div>
                <div class="chat-msg-time">${time}</div>
                ${reactionHtml}
            </div>`;
        }

        function renderDecryptedPayload(parsed) {
            let html = '';

            // 1. Reply block
            if (parsed.reply_to) {
                let previewContent = escHtml(parsed.reply_to.text || '');
                let extraAttrs = '';
                const thumbUrl = parsed.reply_to.thumbUrl || '';

                if (parsed.reply_to.type === 'image' || parsed.reply_to.type === 'post') {
                    const path = parsed.reply_to.url || '';
                    const isE2EE = path.startsWith('chat_images/');
                    extraAttrs = isE2EE ? ` data-media-path="${escHtml(path)}"` : '';
                    
                    const label = parsed.reply_to.type === 'image' ? 'Photo' : 'Shared Post';
                    const icon = parsed.reply_to.type === 'post' ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:2px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>` : '';

                    previewContent = `<div style="display:flex; align-items:center; gap: 8px;">
                        <div style="width:32px; height:32px; border-radius:6px; overflow:hidden; background:rgba(255,255,255,0.1); flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                            <img src="${escHtml(thumbUrl || (isE2EE ? '' : path))}" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:2px;">
                            <span style="font-size:12px; font-weight:600; color:white; display:flex; align-items:center;">${icon}${label}</span>
                            ${parsed.reply_to.text ? `<span style="font-size:11px; opacity:0.6; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;">${escHtml(parsed.reply_to.text)}</span>` : ''}
                        </div>
                    </div>`;
                }

                html += `<div class="msg-reply-block" data-reply-id="${escHtml(parsed.reply_to.id || '')}" style="cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.7" onmouseout="this.style.opacity=1" ${extraAttrs}>
                    <div class="reply-name" style="font-size:11px; font-weight:700; color:#4ade80; margin-bottom:4px;">${escHtml(parsed.reply_to.name || 'Reply')}</div>
                    <div class="reply-text" style="font-size:12px; opacity:0.8; border-left: 2px solid rgba(255,255,255,0.2); padding-left: 8px; margin-bottom: 6px; line-height: 1.2;">${previewContent}</div>
                </div>`;
            }

            // 2. Shared Post 
            if (parsed.share_post_id) {
                const uniqueId = `shared-post-mount-${parsed.share_post_id}-${Math.random().toString(36).substr(2, 9)}`;
                html += `<div id="${uniqueId}" class="shared-post-container" data-post-id="${escHtml(parsed.share_post_id)}" style="overflow: hidden; margin-bottom: 8px; transform-origin: top left; min-height: 100px; display: flex; align-items: center; justify-content: center;">
                </div>`;

                // Dispatch event to app to mount React component
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('render_shared_post', {
                        detail: { postId: parsed.share_post_id, containerId: uniqueId }
                    }));
                }, 100);
            }

            // 3. Regular Text
            if (parsed.text) {
                // Ensure whitespace wrap and linkify URLs
                html += `<div class="msg-text-content" style="white-space: pre-wrap;">${linkifyText(parsed.text)}</div>`;
            }

            // 4. OpenGraph preview
            if (parsed.og_data) {
                const og = parsed.og_data;
                const imgHtml = og.image ? `<img src="${escHtml(og.image)}" style="width:100%; height:120px; object-fit:cover; border-radius: 8px 8px 0 0;" onerror="this.style.display='none'">` : '';
                html += `
                <a href="${escHtml(og.url)}" target="_blank" rel="noopener noreferrer" class="og-preview-card" style="display:block; margin-top:8px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.1); border-radius:10px; text-decoration:none; color:inherit; overflow:hidden;">
                    ${imgHtml}
                    <div style="padding:10px;">
                        <div style="font-size:10px; font-weight:700; color:#2f8bff; text-transform:uppercase; margin-bottom:4px; letter-spacing:0.05em;">${escHtml(og.site_name || new URL(og.url).hostname)}</div>
                        <div style="font-size:13px; font-weight:600; line-height:1.3; margin-bottom:4px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escHtml(og.title || og.url)}</div>
                        ${og.description ? `<div style="font-size:11px; opacity:0.7; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escHtml(og.description)}</div>` : ''}
                    </div>
                </a>`;
            }

            return html;
        }

        function renderE2EEBanner() {
            return `
                <div class="e2ee-banner">
                    <div class="e2ee-banner-row">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Messages are end-to-end encrypted
                    </div>
                    <div class="e2ee-sub">
                        Only you and the person you're chatting with can read your messages. Not even PlusOpinion can read them.
                    </div>
                    <div class="e2ee-key-warning">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                        <span>Your encryption keys are stored only on this device. If you clear your browser data for PlusOpinion, previous messages will become permanently unreadable.</span>
                    </div>
                </div>`;
        }

        function appendMessageUI(msg) {
            const msgList = document.getElementById('chat-messages-list');
            if (!msgList) return;
            const uid = S.currentUser?.id;
            const div = document.createElement('div');
            div.innerHTML = renderMessageBubble(msg, uid, [], false);
            const bubble = div.firstElementChild;
            if (bubble) {
                // Insert before scroll anchor
                const anchor = document.getElementById('chat-scroll-anchor');
                if (anchor) msgList.insertBefore(bubble, anchor);
                else msgList.appendChild(bubble);
                attachMessageLongPress(bubble);
                scrollChatToBottom();
            }
        }

        function scrollChatToBottom() {
            const anchor = document.getElementById('chat-scroll-anchor');
            if (anchor) {
                anchor.scrollIntoView({ behavior: 'instant', block: 'end' });
                return;
            }
            const el = document.getElementById('chat-messages-list');
            if (el) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
                });
            }
        }

        // ─── LONG PRESS ON MESSAGES ─────────────────────────────────
        let msgLongPressTimer = null;
        let msgLongPressTarget = null;

        function attachMessageLongPress(container) {
            const msgs = container.classList?.contains('chat-msg')
                ? [container]
                : Array.from(container.querySelectorAll('.chat-msg'));

            msgs.forEach(msg => {
                // Avoid re-attaching
                if (msg.dataset.lpAttached) return;
                msg.dataset.lpAttached = '1';

                const start = (e) => {
                    msgLongPressTarget = msg;
                    msg.classList.add('long-pressing');
                    msgLongPressTimer = setTimeout(() => {
                        msg.classList.remove('long-pressing');
                        vibrate(12);
                        showMsgOptionsSheet(msg);
                    }, 500);
                };
                const cancel = () => {
                    clearTimeout(msgLongPressTimer);
                    msg.classList.remove('long-pressing');
                };
                msg.addEventListener('touchstart', start, { passive: true });
                msg.addEventListener('touchend', cancel, { passive: true });
                msg.addEventListener('touchmove', cancel, { passive: true });
                msg.addEventListener('mousedown', start);
                msg.addEventListener('mouseup', cancel);
                msg.addEventListener('mouseleave', cancel);
            });
        }

        function showMsgOptionsSheet(msgEl) {
            const msgId = msgEl.dataset.msgId;
            const isMine = msgEl.dataset.isMine === 'true';
            const msgType = msgEl.dataset.msgType;

            // Show/hide edit and delete (only for own text messages)
            document.getElementById('sheet-msg-edit').style.display = (isMine && msgType === 'text') ? 'flex' : 'none';
            document.getElementById('sheet-msg-delete').style.display = isMine ? 'flex' : 'none';

            // Check bookmark state
            const isBookmarked = !!msgEl.querySelector('.msg-bookmark-icon');
            document.getElementById('sheet-bookmark-label').textContent = isBookmarked ? 'Remove Bookmark' : 'Bookmark';

            const sheet = document.getElementById('msg-options-sheet');
            sheet.classList.add('open');

            // Close on overlay
            document.getElementById('msg-options-overlay').onclick = () => sheet.classList.remove('open');

            // Reaction emojis
            document.querySelectorAll('.msg-reaction-emoji').forEach(btn => {
                btn.onclick = async () => {
                    sheet.classList.remove('open');
                    await toggleReaction(msgId, btn.dataset.emoji, msgEl);
                };
            });

            // Bookmark
            document.getElementById('sheet-msg-bookmark').onclick = async () => {
                sheet.classList.remove('open');
                await toggleBookmark(msgId, msgEl, isBookmarked);
            };

            // Edit
            document.getElementById('sheet-msg-edit').onclick = () => {
                sheet.classList.remove('open');
                startInlineEdit(msgEl);
            };

            // Delete
            document.getElementById('sheet-msg-delete').onclick = async () => {
                sheet.classList.remove('open');
                await deleteMessage(msgId, msgEl);
            };
        }

        async function toggleReaction(msgId, emoji, msgEl) {
            const uid = S.currentUser.id;
            // Check if already reacted with this emoji
            const { data: existing } = await window.supabase
                .from('message_reactions')
                .select('id')
                .eq('message_id', msgId)
                .eq('user_id', uid)
                .eq('emoji', emoji)
                .maybeSingle();

            if (existing) {
                await window.supabase.from('message_reactions').delete().eq('id', existing.id);
            } else {
                await window.supabase.from('message_reactions').insert({ message_id: msgId, user_id: uid, emoji });
            }
            // Re-fetch reactions for this message and update UI
            const { data: allReactions } = await window.supabase
                .from('message_reactions').select('*').eq('message_id', msgId);
            const grouped = {};
            (allReactions || []).forEach(r => {
                if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, mine: false };
                grouped[r.emoji].count++;
                if (r.user_id === uid) grouped[r.emoji].mine = true;
            });
            let reactEl = msgEl.querySelector('.chat-msg-reactions');
            if (!reactEl) { reactEl = document.createElement('div'); reactEl.className = 'chat-msg-reactions'; msgEl.appendChild(reactEl); }
            reactEl.innerHTML = Object.entries(grouped).map(([em, d]) =>
                `<div class="chat-reaction-chip${d.mine ? ' mine' : ''}" data-emoji="${em}" data-msg-id="${msgId}">${em}<span class="chip-count">${d.count}</span></div>`
            ).join('');
        }

        async function toggleBookmark(msgId, msgEl, isCurrentlyBookmarked) {
            const uid = S.currentUser.id;
            if (isCurrentlyBookmarked) {
                await window.supabase.from('bookmarks').delete()
                    .eq('message_id', msgId).eq('user_id', uid);
                msgEl.querySelector('.msg-bookmark-icon')?.remove();
            } else {
                await window.supabase.from('bookmarks').insert({ message_id: msgId, user_id: uid });
                const icon = document.createElement('div');
                icon.className = 'msg-bookmark-icon';
                icon.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
                msgEl.appendChild(icon);
            }
        }

        async function deleteMessage(msgId, msgEl) {
            await window.supabase.from('messages').update({ deleted_at: new Date().toISOString() }).eq('id', msgId);
            msgEl.style.opacity = '0.3';
            msgEl.style.transform = 'scale(0.9)';
            msgEl.style.transition = 'all 0.3s';
            setTimeout(() => msgEl.remove(), 300);
        }

        function startInlineEdit(msgEl) {
            const payloadEl = msgEl.querySelector('.chat-msg-payload');
            if (!payloadEl) return;
            const msgId = msgEl.dataset.msgId;
            const current = payloadEl.querySelector('.msg-text-content')?.textContent || '';
            const input = document.createElement('textarea');
            input.value = current;
            input.style.cssText = 'width:100%;background:transparent;border:none;outline:none;color:inherit;font-size:14px;resize:none;font-family:inherit;';
            payloadEl.innerHTML = '';
            payloadEl.appendChild(input);
            input.focus();
            const save = async () => {
                const newText = input.value.trim();
                if (!newText || newText === current) { payloadEl.innerHTML = `<div class="msg-text-content" style="white-space:pre-wrap;">${linkifyText(current)}</div>`; return; }
                const { content, content_iv } = await window.InboxCrypto.encryptForUser(JSON.stringify({ text: newText }), S.currentUser.id, S.currentConv.otherId);
                await window.supabase.from('messages').update({ content, content_iv, is_edited: true }).eq('id', msgId);
                payloadEl.innerHTML = `<div class="msg-text-content" style="white-space:pre-wrap;">${linkifyText(newText)}</div><span style="font-size:9px;opacity:0.4;"> edited</span>`;
            };
            input.addEventListener('blur', save);
            input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); input.blur(); } });
        }

        // ─── CONV ROW LONG PRESS ───────────────────────────────────────────────
        function attachConvLongPress(row) {
            let lpTimer = null;
            const start = () => {
                row.classList.add('long-pressing');
                lpTimer = setTimeout(() => {
                    row.classList.remove('long-pressing');
                    vibrate(12);
                    showConvContextMenu(row);
                }, 500);
            };
            const cancel = () => { clearTimeout(lpTimer); row.classList.remove('long-pressing'); };
            row.addEventListener('touchstart', start, { passive: true });
            row.addEventListener('touchend', cancel);
            row.addEventListener('touchmove', cancel);
            row.addEventListener('mousedown', start);
            row.addEventListener('mouseup', cancel);
            row.addEventListener('mouseleave', cancel);
        }

        function showConvContextMenu(row) {
            const convId = row.dataset.id;
            const otherName = row.dataset.name || 'User';
            const conv = S.conversations.find(c => c.id === convId);

            document.getElementById('conv-ctx-title').textContent = otherName;
            document.getElementById('conv-ctx-remove-label').textContent = `Remove ${otherName}`;
            document.getElementById('conv-ctx-block-label').textContent = `Block ${otherName}`;

            const sheet = document.getElementById('conv-context-sheet');
            sheet.classList.add('open');
            document.getElementById('conv-ctx-overlay').onclick = () => sheet.classList.remove('open');

            document.getElementById('conv-ctx-remove').onclick = async () => { sheet.classList.remove('open'); if (conv) await removeConversation(conv.id); };
            document.getElementById('conv-ctx-delete').onclick = async () => { sheet.classList.remove('open'); if (conv) await deleteConversation(conv.id); };
            document.getElementById('conv-ctx-block').onclick = async () => { sheet.classList.remove('open'); if (conv) await blockUser(conv.otherId, conv.id); };
        }

        // ─── CHAT MORE MENU (3-DOT) ──────────────────────────────────────────
        function initChatMoreMenu() {
            document.getElementById('chat-more-btn').addEventListener('click', () => {
                if (!S.currentConv) return;
                const name = S.currentConv.otherName || 'User';
                document.getElementById('chat-more-sheet-title').textContent = name;
                document.getElementById('sheet-remove-label').textContent = `Remove ${name}`;
                document.getElementById('sheet-block-label').textContent = `Block ${name}`;

                const sheet = document.getElementById('chat-more-sheet');
                sheet.classList.add('open');
                document.getElementById('chat-more-overlay').onclick = () => sheet.classList.remove('open');

                document.getElementById('sheet-remove-user').onclick = async () => {
                    sheet.classList.remove('open');
                    await removeConversation(S.currentConv.id);
                    closeChatView();
                };
                document.getElementById('sheet-delete-chat').onclick = async () => {
                    sheet.classList.remove('open');
                    await deleteConversation(S.currentConv.id);
                    closeChatView();
                };
                document.getElementById('sheet-block-user').onclick = async () => {
                    sheet.classList.remove('open');
                    await blockUser(S.currentConv.otherId, S.currentConv.id);
                    closeChatView();
                };
            });
        }

        async function deleteConversation(convId) {
            const uid = S.currentUser.id;
            const { data: conv } = await window.supabase.from('conversations').select('participant_1_id').eq('id', convId).single();
            if (!conv) return;

            const isP1 = conv.participant_1_id === uid;
            const updateObj = isP1 ? { is_deleted_by_p1: true } : { is_deleted_by_p2: true };

            await window.supabase.from('conversations').update(updateObj).eq('id', convId);
            S.conversations = S.conversations.filter(c => c.id !== convId);
            closeChatView();
            renderConversationsList();
        }

        async function removeConversation(convId) {
            const uid = S.currentUser.id;
            const { data: conv } = await window.supabase.from('conversations').select('participant_1_id').eq('id', convId).single();
            if (!conv) return;

            const isP1 = conv.participant_1_id === uid;
            const updateObj = isP1 ? { removed_by_p1: true } : { removed_by_p2: true };

            await window.supabase.from('conversations').update(updateObj).eq('id', convId);
            S.conversations = S.conversations.filter(c => c.id !== convId);
            closeChatView();
            renderConversationsList();
        }

        async function blockUser(blockedId, convId) {
            const uid = S.currentUser.id;
            await window.supabase.from('profile_blocks').upsert({ blocker_id: uid, blocked_id: blockedId });
            if (convId) await deleteConversation(convId);
            else closeChatView();
        }

        // ─── NAVIGATE TO PROFILE ────────────────────────────────────────────────
        async function navigateToProfile(uid) {
            if (!uid) return;
            // Close inbox and navigate to public profile
            closeInbox();
            
            // For variety and compatibility, we use the standard physical file path directly
            // this ensures it works on all server configurations (localhost, cloudflare, etc.)
            window.location.href = `PUBLIC POV PROFILE.HTML?id=${uid}`;
        }

        // ─── LIVE TIMESTAMP REFRESH ──────────────────────────────────────────────
        function startTimestampRefresh() {
            setInterval(() => {
                document.querySelectorAll('.inbox-conv-time[data-iso]').forEach(el => {
                    if (el.dataset.iso) el.textContent = fmtConvTime(el.dataset.iso);
                });
            }, 60000); // refresh every 60 seconds
        }

        let pendingImages = []; // Array of { file, objectURL }
        S.replyToMsg = null;

        function showReplyBanner(msgJson, visualThumbUrl) {
            S.replyToMsg = { ...msgJson, thumbUrl: visualThumbUrl };
            document.getElementById('chat-reply-name').textContent = msgJson.name || 'User';
            
            const replyTextEl = document.getElementById('chat-reply-text');
            if (msgJson.type === 'image' || msgJson.type === 'post') {
                const label = msgJson.type === 'image' ? 'Photo' : 'Shared Post';
                const icon = msgJson.type === 'post' ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:2px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>` : '';
                
                replyTextEl.innerHTML = `<div style="display:flex; align-items:center; gap: 8px;">
                    <div style="width:28px; height:28px; border-radius:4px; overflow:hidden; background:rgba(255,255,255,0.1); flex-shrink:0;">
                         <img src="${escHtml(visualThumbUrl || msgJson.url || '')}" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'">
                    </div>
                    <span style="font-weight: 600; font-size:12px; display:flex; align-items:center;">${icon}${label}</span>
                </div>`;
            } else {
                let preview = msgJson.text || 'Message';
                if (preview.length > 80) preview = preview.substring(0, 80) + '…';
                replyTextEl.textContent = preview;
            }
            
            document.getElementById('inbox-reply-banner-container').style.display = 'block';
            document.getElementById('chat-text-input').focus();
        }

        function hideReplyBanner() {
            S.replyToMsg = null;
            document.getElementById('inbox-reply-banner-container').style.display = 'none';
        }

        function initSwipeToReply() {
            const list = document.getElementById('chat-messages-list');
            if (!list) return;

            let startX = 0, startY = 0, tracking = false, targetMsg = null;

            list.addEventListener('touchstart', (e) => {
                const msg = e.target.closest('.chat-msg');
                if (!msg) return;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                tracking = true;
                targetMsg = msg;
                msg.style.transition = 'none';
            }, { passive: true });

            list.addEventListener('touchmove', (e) => {
                if (!tracking || !targetMsg) return;
                const dx = e.touches[0].clientX - startX;
                const dy = e.touches[0].clientY - startY;

                // Cancel if vertical scroll
                if (Math.abs(dy) > Math.abs(dx)) {
                    tracking = false;
                    targetMsg.style.transform = '';
                    targetMsg.classList.remove('reply-active');
                    return;
                }

                if (dx > 0) { // Only right swipes
                    targetMsg.style.transform = `translateX(${Math.min(dx, 80)}px)`;
                    if (dx > 50) targetMsg.classList.add('reply-active');
                    else targetMsg.classList.remove('reply-active');
                }
            }, { passive: true });

            list.addEventListener('touchend', (e) => {
                if (!tracking || !targetMsg) return;
                tracking = false;
                targetMsg.style.transition = 'transform 0.2s cubic-bezier(0.1, 0.9, 0.2, 1)';
                targetMsg.style.transform = '';

                if (targetMsg.classList.contains('reply-active')) {
                    targetMsg.classList.remove('reply-active');

                    let msgType = targetMsg.dataset.msgType || 'text';
                    let previewData = {};
                    let visualThumbUrl = '';
                    
                    if (msgType === 'image') {
                        let path = targetMsg.dataset.mediaPath || '';
                        const img = targetMsg.querySelector('img');
                        visualThumbUrl = img ? img.src : path; 
                        previewData = { type: 'image', url: path };
                    } else if (targetMsg.classList.contains('shared-post-only')) {
                        let postContainer = targetMsg.querySelector('.shared-post-container');
                        const postImg = postContainer?.querySelector('img');
                        visualThumbUrl = postImg ? postImg.src : '';
                        previewData = { type: 'post', postId: postContainer?.dataset.postId || '' };
                    } else {
                        const payloadEl = targetMsg.querySelector('.chat-msg-payload');
                        if (payloadEl) {
                            const clone = payloadEl.cloneNode(true);
                            const replyBlock = clone.querySelector('.msg-reply-block');
                            if (replyBlock) replyBlock.remove();
                            let txt = clone.textContent.trim();
                            
                            const postContainer = clone.querySelector('.shared-post-container');
                            if (postContainer) {
                                const postImg = postContainer.querySelector('img');
                                visualThumbUrl = postImg ? postImg.src : '';
                                previewData = { type: 'post', postId: postContainer.dataset.postId || '', text: txt };
                            } else {
                                previewData = { type: 'text', text: txt };
                            }
                        }
                    }

                    const senderName = targetMsg.classList.contains('mine') ? 'You' : S.currentConv.otherName;

                    showReplyBanner({ id: targetMsg.dataset.msgId, name: senderName, ...previewData }, visualThumbUrl);
                    vibrate(10);
                }
                targetMsg = null;
            });

            document.getElementById('chat-reply-close-btn')?.addEventListener('click', hideReplyBanner);
        }

        function openChatImageViewer(src) {
            if (!src || src.startsWith('data:image/gif')) return;
            
            let viewer = document.getElementById('chat-fullscreen-viewer');
            if (!viewer) {
                viewer = document.createElement('div');
                viewer.id = 'chat-fullscreen-viewer';
                viewer.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.98); z-index: 100000;
                    display: flex; align-items: center; justify-content: center;
                    opacity: 0; transition: opacity 0.25s ease; overflow: hidden;
                    touch-action: none;
                `;
                
                const closeBtn = document.createElement('div');
                closeBtn.innerHTML = '✕';
                closeBtn.style.cssText = `
                    position: absolute; top: 20px; right: 20px;
                    color: white; font-size: 24px; font-weight: bold;
                    width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
                    background: rgba(0,0,0,0.5); border-radius: 50%; padding-bottom: 2px; 
                    transition: background 0.2s; z-index: 10; cursor: pointer;
                `;
                
                const img = document.createElement('img');
                img.id = 'chat-fullscreen-img';
                img.style.cssText = `
                    max-width: 95vw; max-height: 90vh; object-fit: contain;
                    border-radius: 8px; transform: scale(0.95); transition: transform 0.2s ease-out;
                    cursor: grab;
                `;
                
                let scale = 1;
                let lastScale = 1;
                let offsetX = 0;
                let offsetY = 0;
                let isDragging = false;
                let startDist = 0;
                let startX = 0;
                let startY = 0;

                const updateTransform = () => {
                    img.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
                };

                const closeViewer = () => {
                    viewer.style.opacity = '0';
                    img.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        viewer.style.display = 'none';
                        scale = 1;
                        offsetX = 0;
                        offsetY = 0;
                        updateTransform();
                    }, 250);
                };

                closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    closeViewer();
                };

                img.addEventListener('mousedown', (e) => {
                    if (scale <= 1) return;
                    isDragging = true;
                    startX = e.clientX - offsetX;
                    startY = e.clientY - offsetY;
                    img.style.cursor = 'grabbing';
                });

                window.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    offsetX = e.clientX - startX;
                    offsetY = e.clientY - startY;
                    updateTransform();
                });

                window.addEventListener('mouseup', () => {
                    isDragging = false;
                    img.style.cursor = scale > 1 ? 'grab' : 'default';
                });

                img.addEventListener('touchstart', (e) => {
                    if (e.touches.length === 2) {
                        startDist = Math.hypot(
                            e.touches[0].pageX - e.touches[1].pageX,
                            e.touches[0].pageY - e.touches[1].pageY
                        );
                        lastScale = scale;
                    } else if (e.touches.length === 1) {
                        startX = e.touches[0].pageX - offsetX;
                        startY = e.touches[0].pageY - offsetY;
                        isDragging = true;
                    }
                }, { passive: false });

                img.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    if (e.touches.length === 2) {
                        const dist = Math.hypot(
                            e.touches[0].pageX - e.touches[1].pageX,
                            e.touches[0].pageY - e.touches[1].pageY
                        );
                        scale = Math.min(Math.max(1, lastScale * (dist / startDist)), 4);
                        updateTransform();
                    } else if (e.touches.length === 1 && isDragging) {
                        offsetX = e.touches[0].pageX - startX;
                        offsetY = e.touches[0].pageY - startY;
                        updateTransform();
                    }
                }, { passive: false });

                img.addEventListener('touchend', () => {
                    isDragging = false;
                    if (scale < 1.1) {
                        scale = 1;
                        offsetX = 0;
                        offsetY = 0;
                        updateTransform();
                    }
                });

                viewer.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.2 : 0.2;
                    scale = Math.min(Math.max(1, scale + delta), 4);
                    if (scale <= 1) {
                        scale = 1;
                        offsetX = 0;
                        offsetY = 0;
                    }
                    updateTransform();
                }, { passive: false });

                viewer.addEventListener('click', (e) => {
                    if (e.target === viewer) closeViewer();
                });

                viewer.appendChild(img);
                viewer.appendChild(closeBtn);
                document.body.appendChild(viewer); 
            }

            const img = document.getElementById('chat-fullscreen-img');
            img.src = src;
            viewer.style.display = 'flex';
            setTimeout(() => {
                viewer.style.opacity = '1';
                img.style.transform = 'scale(1)';
            }, 10);
        }

        function initChatInteractions() {
            const list = document.getElementById('chat-messages-list');
            if (!list) return;

            list.addEventListener('click', (e) => {
                // 1. Reply block click
                const replyBlock = e.target.closest('.msg-reply-block');
                if (replyBlock) {
                    const replyId = replyBlock.dataset.replyId;
                    if (replyId) {
                        const targetMsg = document.querySelector(`.chat-msg[data-msg-id="${replyId}"]`);
                        if (targetMsg) {
                            targetMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            targetMsg.style.transition = 'background-color 0.4s ease';
                            const oldBg = targetMsg.style.backgroundColor;
                            targetMsg.style.backgroundColor = 'rgba(74, 222, 128, 0.25)';
                            setTimeout(() => {
                                targetMsg.style.backgroundColor = oldBg;
                                setTimeout(() => targetMsg.style.transition = '', 400);
                            }, 1200);
                        } else {
                            // Message is higher up and unloaded. For now just shake or ignore
                            replyBlock.style.transform = 'translateX(2px)';
                            setTimeout(() => replyBlock.style.transform = 'translateX(-2px)', 100);
                            setTimeout(() => replyBlock.style.transform = '', 200);
                        }
                    }
                    return;
                }

                // 2. Image click (fullscreen)
                const imgMsg = e.target.closest('.direct-img');
                if (imgMsg && e.target.tagName === 'IMG') {
                    openChatImageViewer(e.target.src);
                    return;
                }
            });
        }

        function initChatInput() {
            initSwipeToReply();
            initChatInteractions();

            const textInput = document.getElementById('chat-text-input');
            const sendBtn = document.getElementById('chat-send-btn');
            const attachBtn = document.getElementById('chat-attach-btn');
            const fileInput = document.getElementById('chat-file-input');

            const updateSendState = () => {
                const hasText = textInput.value.trim().length > 0;
                const hasImages = pendingImages.length > 0;
                sendBtn.disabled = !hasText && !hasImages;
            };

            textInput.addEventListener('input', () => {
                // Auto-grow
                textInput.style.height = 'auto';
                textInput.style.height = Math.min(textInput.scrollHeight, 120) + 'px';
                updateSendState();
            });

            sendBtn.addEventListener('click', async () => {
                if (!S.currentConv) return;
                const text = textInput.value.trim();
                const files = pendingImages.map(p => p.file);

                const payload = {};
                if (S.replyToMsg) {
                    payload.reply_to = S.replyToMsg;
                    hideReplyBanner();
                }

                textInput.value = '';
                textInput.style.height = 'auto';
                clearImagePreviews();
                sendBtn.disabled = true;

                await sendMessage(S.currentConv.id, text, files, payload);
            });

            textInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendBtn.click();
                }
            });

            attachBtn.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files || []);
                e.target.value = '';

                for (const file of files) {
                    // Reject video files — politely
                    if (file.type.startsWith('video/')) {
                        showVideoNotSupported();
                        continue;
                    }
                    if (!file.type.startsWith('image/')) continue;
                    if (pendingImages.length >= 5) break;

                    const objURL = URL.createObjectURL(file);
                    pendingImages.push({ file, objectURL: objURL });
                }

                renderImagePreviews();
                updateSendState();
            });
        }

        function showVideoNotSupported() {
            const msgList = document.getElementById('chat-messages-list');
            const notice = document.createElement('div');
            notice.className = 'video-not-supported';
            notice.innerHTML = `
                🎥 <strong>Video messages aren't available yet</strong><br>
                We're working hard to bring video messaging to PlusOpinion very soon. For now, you can share images, GIFs, emojis and stickers. Thanks for your patience! 🙏`;
            msgList.appendChild(notice);
            scrollChatToBottom();
            setTimeout(() => notice.remove(), 6000);
        }

        function renderImagePreviews() {
            const bar = document.getElementById('chat-img-preview-bar');
            if (pendingImages.length === 0) { bar.style.display = 'none'; bar.innerHTML = ''; return; }
            bar.style.display = 'flex';
            bar.innerHTML = pendingImages.map((p, i) => `
                <div class="chat-img-thumb">
                    <img src="${p.objectURL}" alt="Preview">
                    <button class="chat-img-thumb-remove" data-idx="${i}">✕</button>
                </div>`).join('');
            bar.querySelectorAll('.chat-img-thumb-remove').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.idx);
                    URL.revokeObjectURL(pendingImages[idx].objectURL);
                    pendingImages.splice(idx, 1);
                    renderImagePreviews();
                    document.getElementById('chat-send-btn').disabled = pendingImages.length === 0
                        && !document.getElementById('chat-text-input').value.trim();
                });
            });
        }

        function clearImagePreviews() {
            pendingImages.forEach(p => URL.revokeObjectURL(p.objectURL));
            pendingImages = [];
            renderImagePreviews();
        }

        // ─── SEARCH ───────────────────────────────────────────────────
        function initSearch() {
            const input = document.getElementById('inbox-search-input');
            const results = document.getElementById('search-results-container');

            // When search overlay opens, show default state
            document.getElementById('inbox-search-fab').addEventListener('click', () => {
                if (!input.value.trim()) showSearchDefaultState();
            });

            input.addEventListener('input', () => {
                clearTimeout(S.searchDebounce);
                const q = input.value.trim();
                if (!q) { showSearchDefaultState(); return; }
                S.searchDebounce = setTimeout(() => runSearch(q), 300);
            });
        }

        async function showSearchDefaultState() {
            const results = document.getElementById('search-results-container');
            results.innerHTML = '<div class="inbox-loader"><div class="inbox-spinner"></div></div>';
            const uid = S.currentUser?.id;

            // Recent conversations (up to 5)
            const recentConvs = S.conversations.slice(0, 5);

            // Discover random people (only those with avatars and usernames)
            const { data: people } = await window.supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url')
                .neq('id', uid || '')
                .not('username', 'is', 'null')
                .not('avatar_url', 'is', 'null')
                .limit(8);

            let html = '';

            if (recentConvs.length > 0) {
                html += `<div class="search-section-label">Recent Chats</div>`;
                html += recentConvs.map(c => `
                    <div class="search-user-row" data-cid="${c.id}" data-oid="${c.otherId}">
                        <img class="search-user-avatar" src="${escHtml(c.otherAvatar || getDefaultAvatar())}" alt="" onerror="this.src='${getDefaultAvatar()}'">
                        <div class="search-user-info">
                            <div class="search-user-name">${escHtml(c.otherName)}</div>
                            <div class="search-user-handle">@${escHtml(c.otherUsername)}</div>
                        </div>
                    </div>`).join('');
            }

            if (people && people.length > 0) {
                html += `<div class="search-section-label">Discover People</div>`;
                html += people.map(u => `
                    <div class="search-user-row" data-oid="${u.id}">
                        <img class="search-user-avatar" src="${escHtml(window.rewriteMediaUrl ? window.rewriteMediaUrl(u.avatar_url) : (u.avatar_url || ''))}" alt="" onerror="this.src='${getDefaultAvatar()}'">
                        <div class="search-user-info">
                            <div class="search-user-name">${escHtml(u.full_name || u.username)}</div>
                            <div class="search-user-handle">@${escHtml(u.username)}</div>
                        </div>
                    </div>`).join('');
            }

            if (!html) {
                html = `<div class="search-default-empty"><div class="search-default-empty-icon">🔍</div><div>Search for people or conversations</div></div>`;
            }

            results.innerHTML = html;
            attachSearchRowClicks(results);
        }

        function attachSearchRowClicks(results) {
            results.querySelectorAll('.search-user-row').forEach(row => {
                const oid = row.dataset.oid;
                if (!oid) return;

                // Click avatar or name -> profile
                row.querySelector('.search-user-avatar').onclick = (e) => {
                    e.stopPropagation();
                    navigateToProfile(oid);
                };
                row.querySelector('.search-user-name').onclick = (e) => {
                    e.stopPropagation();
                    navigateToProfile(oid);
                };

                // click row generally -> start chat
                row.addEventListener('click', () => {
                    startConversation(oid);
                });
            });
        }

        async function runSearch(q) {
            const results = document.getElementById('search-results-container');
            results.innerHTML = '<div class="inbox-loader"><div class="inbox-spinner"></div></div>';

            const uid = S.currentUser?.id;
            const lq = q.toLowerCase();

            // 1. Filter existing conversations
            const matchedConvs = [...S.conversations, ...S.requests].filter(c =>
                c.otherName.toLowerCase().includes(lq) ||
                c.otherUsername.toLowerCase().includes(lq) ||
                (c.preview || '').toLowerCase().includes(lq)
            );

            // 2. Search global users
            const { data: users } = await window.supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url')
                .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
                .neq('id', uid)
                .limit(10);

            let html = '';

            if (matchedConvs.length > 0) {
                html += `<div class="search-section-label">Your Conversations</div>`;
                html += matchedConvs.map(c => `
                    <div class="search-user-row" data-cid="${c.id}" data-oid="${c.otherId}">
                        <img class="search-user-avatar" src="${escHtml(c.otherAvatar || getDefaultAvatar())}" alt=""
                             onerror="this.src='${getDefaultAvatar()}'">
                        <div class="search-user-info">
                            <div class="search-user-name">${escHtml(c.otherName)}</div>
                            <div class="search-user-handle">@${escHtml(c.otherUsername)}</div>
                        </div>
                    </div>`).join('');
            }

            if (users && users.length > 0) {
                html += `<div class="search-section-label">People on PlusOpinion</div>`;
                html += users.map(u => `
                    <div class="search-user-row" data-oid="${u.id}" style="cursor: pointer;">
                        <img class="search-user-avatar" src="${escHtml(window.rewriteMediaUrl ? window.rewriteMediaUrl(u.avatar_url) : u.avatar_url) || getDefaultAvatar()}" alt=""
                             onerror="this.src='${getDefaultAvatar()}'" style="cursor: pointer;">
                        <div class="search-user-info">
                            <div class="search-user-name" style="cursor: pointer; font-weight: 600;">${escHtml(u.full_name || u.username)}</div>
                            <div class="search-user-handle">@${escHtml(u.username)}</div>
                        </div>
                    </div>`).join('');
            }

            if (!html) {
                html = `<div class="search-no-results">No results for "${escHtml(q)}"</div>`;
            }

            results.innerHTML = html;
            attachSearchRowClicks(results);
        }

        // ─── INIT ─────────────────────────────────────────────────────
        async function init() {
            injectCSS();
            injectHTML();
            initButtons();

            // Wait for supabase + auth to be ready
            let attempts = 0;
            while ((!window.supabase || !window.getCurrentUser) && attempts < 60) {
                await new Promise(r => setTimeout(r, 100));
                attempts++;
            }

            try {
                S.currentUser = await window.getCurrentUser();
            } catch (e) { S.currentUser = null; }

            if (S.currentUser) {
                // Ensure E2EE keys are ready silently
                window.InboxCrypto?.ensureKeys(S.currentUser.id).catch(console.warn);
                subscribeGlobalRealtime();
            }

            initGestureEngine();
            initChatInput();
            initSearch();
            initChatMoreMenu();
            startTimestampRefresh();

            // Wire chat header elements → profile
            document.getElementById('chat-hdr-avatar').addEventListener('click', () => {
                if (S.currentConv) navigateToProfile(S.currentConv.otherId);
            });
            document.getElementById('chat-hdr-name').style.cursor = 'pointer';
            document.getElementById('chat-hdr-name').addEventListener('click', () => {
                if (S.currentConv) navigateToProfile(S.currentConv.otherId);
            });

            console.log('✅ Inbox panel fully initialized');
        }

        // Expose to Part 1 and Global App
        window.sendPostToUser = async function (convIdFallback, otherId, otherName, otherAvatar, post) {
            if (window.toggleInbox) window.toggleInbox(true, true); // Open inbox panel

            // Let startConversation handle UI setup, profile fetching, and conv creation
            const convId = await startConversation(otherId);
            if (convId) {
                await sendMessage(convId, '', null, { share_post_id: post.id });
            }
        };

        window.startInboxConversation = startConversation; // Expose globally for profile pages

        // Expose global methods for real-time unread count (mirroring notifications.js)
        window.getInboxUnreadCount = async function () {
            try {
                const user = await window.getCurrentUser();
                if (!user) return 0;

                // To get total unread count quickly without grouping:
                // find all messages where we are NOT the sender, read_at is null, 
                // and it belongs to a conversation we are a participant in.
                // An easier way is to just do exactly what loadConversations does under the hood,
                // but only return the count.
                const { data: convs } = await window.supabase
                    .from('conversations')
                    .select('id')
                    .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`);
                
                if (!convs || !convs.length) return 0;
                const convIds = convs.map(c => c.id);

                const { count, error } = await window.supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .in('conversation_id', convIds)
                    .is('read_at', null)
                    .neq('sender_id', user.id);

                if (error) throw error;
                return count || 0;
            } catch (err) {
                console.error('Error fetching inbox unread count:', err);
                return 0;
            }
        };

        window.subscribeToInboxUnreadCount = function (onCountChange) {
            if (!window.supabase) return () => { };

            let subscription = null;

            const setup = async () => {
                const user = await window.getCurrentUser();
                if (!user) return;

                // Initial fetch
                const count = await window.getInboxUnreadCount();
                if (onCountChange) onCountChange(count);
                // Dispatch event for other components
                window.dispatchEvent(new CustomEvent('inbox_unread_changed', { detail: count }));

                // We can just listen to the messages table where sender_id != user.id
                // Since RLS requires us to be in the conversation, this is safe.
                subscription = window.supabase
                    .channel('public:inbox:unread')
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'messages',
                        filter: `sender_id=neq.${user.id}`
                    }, async () => {
                        const newCount = await window.getInboxUnreadCount();
                        if (onCountChange) onCountChange(newCount);
                        // Dispatch event for other components
                        window.dispatchEvent(new CustomEvent('inbox_unread_changed', { detail: newCount }));
                    })
                    .subscribe();
            };

            setup();

            return () => {
                if (subscription) window.supabase.removeChannel(subscription);
            };
        };

        window._inboxBootPhase2 = {
            loadConversations,
            loadMessages,
            sendMessage,
            startConversation,
            acceptRequest,
            declineRequest,
            subscribeToMessages,
            renderRequestsView,
            clearImagePreviews
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

})();
