/* ==========================================================================
   Source Code Copier — Frontend Logic
   ========================================================================== */

(function () {
    'use strict';

    /* -------------------- DOM Elements -------------------- */
    const urlInput       = document.getElementById('urlInput');
    const fetchBtn       = document.getElementById('fetchBtn');
    const statusBar      = document.getElementById('statusBar');
    const statusDot      = document.getElementById('statusDot');
    const statusText     = document.getElementById('statusText');
    const loadingInd     = document.getElementById('loadingIndicator');
    const errorBox       = document.getElementById('errorBox');
    const errorMessage   = document.getElementById('errorMessage');
    const codeContent    = document.getElementById('codeContent');
    const statChars      = document.getElementById('statChars');
    const statLines      = document.getElementById('statLines');
    const statTime       = document.getElementById('statTime');
    const copyBtn        = document.getElementById('copyBtn');
    const downloadBtn    = document.getElementById('downloadBtn');
    const clearBtn       = document.getElementById('clearBtn');

    /* -------------------- State -------------------- */
    let currentSource = '';
    let currentUrl    = '';

    /* -------------------- Helpers -------------------- */

    function setStatus(text, type = 'idle') {
        statusText.textContent = text;
        statusDot.className = 'status-dot';
        if (type === 'error')   statusDot.classList.add('error');
        if (type === 'loading') statusDot.classList.add('loading');
    }

    function showLoading(show) {
        loadingInd.classList.toggle('visible', show);
        fetchBtn.disabled = show;
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorBox.classList.add('visible');
    }

    function hideError() {
        errorBox.classList.remove('visible');
        errorMessage.textContent = '';
    }

    function resetStats() {
        statChars.textContent = '0';
        statLines.textContent = '0';
        statTime.textContent  = '0';
    }

    function formatNumber(n) {
        return new Intl.NumberFormat('id-ID').format(n);
    }

    /* -------------------- Fetch Source -------------------- */

    async function fetchSource() {
        const url = urlInput.value.trim();

        /* Reset */
        hideError();
        resetStats();

        /* Validasi */
        if (!url) {
            showError('URL tidak boleh kosong.');
            setStatus('URL kosong', 'error');
            return;
        }

        let parsed;
        try {
            parsed = new URL(url);
        } catch {
            showError('Format URL tidak valid. Contoh: https://example.com');
            setStatus('Format URL salah', 'error');
            return;
        }

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            showError('Hanya URL http atau https yang didukung.');
            setStatus('Protokol tidak didukung', 'error');
            return;
        }

        /* Loading */
        showLoading(true);
        setStatus('Mengambil source code...', 'loading');

        try {
            const res = await fetch(`/.netlify/functions/fetch?url=${encodeURIComponent(parsed.href)}`);
            const data = await res.json();

            if (!data.success) {
                showError(data.error || 'Gagal mengambil source code.');
                setStatus('Gagal mengambil data', 'error');
                return;
            }

            /* Update UI */
            currentSource = data.source;
            currentUrl    = data.url;

            codeContent.textContent = data.source;

            statChars.textContent = formatNumber(data.charCount);
            statLines.textContent = formatNumber(data.lineCount);
            statTime.textContent  = formatNumber(data.elapsedMs);

            setStatus(`Berhasil mengambil source dari ${data.url}`, 'idle');

        } catch (err) {
            showError(`Kesalahan jaringan: ${err.message}`);
            setStatus('Kesalahan jaringan', 'error');
        } finally {
            showLoading(false);
        }
    }

    /* -------------------- Actions -------------------- */

    function copyAll() {
        if (!currentSource) {
            showError('Belum ada source code untuk disalin.');
            return;
        }

        navigator.clipboard.writeText(currentSource)
            .then(() => {
                setStatus('Source code berhasil disalin ke clipboard.', 'idle');
            })
            .catch(err => {
                showError(`Gagal menyalin: ${err.message}`);
            });
    }

    function downloadSource() {
        if (!currentSource) {
            showError('Belum ada source code untuk diunduh.');
            return;
        }

        const blob = new Blob([currentSource], { type: 'text/html;charset=utf-8' });
        const url  = URL.createObjectURL(blob);

        /* Nama file dari hostname */
        let fileName = 'source.html';
        try {
            const host = new URL(currentUrl).hostname.replace(/\./g, '_');
            fileName = `${host}_source.html`;
        } catch { /* biarkan default */ }

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setStatus(`File ${fileName} berhasil diunduh.`, 'idle');
    }

    function clearAll() {
        urlInput.value = '';
        currentSource = '';
        currentUrl = '';
        codeContent.textContent = '// Source code akan muncul di sini...';
        resetStats();
        hideError();
        setStatus('Siap menerima URL', 'idle');
        urlInput.focus();
    }

    /* -------------------- Event Listeners -------------------- */

    fetchBtn.addEventListener('click', fetchSource);

    urlInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            fetchSource();
        }
    });

    copyBtn.addEventListener('click', copyAll);
    downloadBtn.addEventListener('click', downloadSource);
    clearBtn.addEventListener('click', clearAll);

    /* -------------------- Init -------------------- */

    document.getElementById('year').textContent = new Date().getFullYear();
    resetStats();

    console.log('Source Code Copier v1.0 — siap digunakan');
})();