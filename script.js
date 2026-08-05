/* ============================================================
   AZAZIL CRYPT v2.0 - SCRIPT
   ============================================================ */

// ===== STATE =====
const state = {
    // Encrypt
    encFile: null,
    encFileName: '',
    encFileSize: 0,
    encPassword: '',
    encConfirm: '',
    encProgress: 0,
    isEncrypting: false,
    
    // Decrypt
    decFile: null,
    decFileName: '',
    decFileSize: 0,
    decPassword: '',
    isDecrypting: false,
};

// ===== DOM REFS =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
    // Tabs
    tabs: $$('.tab-btn'),
    tabContents: $$('.tab-content'),
    
    // Theme
    themeToggle: $('#themeToggle'),
    
    // Encrypt
    dropZone: $('#dropZone'),
    fileInput: $('#fileInput'),
    fileInfo: $('#fileInfo'),
    fileName: $('#fileName'),
    fileSize: $('#fileSize'),
    removeFile: $('#removeFile'),
    encPassword: $('#encPassword'),
    encConfirm: $('#encConfirmPassword'),
    strengthBar: $('#strengthFill'),
    strengthText: $('#strengthText'),
    generateBtn: $('#generatePassword'),
    genOpts: $$('.gen-opt'),
    encryptBtn: $('#encryptBtn'),
    resetEncrypt: $('#resetEncrypt'),
    progressContainer: $('#encProgressContainer'),
    progressFill: $('#encProgressFill'),
    progressText: $('#encProgressText'),
    progressStatus: $('#encProgressStatus'),
    resultContainer: $('#encResultContainer'),
    resultDetail: $('#encResultDetail'),
    downloadBtn: $('#downloadEncrypted'),
    
    // Decrypt
    dropZoneDecrypt: $('#dropZoneDecrypt'),
    fileInputDecrypt: $('#fileInputDecrypt'),
    fileInfoDecrypt: $('#fileInfoDecrypt'),
    fileNameDecrypt: $('#fileNameDecrypt'),
    fileSizeDecrypt: $('#fileSizeDecrypt'),
    removeFileDecrypt: $('#removeFileDecrypt'),
    decPassword: $('#decPassword'),
    decryptBtn: $('#decryptBtn'),
    resetDecrypt: $('#resetDecrypt'),
    progressContainerDec: $('#decProgressContainer'),
    progressFillDec: $('#decProgressFill'),
    progressTextDec: $('#decProgressText'),
    progressStatusDec: $('#decProgressStatus'),
    resultContainerDec: $('#decResultContainer'),
    resultDetailDec: $('#decResultDetail'),
    downloadBtnDec: $('#downloadDecrypted'),
    
    // Toast
    toastContainer: $('#toastContainer'),
};

