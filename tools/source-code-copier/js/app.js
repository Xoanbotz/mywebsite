/* ==========================================================================
   Source Code Copier — Frontend Logic v2.0
   Multi-tab: HTML, CSS, JS, Images
   ========================================================================== */

(function () {
    'use strict';

    /* -------------------- DOM -------------------- */
    const urlInput     = document.getElementById('urlInput');
    const fetchBtn     = document.getElementById('fetchBtn');
    const statusDot    = document.getElementById('statusDot');
    const statusText   = document.getElementById('statusText');
    const loadingInd   = document.getElementById('loadingIndicator');
    const errorBox     = document.getElementById('errorBox');
    const errorMessage = document.getElementById('errorMessage');

    const checkHtml = document.getElementById('checkHtml');
    const checkCss  = document.getElementById('checkCss');
    const checkJs   = document.getElementById('checkJs');
    const checkImg  = document.getElementById('checkImg');

    const codeHtml = document.getElementById('codeHtml');
    const codeCss  = document.getElementById('codeCss');
    const codeJs   = document.getElementById('codeJs');
    const imageGrid = document.getElementById('imageGrid');

    const countCss = document.getElementById('countCss');
    const countJs  = document.getElementById('countJs');
    const countImg = document.getElementById('countImg');

    const statChars = document.getElementById('statChars');
    const statLines = document.getElementById('statLines');
    const statTime  = document.getElementById('statTime');

    /* -------------------- State -------------------- */
    let data = {
        html: '',
        css: [],
        js: [],
        images: [],
        url: ''
    };

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

    function formatNumber(n) {
        return new Intl.NumberFormat('id-ID').format(n);
    }

    function resetAll() {
        data = { html: '', css: [], js: [], images: [], url: '' };
        codeHtml.textContent = '// Source HTML muncul di sini...';
        codeCss.textContent  = '// Source CSS muncul di sini...';
        codeJs.textContent   = '// Source JS muncul di sini...';
        imageGrid.innerHTML  = '<p class="empty-state">Belum ada gambar.</p>';
        countCss.textContent = '0';
        countJs.textContent  = '0';
        countImg.textContent = '0';
        statChars.textContent = '0';
        statLines.textContent = '0';
        statTime.textContent  = '0';
    }

    /* -------------------- Tab Logic -------------------- */
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });

    /* -------------------- Fetch -------------------- */
    async function fetchSource() {
        const url = urlInput.value.trim();
        hideError();

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

        const wantHtml = checkHtml.checked;
        const wantCss  = checkCss.checked;
        const wantJs   = checkJs.checked;
        const wantImg  = checkImg.checked;

        if (!wantHtml && !wantCss && !wantJs && !wantImg) {
            showError('Pilih minimal satu jenis source code.');
            setStatus('Belum ada pilihan', 'error');
            return;
        }

        showLoading(true);
        setStatus('Mengambil source code...', 'loading');

        try {
            const res = await fetch(`/.netlify/functions/fetch?url=${encodeURIComponent(parsed.href)}`);
            const result = await res.json();

            if (!result.success) {
                showError(result.error || 'Gagal mengambil source code.');
                setStatus('Gagal mengambil data', 'error');
                return;
            }

            /* Reset & simpan data */
            resetAll();
            data.url = result.url;

            let totalChars = 0;
            let totalLines = 0;

            /* HTML */
            if (wantHtml) {
                data.html = result.html.source;
                codeHtml.textContent = data.html;
                totalChars += result.html.charCount;
                totalLines += result.html.lineCount;
            }

            /* CSS */
            if (wantCss) {
                data.css = result.css || [];
                if (data.css.length > 0) {
                    codeCss.textContent = data.css.map((item, i) =>
                        `/* ===== [${i + 1}] ${item.url} ===== */\n${item.content}\n\n`
                    ).join('');
                    totalChars += codeCss.textContent.length;
                    totalLines += codeCss.textContent.split(/\r?\n/).length;
                } else {
                    codeCss.textContent = '// Tidak ada file CSS eksternal ditemukan.';
                }
                countCss.textContent = data.css.length;
            }

            /* JS */
            if (wantJs) {
                data.js = result.js || [];
                if (data.js.length > 0) {
                    codeJs.textContent = data.js.map((item, i) =>
                        `/* ===== [${i + 1}] ${item.url} ===== */\n${item.content}\n\n`
                    ).join('');
                    totalChars += codeJs.textContent.length;
                    totalLines += codeJs.textContent.split(/\r?\n/).length;
                } else {
                    codeJs.textContent = '// Tidak ada file JavaScript eksternal ditemukan.';
                }
                countJs.textContent = data.js.length;
            }

            /* Images */
            if (wantImg) {
                data.images = result.images || [];
                renderImages(data.images);
                countImg.textContent = data.images.length;
            }

            statChars.textContent = formatNumber(totalChars);
            statLines.textContent = formatNumber(totalLines);
            statTime.textContent  = formatNumber(result.elapsedMs);

            setStatus(`Berhasil mengambil source dari ${result.url}`, 'idle');

        } catch (err) {
            showError(`Kesalahan jaringan: ${err.message}`);
            setStatus('Kesalahan jaringan', 'error');
        } finally {
            showLoading(false);
        }
    }

    /* -------------------- Render Images -------------------- */
    function renderImages(images) {
        if (!images || images.length === 0) {
            imageGrid.innerHTML = '<p class="empty-state">Belum ada gambar.</p>';
            return;
        }
        imageGrid.innerHTML = images.map((img, i) => `
            <div class="image-card">
                <img src="${img.content}" alt="image-${i + 1}" loading="lazy">
                <div class="image-name">${img.url.split('/').pop() || `image-${i + 1}`}</div>
            </div>
        `).join('');
    }

    /* -------------------- Actions -------------------- */
    function copyToClipboard(text, label) {
        if (!text) {
            showError(`Belum ada ${label} untuk disalin.`);
            return;
        }
        navigator.clipboard.writeText(text)
            .then(() => setStatus(`${label} berhasil disalin ke clipboard.`, 'idle'))
            .catch(err => showError(`Gagal menyalin: ${err.message}`));
    }

    function downloadFile(content, filename, mime) {
        if (!content) {
            showError('Belum ada konten untuk diunduh.');
            return;
        }
        const blob = new Blob([content], { type: mime });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatus(`File ${filename} berhasil diunduh.`, 'idle');
    }

    function getHostPrefix() {
        try {
            return new URL(data.url).hostname.replace(/\./g, '_');
        } catch {
            return 'source';
        }
    }

    async function downloadAll() {
        if (!data.html && data.css.length === 0 && data.js.length === 0 && data.images.length === 0) {
            showError('Belum ada data untuk diunduh.');
            return;
        }

        const zip = new JSZip();
        const prefix = getHostPrefix();
        const folder = zip.folder(`${prefix}_source`);

        if (data.html) folder.file('index.html', data.html);

        data.css.forEach((item, i) => {
            const name = item.url.split('/').pop() || `style-${i + 1}.css`;
            folder.folder('css').file(name, item.content);
        });

        data.js.forEach((item, i) => {
            const name = item.url.split('/').pop() || `script-${i + 1}.js`;
            folder.folder('js').file(name, item.content);
        });

        data.images.forEach((item, i) => {
            const name = item.url.split('/').pop() || `image-${i + 1}`;
            const base64 = item.content.split(',')[1];
            folder.folder('images').file(name, base64, { base64: true });
        });

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${prefix}_source.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setStatus(`ZIP berhasil diunduh (${(blob.size / 1024).toFixed(1)} KB).`, 'idle');
    }

    function clearAll() {
        urlInput.value = '';
        resetAll();
        hideError();
        setStatus('Siap menerima URL', 'idle');
        urlInput.focus();
    }

    /* -------------------- Event -------------------- */
    fetchBtn.addEventListener('click', fetchSource);
    urlInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); fetchSource(); }
    });

    document.getElementById('copyHtml').addEventListener('click', () => copyToClipboard(data.html, 'HTML'));
    document.getElementById('copyCss').addEventListener('click', () => {
        const text = data.css.map(item => item.content).join('\n\n');
        copyToClipboard(text, 'CSS');
    });
    document.getElementById('copyJs').addEventListener('click', () => {
        const text = data.js.map(item => item.content).join('\n\n');
        copyToClipboard(text, 'JavaScript');
    });

    document.getElementById('downloadHtml').addEventListener('click', () => {
        downloadFile(data.html, `${getHostPrefix()}_index.html`, 'text/html;charset=utf-8');
    });
    document.getElementById('downloadCss').addEventListener('click', () => {
        const text = data.css.map((item, i) =>
            `/* ===== ${item.url} ===== */\n${item.content}\n`
        ).join('\n\n');
        downloadFile(text, `${getHostPrefix()}_styles.css`, 'text/css;charset=utf-8');
    });
    document.getElementById('downloadJs').addEventListener('click', () => {
        const text = data.js.map((item, i) =>
            `/* ===== ${item.url} ===== */\n${item.content}\n`
        ).join('\n\n');
        downloadFile(text, `${getHostPrefix()}_scripts.js`, 'application/javascript;charset=utf-8');
    });

    document.getElementById('downloadAll').addEventListener('click', downloadAll);
    document.getElementById('clearBtn').addEventListener('click', clearAll);

    /* -------------------- Init -------------------- */
    document.getElementById('year').textContent = new Date().getFullYear();
    resetAll();

    console.log('Source Code Copier v2.0 — siap digunakan');
})();