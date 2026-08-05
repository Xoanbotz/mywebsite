/**
 * password.js - Password Management
 * Handles password input, generation, strength checking, and visibility toggle
 */

import { generatePassword, checkPasswordStrength } from './crypto.js';
import { showToast, copyToClipboard } from './ui.js';

/**
 * PasswordManager - Manages password input and related functionality
 */
class PasswordManager {
    constructor(options = {}) {
        this.input = options.input;
        this.toggleButton = options.toggleButton;
        this.strengthFill = options.strengthFill;
        this.strengthText = options.strengthText;
        this.generateButton = options.generateButton;
        this.lengthButtons = options.lengthButtons || [];
        this.confirmInput = options.confirmInput;
        this.minLength = options.minLength || 8;
        this.onPasswordChange = options.onPasswordChange || null;
        
        this.currentLength = 16;
        this.isVisible = false;
        
        this.init();
    }
    
    /**
     * Initialize password manager
     */
    init() {
        // Toggle password visibility
        if (this.toggleButton && this.input) {
            this.toggleButton.addEventListener('click', () => {
                this.toggleVisibility();
            });
        }
        
        // Input events
        if (this.input) {
            this.input.addEventListener('input', () => {
                this.handleInputChange();
            });
            
            this.input.addEventListener('focus', () => {
                this.handleInputFocus();
            });
            
            this.input.addEventListener('blur', () => {
                this.handleInputBlur();
            });
        }
        
        // Confirm input events
        if (this.confirmInput) {
            this.confirmInput.addEventListener('input', () => {
                this.checkConfirmMatch();
            });
        }
        
        // Generate password button
        if (this.generateButton) {
            this.generateButton.addEventListener('click', () => {
                this.generateAndSetPassword();
            });
        }
        
        // Length buttons
        if (this.lengthButtons.length > 0) {
            this.lengthButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const length = parseInt(btn.dataset.length);
                    if (!isNaN(length)) {
                        this.setLength(length);
                    }
                });
            });
        }
        
        // Initial strength check
        if (this.input && this.input.value) {
            this.updateStrength(this.input.value);
        }
    }
    
    /**
     * Toggle password visibility
     */
    toggleVisibility() {
        if (!this.input) return;
        
        this.isVisible = !this.isVisible;
        this.input.type = this.isVisible ? 'text' : 'password';
        
        // Update button icon
        if (this.toggleButton) {
            const svg = this.toggleButton.querySelector('svg');
            if (svg) {
                if (this.isVisible) {
                    // Eye closed icon (hide password)
                    svg.innerHTML = `
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                    `;
                } else {
                    // Eye open icon (show password)
                    svg.innerHTML = `
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    `;
                }
            }
        }
        
        // Keep focus
        this.input.focus();
    }
    
    /**
     * Handle input change
     */
    handleInputChange() {
        const value = this.input.value;
        this.updateStrength(value);
        this.checkConfirmMatch();
        
        if (this.onPasswordChange) {
            this.onPasswordChange(value);
        }
    }
    
    /**
     * Handle input focus
     */
    handleInputFocus() {
        const container = this.input.closest('.password-field');
        if (container) {
            container.classList.add('focused');
        }
    }
    
    /**
     * Handle input blur
     */
    handleInputBlur() {
        const container = this.input.closest('.password-field');
        if (container) {
            container.classList.remove('focused');
        }
    }
    
    /**
     * Update password strength display
     */
    updateStrength(password) {
        if (!password) {
            if (this.strengthFill) {
                this.strengthFill.style.width = '0%';
                this.strengthFill.className = 'strength-fill';
            }
            if (this.strengthText) {
                this.strengthText.textContent = 'Kosong';
                this.strengthText.style.color = '';
            }
            return;
        }
        
        const result = checkPasswordStrength(password);
        
        if (this.strengthFill) {
            const percentage = (result.score / 5) * 100;
            this.strengthFill.style.width = percentage + '%';
            this.strengthFill.className = `strength-fill ${result.color}`;
        }
        
        if (this.strengthText) {
            this.strengthText.textContent = result.label;
            
            // Color the text based on strength
            const colors = {
                'weak': 'var(--error)',
                'fair': 'var(--warning)',
                'good': 'var(--info)',
                'strong': 'var(--success)',
                'empty': 'var(--text-muted)'
            };
            this.strengthText.style.color = colors[result.color] || 'var(--text-muted)';
        }
        
        return result;
    }
    
    /**
     * Check if confirm password matches
     */
    checkConfirmMatch() {
        if (!this.confirmInput || !this.input) return true;
        
        const password = this.input.value;
        const confirm = this.confirmInput.value;
        
        if (confirm.length === 0) {
            this.confirmInput.style.borderColor = '';
            return true;
        }
        
        const matches = password === confirm;
        this.confirmInput.style.borderColor = matches ? 'var(--success)' : 'var(--error)';
        
        return matches;
    }
    
    /**
     * Generate and set password
     */
    generateAndSetPassword() {
        if (!this.input) return;
        
        const password = generatePassword(this.currentLength);
        this.input.value = password;
        this.handleInputChange();
        
        // Auto-hide if visible
        if (this.isVisible) {
            this.toggleVisibility();
        }
        
        // Show success toast
        showToast('Password berhasil dibuat!', 'success');
        
        // Trigger change event
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    /**
     * Set password length
     */
    setLength(length) {
        this.currentLength = length;
        
        // Update active button
        this.lengthButtons.forEach(btn => {
            const btnLength = parseInt(btn.dataset.length);
            btn.classList.toggle('active', btnLength === length);
        });
        
        // If input is empty, generate new password with new length
        if (this.input && !this.input.value) {
            this.generateAndSetPassword();
        }
    }
    
    /**
     * Get current password
     */
    getPassword() {
        return this.input ? this.input.value : '';
    }
    
    /**
     * Set password value
     */
    setPassword(password) {
        if (this.input) {
            this.input.value = password;
            this.handleInputChange();
        }
    }
    
    /**
     * Clear password
     */
    clearPassword() {
        if (this.input) {
            this.input.value = '';
            this.handleInputChange();
        }
        if (this.confirmInput) {
            this.confirmInput.value = '';
            this.confirmInput.style.borderColor = '';
        }
    }
    
    /**
     * Validate password
     */
    validate() {
        const password = this.getPassword();
        
        if (password.length < this.minLength) {
            showToast(`Password minimal ${this.minLength} karakter`, 'error');
            return false;
        }
        
        if (this.confirmInput) {
            const matches = this.checkConfirmMatch();
            if (!matches) {
                showToast('Konfirmasi password tidak cocok', 'error');
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Copy password to clipboard
     */
    async copyPassword() {
        const password = this.getPassword();
        if (!password) {
            showToast('Tidak ada password untuk disalin', 'warning');
            return false;
        }
        
        const success = await copyToClipboard(password);
        if (success) {
            showToast('Password disalin ke clipboard!', 'success');
        }
        return success;
    }
}

/**
 * Create password manager for encrypt page
 */
export function createEncryptPasswordManager() {
    const input = document.getElementById('encryptPassword');
    const toggleButton = document.querySelector('[data-target="encryptPassword"]');
    const strengthFill = document.getElementById('encryptStrengthFill');
    const strengthText = document.getElementById('encryptStrengthText');
    const generateButton = document.getElementById('encryptGeneratePassword');
    const lengthButtons = document.querySelectorAll('.length-btn');
    
    if (!input) {
        console.error('Encrypt password input not found');
        return null;
    }
    
    return new PasswordManager({
        input: input,
        toggleButton: toggleButton,
        strengthFill: strengthFill,
        strengthText: strengthText,
        generateButton: generateButton,
        lengthButtons: lengthButtons,
        minLength: 8
    });
}

/**
 * Create password manager for decrypt page
 */
export function createDecryptPasswordManager() {
    const input = document.getElementById('decryptPassword');
    const toggleButton = document.querySelector('[data-target="decryptPassword"]');
    const strengthFill = document.getElementById('decryptStrengthFill');
    const strengthText = document.getElementById('decryptStrengthText');
    
    if (!input) {
        console.error('Decrypt password input not found');
        return null;
    }
    
    return new PasswordManager({
        input: input,
        toggleButton: toggleButton,
        strengthFill: strengthFill,
        strengthText: strengthText,
        minLength: 8
    });
}

/**
 * Password strength indicator helper
 */
export function updatePasswordStrength(input, fillElement, textElement) {
    const password = input.value;
    if (!password) {
        if (fillElement) {
            fillElement.style.width = '0%';
            fillElement.className = 'strength-fill';
        }
        if (textElement) {
            textElement.textContent = 'Kosong';
        }
        return null;
    }
    
    const result = checkPasswordStrength(password);
    
    if (fillElement) {
        const percentage = (result.score / 5) * 100;
        fillElement.style.width = percentage + '%';
        fillElement.className = `strength-fill ${result.color}`;
    }
    
    if (textElement) {
        textElement.textContent = result.label;
    }
    
    return result;
}

export { PasswordManager };