// ===== TOAST =====
function showToast(message, type = 'info', duration = 4000) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close">✕</button>
    `;
    
    DOM.toastContainer.appendChild(toast);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        removeToast(toast);
    });
    
    setTimeout(() => removeToast(toast), duration);
    
    function removeToast(el) {
        if (!el.parentNode) return;
        el.classList.add('toast-out');
        setTimeout(() => el.remove(), 300);
    }
}

// ===== THEME =====
function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('azazil-theme', theme);
}

DOM.themeToggle.addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
});

// Load saved theme
const savedTheme = localStorage.getItem('azazil-theme');
if (savedTheme) setTheme(savedTheme);

// ===== TABS =====
DOM.tabs.forEach(btn => {
    btn.addEventListener('click', () => {
        DOM.tabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const target = btn.dataset.tab;
        DOM.tabContents.forEach(c => c.classList.remove('active'));
        document.getElementById(`tab-${target}`).classList.add('active');
    });
});

// ===== HELPERS =====
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function generateRandomString(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    return Array.from(arr, v => chars[v % chars.length]).join('');
}

// ===== PASSWORD STRENGTH =====
function checkStrength(password) {
    let score = 0;
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;
    return Math.min(score, 100);
}

function updateStrength(password) {
    const score = checkStrength(password);
    DOM.strengthBar.style.width = score + '%';
    
    if (score < 30) {
        DOM.strengthBar.style.background = '#ff0040';
        DOM.strengthText.textContent = 'Lemah 😓';
    } else if (score < 60) {
        DOM.strengthBar.style.background = '#ffaa00';
        DOM.strengthText.textContent = 'Sedang 😐';
    } else if (score < 80) {
        DOM.strengthBar.style.background = '#00aaff';
        DOM.strengthText.textContent = 'Kuat 💪';
    } else {
        DOM.strengthBar.style.background = '#00ff41';
        DOM.strengthText.textContent = 'Sangat Kuat 🔥';
    }
}

DOM.encPassword.addEventListener('input', (e) => {
    updateStrength(e.target.value);
    validateEncrypt();
});

DOM.encConfirm.addEventListener('input', validateEncrypt);

function validateEncrypt() {
    const pass = DOM.encPassword.value;
    const confirm = DOM.encConfirm.value;
    const hasFile = !!state.encFile;
    const passValid = pass.length >= 8 && pass === confirm;
    DOM.encryptBtn.disabled = !(hasFile && passValid);
}

// ===== GENERATE PASSWORD =====
DOM.generateBtn.addEventListener('click', () => {
    const active = DOM.genOpts.querySelector('.active');
    const len = parseInt(active?.dataset.len || 16);
    const password = generateRandomString(len);
    DOM.encPassword.value = password;
    DOM.encConfirm.value = password;
    updateStrength(password);
    validateEncrypt();
    showToast(`🔑 Password ${len} karakter di-generate!`, 'success');
});

DOM.genOpts.forEach(opt => {
    opt.addEventListener('click', () => {
        DOM.genOpts.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
    });
});

// ===== PASSWORD TOGGLE =====
document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.textContent = isPassword ? '🙈' : '👁️';
    });
});

// ===== PASSWORD COPY =====
document.querySelectorAll('.password-copy').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        navigator.clipboard.writeText(input.value).then(() => {
            showToast('📋 Password disalin!', 'success');
        }).catch(() => {
            // Fallback
            input.select();
            document.execCommand('copy');
            showToast('📋 Password disalin!', 'success');
        });
    });
});

// ===== ENCRYPT - DROP ZONE =====
function handleEncryptFile(file) {
    if (!file) return;
    
    // Size limit (2GB)
    if (file.size > 2 * 1024 * 1024 * 1024) {
        showToast('⚠️ Ukuran file terlalu besar! Maks. 2GB', 'error');
        return;
    }
    
    state.encFile = file;
    state.encFileName = file.name;
    state.encFileSize = file.size;
    
    DOM.fileInfo.style.display = 'flex';
    DOM.fileName.textContent = file.name;
    DOM.fileSize.textContent = formatSize(file.size);
    
    validateEncrypt();
    showToast(`📁 ${file.name} siap di-encrypt`, 'success');
}

DOM.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    DOM.dropZone.classList.add('drag-over');
});

DOM.dropZone.addEventListener('dragleave', () => {
    DOM.dropZone.classList.remove('drag-over');
});

DOM.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleEncryptFile(file);
});

DOM.fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleEncryptFile(file);
});

DOM.removeFile.addEventListener('click', () => {
    state.encFile = null;
    DOM.fileInfo.style.display = 'none';
    DOM.fileInput.value = '';
    validateEncrypt();
});

// ===== ENCRYPT =====
DOM.encryptBtn.addEventListener('click', async () => {
    if (state.isEncrypting) return;
    if (!state.encFile) {
        showToast('⚠️ Pilih file dulu bro!', 'error');
        return;
    }
    
    const password = DOM.encPassword.value;
    const confirm = DOM.encConfirm.value;
    
    if (password.length < 8) {
        showToast('⚠️ Password minimal 8 karakter!', 'error');
        return;
    }
    
    if (password !== confirm) {
        showToast('⚠️ Password dan konfirmasi tidak sama!', 'error');
        return;
    }
    
    state.isEncrypting = true;
    DOM.encryptBtn.disabled = true;
    DOM.encryptBtn.innerHTML = '<span class="btn-spinner">⏳</span> Memproses...';
    
    try {
        await encryptFile(state.encFile, password);
    } catch (err) {
        showToast('❌ Error: ' + err.message, 'error');
        console.error(err);
    } finally {
        state.isEncrypting = false;
        DOM.encryptBtn.disabled = false;
        DOM.encryptBtn.innerHTML = '<span class="btn-icon">🔒</span><span class="btn-text">Encrypt</span>';
    }
});

async function encryptFile(file, password) {
    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    
    // Show progress
    DOM.progressContainer.style.display = 'block';
    DOM.resultContainer.style.display = 'none';
    DOM.progressFill.style.width = '0%';
    DOM.progressText.textContent = '0%';
    DOM.progressStatus.textContent = 'Membaca file...';
    
    // Read file as ArrayBuffer
    const arrayBuffer = await readFileAsArrayBuffer(file);
    
    DOM.progressStatus.textContent = 'Derive key...';
    DOM.progressFill.style.width = '20%';
    DOM.progressText.textContent = '20%';
    
    // Derive key with PBKDF2
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(password, salt);
    
    DOM.progressStatus.textContent = 'Encrypting...';
    DOM.progressFill.style.width = '40%';
    DOM.progressText.textContent = '40%';
    
    // Encrypt with AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        arrayBuffer
    );
    
    DOM.progressFill.style.width = '80%';
    DOM.progressText.textContent = '80%';
    DOM.progressStatus.textContent = 'Finalizing...';
    
    // Build final file: salt (16) + iv (12) + ciphertext
    const result = new Uint8Array(16 + 12 + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, 16);
    result.set(new Uint8Array(encrypted), 28);
    
    // Original filename without extension
    const originalName = file.name.replace(/\.[^.]+$/, '') || 'file';
    
    DOM.progressFill.style.width = '100%';
    DOM.progressText.textContent = '100%';
    DOM.progressStatus.textContent = 'Selesai! ✅';
    
    // Store result for download
    state.encResult = result;
    state.encOriginalName = originalName;
    
    // Show result
    DOM.resultContainer.style.display = 'flex';
    DOM.resultDetail.textContent = `Ukuran: ${formatSize(result.length)} (asli: ${formatSize(file.size)})`;
    
    showToast('✅ Enkripsi berhasil!', 'success');
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsArrayBuffer(file);
    });
}

async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 250000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// ===== DOWNLOAD ENCRYPTED =====
DOM.downloadBtn.addEventListener('click', () => {
    if (!state.encResult) return;
    
    const blob = new Blob([state.encResult], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.encOriginalName || 'file'}.enc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    
    showToast('📥 File .enc diunduh!', 'success');
    
    // Reset after download
    setTimeout(() => {
        DOM.resetEncrypt.click();
    }, 2000);
});

// ===== RESET ENCRYPT =====
DOM.resetEncrypt.addEventListener('click', () => {
    state.encFile = null;
    state.encResult = null;
    DOM.fileInfo.style.display = 'none';
    DOM.fileInput.value = '';
    DOM.encPassword.value = '';
    DOM.encConfirm.value = '';
    DOM.progressContainer.style.display = 'none';
    DOM.resultContainer.style.display = 'none';
    DOM.progressFill.style.width = '0%';
    DOM.progressText.textContent = '0%';
    updateStrength('');
    validateEncrypt();
});

// ===== DECRYPT - DROP ZONE =====
function handleDecryptFile(file) {
    if (!file) return;
    
    if (!file.name.endsWith('.enc')) {
        showToast('⚠️ File harus berekstensi .enc!', 'error');
        return;
    }
    
    state.decFile = file;
    state.decFileName = file.name;
    state.decFileSize = file.size;
    
    DOM.fileInfoDecrypt.style.display = 'flex';
    DOM.fileNameDecrypt.textContent = file.name;
    DOM.fileSizeDecrypt.textContent = formatSize(file.size);
    
    DOM.decryptBtn.disabled = false;
    showToast(`🔐 ${file.name} siap di-decrypt`, 'success');
}

DOM.dropZoneDecrypt.addEventListener('dragover', (e) => {
    e.preventDefault();
    DOM.dropZoneDecrypt.classList.add('drag-over');
});

DOM.dropZoneDecrypt.addEventListener('dragleave', () => {
    DOM.dropZoneDecrypt.classList.remove('drag-over');
});

DOM.dropZoneDecrypt.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.dropZoneDecrypt.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleDecryptFile(file);
});

DOM.fileInputDecrypt.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleDecryptFile(file);
});

DOM.removeFileDecrypt.addEventListener('click', () => {
    state.decFile = null;
    DOM.fileInfoDecrypt.style.display = 'none';
    DOM.fileInputDecrypt.value = '';
    DOM.decryptBtn.disabled = true;
});

DOM.decPassword.addEventListener('input', () => {
    const hasFile = !!state.decFile;
    const passValid = DOM.decPassword.value.length >= 8;
    DOM.decryptBtn.disabled = !(hasFile && passValid);
});

// ===== DECRYPT =====
DOM.decryptBtn.addEventListener('click', async () => {
    if (state.isDecrypting) return;
    if (!state.decFile) {
        showToast('⚠️ Pilih file .enc dulu bro!', 'error');
        return;
    }
    
    const password = DOM.decPassword.value;
    if (password.length < 8) {
        showToast('⚠️ Password minimal 8 karakter!', 'error');
        return;
    }
    
    state.isDecrypting = true;
    DOM.decryptBtn.disabled = true;
    DOM.decryptBtn.innerHTML = '<span class="btn-spinner">⏳</span> Memproses...';
    
    try {
        await decryptFile(state.decFile, password);
    } catch (err) {
        showToast('❌ ' + err.message, 'error');
        console.error(err);
    } finally {
        state.isDecrypting = false;
        DOM.decryptBtn.disabled = false;
        DOM.decryptBtn.innerHTML = '<span class="btn-icon">🔓</span><span class="btn-text">Decrypt</span>';
    }
});

async function decryptFile(file, password) {
    // Show progress
    DOM.progressContainerDec.style.display = 'block';
    DOM.resultContainerDec.style.display = 'none';
    DOM.progressFillDec.style.width = '0%';
    DOM.progressTextDec.textContent = '0%';
    DOM.progressStatusDec.textContent = 'Membaca file...';
    
    // Read file
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const data = new Uint8Array(arrayBuffer);
    
    // Extract salt (16), iv (12), ciphertext
    if (data.length < 28) {
        throw new Error('File .enc tidak valid!');
    }
    
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const ciphertext = data.slice(28);
    
    DOM.progressStatusDec.textContent = 'Derive key...';
    DOM.progressFillDec.style.width = '30%';
    DOM.progressTextDec.textContent = '30%';
    
    // Derive key
    const key = await deriveKey(password, salt);
    
    DOM.progressStatusDec.textContent = 'Decrypting...';
    DOM.progressFillDec.style.width = '60%';
    DOM.progressTextDec.textContent = '60%';
    
    // Decrypt
    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );
        
        DOM.progressFillDec.style.width = '90%';
        DOM.progressTextDec.textContent = '90%';
        DOM.progressStatusDec.textContent = 'Finalizing...';
        
        // Get original filename (remove .enc)
        const originalName = file.name.replace(/\.enc$/i, '') || 'decrypted';
        
        // Show result
        DOM.resultContainerDec.style.display = 'flex';
        DOM.resultDetailDec.textContent = `Ukuran: ${formatSize(decrypted.byteLength)}`;
        
        // Store for download
        state.decResult = decrypted;
        state.decOriginalName = originalName;
        
        DOM.progressFillDec.style.width = '100%';
        DOM.progressTextDec.textContent = '100%';
        DOM.progressStatusDec.textContent = 'Selesai! ✅';
        
        showToast('✅ Dekripsi berhasil!', 'success');
        
    } catch (err) {
        throw new Error('Password salah atau file rusak!');
    }
}

// ===== DOWNLOAD DECRYPTED =====
DOM.downloadBtnDec.addEventListener('click', () => {
    if (!state.decResult) return;
    
    const blob = new Blob([state.decResult]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.decOriginalName || 'decrypted';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    
    showToast('📥 File asli diunduh!', 'success');
    
    setTimeout(() => {
        DOM.resetDecrypt.click();
    }, 2000);
});

// ===== RESET DECRYPT =====
DOM.resetDecrypt.addEventListener('click', () => {
    state.decFile = null;
    state.decResult = null;
    DOM.fileInfoDecrypt.style.display = 'none';
    DOM.fileInputDecrypt.value = '';
    DOM.decPassword.value = '';
    DOM.progressContainerDec.style.display = 'none';
    DOM.resultContainerDec.style.display = 'none';
    DOM.progressFillDec.style.width = '0%';
    DOM.progressTextDec.textContent = '0%';
    DOM.decryptBtn.disabled = true;
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Escape to reset
    if (e.key === 'Escape') {
        const active = document.querySelector('.tab-content.active');
        if (active) {
            const id = active.id;
            if (id === 'tab-encrypt') DOM.resetEncrypt.click();
            else if (id === 'tab-decrypt') DOM.resetDecrypt.click();
        }
    }
});

// ===== INIT =====
console.log('🔐 AZAZIL CRYPT v2.0 LOADED');
console.log('💀 AES-256-GCM • PBKDF2 250.000 iterations');
console.log('🔥 All encryption happens locally in your browser.');