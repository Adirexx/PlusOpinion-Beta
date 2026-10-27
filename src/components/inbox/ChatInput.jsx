/**
 * ChatInput.jsx — Message Input Bar
 * ====================================
 * Ported from inbox_panel.js initChatInput().
 * Textarea, send button, attach button, auto-grow, Enter to send.
 */

import { useState, useRef, useCallback } from 'react'
import { useInbox } from '../../context/InboxContext'

export default function ChatInput() {
    const { sendMessage, pendingImages, setPendingImages, replyToMsg, setReplyToMsg, sendTypingEvent } = useInbox()
    const [text, setText] = useState('')
    const [sending, setSending] = useState(false)
    const textRef = useRef(null)
    const fileInputRef = useRef(null)

    const hasText = text.trim().length > 0
    const hasImages = pendingImages.length > 0
    const canSend = (hasText || hasImages) && !sending

    // Auto-grow textarea and emit typing event
    const typingDebounceRef = useRef(null)
    const handleInput = useCallback((e) => {
        setText(e.target.value)
        if (textRef.current) {
            textRef.current.style.height = 'auto'
            textRef.current.style.height = Math.min(textRef.current.scrollHeight, 120) + 'px'
        }
        
        // Typing indicator logic
        sendTypingEvent(true)
        if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current)
        typingDebounceRef.current = setTimeout(() => {
            sendTypingEvent(false)
        }, 3000)
    }, [sendTypingEvent])

    // Send message
    const handleSend = useCallback(async () => {
        if (!canSend) return
        setSending(true)

        const msgText = text.trim()
        const files = pendingImages.map(p => p.file)

        const payload = {}
        if (replyToMsg) {
            payload.reply_to = replyToMsg
            setReplyToMsg(null)
        }

        setText('')
        if (textRef.current) textRef.current.style.height = '40px'
        // Clear images
        pendingImages.forEach(p => URL.revokeObjectURL(p.objectURL))
        setPendingImages([])

        try {
            sendTypingEvent(false)
            if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current)
            await sendMessage(msgText, files.length > 0 ? files : null, payload)
        } catch (e) {
            console.error('[Inbox] Send error:', e)
        }

        setSending(false)
    }, [canSend, text, pendingImages, replyToMsg, sendMessage, setReplyToMsg, setPendingImages, sendTypingEvent])

    // Enter to send, Shift+Enter for newline
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }, [handleSend])

    const handleBlur = () => {
        sendTypingEvent(false)
    }

    // File attachment
    const handleFileChange = useCallback((e) => {
        const files = Array.from(e.target.files || [])
        e.target.value = ''

        const newImages = []
        for (const file of files) {
            if (file.type && file.type.startsWith('video/')) {
                continue
            }
            const isImg = (file.type && file.type.startsWith('image/')) ||
                /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name || '')
            if (!isImg) continue
            if (pendingImages.length + newImages.length >= 5) break

            const objURL = URL.createObjectURL(file)
            newImages.push({ file, objectURL: objURL })
        }

        if (newImages.length > 0) {
            if (typeof setPendingImages === 'function') {
                setPendingImages(prev => [...prev, ...newImages])
            }
        }
    }, [pendingImages, setPendingImages])

    return (
        <div className="chat-input-bar">
            <button
                type="button"
                className="chat-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach image"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
                </svg>
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg, image/png, image/webp, image/gif, image/heic, image/heif, image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            <textarea
                ref={textRef}
                className="chat-text-input"
                placeholder="Message…"
                rows={1}
                value={text}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
            />
            <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Send"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
            </button>
        </div>
    )
}
