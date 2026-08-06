/**
 * history.js - History Management
 * Stores and manages encryption/decryption history during browser session
 */

import { formatDate, formatFileSize, showToast } from './ui.js';

/**
 * HistoryManager - Manages session history
 */
class HistoryManager {
    constructor() {
        this.history = [];
        this.maxItems = 100;
        this.currentFilter = 'all';
        this.loadFromSession();
    }
    
    /**
     * Load history from session storage
     */
    loadFromSession() {
        try {
            const saved = sessionStorage.getItem('azazil-history');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    this.history = parsed;
                }
            }
        } catch (error) {
            console.error('Failed to load history from session:', error);
            this.history = [];
        }
    }
    
    /**
     * Save history to session storage
     */
    saveToSession() {
        try {
            sessionStorage.setItem('azazil-history', JSON.stringify(this.history));
        } catch (error) {
            console.error('Failed to save history to session:', error);
        }
    }
    
    /**
     * Add a new history entry
     * @param {Object} entry - History entry
     * @param {string} entry.type - 'encrypt' or 'decrypt'
     * @param {string} entry.filename - Original filename
     * @param {number} entry.size - File size in bytes
     * @param {number} entry.duration - Process duration in milliseconds
     * @param {string} entry.status - 'success' or 'error'
     * @param {string} entry.error - Error message if failed (optional)
     */
    addEntry(entry) {
        const historyEntry = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            type: entry.type || 'encrypt',
            filename: entry.filename || 'unknown',
            size: entry.size || 0,
            duration: entry.duration || 0,
            status: entry.status || 'success',
            error: entry.error || null,
            timestamp: new Date().toISOString()
        };
        
        this.history.unshift(historyEntry);
        
        // Limit history size
        if (this.history.length > this.maxItems) {
            this.history = this.history.slice(0, this.maxItems);
        }
        
        this.saveToSession();
        this.render();
        
        // Update dashboard stats
        this.updateDashboardStats();
        
        return historyEntry;
    }
    
    /**
     * Get all history entries
     * @param {string} filter - Filter by type ('all', 'encrypt', 'decrypt')
     * @returns {Array} Filtered history entries
     */
    getEntries(filter = null) {
        const type = filter || this.currentFilter;
        if (type === 'all') {
            return this.history;
        }
        return this.history.filter(entry => entry.type === type);
    }
    
    /**
     * Get history stats
     * @returns {Object} Statistics
     */
    getStats() {
        const encrypts = this.history.filter(e => e.type === 'encrypt' && e.status === 'success');
        const decrypts = this.history.filter(e => e.type === 'decrypt' && e.status === 'success');
        const errors = this.history.filter(e => e.status === 'error');
        
        return {
            total: this.history.length,
            encryptCount: encrypts.length,
            decryptCount: decrypts.length,
            errorCount: errors.length,
            totalSize: this.history.reduce((sum, e) => sum + e.size, 0),
            averageDuration: this.history.length > 0 
                ? this.history.reduce((sum, e) => sum + e.duration, 0) / this.history.length 
                : 0
        };
    }
    
    /**
     * Clear all history
     */
    clearHistory() {
        this.history = [];
        this.saveToSession();
        this.render();
        this.updateDashboardStats();
        showToast('Riwayat berhasil dibersihkan', 'success');
    }
    
    /**
     * Remove a single entry by ID
     * @param {string} id - Entry ID
     */
    removeEntry(id) {
        this.history = this.history.filter(entry => entry.id !== id);
        this.saveToSession();
        this.render();
        this.updateDashboardStats();
    }
    
    /**
     * Set filter and re-render
     * @param {string} filter - Filter type
     */
    setFilter(filter) {
        this.currentFilter = filter;
        this.render();
        this.updateFilterButtons();
    }
    
    /**
     * Update filter buttons
     */
    updateFilterButtons() {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => {
            const filter = btn.dataset.filter;
            btn.classList.toggle('active', filter === this.currentFilter);
        });
    }
    
    /**
     * Render history to DOM
     */
    render() {
        const container = document.getElementById('historyList');
        if (!container) return;
        
        const entries = this.getEntries();
        
        if (entries.length === 0) {
            container.innerHTML = `
                <p class="empty-state">Belum ada riwayat aktivitas</p>
            `;
            return;
        }
        
        container.innerHTML = entries.map(entry => this.createHistoryItemHTML(entry)).join('');
        
        // Add click event listeners for remove buttons
        container.querySelectorAll('.history-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                if (id) {
                    this.removeEntry(id);
                }
            });
        });
    }
    
    /**
     * Create HTML for a history item
     * @param {Object} entry - History entry
     * @returns {string} HTML string
     */
    createHistoryItemHTML(entry) {
        const icon = entry.type === 'encrypt' ? '🔐' : '🔓';
        const typeLabel = entry.type === 'encrypt' ? 'Enkripsi' : 'Dekripsi';
        const statusClass = entry.status === 'success' ? 'success' : 'error';
        const statusLabel = entry.status === 'success' ? 'Berhasil' : 'Gagal';
        const durationLabel = entry.duration ? `${(entry.duration / 1000).toFixed(2)}s` : '--';
        const date = new Date(entry.timestamp);
        
        let errorHtml = '';
        if (entry.error) {
            errorHtml = `<span class="history-error">${entry.error}</span>`;
        }
        
        return `
            <div class="history-item" data-id="${entry.id}">
                <div class="history-info">
                    <div class="history-icon ${entry.type}">
                        <span>${icon}</span>
                    </div>
                    <div class="history-details">
                        <div class="history-name">${this.escapeHtml(entry.filename)}</div>
                        <div class="history-meta">
                            <span>${typeLabel}</span>
                            <span>•</span>
                            <span>${formatFileSize(entry.size)}</span>
                            <span>•</span>
                            <span>${durationLabel}</span>
                            <span>•</span>
                            <span>${formatDate(date)}</span>
                            ${errorHtml}
                        </div>
                    </div>
                </div>
                <div class="history-right">
                    <span class="history-status ${statusClass}">${statusLabel}</span>
                    <button class="history-remove-btn" data-id="${entry.id}" aria-label="Hapus riwayat">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Update dashboard statistics
     */
    updateDashboardStats() {
        const stats = this.getStats();
        
        const encryptCount = document.getElementById('encryptCount');
        if (encryptCount) {
            encryptCount.textContent = stats.encryptCount;
        }
        
        const decryptCount = document.getElementById('decryptCount');
        if (decryptCount) {
            decryptCount.textContent = stats.decryptCount;
        }
        
        // Update recent activity on dashboard
        this.updateRecentActivity();
    }
    
    /**
     * Update recent activity on dashboard
     */
    updateRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        const recent = this.history.slice(0, 5);
        
        if (recent.length === 0) {
            container.innerHTML = `
                <p class="empty-state">Belum ada aktivitas</p>
            `;
            return;
        }
        
        container.innerHTML = recent.map(entry => {
            const icon = entry.type === 'encrypt' ? '🔐' : '🔓';
            const statusClass = entry.status === 'success' ? 'success' : 'error';
            const statusLabel = entry.status === 'success' ? 'Berhasil' : 'Gagal';
            const date = new Date(entry.timestamp);
            
            return `
                <div class="activity-item">
                    <div class="activity-info">
                        <div class="activity-icon ${entry.type}">
                            <span>${icon}</span>
                        </div>
                        <div class="activity-details">
                            <div class="activity-name">${this.escapeHtml(entry.filename)}</div>
                            <div class="activity-meta">
                                ${entry.type === 'encrypt' ? 'Enkripsi' : 'Dekripsi'} • 
                                ${formatFileSize(entry.size)} • 
                                ${formatDate(date)}
                            </div>
                        </div>
                    </div>
                    <span class="activity-status ${statusClass}">${statusLabel}</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Initialize history UI
     */
    initUI() {
        // Render history
        this.render();
        this.updateDashboardStats();
        
        // Setup filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                if (filter) {
                    this.setFilter(filter);
                }
            });
        });
        
        // Setup clear history button
        const clearBtn = document.getElementById('clearHistory');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (this.history.length === 0) {
                    showToast('Tidak ada riwayat untuk dihapus', 'info');
                    return;
                }
                
                if (confirm('Yakin ingin menghapus semua riwayat?')) {
                    this.clearHistory();
                }
            });
        }
        
        // Update session time
        this.updateSessionTime();
        setInterval(() => this.updateSessionTime(), 60000);
    }
    
    /**
     * Update session time display
     */
    updateSessionTime() {
        const element = document.getElementById('sessionTime');
        if (!element) return;
        
        // Get session start time from session storage
        let startTime = sessionStorage.getItem('azazil-session-start');
        if (!startTime) {
            startTime = Date.now().toString();
            sessionStorage.setItem('azazil-session-start', startTime);
        }
        
        const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 60000);
        
        if (elapsed < 60) {
            element.textContent = `${elapsed}m`;
        } else {
            const hours = Math.floor(elapsed / 60);
            const minutes = elapsed % 60;
            element.textContent = `${hours}j ${minutes}m`;
        }
    }
}

/**
 * Create history manager instance
 */
let historyManager = null;

/**
 * Get or create history manager
 * @returns {HistoryManager} History manager instance
 */
export function getHistoryManager() {
    if (!historyManager) {
        historyManager = new HistoryManager();
    }
    return historyManager;
}

/**
 * Add history entry
 * @param {Object} entry - History entry
 */
export function addHistoryEntry(entry) {
    const manager = getHistoryManager();
    return manager.addEntry(entry);
}

/**
 * Clear all history
 */
export function clearHistory() {
    const manager = getHistoryManager();
    manager.clearHistory();
}

/**
 * Initialize history
 */
export function initHistory() {
    const manager = getHistoryManager();
    manager.initUI();
    return manager;
}

export { HistoryManager };