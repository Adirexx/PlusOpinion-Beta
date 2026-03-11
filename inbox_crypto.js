/**
 * PLUSOPINION INBOX — E2EE CRYPTO MODULE
 * ========================================
 * End-to-End Encryption using Web Crypto API (built into all modern browsers)
 * Algorithm: ECDH P-256 key exchange + AES-GCM 256-bit message encryption
 *
 * How it works:
 * 1. Each user has an ECDH key pair (generated once, first time inbox is opened)
 * 2. Public key → stored in Supabase profiles table (everyone can read it)
 * 3. Private key → stored encrypted in localStorage (never leaves device)
 * 4. To send: derive shared AES key from your private key + recipient's public key
 * 5. To receive: derive same shared AES key from your private key + sender's public key
 * 6. ECDH is commutative: both sides arrive at the identical shared secret
 *
 * Image Compression:
 * - All images are compressed client-side to max 200KB before upload
 * - Uses Canvas API for re-encoding as JPEG at adaptive quality
 */

(function () {
    'use strict';

    const STORAGE_KEY_PREFIX = 'po_inbox_pk_'; // po = PlusOpinion

    // ===================================================================
    // KEY GENERATION & MANAGEMENT
    // ===================================================================

    /**
     * Generate a new ECDH key pair for the current user.
     * Called once when the user opens inbox for the first time.
     * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
     */
    async function generateKeyPair() {
        const keyPair = await crypto.subtle.generateKey(
            { name: 'ECDH', namedCurve: 'P-256' },
            true,               // extractable — so we can export and store
            ['deriveKey']
        );
        return keyPair;
    }

    /**
     * Export a CryptoKey to a JSON Web Key (JWK) string for storage.
     * @param {CryptoKey} key
     * @returns {Promise<string>} JSON string
     */
    async function exportKey(key) {
        const jwk = await crypto.subtle.exportKey('jwk', key);
        return JSON.stringify(jwk);
    }

    /**
     * Import a public key from a JWK string.
     * Used when we fetch another user's public key from Supabase.
     * @param {string} jwkString
     * @returns {Promise<CryptoKey>}
     */
    async function importPublicKey(jwkString) {
        const jwk = typeof jwkString === 'string' ? JSON.parse(jwkString) : jwkString;
        return crypto.subtle.importKey(
            'jwk',
            jwk,
            { name: 'ECDH', namedCurve: 'P-256' },
            false,          // public keys don't need to be extractable after import
            []              // ECDH public keys have no usages — they're used in deriveKey
        );
    }

    /**
     * Import a private key from a JWK string (from localStorage).
     * @param {string} jwkString
     * @returns {Promise<CryptoKey>}
     */
    async function importPrivateKey(jwkString) {
        const jwk = typeof jwkString === 'string' ? JSON.parse(jwkString) : jwkString;
        return crypto.subtle.importKey(
            'jwk',
            jwk,
            { name: 'ECDH', namedCurve: 'P-256' },
            false,          // private keys should not be re-extractable after import
            ['deriveKey']
        );
    }

    /**
     * Ensure the current user has keys.
     * Generates and saves keys if they don't exist.
     * Uploads public key to Supabase.
     * @param {string} userId  - The current user's Supabase UUID
     * @returns {Promise<CryptoKey>} The user's private CryptoKey
     */
    async function ensureKeys(userId) {
        const storageKey = STORAGE_KEY_PREFIX + userId;

        // Check if we already have a private key stored
        let privateKeyJwk = null;
        try {
            privateKeyJwk = localStorage.getItem(storageKey);
        } catch (e) {
            console.warn('[Crypto] localStorage not available:', e);
        }

        if (privateKeyJwk) {
            // Keys already exist — import and return the private key
            try {
                const privateKey = await importPrivateKey(privateKeyJwk);
                return privateKey;
            } catch (e) {
                console.warn('[Crypto] Stored key invalid, regenerating:', e);
                // Fall through to regenerate
            }
        }

        // Generate new key pair
        console.log('[Crypto] Generating new E2EE key pair for user:', userId);
        const keyPair = await generateKeyPair();

        // Export both keys
        const privateKeyString = await exportKey(keyPair.privateKey);
        const publicKeyString = await exportKey(keyPair.publicKey);

        // Save private key to localStorage (never sent to server)
        try {
            localStorage.setItem(storageKey, privateKeyString);
        } catch (e) {
            console.error('[Crypto] Failed to save private key:', e);
        }

        // Upload public key to Supabase profiles table
        try {
            await window.supabase
                .from('profiles')
                .update({ public_key: publicKeyString })
                .eq('id', userId);
            console.log('[Crypto] ✅ Public key uploaded to Supabase');
        } catch (e) {
            console.error('[Crypto] Failed to upload public key:', e);
        }

        return keyPair.privateKey;
    }

    /**
     * Fetch another user's public key from Supabase.
     * @param {string} userId
     * @returns {Promise<CryptoKey|null>}
     */
    async function fetchUserPublicKey(userId) {
        try {
            const { data, error } = await window.supabase
                .from('profiles')
                .select('public_key')
                .eq('id', userId)
                .single();

            if (error || !data?.public_key) {
                console.warn('[Crypto] No public key found for user:', userId);
                return null;
            }

            return await importPublicKey(data.public_key);
        } catch (e) {
            console.error('[Crypto] Error fetching public key:', e);
            return null;
        }
    }

    // ===================================================================
    // SHARED KEY DERIVATION
    // ===================================================================

    /**
     * Derive a shared AES-GCM key using ECDH.
     * Both Alice and Bob arrive at the same key:
     *   Alice: deriveSharedKey(alicePrivate, bobPublic)
     *   Bob:   deriveSharedKey(bobPrivate, alicePublic)
     *   → Same 256-bit AES key on both sides
     *
     * @param {CryptoKey} myPrivateKey
     * @param {CryptoKey} theirPublicKey
     * @returns {Promise<CryptoKey>} AES-GCM key
     */
    async function deriveSharedKey(myPrivateKey, theirPublicKey) {
        return crypto.subtle.deriveKey(
            { name: 'ECDH', public: theirPublicKey },
            myPrivateKey,
            { name: 'AES-GCM', length: 256 },
            false,          // shared key is not extractable
            ['encrypt', 'decrypt']
        );
    }

    // ===================================================================
    // ENCRYPT & DECRYPT
    // ===================================================================

    /**
     * Convert a Uint8Array to a Base64 string.
     */
    function toBase64(uint8) {
        return btoa(String.fromCharCode(...uint8));
    }

    /**
     * Convert a Base64 string to a Uint8Array.
     */
    function fromBase64(b64) {
        return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    }

    /**
     * Encrypt a plaintext string using AES-GCM.
     * @param {string} plaintext
     * @param {CryptoKey} aesKey - derived shared key
     * @returns {Promise<{ciphertext: string, iv: string}>} Base64-encoded outputs
     */
    async function encryptMessage(plaintext, aesKey) {
        const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
        const encodedText = new TextEncoder().encode(plaintext);

        const cipherBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            aesKey,
            encodedText
        );

        return {
            ciphertext: toBase64(new Uint8Array(cipherBuffer)),
            iv: toBase64(iv)
        };
    }

    /**
     * Decrypt a ciphertext string using AES-GCM.
     * @param {string} ciphertext - Base64 encoded
     * @param {string} ivString - Base64 encoded IV
     * @param {CryptoKey} aesKey - derived shared key
     * @returns {Promise<string>} decrypted plaintext
     */
    async function decryptMessage(ciphertext, ivString, aesKey) {
        const iv = fromBase64(ivString);
        const cipherBuffer = fromBase64(ciphertext);

        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            aesKey,
            cipherBuffer
        );

        return new TextDecoder().decode(decryptedBuffer);
    }

    // ===================================================================
    // HIGH-LEVEL SEND / RECEIVE HELPERS
    // ===================================================================

    /**
     * Encrypt a message for sending.
     * Handles key lookup and derivation automatically.
     *
     * @param {string} plaintext - message to encrypt
     * @param {string} myUserId - current user's UUID
     * @param {string} theirUserId - recipient's UUID
     * @returns {Promise<{content: string, content_iv: string}|null>}
     *          Returns null if encryption fails (caller should handle gracefully)
     */
    async function encryptForUser(plaintext, myUserId, theirUserId) {
        try {
            const myPrivateKey = await ensureKeys(myUserId);
            const theirPublicKey = await fetchUserPublicKey(theirUserId);

            if (!theirPublicKey) {
                // Recipient has no public key (hasn't opened inbox yet)
                // Fall back to storing plaintext — less secure but functional
                console.warn('[Crypto] Recipient has no public key. Storing plaintext for now.');
                return { content: plaintext, content_iv: null };
            }

            const sharedKey = await deriveSharedKey(myPrivateKey, theirPublicKey);
            const { ciphertext, iv } = await encryptMessage(plaintext, sharedKey);

            return { content: ciphertext, content_iv: iv };
        } catch (e) {
            console.error('[Crypto] Encryption failed:', e);
            // Graceful degradation — never lose a message due to crypto failure
            return { content: plaintext, content_iv: null };
        }
    }

    /**
     * Decrypt a received message.
     * @param {string} ciphertext - Base64 encoded ciphertext from DB
     * @param {string|null} iv - Base64 encoded IV from DB (null = plaintext)
     * @param {string} myUserId - current user's UUID
     * @param {string} senderUserId - sender's UUID
     * @returns {Promise<string>} - plaintext or fallback
     */
    async function decryptFromUser(ciphertext, iv, myUserId, senderUserId) {
        // If no IV, message was stored as plaintext (key not available at send time)
        if (!iv) return ciphertext;

        try {
            const myPrivateKey = await ensureKeys(myUserId);
            const senderPublicKey = await fetchUserPublicKey(senderUserId);

            if (!senderPublicKey) {
                console.warn('[Crypto] Sender public key not found, cannot decrypt');
                return '[Message encrypted — key not available]';
            }

            const sharedKey = await deriveSharedKey(myPrivateKey, senderPublicKey);
            return await decryptMessage(ciphertext, iv, sharedKey);
        } catch (e) {
            console.error('[Crypto] Decryption failed:', e);
            return '[Message encrypted — decryption failed]';
        }
    }

    // ===================================================================
    // IMAGE COMPRESSION (MAX 200KB)
    // ===================================================================

    /**
     * Compress an image File/Blob to max 200KB using Canvas API.
     * Adaptively reduces JPEG quality until the target size is met.
     *
     * @param {File|Blob} file - original image file
     * @param {number} maxBytes - max output size in bytes (default: 200KB = 204800)
     * @returns {Promise<Blob>} compressed Blob (image/jpeg)
     */
    async function compressImage(file, maxBytes = 204800) {
        return new Promise((resolve, reject) => {
            // Validate input is an image
            if (!file.type.startsWith('image/')) {
                reject(new Error('File is not an image'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Calculate dimensions — scale down if width > 1080px
                    let { width, height } = img;
                    const MAX_DIMENSION = 1080;

                    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                        if (width > height) {
                            height = Math.round((height / width) * MAX_DIMENSION);
                            width = MAX_DIMENSION;
                        } else {
                            width = Math.round((width / height) * MAX_DIMENSION);
                            height = MAX_DIMENSION;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    // Binary search for the best quality setting
                    let low = 0.1, high = 0.92, quality = 0.82;
                    let compressed = null;

                    // Try up to 8 iterations to find the right quality
                    const tryQuality = (q) => {
                        return new Promise(res => {
                            canvas.toBlob(blob => res(blob), 'image/jpeg', q);
                        });
                    };

                    (async () => {
                        for (let i = 0; i < 8; i++) {
                            quality = (low + high) / 2;
                            compressed = await tryQuality(quality);

                            if (!compressed) { quality = 0.5; break; }

                            if (compressed.size <= maxBytes && compressed.size > maxBytes * 0.7) {
                                break; // Good enough — within 70–100% of limit
                            } else if (compressed.size > maxBytes) {
                                high = quality; // Too big — reduce quality
                            } else {
                                low = quality;  // Too small — can increase quality
                            }
                        }

                        if (!compressed || compressed.size > maxBytes) {
                            // Fallback: force minimum quality
                            compressed = await tryQuality(0.1);
                        }

                        console.log(`[Crypto] Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressed.size / 1024).toFixed(1)}KB (q=${quality.toFixed(2)})`);
                        resolve(compressed);
                    })();
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Upload a compressed image to Supabase "chat-media" storage bucket.
     * Returns the storage path (used to generate signed URLs on demand).
     *
     * @param {Blob} blob - compressed image blob
     * @param {string} conversationId - for path namespacing
     * @param {string} senderId - for path namespacing
     * @returns {Promise<string>} storage path
     */
    async function uploadChatImage(blob, conversationId, senderId) {
        const fileName = `${conversationId}/${senderId}/${Date.now()}.jpg`;

        const { data, error } = await window.supabase.storage
            .from('chat-media')
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (error) throw error;
        return data.path;
    }

    /**
     * Get a short-lived signed URL for a chat image.
     * Signed URLs expire in 1 hour — private bucket security.
     * @param {string} path - storage path
     * @returns {Promise<string>} signed URL
     */
    async function getChatImageUrl(path) {
        const { data, error } = await window.supabase.storage
            .from('chat-media')
            .createSignedUrl(path, 3600); // 1 hour expiry
        if (error) throw error;
        return data.signedUrl;
    }

    // ===================================================================
    // EXPOSE TO GLOBAL SCOPE
    // ===================================================================
    window.InboxCrypto = {
        ensureKeys,
        encryptForUser,
        decryptFromUser,
        compressImage,
        uploadChatImage,
        getChatImageUrl,
        // Lower-level exports for testing
        _generateKeyPair: generateKeyPair,
        _exportKey: exportKey,
    };

    console.log('✅ InboxCrypto loaded (ECDH P-256 + AES-GCM + Image Compression)');

})();
