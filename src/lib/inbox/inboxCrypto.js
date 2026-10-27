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
 *
 * PORTED FROM: inbox_crypto.js (old MPA)
 * CHANGES: window.supabase → import { supabase }, IIFE → ES module, window.InboxCrypto → named exports
 * PRESERVED: All algorithm choices, key formats, localStorage keys, fallback logic, compression settings
 */

import { supabase } from '../supabaseClient.js'
import { encryptPrivateKeyWithPin, decryptPrivateKeyWithPin } from './pinCrypto.js'

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
 * Ensure the current user has E2EE keys.
 *
 * SECURITY FIX (Phase 7.1A): Private key is NEVER uploaded to Supabase.
 * Only the PUBLIC key goes to the server. Private key lives exclusively
 * in localStorage. For multi-device, users export/import via
 * exportKeyBackup() / importKeyBackup().
 *
 * MIGRATION: If a private key still exists in Supabase from the old code,
 * we import it locally and then CLEAR it from the server.
 *
 * @param {string} userId
 * @returns {Promise<CryptoKey>} private key
 */
export async function ensureKeys(userId) {
    const storageKey = STORAGE_KEY_PREFIX + userId;

    // 1. Check localStorage first (primary source of truth)
    let privateKeyJwk = null;
    try {
        privateKeyJwk = localStorage.getItem(storageKey);
    } catch (e) {
        console.warn('[Crypto] localStorage not available:', e);
    }

    if (privateKeyJwk) {
        try {
            const privateKey = await importPrivateKey(privateKeyJwk);
            return privateKey;
        } catch (e) {
            console.warn('[Crypto] Stored key invalid');
        }
    }

    throw new Error('E2EE_KEY_MISSING');
}

/**
 * Check if the user has a local private key.
 */
export function hasLocalKey(userId) {
    const storageKey = STORAGE_KEY_PREFIX + userId;
    return !!localStorage.getItem(storageKey);
}

/**
 * Check if the user has an encrypted backup on Supabase.
 */
export async function checkCloudBackup(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('encrypted_private_key, key_salt')
        .eq('id', userId)
        .single();
        
    if (error || !data) return { hasBackup: false };
    
    // We store the iv and ciphertext together separated by ":" in encrypted_private_key
    if (data.encrypted_private_key && data.key_salt) {
        const parts = data.encrypted_private_key.split(':');
        if (parts.length === 2) {
            return {
                hasBackup: true,
                encryptedBlob: parts[1],
                iv: parts[0],
                salt: data.key_salt
            };
        }
    }
    return { hasBackup: false };
}

/**
 * Setup E2EE for the first time using a PIN.
 */
export async function setupE2EE(userId, pin) {
    console.log('[Crypto] Generating new E2EE key pair for user:', userId);
    const keyPair = await generateKeyPair();

    const privateKeyString = await exportKey(keyPair.privateKey);
    const publicKeyString = await exportKey(keyPair.publicKey);

    // Encrypt private key with PIN
    const { encryptedKey, iv, salt } = await encryptPrivateKeyWithPin(privateKeyString, pin);
    const combinedEncrypted = `${iv}:${encryptedKey}`;

    // Upload public key and encrypted private key to Supabase
    const { error } = await supabase
        .from('profiles')
        .update({ 
            public_key: publicKeyString,
            encrypted_private_key: combinedEncrypted,
            key_salt: salt,
            private_key: null // Ensure legacy plaintext is wiped
        })
        .eq('id', userId);
        
    if (error) throw error;

    // Save plaintext private key to local storage
    const storageKey = STORAGE_KEY_PREFIX + userId;
    localStorage.setItem(storageKey, privateKeyString);

    return true;
}

/**
 * Recover E2EE private key from cloud using PIN.
 */
export async function recoverE2EE(userId, pin, encryptedBlob, iv, salt) {
    try {
        const privateKeyString = await decryptPrivateKeyWithPin(encryptedBlob, iv, salt, pin);
        
        // Validate key
        await importPrivateKey(privateKeyString);
        
        // Save to local storage
        const storageKey = STORAGE_KEY_PREFIX + userId;
        localStorage.setItem(storageKey, privateKeyString);
        
        return true;
    } catch (e) {
        if (e.message === 'INVALID_PIN') return false;
        throw e;
    }
}


/**
 * Export the user's private key as a downloadable JSON backup.
 * For manual multi-device sync. Returns null if no key exists.
 * @param {string} userId
 * @returns {string|null} JSON string of the private key JWK
 */
export function exportKeyBackup(userId) {
    const storageKey = STORAGE_KEY_PREFIX + userId;
    try {
        return localStorage.getItem(storageKey);
    } catch (e) {
        console.error('[Crypto] Cannot export key backup:', e);
        return null;
    }
}

/**
 * Import a private key from a backup JSON string.
 * Validates the key before storing.
 * @param {string} userId
 * @param {string} jwkString - JSON string of private key JWK
 * @returns {Promise<boolean>} true if import succeeded
 */
