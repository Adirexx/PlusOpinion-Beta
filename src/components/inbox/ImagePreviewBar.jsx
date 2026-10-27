/**
 * ImagePreviewBar.jsx — Selected image thumbnails before sending
 * =================================================================
 * Ported from inbox_panel.js image preview logic.
 */

import { useInbox } from '../../context/InboxContext'

export default function ImagePreviewBar() {
    const { pendingImages, setPendingImages } = useInbox()

    if (pendingImages.length === 0) return null

    const handleRemove = (index) => {
        setPendingImages(prev => {
            const next = [...prev]
            URL.revokeObjectURL(next[index].objectURL) // cleanup
            next.splice(index, 1)
            return next
        })
    }

    return (
        <div className="chat-image-preview-bar">
            {pendingImages.map((img, i) => (
                <div key={i} className="chat-img-thumb">
                    <img src={img.objectURL} alt="Preview" />
                    <button
                        className="chat-img-thumb-remove"
                        onClick={() => handleRemove(i)}
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    )
}
