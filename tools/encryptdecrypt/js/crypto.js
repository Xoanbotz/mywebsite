/**
 * crypto.js - Cryptographic operations using Web Crypto API
 * AES-256-GCM encryption/decryption with PBKDF2 key derivation
 */

// Constants
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 250000;
const PBKDF2_HASH = 'SHA-256';
const IV_LENGTH = 12; // bytes
const SALT_LENGTH = 16; // bytes
const HEADER = 'AZAZILCRYPT';
const HEADER_VERSION = '2.0';

/**
 * Generate cryptographically secure random bytes
 * @param {number} length - Number of bytes to generate
 * @returns {Uint8Array} Random bytes
 */
function getRandomBytes(length) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
}

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer - Buffer to convert
 * @returns {string} Base64 encoded string
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param {string} base64 - Base64 encoded string
 * @returns {ArrayBuffer} Decoded buffer
 */
function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Concatenate multiple Uint8Arrays
 * @param {...Uint8Array} arrays - Arrays to concatenate
 * @returns {Uint8Array} Concatenated array
 */
function concatArrays(...arrays) {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

/**
 * Derive encryption key from password using PBKDF2
 * @param {string} password - User password
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>} Derived AES key
 */
async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        'PBKDF2',
        false,
        ['deriveKey']
    );
    
    // Derive AES key using PBKDF2
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: PBKDF2_HASH
        },
        keyMaterial,
        {
            name: ALGORITHM,
            length: KEY_LENGTH
        },
        false,
        ['encrypt', 'decrypt']
    );
    
    return key;
}

/**
 * Encrypt data with AES-256-GCM
 * @param {ArrayBuffer} data - Data to encrypt
 * @param {string} password - Encryption password
 * @returns {Promise<Object>} Encrypted result with salt, iv, ciphertext
 */
async function encryptData(data, password) {
    try {
        // Generate random salt and IV
        const salt = getRandomBytes(SALT_LENGTH);
        const iv = getRandomBytes(IV_LENGTH);
        
        // Derive key from password
        const key = await deriveKey(password, salt);
        
        // Encrypt data
        const ciphertext = await crypto.subtle.encrypt(
            {
                name: ALGORITHM,
                iv: iv,
                tagLength: 128 // GCM authentication tag
            },
            key,
            data
        );
        
        // Return components
        return {
            salt: salt,
            iv: iv,
            ciphertext: new Uint8Array(ciphertext)
        };
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Encryption failed: ' + error.message);
    }
}

/**
 * Decrypt data with AES-256-GCM
 * @param {Uint8Array} ciphertext - Encrypted data
 * @param {Uint8Array} salt - Salt used for key derivation
 * @param {Uint8Array} iv - IV used for encryption
 * @param {string} password - Decryption password
 * @returns {Promise<ArrayBuffer>} Decrypted data
 */
async function decryptData(ciphertext, salt, iv, password) {
    try {
        // Derive key from password
        const key = await deriveKey(password, salt);
        
        // Decrypt data
        const plaintext = await crypto.subtle.decrypt(
            {
                name: ALGORITHM,
                iv: iv,
                tagLength: 128
            },
            key,
            ciphertext
        );
        
        return plaintext;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Decryption failed: Invalid password or corrupted data');
    }
}

/**
 * Encrypt a file and return formatted data
 * @param {File} file - File to encrypt
 * @param {string} password - Encryption password
 * @returns {Promise<Object>} Encrypted file data with metadata
 */
async function encryptFile(file, password) {
    const startTime = performance.now();
    
    try {
        // Read file as ArrayBuffer
        const fileData = await file.arrayBuffer();
        const fileSize = fileData.byteLength;
        
        // Encrypt the data
        const { salt, iv, ciphertext } = await encryptData(fileData, password);
        
        // Build the encrypted file format
        const headerBytes = new TextEncoder().encode(HEADER);
        const versionBytes = new TextEncoder().encode(HEADER_VERSION);
        
        // Combine all parts: header + version + salt + iv + ciphertext
        const encryptedData = concatArrays(
            headerBytes,
            new Uint8Array([0]), // Separator
            versionBytes,
            new Uint8Array([0]), // Separator
            salt,
            iv,
            ciphertext
        );
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        return {
            encryptedData: encryptedData,
            originalName: file.name,
            originalSize: fileSize,
            encryptedSize: encryptedData.length,
            salt: salt,
            iv: iv,
            duration: duration
        };
    } catch (error) {
        console.error('File encryption error:', error);
        throw new Error('Failed to encrypt file: ' + error.message);
    }
}

/**
 * Decrypt an encrypted file
 * @param {ArrayBuffer} encryptedBuffer - Encrypted file data
 * @param {string} password - Decryption password
 * @returns {Promise<Object>} Decrypted file data with metadata
 */
