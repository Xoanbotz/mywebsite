/**
 * app.js - Main Application Entry Point
 * Initializes and orchestrates all application modules
 */

import { initUI, showToast, showLoading, hideLoading, setButtonEnabled, setElementVisible, updateProgress, updateProgressDetails } from './ui.js';
import { encryptFile, decryptFile, formatFileSize } from './crypto.js';
import { createEncryptDragDrop, createDecryptDragDrop, validateEncryptedFileContent } from './dragdrop.js';
import { createEncryptPasswordManager, createDecryptPasswordManager } from './password.js';
import { getHistoryManager, addHistoryEntry, initHistory } from './history.js';
import { getFileExtension, getFileNameWithoutExtension, isWebCryptoSupported } from './utils.js';

/**
 * App - Main application class
 */
class App {
    constructor() {
        // Page elements
        this.encryptDropZone = null;
        this.decryptDropZone = null;
        this.encryptFileInput = null;
        this.decryptFileInput = null;
        
        // Managers
        this.encryptDragDrop = null;
        this.decryptDragDrop = null;
        this.encryptPasswordManager = null;
        this.decryptPasswordManager = null;
        this.historyManager = null;
        
        // State
        this.isProcessing = false;
        this.encryptFile = null;
        this.decryptFile = null;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the application
     */
    async init() {
        // Check Web Crypto API support
        if (!isWebCryptoSupported()) {
            showToast('Browser tidak mendukung Web Crypto API. Gunakan browser modern.', 'error', 5000);
            return;
        }
        
        // Initialize UI
        initUI();
        
        // Initialize history
        this.historyManager = initHistory();
        
        // Initialize drag and drop
        this.initDragDrop();
        
        // Initialize password managers
        this.initPasswordManagers();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Set default password length
        this.setDefaultPasswordLength();
        
        console.log('AzazilCrypt v2.0 initialized successfully');
        console.log('Web Crypto API:', isWebCryptoSupported() ? '✅ Supported' : '❌ Not supported');
        console.log('Secure Context:', window.isSecureContext ? '✅' : '⚠️');
    }
    
    /**
     * Initialize drag and drop managers
     */
    initDragDrop() {
        // Encrypt drag drop
        this.encryptDragDrop = createEncryptDragDrop();
        if (this.encryptDragDrop) {
            this.encryptDragDrop.onFileSelect = (file) => {
                this.handleEncryptFileSelect(file);
            };
            this.encryptDragDrop.onFileRemove = () => {
                this.handleEncryptFileRemove();
            };
        }
        
        // Decrypt drag drop
        this.decryptDragDrop = createDecryptDragDrop();
        if (this.decryptDragDrop) {
            this.decryptDragDrop.onFileSelect = async (file) => {
                await this.handleDecryptFileSelect(file);
            };
            this.decryptDragDrop.onFileRemove = () => {
                this.handleDecryptFileRemove();
            };
        }
    }
    
    /**
     * Initialize password managers
     */
    initPasswordManagers() {
        // Encrypt password manager
        this.encryptPasswordManager = createEncryptPasswordManager();
        if (this.encryptPasswordManager) {
            this.encryptPasswordManager.onPasswordChange = () => {
                this.validateEncryptForm();
            };
        }
        
        // Decrypt password manager
        this.decryptPasswordManager = createDecryptPasswordManager();
        if (this.decryptPasswordManager) {
            this.decryptPasswordManager.onPasswordChange = () => {
                this.validateDecryptForm();
            };
        }
    }
    
    /**
     * Set default password length
     */
    setDefaultPasswordLength() {
        const defaultLength = 16;
        const buttons = document.querySelectorAll('.length-btn');
        buttons.forEach(btn => {
            const length = parseInt(btn.dataset.length);
            if (length === defaultLength) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Encrypt button
        const encryptBtn = document.getElementById('encryptButton');
        if (encryptBtn) {
            encryptBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleEncrypt();
            });
        }
        
        // Decrypt button
        const decryptBtn = document.getElementById('decryptButton');
        if (decryptBtn) {
            decryptBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleDecrypt();
            });
        }
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter to encrypt/decrypt
            if (e.ctrlKey && e.key === 'Enter') {
                const activePage = document.querySelector('.page.active');
                if (activePage) {
                    const id = activePage.id;
                    if (id === 'encrypt') {
                        this.handleEncrypt();
                    } else if (id === 'decrypt') {
                        this.handleDecrypt();
                    }
                }
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                // Close any open elements
            }
        });
    }
    
    /**
     * Handle encrypt file select
     */
    handleEncryptFileSelect(file) {
        this.encryptFile = file;
        this.validateEncryptForm();
    }
    
    /**
     * Handle encrypt file remove
     */
    handleEncryptFileRemove() {
        this.encryptFile = null;
        this.validateEncryptForm();
        
        // Reset progress
        setElementVisible('encryptProgress', false);
        updateProgress('encryptProgressFill', 0, 'encryptPercent');
    }
    
    /**
     * Handle decrypt file select
     */
    async handleDecryptFileSelect(file) {
        this.decryptFile = file;
        
        // Validate encrypted file
        try {
            const isValid = await validateEncryptedFileContent(file);
            if (!isValid) {
                showToast('File bukan format AzazilCrypt yang valid', 'error');
                this.decryptDragDrop.removeFile();
                this.decryptFile = null;
                this.validateDecryptForm();
                return;
            }
        } catch (error) {
            console.error('File validation error:', error);
            showToast('Gagal memvalidasi file', 'error');
            this.decryptDragDrop.removeFile();
            this.decryptFile = null;
            this.validateDecryptForm();
            return;
        }
        
        this.validateDecryptForm();
    }
    
    /**
     * Handle decrypt file remove
     */
    handleDecryptFileRemove() {
        this.decryptFile = null;
        this.validateDecryptForm();
        
        // Reset progress
        setElementVisible('decryptProgress', false);
        updateProgress('decryptProgressFill', 0, 'decryptPercent');
    }
    
    /**
     * Validate encrypt form
     */
    validateEncryptForm() {
        const hasFile = this.encryptFile !== null;
        const password = this.encryptPasswordManager ? this.encryptPasswordManager.getPassword() : '';
        const isValid = hasFile && password.length >= 8;
        
        setButtonEnabled('encryptButton', isValid);
        return isValid;
    }
    
    /**
     * Validate decrypt form
     */
    validateDecryptForm() {
        const hasFile = this.decryptFile !== null;
        const password = this.decryptPasswordManager ? this.decryptPasswordManager.getPassword() : '';
        const isValid = hasFile && password.length >= 8;
        
        setButtonEnabled('decryptButton', isValid);
        return isValid;
    }
    
    /**
     * Handle encrypt process
     */
    async handleEncrypt() {
        if (this.isProcessing) return;
        
        // Validate form
        if (!this.validateEncryptForm()) {
            showToast('Silakan pilih file dan masukkan password (min. 8 karakter)', 'warning');
            return;
        }
        
        const file = this.encryptFile;
        const password = this.encryptPasswordManager.getPassword();
        
        if (!file || !password) {
            showToast('File atau password tidak valid', 'error');
            return;
        }
        
        // Start processing
        this.isProcessing = true;
        setButtonEnabled('encryptButton', false);
        showLoading('Mengenkripsi file...');
        setElementVisible('encryptProgress', true);
        updateProgress('encryptProgressFill', 0, 'encryptPercent');
        
        const startTime = performance.now();
        
        try {
            // Simulate progress updates
            let progressInterval = setInterval(() => {
                const elapsed = performance.now() - startTime;
                // Estimate progress based on file size and time
                const estimatedTotal = file.size / (1024 * 1024) * 2000; // 2MB per second estimate
                const progress = Math.min((elapsed / estimatedTotal) * 100, 95);
                updateProgress('encryptProgressFill', progress, 'encryptPercent');
            }, 100);
            
            // Perform encryption
            const result = await encryptFile(file, password);
            
            clearInterval(progressInterval);
            updateProgress('encryptProgressFill', 100, 'encryptPercent');
            
            // Calculate speed
            const endTime = performance.now();
            const duration = endTime - startTime;
            const speed = result.encryptedSize / (duration / 1000);
            updateProgressDetails('encryptSpeed', 'encryptETA', speed, 0);
            
            // Download encrypted file
            const encryptedFilename = `${getFileNameWithoutExtension(file.name)}.enc`;
            const blob = new Blob([result.encryptedData], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = encryptedFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            
            // Add to history
            addHistoryEntry({
                type: 'encrypt',
                filename: file.name,
                size: file.size,
                duration: duration,
                status: 'success'
            });
            
            showToast(`File berhasil dienkripsi: ${encryptedFilename}`, 'success');
            
            // Reset form after delay
            setTimeout(() => {
                this.resetEncryptForm();
            }, 2000);
            
        } catch (error) {
            console.error('Encryption error:', error);
            showToast(`Enkripsi gagal: ${error.message}`, 'error');
            
            // Add error to history
            addHistoryEntry({
                type: 'encrypt',
                filename: file.name,
                size: file.size,
                duration: performance.now() - startTime,
                status: 'error',
                error: error.message
            });
            
        } finally {
            hideLoading();
            this.isProcessing = false;
            setButtonEnabled('encryptButton', true);
        }
    }
    
    /**
     * Handle decrypt process
     */
    async handleDecrypt() {
        if (this.isProcessing) return;
        
        // Validate form
        if (!this.validateDecryptForm()) {
            showToast('Silakan pilih file dan masukkan password (min. 8 karakter)', 'warning');
            return;
        }
        
        const file = this.decryptFile;
        const password = this.decryptPasswordManager.getPassword();
        
        if (!file || !password) {
            showToast('File atau password tidak valid', 'error');
            return;
        }
        
        // Start processing
        this.isProcessing = true;
        setButtonEnabled('decryptButton', false);
        showLoading('Mendekripsi file...');
        setElementVisible('decryptProgress', true);
        updateProgress('decryptProgressFill', 0, 'decryptPercent');
        
        const startTime = performance.now();
        
        try {
            // Read file
            const encryptedBuffer = await file.arrayBuffer();
            
            // Simulate progress
            let progressInterval = setInterval(() => {
                const elapsed = performance.now() - startTime;
                const estimatedTotal = file.size / (1024 * 1024) * 2000;
                const progress = Math.min((elapsed / estimatedTotal) * 100, 95);
                updateProgress('decryptProgressFill', progress, 'decryptPercent');
            }, 100);
            
            // Perform decryption
            const result = await decryptFile(encryptedBuffer, password);
            
            clearInterval(progressInterval);
            updateProgress('decryptProgressFill', 100, 'decryptPercent');
            
            // Calculate speed
            const endTime = performance.now();
            const duration = endTime - startTime;
            const speed = result.size / (duration / 1000);
            updateProgressDetails('decryptSpeed', 'decryptETA', speed, 0);
            
            // Get original filename
            let originalName = 'decrypted_file';
            // Try to extract original name from file name
            const fileName = file.name;
            if (fileName.endsWith('.enc')) {
                originalName = fileName.slice(0, -4);
            }
            
            // Download decrypted file
            const blob = new Blob([result.plaintext], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = originalName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            
            // Add to history
            addHistoryEntry({
                type: 'decrypt',
                filename: file.name,
                size: result.size,
                duration: duration,
                status: 'success'
            });
            
            showToast(`File berhasil didekripsi: ${originalName}`, 'success');
            
            // Reset form after delay
            setTimeout(() => {
                this.resetDecryptForm();
            }, 2000);
            
        } catch (error) {
            console.error('Decryption error:', error);
            
            let errorMessage = error.message || 'Dekripsi gagal';
            if (errorMessage.includes('password') || errorMessage.includes('decrypt')) {
                errorMessage = 'Password salah atau file korup';
            }
            
            showToast(`Dekripsi gagal: ${errorMessage}`, 'error');
            
            // Add error to history
            addHistoryEntry({
                type: 'decrypt',
                filename: file.name,
                size: file.size,
                duration: performance.now() - startTime,
                status: 'error',
                error: errorMessage
            });
            
        } finally {
            hideLoading();
            this.isProcessing = false;
            setButtonEnabled('decryptButton', true);
        }
    }
    
    /**
     * Reset encrypt form
     */
    resetEncryptForm() {
        if (this.encryptDragDrop) {
            this.encryptDragDrop.reset();
        }
        if (this.encryptPasswordManager) {
            this.encryptPasswordManager.clearPassword();
        }
        this.encryptFile = null;
        setElementVisible('encryptProgress', false);
        updateProgress('encryptProgressFill', 0, 'encryptPercent');
        this.validateEncryptForm();
    }
    
    /**
     * Reset decrypt form
     */
    resetDecryptForm() {
        if (this.decryptDragDrop) {
            this.decryptDragDrop.reset();
        }
        if (this.decryptPasswordManager) {
            this.decryptPasswordManager.clearPassword();
        }
        this.decryptFile = null;
        setElementVisible('decryptProgress', false);
        updateProgress('decryptProgressFill', 0, 'decryptPercent');
        this.validateDecryptForm();
    }
}

// ========================================
// Start Application
// ========================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new App();
    });
} else {
    window.app = new App();
}

// ========================================
// Expose for debugging (development only)
// ========================================

// Export app instance for debugging
export { App };