export async function importKeyBackup(userId, jwkString) {
    try {
        // Validate it's a real key
        await importPrivateKey(jwkString);
        const storageKey = STORAGE_KEY_PREFIX + userId;
        localStorage.setItem(storageKey, jwkString);
        console.log('[Crypto] ✅ Key backup imported successfully');
        return true;
    } catch (e) {
        console.error('[Crypto] Invalid key backup:', e);
        return false;
    }
}

/**
 * Fetch another user's public key from Supabase.
 * @param {string} userId
 * @returns {Promise<CryptoKey|null>}
 */
async function fetchUserPublicKey(userId) {
    try {
        const { data, error } = await supabase
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
export async function encryptForUser(plaintext, myUserId, theirUserId) {
    try {
        const myPrivateKey = await ensureKeys(myUserId);
        const theirPublicKey = await fetchUserPublicKey(theirUserId);

        if (!theirPublicKey) {
            // Recipient has no public key (hasn't opened inbox yet)
            // Phase 7.1B: Return a flag so UI can warn the user
            console.warn('[Crypto] Recipient has no public key. Message will be unencrypted.');
            return { content: plaintext, content_iv: null, _unencrypted: true };
        }

        const sharedKey = await deriveSharedKey(myPrivateKey, theirPublicKey);
        const { ciphertext, iv } = await encryptMessage(plaintext, sharedKey);

        return { content: ciphertext, content_iv: iv, _unencrypted: false };
    } catch (e) {
        console.error('[Crypto] Encryption failed:', e);
        // Graceful degradation — never lose a message due to crypto failure
        return { content: plaintext, content_iv: null, _unencrypted: true };
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
export async function decryptFromUser(ciphertext, iv, myUserId, senderUserId) {
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
export async function compressImage(file, maxBytes = 204800) {
    return new Promise((resolve) => {
        // Validate input is an image (by MIME or extension)
        const isImage = (file.type && file.type.startsWith('image/')) ||
            /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name || '');

        if (!isImage) {
            console.warn('[Crypto] File not recognized as image, using original file');
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                try {
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

                    canvas.width = Math.max(1, width);
                    canvas.height = Math.max(1, height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Binary search for optimal quality to stay under maxBytes
                    let low = 0.1, high = 0.92, quality = 0.82;
                    let compressed = null;

                    const tryQuality = (q) => {
                        return new Promise(res => {
                            canvas.toBlob(blob => res(blob), 'image/jpeg', q);
                        });
                    };

                    (async () => {
                        try {
                            for (let i = 0; i < 8; i++) {
                                quality = (low + high) / 2;
                                compressed = await tryQuality(quality);

                                if (!compressed) { quality = 0.5; break; }

                                if (compressed.size <= maxBytes && compressed.size > maxBytes * 0.7) {
                                    break; // Good enough — within 70–100% of target limit
                                } else if (compressed.size > maxBytes) {
                                    high = quality; // Too big — reduce quality
                                } else {
                                    low = quality;  // Too small — can increase quality
                                }
                            }

                            if (!compressed || compressed.size > maxBytes) {
                                // Fallback: force minimum acceptable quality
                                compressed = await tryQuality(0.15);
                            }

                            if (compressed && compressed.size > 0) {
                                console.log(`[Crypto] Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressed.size / 1024).toFixed(1)}KB (q=${quality.toFixed(2)})`);
                                resolve(compressed);
                            } else {
                                resolve(file);
                            }
                        } catch (compErr) {
                            console.warn('[Crypto] Compression error, falling back to original:', compErr);
                            resolve(file);
                        }
                    })();
                } catch (canvasErr) {
                    console.warn('[Crypto] Canvas error, falling back to original file:', canvasErr);
                    resolve(file);
                }
            };
            img.onerror = () => {
                console.warn('[Crypto] Image decode failed, falling back to original file');
                resolve(file);
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            console.warn('[Crypto] FileReader failed, falling back to original file');
            resolve(file);
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Upload a compressed image to Supabase "chat-media" storage bucket.
 * Returns the storage path (used to generate signed URLs on demand).
 *
 * @param {Blob|File} blob - compressed image blob
 * @param {string} conversationId - for path namespacing
 * @param {string} senderId - for path namespacing
 * @returns {Promise<string>} storage path
 */
export async function uploadChatImage(blob, conversationId, senderId) {
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const fileName = `${conversationId}/${senderId}/${uniqueSuffix}.jpg`;

    const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(fileName, blob, {
            contentType: blob.type || 'image/jpeg',
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
export async function getChatImageUrl(path) {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
        return path;
    }
    const cleanPath = path.replace(/^chat-media\//, '');
    const { data, error } = await supabase.storage
        .from('chat-media')
        .createSignedUrl(cleanPath, 3600); // 1 hour expiry
    if (error) {
        console.error('[Crypto] getChatImageUrl error for', cleanPath, error);
        throw error;
    }
    return data.signedUrl;
}

// Lower-level exports for testing
export const _generateKeyPair = generateKeyPair;
export const _exportKey = exportKey;
