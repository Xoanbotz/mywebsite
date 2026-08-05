/**
 * ui.js - User Interface Utilities
 * Handles toast notifications, loading states, theme management, and UI updates
 */

// ========================================
// TOAST NOTIFICATIONS
// ========================================

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.error('Toast container not found');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon based on type
    const icon = getToastIcon(type);
    
    toast.innerHTML = `
        <span class="toast-message">${icon} ${message}</span>
        <button class="toast-close" aria-label="Close notification">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Auto-remove after duration
    const timeout = setTimeout(() => {
        removeToast(toast);
    }, duration);
    
    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearTimeout(timeout);
            removeToast(toast);
        });
    }
    
    // Hover pause
    toast.addEventListener('mouseenter', () => {
        clearTimeout(timeout);
    });
    
    toast.addEventListener('mouseleave', () => {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    });
    
    return toast;
}

/**
 * Remove a toast with animation
 * @param {HTMLElement} toast - Toast element to remove
 */
function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    
    toast.classList.add('removing');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

/**
 * Get icon for toast type
 * @param {string} type - Toast type
 * @returns {string} HTML icon
 */
function getToastIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

/**
 * Clear all toasts
 */
export function clearToasts() {
    const container = document.getElementById('toastContainer');
    if (container) {
        container.innerHTML = '';
    }
}

// ========================================
// LOADING OVERLAY
// ========================================

/**
 * Show loading overlay
 * @param {string} message - Loading message
 */
export function showLoading(message = 'Memproses...') {
    const overlay = document.getElementById('loadingOverlay');
    const text = overlay?.querySelector('.loading-text');
    
    if (overlay) {
        if (text) text.textContent = message;
        overlay.classList.add('visible');
        overlay.style.display = 'flex';
    }
}

/**
 * Hide loading overlay
 */
export function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('visible');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }
}

/**
 * Update loading message
 * @param {string} message - New loading message
 */
export function updateLoadingMessage(message) {
    const overlay = document.getElementById('loadingOverlay');
    const text = overlay?.querySelector('.loading-text');
    if (text) {
        text.textContent = message;
    }
}

// ========================================
// THEME MANAGEMENT
// ========================================

/**
 * Toggle theme between dark and light
 */
export function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    setTheme(newTheme);
}

/**
 * Set theme
 * @param {string} theme - Theme name ('dark' or 'light')
 */
export function setTheme(theme) {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    
    // Save to localStorage
    try {
        localStorage.setItem('azazil-theme', theme);
    } catch (error) {
        // Ignore localStorage errors
    }
    
    // Update theme toggle button icon
    updateThemeIcon(theme);
}

/**
 * Load saved theme
 */
export function loadTheme() {
    try {
        const savedTheme = localStorage.getItem('azazil-theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
            setTheme(savedTheme);
            return savedTheme;
        }
    } catch (error) {
        // Ignore localStorage errors
    }
    
    // Default: dark mode
    setTheme('dark');
    return 'dark';
}

/**
 * Update theme toggle icon
 * @param {string} theme - Current theme
 */
function updateThemeIcon(theme) {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    
    const svg = toggle.querySelector('svg');
    if (!svg) return;
    
    if (theme === 'dark') {
        // Sun icon (switch to light)
        svg.innerHTML = `
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        `;
    } else {
        // Moon icon (switch to dark)
        svg.innerHTML = `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        `;
    }
}

// ========================================
// NAVIGATION
// ========================================

/**
 * Navigate to a page
 * @param {string} pageId - ID of the page to navigate to
 */
export function navigateTo(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add('active');
    }
    
    // Update nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${pageId}`) {
            link.classList.add('active');
        }
    });
    
    // Close sidebar on mobile
    closeSidebar();
}

/**
 * Open sidebar
 */
export function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.add('open');
    }
    
    // Create overlay if doesn't exist
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', closeSidebar);
        document.body.appendChild(overlay);
    }
    overlay.classList.add('active');
}

/**
 * Close sidebar
 */
export function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.remove('open');
    }
    
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

