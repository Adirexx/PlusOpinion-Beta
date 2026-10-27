import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Icon from '../ui/Icon';
import MentionAutocomplete from '../feed/MentionAutocomplete';
import { createPost, updatePost } from '../../lib/api/posts';
import { uploadMedia, uploadVerificationProof } from '../../lib/api/media';
import { getCategories } from '../../lib/api/categories';

const vibrate = (ms) => { if (navigator.vibrate) navigator.vibrate(ms); };

const OpinionModal = ({ isOpen, onClose, onPublished, userProfile, initialPost = null }) => {
            const [stage, setStage] = useState('IDLE');
            const [text, setText] = useState('');
            const [tagName, setTagName] = useState('');
            const [selectedCategory, setSelectedCategory] = useState('');
            const [showTagInput, setShowTagInput] = useState(false);
            const [mediaCount, setMediaCount] = useState(0);
            const [mediaFiles, setMediaFiles] = useState([]); // Store actual file URLs
            const fileInputRef = useRef(null);
            const verificationInputRef = useRef(null); // Ref for verification proof upload
            const [draftId, setDraftId] = useState(null); // ID if editing existing draft
            const [mentionQuery, setMentionQuery] = useState(null);

            const PREDEFINED_CATEGORIES = ['Electronics', 'Automotive', 'Software', 'Fashion', 'Tech', 'Food', 'Gaming', 'Lifestyle', 'Fitness', 'Beauty & Skin Care', 'Other'];

            const [mentionCoords, setMentionCoords] = useState({ top: 0, left: 0 });

            // Helper to get caret coordinates inside a textarea
            const getCaretCoordinates = (element, position) => {
                const div = document.createElement('div');
                const style = window.getComputedStyle(element);
                const properties = [
                    'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
                    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle',
                    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
                    'fontStyle', 'fontVariant', 'fontWeight', 'stretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily',
                    'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing', 'tabSize', 'MozTabSize'
                ];
                properties.forEach(prop => { div.style[prop] = style[prop]; });
                div.style.position = 'absolute';
                div.style.visibility = 'hidden';
                div.style.whiteSpace = 'pre-wrap';
                div.style.wordWrap = 'break-word';
                div.style.top = '0';
                div.style.left = '-9999px';
                div.textContent = element.value.substring(0, position);
                const span = document.createElement('span');
                span.textContent = element.value.substring(position) || '.';
                div.appendChild(span);
                document.body.appendChild(div);
                const coordinates = {
                    top: span.offsetTop + parseInt(style.borderTopWidth),
                    left: span.offsetLeft + parseInt(style.borderLeftWidth)
                };
                document.body.removeChild(div);
                return coordinates;
            };

            useEffect(() => {
                if (isOpen) {
                    setStage('WRITE');

                    // FETCH CATEGORIES DYNAMICALLY for tagging
                    const fetchCats = getCategories || window.getCategories;
                    if (fetchCats) {
                        fetchCats().then(cats => {
                            const catList = Array.isArray(cats) ? cats : [];
                            window.allCategories = catList; // Cache locally
                        }).catch(err => console.error("Error fetching categories for composer", err));
                    }

                    if (initialPost) {
                        // Enforce single edit limit on published opinions
                        if (!initialPost.is_draft && initialPost.is_edited) {
                            window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Opinions can only be edited once.', icon: 'Lock', isSuccess: false } }));
                            onClose();
                            return;
                        }

                        // EDIT MODE
                        setDraftId(initialPost.is_draft ? initialPost.id : null);
                        setText(initialPost.text_content || initialPost.text || '');
                        setTagName(initialPost.product_name || initialPost.product || '');
                        setSelectedCategory(initialPost.category || '');
                        if (initialPost.product_name || initialPost.product) setShowTagInput(true);

                        if (initialPost.images && Array.isArray(initialPost.images) && initialPost.images.length > 0) {
                            setMediaFiles(initialPost.images.map(url => ({ url, type: 'image/jpeg' })));
                            setMediaCount(initialPost.images.length);
                        } else if (initialPost.media_url || initialPost.media) {
                            const url = initialPost.media_url || initialPost.media;
                            const type = (initialPost.media_type === 'video' || url.includes('.mp4') || url.includes('/videos/')) ? 'video/mp4' : 'image/jpeg';
                            setMediaFiles([{ url, type }]);
                            setMediaCount(1);
                        } else {
                            setMediaFiles([]);
                            setMediaCount(0);
                        }
                    }
                    // Check for draft to edit (only if not editing existing post)
                    else {
                        const draftToEdit = localStorage.getItem('plusopinion_draft_edit');
                        if (draftToEdit) {
                            try {
                                const draft = JSON.parse(draftToEdit);
                                setDraftId(draft.id);
                                setText(draft.text_content || draft.text || '');
                                setTagName(draft.product_name || draft.product || '');
                                setSelectedCategory(draft.category || '');
                                if (draft.product_name || draft.product) setShowTagInput(true);
                                localStorage.removeItem('plusopinion_draft_edit');
                                window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Draft loaded', icon: 'Edit2', isSuccess: true } }));
                            } catch (e) { console.error("Error parsing draft", e); }
                        } else {
                            // Reset for new post
                            setDraftId(null);
                            setText('');
                            setTagName('');
                            setSelectedCategory('');
                            setShowTagInput(false);
                            setMediaCount(0);
                            setMediaFiles([]);
                        }
                    }

                } else {
                    setStage('IDLE');
                }
            }, [isOpen, initialPost]);

            const MIN_CHARS = 20;
            const MAX_CHARS = 400;
            const canPublish = text.length >= MIN_CHARS && text.length <= MAX_CHARS;

            const handleTextChange = (e) => {
                const val = e.target.value;
                if (val.length <= MAX_CHARS) setText(val);

                // Mention logic - allow full names with spaces
                const cursor = e.target.selectionStart;
                const atMatch = val.substring(0, cursor).match(/@([a-zA-Z0-9_. ]{1,30})$/);

                if (atMatch) {
                    setMentionQuery(atMatch[1]);
                    // Calculate coordinates for caret following
                    const coords = getCaretCoordinates(e.target, cursor);
                    setMentionCoords(coords);
                } else {
                    setMentionQuery(null);
                }
            };

            const handleMentionSelect = (user) => {
                const textarea = document.querySelector('textarea[placeholder*="mention"]');
                const cursor = textarea?.selectionStart || text.length;
                const textBeforeCursor = text.substring(0, cursor);
                const textAfterCursor = text.substring(cursor);
                const atIndex = textBeforeCursor.lastIndexOf('@');

                if (atIndex !== -1) {
                    const newTextBefore = textBeforeCursor.substring(0, atIndex) + '@' + user.username + ' ';
                    setText(newTextBefore + textAfterCursor);
                    setMentionQuery(null);
                    // Reset cursor position after React update
                    setTimeout(() => {
                        if (textarea) {
                            const newPos = newTextBefore.length;
                            textarea.focus();
                            textarea.setSelectionRange(newPos, newPos);
                        }
                    }, 0);
                }
            };

            const handleTagToggle = () => {
                if (!showTagInput) {
                    // Open category selector first
                    setShowTagInput(true);
                } else {
                    setShowTagInput(false);
                }
            };

            const selectCategory = (cat) => {
                const categoryName = typeof cat === 'object' ? cat.name : cat;
                setSelectedCategory(categoryName);
                // After selecting category, user can type product
            };


            const MAX_IMAGES = 4;
            const imageInputRef = useRef(null);
            const videoInputRef = useRef(null);
            const hasVideo = mediaFiles.some(f => f.type?.startsWith('video/'));
            const hasImages = mediaFiles.some(f => !f.type?.startsWith('video/'));

            // Handle multi-image selection (up to 4, images only)
            const handleImageSelect = (e) => {
                const files = Array.from(e.target.files || []);
                if (hasVideo) {
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Remove the video before adding images', icon: 'AlertTriangle', isSuccess: false } }));
                    e.target.value = '';
                    return;
                }
                const remaining = MAX_IMAGES - mediaFiles.filter(f => !f.type?.startsWith('video/')).length;
                if (files.length > remaining) {
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Max ${MAX_IMAGES} images. ${remaining} slot(s) remaining.`, icon: 'AlertTriangle', isSuccess: false } }));
                }
                const toAdd = files.slice(0, remaining);
                toAdd.forEach(file => {
                    if (file.size > 5 * 1024 * 1024) {
                        window.dispatchEvent(new CustomEvent('toast', { detail: { message: `${file.name} is too large. Max 5MB per image.`, icon: 'AlertTriangle', isSuccess: false } }));
                        return;
                    }
                    const url = URL.createObjectURL(file);
                    setMediaFiles(prev => [...prev, { url, file, type: file.type }]);
                    setMediaCount(prev => prev + 1);
                });
                e.target.value = '';
            };

            // Handle single video selection (no images allowed when video is set)
            const handleVideoSelect = (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    if (hasImages) {
                        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Remove all images before adding a video', icon: 'AlertTriangle', isSuccess: false } }));
                        e.target.value = '';
                        return;
                    }
                    if (file.size > 20 * 1024 * 1024) {
                        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Video too large. Max 20MB', icon: 'AlertTriangle', isSuccess: false } }));
                        e.target.value = '';
                        return;
                    }
                    // Replace any existing video (only 1 allowed)
                    const url = URL.createObjectURL(file);
                    setMediaFiles([{ url, file, type: file.type }]);
                    setMediaCount(1);
                }
                e.target.value = '';
            };

            const removeMedia = (index) => {
                setMediaFiles(prev => prev.filter((_, i) => i !== index));
                setMediaCount(prev => prev - 1);
            };

            const handleVerificationFileSelect = (e) => {
                if (e.target.files && e.target.files[0]) {
                    finishPublishing(true, e.target.files[0]);
                }
            };

            const handlePublish = () => { vibrate(10); setStage('VERIFY'); };

            const finishPublishing = async (isVerified, verificationFile = null) => {
                vibrate(5);
                setStage('SUBMITTING');

                const mediaItem = mediaFiles.length > 0 ? mediaFiles[0] : null;

                try {
                    // Upload verification proof if exists
                    let proofUrl = initialPost?.verification_proof_url || null; // PRESERVE EXISTING
                    if (isVerified && verificationFile) {
                        try {
                            const uploadProofFn = uploadVerificationProof || window.uploadVerificationProof;
                            proofUrl = await uploadProofFn(verificationFile);
                        } catch (uploadError) {
                            console.error("Verification upload failed", uploadError);
                            // Proceed without proof? or fail? Let's proceed but maybe warn.
                        }
                    }

                    // ── Upload Media ──────────────────────────────────
                    const imageItems = mediaFiles.filter(f => !f.type?.startsWith('video/'));
                    const videoItem = mediaFiles.find(f => f.type?.startsWith('video/'));

                    let mediaUrl = null;
                    let mediaType = null;
                    let imagesArray = null;

                    if (videoItem) {
                        // Single video
                        mediaType = 'video';
                        if (videoItem.file) {
                            try { mediaUrl = await uploadMedia(videoItem.file); }
                            catch (err) { throw new Error('Video upload failed: ' + err.message); }
                        } else if (initialPost?.media) {
                            mediaUrl = initialPost.media;
                        }
                    } else if (imageItems.length > 0) {
                        // Multiple images → upload all, save to images[]
                        mediaType = 'image';
                        const uploadedUrls = [];
                        for (const imgItem of imageItems) {
                            if (imgItem.file) {
                                try { uploadedUrls.push(await uploadMedia(imgItem.file)); }
                                catch (err) { throw new Error('Image upload failed: ' + err.message); }
                            } else {
                                uploadedUrls.push(imgItem.url); // Existing URL (edit mode)
                            }
                        }
                        if (uploadedUrls.length === 1) {
                            // Single image — use legacy media_url for backward compat
                            mediaUrl = uploadedUrls[0];
                        } else {
                            // Multiple images — save to images array
                            imagesArray = uploadedUrls;
                            mediaUrl = uploadedUrls[0]; // Keep first as fallback
                        }
                    } else if (initialPost?.media) {
                        // Preserve existing media when editing with no new upload
                        mediaUrl = initialPost.media;
                        mediaType = initialPost.media_type || 'image';
                        imagesArray = initialPost.images || null;
                    }

                    const postData = {
                        text_content: text,
                        product_name: tagName || "General",
                        category: selectedCategory || "Category",
                        is_verified_purchase: isVerified,
                        verification_proof_url: proofUrl,
                        media_url: mediaUrl,
                        media_type: mediaType,
                        images: imagesArray,
                        is_draft: false
                    };

                    if (initialPost && !initialPost.is_draft) {
                        // UPDATE EXISTING PUBLISHED POST
                        postData.is_edited = true;
                        // PRESERVE ORIGINAL CREATION DATE: DO NOT OVERWRITE created_at
                        const updatedPost = await updatePost(initialPost.id, postData);
                        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Opinion Updated!', icon: 'Check', isSuccess: true } }));
                        if (onPublished) onPublished(updatedPost, true);
                    } else if (initialPost?.is_draft || draftId) {
                        // PUBLISH DRAFT PUBLICLY
                        const targetDraftId = initialPost?.is_draft ? initialPost.id : draftId;
                        postData.is_draft = false;
                        // "the draft will have the same day timestamp when teh user has uploaded it publically, not teh daty when he drafted it"
                        postData.created_at = new Date().toISOString();
                        postData.is_edited = false;
                        const updatedPost = await updatePost(targetDraftId, postData);
                        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Draft Published!', icon: 'Zap', isSuccess: true } }));
                        if (onPublished) onPublished(updatedPost, false);
                    } else {
                        // Create new post
                        const newPost = await createPost(postData);
                        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Opinion Published!', icon: 'Zap', isSuccess: true } }));
                        if (onPublished) onPublished(newPost, false);
                    }

                    onClose();

                } catch (e) {
                    console.error("Publishing failed, resetting stage:", e);
                    setStage('WRITE'); // Go back to editing on error
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Publishing failed: ' + e.message, icon: 'AlertTriangle', isSuccess: false } }));
                }
            };

            const handleSaveDraft = async () => {
                if (initialPost && !initialPost.is_draft) {
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Published opinion cannot be saved as a draft', icon: 'AlertTriangle', isSuccess: false } }));
                    return;
                }
                if (!text.trim()) {
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Draft is empty', icon: 'AlertTriangle', isSuccess: false } }));
                    return;
                }

                vibrate(5);

                try {
                    const draftData = {
                        text_content: text,
                        product_name: tagName || "General",
                        category: selectedCategory || "Draft",
                        is_draft: true
                    };

                    const targetDraftId = initialPost?.is_draft ? initialPost.id : draftId;
                    if (targetDraftId) {
                        const updated = await updatePost(targetDraftId, draftData);
                        setDraftId(targetDraftId);
                        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Draft Updated', icon: 'Save', isSuccess: true } }));
                        window.dispatchEvent(new CustomEvent('draft:saved', { detail: { draft: updated || { id: targetDraftId, ...draftData } } }));
                    } else {
                        const newPost = await createPost(draftData);
                        setDraftId(newPost.id);
                        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Draft Saved', icon: 'Save', isSuccess: true } }));
                        window.dispatchEvent(new CustomEvent('draft:saved', { detail: { draft: newPost } }));
                    }
                } catch (e) {
                    console.error("Saving draft failed", e);
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to save draft', icon: 'AlertTriangle', isSuccess: false } }));
                }
            };

            if (!isOpen) return null;

            return (
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
                    <div className={`w-full max-w-sm bg-[#0A0F1D] border border-[#2f8bff]/20 rounded-[24px] shadow-2xl overflow-visible flex flex-col relative z-10 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'}`} style={{ height: '580px' }}>
                        <div className="px-6 pt-5 pb-2 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                {stage === 'VERIFY' && (
                                    <button
                                        onClick={() => { vibrate(5); setStage('WRITE'); }}
                                        className="p-1 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white"
                                    >
                                        <Icon icon="ArrowLeft" size={24} />
                                    </button>
                                )}
                                <h2 className="text-xl font-heading font-bold text-white tracking-wide">
                                    {initialPost && !initialPost.is_draft ? 'Edit Opinion' : (initialPost?.is_draft || draftId) ? 'Edit Draft' : 'Draft Opinion'}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {(!initialPost || initialPost.is_draft) && (
                                    <button onClick={handleSaveDraft} className="text-[10px] font-bold text-slate-400 bg-white/5 px-3 py-1 rounded tracking-widest border border-white/10 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1"><Icon icon="Save" size={10} /> SAVE DRAFT</button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col relative overflow-visible">
                            {stage === 'WRITE' && (
                                <>
                                    <div className="flex-1 px-6 py-2 relative">
                                        <MentionAutocomplete query={mentionQuery} onSelect={handleMentionSelect} direction="down" coords={mentionCoords} />
                                        <textarea value={text} onChange={handleTextChange} placeholder="Share, what's your opinion or type @ to mention..." className="w-full h-full bg-transparent text-lg text-white placeholder-slate-600 outline-none resize-none font-light leading-relaxed custom-scrollbar pb-6" autoFocus={false} />
                                        <div className={`absolute bottom-2 right-6 text-[10px] font-medium transition-colors ${text.length < MIN_CHARS || text.length === MAX_CHARS ? 'text-neon' : 'text-slate-600'}`}>{text.length} / {MAX_CHARS}</div>
                                    </div>
                                    <div className="px-6 pb-2">
                                        {(tagName || selectedCategory) && !showTagInput && (
                                            <div className="inline-flex items-center gap-2 mb-3 bg-[#2f8bff]/10 border border-[#2f8bff]/20 px-3 py-1.5 rounded-lg text-[#2f8bff] text-sm animate-fade-in">
                                                <Icon icon="Tag" size={14} className="fill-current" />
                                                <span>{selectedCategory ? `${selectedCategory}` : ''} {tagName ? `/ ${tagName}` : ''}</span>
                                                <button onClick={() => { setTagName(''); setSelectedCategory(''); setShowTagInput(true); }}><Icon icon="X" size={12} /></button>
                                            </div>
                                        )}

                                        {!showTagInput && !tagName && !selectedCategory && (
                                            <button onClick={handleTagToggle} className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2 py-2">
                                                <Icon icon="Tag" size={16} /> Tag Category & Product
                                            </button>
                                        )}
                                        {showTagInput && (
                                            <div className="bg-[#161922] rounded-xl p-4 border border-white/10 animate-fade-in mb-3 shadow-2xl relative">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Category</h4>
                                                    <button
                                                        onClick={() => setShowTagInput(false)}
                                                        className="text-white/40 hover:text-white"
                                                    >
                                                        <Icon icon="X" size={14} />
                                                    </button>
                                                </div>

                                                {/* CATEGORY CHIPS - ORIGINAL AESTHETICS & ALPHABETICAL */}
                                                <div className="mb-4">
                                                    <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto no-scrollbar">
                                                        {[
                                                            'Automotive', 'Beauty & Skin Care', 'Education', 'Electronics', 'Fashion',
                                                            'Finance', 'Fitness', 'Food & Bev', 'Gaming', 'Health',
                                                            'Home', 'Office', 'Personal Care', 'Pets',
                                                            'Science', 'Sports', 'Technology', 'Travel', 'Others'
                                                        ].sort().map(cat => (
                                                            <button
                                                                key={cat}
                                                                onClick={() => selectCategory(cat)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 ${selectedCategory === cat ? 'bg-neon/20 border-neon text-neon' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                                                            >
                                                                {cat}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* INPUT FIELDS - STABILIZED */}
                                                <div className="space-y-3 relative pt-2">
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Icon icon="Grid" size={14} /></div>
                                                        <input
                                                            type="text"
                                                            value={selectedCategory}
                                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && setShowTagInput(false)}
                                                            placeholder="Or type custom category..."
                                                            className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl pl-10 pr-12 py-3 text-sm text-white focus:border-neon/50 outline-none transition-all placeholder-white/20"
                                                        />
                                                        {/* Finalize Button integrated into input */}
                                                        <button
                                                            onClick={() => { vibrate(5); setShowTagInput(false); }}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neon hover:bg-neon/10 rounded-lg transition-colors border border-neon/20"
                                                            title="Finalize Tag"
                                                        >
                                                            <Icon icon="CornerDownLeft" size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="relative">
                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Icon icon="Tag" size={14} /></div>
                                                        <input
                                                            type="text"
                                                            value={tagName}
                                                            onChange={(e) => setTagName(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && setShowTagInput(false)}
                                                            placeholder="Brand/Model Name"
                                                            className="w-full bg-[#0A0F1D] border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm text-white focus:border-neon/50 outline-none transition-all placeholder-white/20"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {mediaFiles.length > 0 && (
                                            <div className="flex gap-2 mb-3 overflow-x-auto">
                                                {mediaFiles.map((src, i) => (
                                                    <div key={i} className="w-16 h-16 bg-slate-800 rounded-lg border border-white/10 flex-shrink-0 animate-pop relative overflow-hidden group">
                                                        {src.type?.startsWith('video') ? (
                                                            <video src={src.url} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <img src={src.url} className="w-full h-full object-cover" alt="attachment" />
                                                        )}
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            {src.type?.startsWith('video') && <Icon icon="Video" size={16} className="text-white drop-shadow-md" />}
                                                        </div>
                                                        <button onClick={() => removeMedia(i)} className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white hover:bg-red-500 transition-colors pointer-events-auto">
                                                            <Icon icon="X" size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {!tagName && !selectedCategory && text.length > 0 && !showTagInput && (<div className="text-[10px] text-slate-500 mb-2 font-medium">Tag product for better reach</div>)}
                                    </div>

                                    <div className="px-5 py-4 bg-[#020205]/50 border-t border-white/5 backdrop-blur-md flex justify-between items-center">
                                        <div className="flex gap-3">
                                            <button onClick={handleTagToggle} className={`p-2 rounded-full transition-all duration-300 ${tagName || showTagInput ? 'text-[#2f8bff] bg-[#2f8bff]/10' : 'text-[#2f8bff] hover:bg-white/10'}`}><Icon icon="Tag" size={20} className={`${tagName || showTagInput ? "fill-[#2f8bff]" : ""} stroke-current`} /></button>

                                            {/* Hidden file inputs */}
                                            <input type="file" ref={imageInputRef} className="hidden" accept="image/jpeg, image/png, image/webp, image/gif, image/heic, image/heif, image/*" multiple="multiple" onChange={handleImageSelect} />
                                            <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoSelect} />

                                            {/* Image button — disabled if video exists or max images reached */}
                                            <button
                                                onClick={() => imageInputRef.current?.click()}
                                                disabled={hasVideo || mediaFiles.filter(f => !f.type?.startsWith('video/')).length >= MAX_IMAGES}
                                                className={`p-2 rounded-full transition-colors flex items-center gap-1 ${hasVideo || mediaFiles.filter(f => !f.type?.startsWith('video/')).length >= MAX_IMAGES
                                                    ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white'
                                                    }`}
                                                title={hasVideo ? 'Remove video first' : `Add images (${mediaFiles.filter(f => !f.type?.startsWith('video/')).length}/${MAX_IMAGES})`}
                                            >
                                                <Icon icon="Image" size={18} />
                                                {mediaFiles.filter(f => !f.type?.startsWith('video/')).length > 0 && (
                                                    <span className="text-[9px] font-bold text-neon">{mediaFiles.filter(f => !f.type?.startsWith('video/')).length}</span>
                                                )}
                                            </button>

                                            {/* Video button — disabled if images exist or video already selected */}
                                            <button
                                                onClick={() => videoInputRef.current?.click()}
                                                disabled={hasImages || hasVideo}
                                                className={`p-2 rounded-full transition-colors ${hasImages || hasVideo
                                                    ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white'
                                                    }`}
                                                title={hasImages ? 'Remove images first' : hasVideo ? '1 video selected' : 'Add video'}
                                            >
                                                <Icon icon="Video" size={18} />
                                            </button>
                                        </div>
                                        <button disabled={!canPublish} onClick={handlePublish} className={`px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${canPublish ? 'bg-white text-black hover:scale-105 shadow-lg shadow-white/10' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>Publish</button>
                                    </div>
                                </>
                            )}
                            {stage === 'VERIFY' && (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in relative">
                                    <div className="w-16 h-16 rounded-full bg-[#2f8bff]/10 flex items-center justify-center mb-6 text-[#2f8bff] border border-[#2f8bff]/20"><Icon icon="ShieldCheck" size={36} /></div>
                                    <h3 className="text-xl font-heading font-bold text-white mb-3">Verify Authenticity</h3>
                                    <p className="text-sm text-slate-400 mb-8 leading-relaxed font-light px-2">To maintain community trust, we verify ownership. Attaching a receipt or screenshot significantly improves your <span className="text-white font-medium">Reputation Quality Score (RQS)</span>.</p>

                                    <input type="file" ref={verificationInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleVerificationFileSelect} />

                                    <button onClick={() => verificationInputRef.current?.click()} className="w-full py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white mb-4 hover:bg-slate-700 transition-colors flex items-center justify-center gap-3 group"><Icon icon="Upload" size={18} className="group-hover:-translate-y-1 transition-transform" /> <span>Upload Purchase Proof</span></button>
                                    <button onClick={() => finishPublishing(false)} className="text-xs text-slate-500 hover:text-white transition-colors tracking-wide">Skip Verification</button>
                                </div>
                            )}
                            {stage === 'SUBMITTING' && (
                                <div className="flex-1 flex flex-col items-start justify-center p-8 animate-fade-in bg-[#0A0F1D] w-full">
                                    <div className="font-sans text-sm space-y-4 w-full pl-2">
                                        <div className="flex items-center gap-3 text-slate-300"><span className="w-2 h-2 rounded-full bg-[#6BFFB6]"></span> Uploading photo...</div>
                                        <div className="flex items-center gap-3 text-slate-300 animate-fade-in" style={{ animationDelay: '0.8s' }}><span className="w-2 h-2 rounded-full bg-[#6BFFB6]"></span> Almost there...</div>
                                        <div className="flex items-center gap-3 text-slate-300 animate-fade-in" style={{ animationDelay: '1.8s' }}><span className="w-2 h-2 rounded-full bg-[#6BFFB6]"></span> Done.</div>
                                        <div className="flex items-center gap-3 text-white font-bold animate-pulse" style={{ animationDelay: '2.5s' }}><span className="text-[#2f8bff]">&rarr;</span> Publishing...</div>
                                    </div>
                                    <div className="w-full bg-slate-800 h-1 mt-10 rounded-full overflow-hidden"><div className="h-full bg-[#2f8bff] w-full transition-transform duration-[2000ms] ease-linear origin-left scale-x-0 animate-[shimmer_2s_linear_forwards]" style={{ transform: 'scaleX(1)' }}></div></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        };

export default OpinionModal;
