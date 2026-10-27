/**
 * EditModal.jsx — Post editing modal
 *
 * Ported from HOMEPAGE_FINAL.compiled.js L3922-3972.
 * Allows one-time editing of a post's text content.
 *
 * Changes from old source:
 *   - React.createElement → JSX
 *   - window.editPost → editPost import from lib/api
 *   - window.dispatchEvent('toast') → useToast() context
 */

import { useState, useEffect } from 'react';
import { editPost } from '../../lib/api/posts';

const EditModal = ({ isOpen, onClose, post, onSave }) => {
  const [text, setText] = useState(post?.text || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && post) setText(post.text);
  }, [isOpen, post]);

  const handleSave = async () => {
    if (!text.trim()) return;
    setIsSaving(true);
    try {
      await editPost(post.id, text);
      onSave(post.id, text);
      onClose();
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Opinion updated', icon: 'Check', isSuccess: true } }));
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: e.message || 'Failed to update', icon: 'AlertTriangle', isSuccess: false } }));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0A0F1D] border border-white/10 rounded-2xl w-[90%] max-w-lg p-6 relative shadow-2xl animate-scale-in">
        <h3 className="text-xl font-heading font-bold text-white mb-4">
          Edit Opinion
        </h3>
        <textarea
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white resize-none h-40 focus:outline-none focus:border-neon/50 transition-colors"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 rounded-lg text-sm font-medium bg-neon text-black font-bold hover:bg-neon/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