/**
 * Toggle sidebar
 */
export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

// ========================================
// UTILITY UI FUNCTIONS
// ========================================

/**
 * Update progress bar
 * @param {string} elementId - ID of the progress fill element
 * @param {number} percent - Percentage (0-100)
 * @param {string} percentTextId - ID of the percentage text element (optional)
 */
export function updateProgress(elementId, percent, percentTextId = null) {
    const fill = document.getElementById(elementId);
    if (fill) {
        fill.style.width = Math.min(100, Math.max(0, percent)) + '%';
    }
    
    if (percentTextId) {
        const text = document.getElementById(percentTextId);
        if (text) {
            text.textContent = Math.round(percent) + '%';
        }
    }
}

/**
 * Update progress details
 * @param {string} speedId - ID of speed element
 * @param {string} etaId - ID of ETA element
 * @param {number} speed - Speed in bytes per second
 * @param {number} eta - Estimated time in seconds
 */
export function updateProgressDetails(speedId, etaId, speed, eta) {
    const speedEl = document.getElementById(speedId);
    const etaEl = document.getElementById(etaId);
    
    if (speedEl) {
        speedEl.textContent = formatSpeed(speed);
    }
    
    if (etaEl) {
        etaEl.textContent = `Estimasi: ${formatETA(eta)}`;
    }
}

/**
 * Format speed for display
 * @param {number} bytesPerSecond - Speed in bytes/second
 * @returns {string} Formatted speed
 */
function formatSpeed(bytesPerSecond) {
    if (bytesPerSecond === 0) return '0 MB/s';
    
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const k = 1024;
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    const size = bytesPerSecond / Math.pow(k, i);
    
    return size.toFixed(1) + ' ' + units[i];
}

/**
 * Format ETA for display
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted ETA
 */
function formatETA(seconds) {
    if (!seconds || seconds === Infinity || seconds === 0) {
        return '--';
    }
    
    if (seconds < 60) {
        return `${Math.round(seconds)} detik`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}j ${minutes}m`;
    }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        return false;
    }
}

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
        return 'Baru saja';
    } else if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m yang lalu`;
    } else if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}j yang lalu`;
    } else if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}h yang lalu`;
    } else {
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / Math.pow(k, i);
    
    return size.toFixed(i > 0 ? 2 : 0) + ' ' + sizes[i];
}

/**
 * Enable/disable button
 * @param {string} buttonId - ID of the button
 * @param {boolean} enabled - Whether button should be enabled
 */
export function setButtonEnabled(buttonId, enabled) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = !enabled;
    }
}

/**
 * Show/hide element
 * @param {string} elementId - ID of the element
 * @param {boolean} show - Whether to show or hide
 */
export function setElementVisible(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
        if (show) {
            element.style.display = 'block';
            element.classList.add('visible');
        } else {
            element.style.display = 'none';
            element.classList.remove('visible');
        }
    }
}

/**
 * Create ripple effect
 * @param {Event} event - Click event
 */
export function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize UI components
 */
export function initUI() {
    // Load theme
    loadTheme();
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTheme();
            createRipple(e);
        });
    }
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleSidebar();
            createRipple(e);
        });
    }
    
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const pageId = href.substring(1);
                navigateTo(pageId);
                createRipple(e);
            }
        });
    });
    
    // Quick actions
    const quickEncrypt = document.getElementById('quickEncrypt');
    if (quickEncrypt) {
        quickEncrypt.addEventListener('click', () => {
            navigateTo('encrypt');
        });
    }
    
    const quickDecrypt = document.getElementById('quickDecrypt');
    if (quickDecrypt) {
        quickDecrypt.addEventListener('click', () => {
            navigateTo('decrypt');
        });
    }
    
    // Add ripple effect to buttons
    document.querySelectorAll('.btn-primary, .btn-secondary, .btn-generate, .filter-btn, .length-btn').forEach(btn => {
        btn.classList.add('ripple');
        btn.addEventListener('click', createRipple);
    });
}