async function decryptFile(encryptedBuffer, password) {
    const startTime = performance.now();
    
    try {
        const data = new Uint8Array(encryptedBuffer);
        
        // Parse the encrypted file format
        const headerBytes = new TextEncoder().encode(HEADER);
        const headerLength = headerBytes.length;
        
        // Check header
        for (let i = 0; i < headerLength; i++) {
            if (data[i] !== headerBytes[i]) {
                throw new Error('Invalid header: Not an AzazilCrypt encrypted file');
            }
        }
        
        // Find separators
        let pos = headerLength;
        if (data[pos] !== 0) {
            throw new Error('Invalid format: Missing separator');
        }
        pos++;
        
        // Read version
        let versionEnd = pos;
        while (versionEnd < data.length && data[versionEnd] !== 0) {
            versionEnd++;
        }
        if (versionEnd >= data.length) {
            throw new Error('Invalid format: Version not found');
        }
        
        const versionBytes = data.slice(pos, versionEnd);
        const version = new TextDecoder().decode(versionBytes);
        if (version !== HEADER_VERSION) {
            throw new Error(`Unsupported version: ${version}. Expected ${HEADER_VERSION}`);
        }
        pos = versionEnd + 1;
        
        // Extract salt (16 bytes)
        if (pos + SALT_LENGTH > data.length) {
            throw new Error('Invalid format: Salt missing');
        }
        const salt = data.slice(pos, pos + SALT_LENGTH);
        pos += SALT_LENGTH;
        
        // Extract IV (12 bytes)
        if (pos + IV_LENGTH > data.length) {
            throw new Error('Invalid format: IV missing');
        }
        const iv = data.slice(pos, pos + IV_LENGTH);
        pos += IV_LENGTH;
        
        // Extract ciphertext (rest of the data)
        const ciphertext = data.slice(pos);
        if (ciphertext.length === 0) {
            throw new Error('Invalid format: Ciphertext missing');
        }
        
        // Decrypt the data
        const plaintext = await decryptData(ciphertext, salt, iv, password);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        return {
            plaintext: plaintext,
            size: plaintext.byteLength,
            duration: duration
        };
    } catch (error) {
        console.error('File decryption error:', error);
        throw error;
    }
}

/**
 * Generate a random password
 * @param {number} length - Password length
 * @returns {string} Generated password
 */
function generatePassword(length) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
    const randomBytes = getRandomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset[randomBytes[i] % charset.length];
    }
    return password;
}

/**
 * Check password strength
 * @param {string} password - Password to check
 * @returns {Object} Strength score and feedback
 */
function checkPasswordStrength(password) {
    if (!password || password.length === 0) {
        return { score: 0, label: 'Kosong', color: 'empty' };
    }
    
    let score = 0;
    const feedback = [];
    
    // Length check
    if (password.length < 8) {
        feedback.push('Minimal 8 karakter');
    } else {
        score += 1;
    }
    
    if (password.length >= 12) {
        score += 1;
    }
    
    // Complexity checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    
    // Calculate final score (0-5)
    let finalScore = Math.min(score, 5);
    let label = '';
    let color = '';
    
    if (finalScore <= 1) {
        label = 'Lemah';
        color = 'weak';
    } else if (finalScore <= 2) {
        label = 'Lemah';
        color = 'weak';
    } else if (finalScore <= 3) {
        label = 'Sedang';
        color = 'fair';
    } else if (finalScore <= 4) {
        label = 'Kuat';
        color = 'good';
    } else {
        label = 'Sangat Kuat';
        color = 'strong';
    }
    
    return {
        score: finalScore,
        label: label,
        color: color,
        feedback: feedback
    };
}

/**
 * Validate encrypted file header
 * @param {ArrayBuffer} buffer - File buffer to validate
 * @returns {boolean} True if valid AzazilCrypt file
 */
function validateEncryptedFile(buffer) {
    try {
        const data = new Uint8Array(buffer);
        const headerBytes = new TextEncoder().encode(HEADER);
        const headerLength = headerBytes.length;
        
        // Check header
        for (let i = 0; i < headerLength; i++) {
            if (data[i] !== headerBytes[i]) {
                return false;
            }
        }
        
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Get file extension from name
 * @param {string} filename - File name
 * @returns {string} File extension
 */
function getFileExtension(filename) {
    return filename.split('.').pop() || '';
}

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted size
 */
function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Export functions for use in other modules
export {
    // Core cryptographic functions
    encryptData,
    decryptData,
    encryptFile,
    decryptFile,
    deriveKey,
    
    // Utility functions
    getRandomBytes,
    arrayBufferToBase64,
    base64ToArrayBuffer,
    concatArrays,
    generatePassword,
    checkPasswordStrength,
    validateEncryptedFile,
    getFileExtension,
    formatFileSize,
    
    // Constants
    HEADER,
    HEADER_VERSION,
    PBKDF2_ITERATIONS,
    IV_LENGTH,
    SALT_LENGTH
};