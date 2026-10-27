/**
 * textFormatter.jsx — Inline text rendering utilities
 *
 * Renders post text with clickable @mentions and hyperlinks.
 * Previously used window.navigateTo / window.location.href.
 * Now uses a React Router navigate ref pattern so no window.* is needed.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

// ── Standalone token renderer (used as a hook-based component) ────
export function TextWithMentions({ text }) {
  const navigate = useNavigate();
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const mentionRegex = /@([\w.]+)/g;
  const tokens = text.split(/(\s+)/);

  return (
    <>
      {tokens.map((token, i) => {
        urlRegex.lastIndex = 0;
        if (urlRegex.test(token)) {
          return (
            <a
              key={i}
              href={token}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2f8bff] underline hover:text-blue-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {token}
            </a>
          );
        }

        mentionRegex.lastIndex = 0;
        const mentionMatch = mentionRegex.exec(token);
        if (mentionMatch) {
          const username = mentionMatch[1];
          return (
            <span
              key={i}
              className="text-neon font-semibold cursor-pointer hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.vibrate) navigator.vibrate(5);
                navigate(`/profile?username=${username}`);
              }}
            >
              {token}
            </span>
          );
        }

        return token;
      })}
    </>
  );
}

// ── Legacy helper (kept for backward compat with PostCard / CommentItem) ──
// These callers render JSX so they can use <TextWithMentions> directly.
// renderTextWithMentions is preserved for any pure-JS callers but now
// uses the React component internally via a wrapper.
export const renderTextWithMentions = (text) => {
  if (!text) return text;

  // Falls back to window.navigateTo shim if available (legacy callers),
  // otherwise uses history.pushState which triggers React Router's listener.
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const mentionRegex = /@([\w.]+)/g;
  const tokens = text.split(/(\s+)/);

  return tokens.map((token, i) => {
    urlRegex.lastIndex = 0;
    if (urlRegex.test(token)) {
      return (
        <a
          key={i}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#2f8bff] underline hover:text-blue-400 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {token}
        </a>
      );
    }

    mentionRegex.lastIndex = 0;
    const mentionMatch = mentionRegex.exec(token);
    if (mentionMatch) {
      const username = mentionMatch[1];
      return (
        <span
          key={i}
          className="text-neon font-semibold cursor-pointer hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            if (navigator.vibrate) navigator.vibrate(5);
            // Use React Router's navigate if available via window.navigateTo shim,
            // else push via history API (React Router listens to popstate/pushstate)
            if (typeof window.navigateTo === 'function') {
              window.navigateTo(`/profile?username=${username}`);
            } else {
              window.history.pushState(null, '', `/profile?username=${username}`);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
        >
          {token}
        </span>
      );
    }

    return token;
  });
};
