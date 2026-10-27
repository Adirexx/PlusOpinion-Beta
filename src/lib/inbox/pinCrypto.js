// Separated PIN Crypto logic
const KEK_ITERATIONS = 100000;

function fromBase64(b64) {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
}
function toBase64(arr) {
    return btoa(String.fromCharCode(...arr));
}

export async function deriveKekFromPin(pin, saltString) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(pin),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    
    const salt = saltString ? fromBase64(saltString) : crypto.getRandomValues(new Uint8Array(16));
    
    const kek = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: KEK_ITERATIONS,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
    
    return { kek, saltString: saltString || toBase64(salt) };
}

export async function encryptPrivateKeyWithPin(privateKeyString, pin) {
    const { kek, saltString } = await deriveKekFromPin(pin);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(privateKeyString);
    
    const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        kek,
        encoded
    );
    
    return {
        encryptedKey: toBase64(new Uint8Array(cipherBuffer)),
        iv: toBase64(iv),
        salt: saltString
    };
}

export async function decryptPrivateKeyWithPin(encryptedBlob, ivString, saltString, pin) {
    try {
        const { kek } = await deriveKekFromPin(pin, saltString);
        const iv = fromBase64(ivString);
        const cipherBuffer = fromBase64(encryptedBlob);
        
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            kek,
            cipherBuffer
        );
        
        return new TextDecoder().decode(decryptedBuffer);
    } catch (e) {
        throw new Error('INVALID_PIN');
    }
}
