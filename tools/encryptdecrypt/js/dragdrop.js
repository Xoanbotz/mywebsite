/**
 * dragdrop.js - Drag & Drop and File Upload Handlers
 * Manages file selection, drag and drop, and file validation
 */

import { getFileExtension, formatFileSize, validateEncryptedFile } from './crypto.js';
import { showToast } from './ui.js';

/**
 * DragDropManager - Manages drag and drop functionality
 */
class DragDropManager {
    constructor(options = {}) {
        this.dropZone = options.dropZone;
        this.fileInput = options.fileInput;
        this.fileInfo = options.fileInfo;
        this.fileName = options.fileName;
        this.fileSize = options.fileSize;
        this.fileType = options.fileType;
        this.removeButton = options.removeButton;
        this.onFileSelect = options.onFileSelect || null;
        this.onFileRemove = options.onFileRemove || null;
        this.acceptedTypes = options.acceptedTypes || [];
        this.maxSize = options.maxSize || Infinity;
        this.minSize = options.minSize || 0;
        
        this.currentFile = null;
        this.isDragging = false;
        
        this.init();
    }
    
    /**
     * Initialize drag and drop events
     */
    init() {
        if (!this.dropZone) {
            console.error('Drop zone element is required');
            return;
        }
        
        // Click to open file dialog
        this.dropZone.addEventListener('click', () => {
            this.openFileDialog();
        });
        
        // Drag events
        this.dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDragEnter(e);
        });
        
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDragOver(e);
        });
        
        this.dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDragLeave(e);
        });
        
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDrop(e);
        });
        
        // File input change
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e);
            });
        }
        
        // Remove button
        if (this.removeButton) {
            this.removeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFile();
            });
        }
    }
    
    /**
     * Open file dialog
     */
    openFileDialog() {
        if (this.fileInput) {
            this.fileInput.click();
        }
    }
    
    /**
     * Handle drag enter
     */
    handleDragEnter(e) {
        e.preventDefault();
        this.isDragging = true;
        this.dropZone.classList.add('dragover');
    }
    
    /**
     * Handle drag over
     */
    handleDragOver(e) {
        e.preventDefault();
        if (!this.dropZone.classList.contains('dragover')) {
            this.dropZone.classList.add('dragover');
        }
    }
    
    /**
     * Handle drag leave
     */
    handleDragLeave(e) {
        e.preventDefault();
        this.isDragging = false;
        this.dropZone.classList.remove('dragover');
    }
    
    /**
     * Handle drop
     */
    handleDrop(e) {
        e.preventDefault();
        this.isDragging = false;
        this.dropZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    /**
     * Handle file select from input
     */
    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    }
    
    /**
     * Process and validate file
     */
    processFile(file) {
        // Validate file
        const validation = this.validateFile(file);
        if (!validation.valid) {
            showToast(validation.message, 'error');
            return;
        }
        
        this.currentFile = file;
        this.displayFileInfo(file);
        
        if (this.onFileSelect) {
            this.onFileSelect(file);
        }
    }
    
    /**
     * Validate file
     */
    validateFile(file) {
        // Check if file exists
        if (!file) {
            return { valid: false, message: 'Tidak ada file yang dipilih' };
        }
        
        // Check file size
        if (file.size < this.minSize) {
            return { 
                valid: false, 
                message: `File terlalu kecil. Minimal ${formatFileSize(this.minSize)}` 
            };
        }
        
        if (file.size > this.maxSize) {
            return { 
                valid: false, 
                message: `File terlalu besar. Maksimal ${formatFileSize(this.maxSize)}` 
            };
        }
        
        // Check accepted types
        if (this.acceptedTypes.length > 0) {
            const ext = getFileExtension(file.name).toLowerCase();
            const type = file.type.toLowerCase();
            
            const isValid = this.acceptedTypes.some(accepted => {
                if (accepted.startsWith('.')) {
                    // Extension check
                    return ext === accepted.substring(1).toLowerCase();
                } else if (accepted.includes('/')) {
                    // MIME type check
                    return type === accepted.toLowerCase();
                } else {
                    // Extension without dot
                    return ext === accepted.toLowerCase();
                }
            });
            
            if (!isValid) {
                return { 
                    valid: false, 
                    message: `Tipe file tidak didukung. Terima: ${this.acceptedTypes.join(', ')}` 
                };
            }
        }
        
        // Special validation for encrypted files
        if (this.acceptedTypes.includes('.enc')) {
            const reader = new FileReader();
            try {
                const isValid = validateEncryptedFile(reader.result);
                // Note: This is a sync check, but we can't read file synchronously
                // We'll do this check asynchronously in the decrypt page
            } catch (error) {
                // Skip validation here, will be done later
            }
        }
        
        return { valid: true };
    }
    
    /**
     * Display file information
     */
    displayFileInfo(file) {
        if (this.fileInfo) {
            this.fileInfo.style.display = 'block';
            this.fileInfo.classList.add('visible');
        }
        
        if (this.fileName) {
            this.fileName.textContent = file.name;
        }
        
        if (this.fileSize) {
            this.fileSize.textContent = formatFileSize(file.size);
        }
        
        if (this.fileType) {
            this.fileType.textContent = `Tipe: ${file.type || 'Unknown'}`;
        }
        
        // Hide upload content if exists
        const uploadContent = this.dropZone?.querySelector('.upload-content');
        if (uploadContent) {
            uploadContent.style.display = 'none';
        }
    }
    
    /**
     * Remove current file
     */
    removeFile() {
        this.currentFile = null;
        
        if (this.fileInfo) {
            this.fileInfo.style.display = 'none';
            this.fileInfo.classList.remove('visible');
        }
        
        if (this.fileName) {
            this.fileName.textContent = '';
        }
        
        if (this.fileSize) {
            this.fileSize.textContent = '';
        }
        
        if (this.fileType) {
            this.fileType.textContent = '';
        }
        
        // Show upload content
        const uploadContent = this.dropZone?.querySelector('.upload-content');
        if (uploadContent) {
            uploadContent.style.display = 'block';
        }
        
        // Reset file input
        if (this.fileInput) {
            this.fileInput.value = '';
        }
        
        if (this.onFileRemove) {
            this.onFileRemove();
        }
    }
    
    /**
     * Get current file
     */
    getFile() {
        return this.currentFile;
    }
    
    /**
     * Check if file is loaded
     */
    hasFile() {
        return this.currentFile !== null;
    }
    
    /**
     * Reset the drop zone
     */
    reset() {
        this.removeFile();
        this.dropZone.classList.remove('dragover');
        this.isDragging = false;
    }
    
    /**
     * Update accepted types
     */
    setAcceptedTypes(types) {
        this.acceptedTypes = types;
    }
    
    /**
     * Update file size limits
     */
    setSizeLimits(min, max) {
        this.minSize = min || 0;
        this.maxSize = max || Infinity;
    }
}

/**
 * Create drag and drop manager for encrypt page
 */
export function createEncryptDragDrop() {
    const dropZone = document.getElementById('encryptDropZone');
    const fileInput = document.getElementById('encryptFileInput');
    const fileInfo = document.getElementById('encryptFileInfo');
    const fileName = document.getElementById('encryptFileName');
    const fileSize = document.getElementById('encryptFileSize');
    const fileType = document.getElementById('encryptFileType');
    const removeButton = document.getElementById('encryptRemoveFile');
    
    if (!dropZone || !fileInput) {
        console.error('Encrypt drag drop elements not found');
        return null;
    }
    
    return new DragDropManager({
        dropZone: dropZone,
        fileInput: fileInput,
        fileInfo: fileInfo,
        fileName: fileName,
        fileSize: fileSize,
        fileType: fileType,
        removeButton: removeButton,
        acceptedTypes: [], // Accept all files
        maxSize: 1024 * 1024 * 1024, // 1GB
        minSize: 1 // At least 1 byte
    });
}

/**
 * Create drag and drop manager for decrypt page
 */
export function createDecryptDragDrop() {
    const dropZone = document.getElementById('decryptDropZone');
    const fileInput = document.getElementById('decryptFileInput');
    const fileInfo = document.getElementById('decryptFileInfo');
    const fileName = document.getElementById('decryptFileName');
    const fileSize = document.getElementById('decryptFileSize');
    const fileType = document.getElementById('decryptFileType');
    const removeButton = document.getElementById('decryptRemoveFile');
    
    if (!dropZone || !fileInput) {
        console.error('Decrypt drag drop elements not found');
        return null;
    }
    
    return new DragDropManager({
        dropZone: dropZone,
        fileInput: fileInput,
        fileInfo: fileInfo,
        fileName: fileName,
        fileSize: fileSize,
        fileType: fileType,
        removeButton: removeButton,
        acceptedTypes: ['.enc'],
        maxSize: 1024 * 1024 * 1024, // 1GB
        minSize: 64 // Minimum size for encrypted file
    });
}

/**
 * Validate encrypted file content (async)
 */
export async function validateEncryptedFileContent(file) {
    try {
        const buffer = await file.arrayBuffer();
        return validateEncryptedFile(buffer);
    } catch (error) {
        console.error('Error validating encrypted file:', error);
        return false;
    }
}

export { DragDropManager };