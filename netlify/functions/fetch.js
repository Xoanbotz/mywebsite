/* ==========================================================================
   Netlify Function — /api/fetch
   Proxy fetch HTML + inline CSS, JS, dan gambar.
   ========================================================================== */

const axios = require('axios');

const MAX_ASSETS = 30;         // batas jumlah asset yang di-fetch
const ASSET_TIMEOUT = 8000;    // timeout per asset (ms)
const MAX_ASSET_SIZE = 5 * 1024 * 1024; // 5 MB per asset

/* --------------------------------------------------------------------------
   Helper: ambil konten asset dengan aman
   -------------------------------------------------------------------------- */
async function fetchAsset(url) {
    try {
        const res = await axios.get(url, {
            timeout: ASSET_TIMEOUT,
            responseType: 'arraybuffer',
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SourceCodeCopier/1.0)'
            },
            validateStatus: () => true
        });

        if (res.status !== 200) return null;
        if (res.data.byteLength > MAX_ASSET_SIZE) return null;

        return {
            buffer: Buffer.from(res.data),
            contentType: res.headers['content-type'] || ''
        };
    } catch {
        return null;
    }
}

/* --------------------------------------------------------------------------
   Helper: inline CSS
   -------------------------------------------------------------------------- */
async function inlineCSS(html, baseUrl) {
    const linkRegex = /<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi;
    const matches = html.match(linkRegex) || [];

    for (const tag of matches.slice(0, MAX_ASSETS)) {
        const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
        if (!hrefMatch) continue;

        const href = hrefMatch[1];
        if (href.startsWith('data:') || href.startsWith('blob:')) continue;

        let cssUrl;
        try {
            cssUrl = new URL(href, baseUrl).href;
        } catch { continue; }

        const asset = await fetchAsset(cssUrl);
        if (!asset) continue;

        const cssText = asset.buffer.toString('utf-8');
        const styleTag = `<style data-inlined-from="${cssUrl}">\n${cssText}\n</style>`;
        html = html.replace(tag, styleTag);
    }
    return html;
}

/* --------------------------------------------------------------------------
   Helper: inline JS
   -------------------------------------------------------------------------- */
async function inlineJS(html, baseUrl) {
    const scriptRegex = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi;
    const matches = [...html.matchAll(scriptRegex)];

    for (const match of matches.slice(0, MAX_ASSETS)) {
        const fullTag = match[0];
        const src = match[1];
        if (src.startsWith('data:') || src.startsWith('blob:')) continue;

        let jsUrl;
        try {
            jsUrl = new URL(src, baseUrl).href;
        } catch { continue; }

        const asset = await fetchAsset(jsUrl);
        if (!asset) continue;

        const jsText = asset.buffer.toString('utf-8');
        const scriptTag = `<script data-inlined-from="${jsUrl}">\n${jsText}\n</script>`;
        html = html.replace(fullTag, scriptTag);
    }
    return html;
}

/* --------------------------------------------------------------------------
   Helper: inline gambar
   -------------------------------------------------------------------------- */
async function inlineImages(html, baseUrl) {
    const imgRegex = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
    const matches = [...html.matchAll(imgRegex)];

    for (const match of matches.slice(0, MAX_ASSETS)) {
        const fullTag = match[0];
        const src = match[1];
        if (src.startsWith('data:') || src.startsWith('blob:')) continue;

        let imgUrl;
        try {
            imgUrl = new URL(src, baseUrl).href;
        } catch { continue; }

        const asset = await fetchAsset(imgUrl);
        if (!asset) continue;

        const base64 = asset.buffer.toString('base64');
        const mime = asset.contentType || 'image/png';
        const dataUri = `data:${mime};base64,${base64}`;

        html = html.replace(fullTag, fullTag.replace(src, dataUri));
    }
    return html;
}

/* --------------------------------------------------------------------------
   Handler utama
   -------------------------------------------------------------------------- */
exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed.' })
        };
    }

    const { url } = event.queryStringParameters || {};

    if (!url) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Parameter "url" wajib diisi.' })
        };
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Format URL tidak valid.' })
        };
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Hanya URL http atau https yang diizinkan.' })
        };
    }

    const startTime = Date.now();

    try {
        const response = await axios.get(parsedUrl.href, {
            timeout: 15000,
            responseType: 'text',
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SourceCodeCopier/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            validateStatus: () => true
        });

        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('text') && !contentType.includes('html') && !contentType.includes('xml')) {
            return {
                statusCode: 415,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: `Tipe konten "${contentType}" tidak didukung.`
                })
            };
        }

        let html = typeof response.data === 'string' ? response.data : String(response.data);
        const baseUrl = parsedUrl.href;

        /* Inline semua asset secara paralel */
        const [cssDone, jsDone, imgDone] = await Promise.all([
            inlineCSS(html, baseUrl),
            inlineJS(html, baseUrl),
            inlineImages(html, baseUrl)
        ]);

        /* CSS harus dijalanin dulu, baru JS & img pake hasil CSS */
        html = cssDone;
        html = await inlineJS(html, baseUrl);
        html = await inlineImages(html, baseUrl);

        const elapsed = Date.now() - startTime;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                url: baseUrl,
                status: response.status,
                contentType,
                source: html,
                charCount: html.length,
                lineCount: html.split(/\r?\n/).length,
                elapsedMs: elapsed
            })
        };

    } catch (err) {
        const elapsed = Date.now() - startTime;

        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
            return {
                statusCode: 504,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Waktu permintaan habis (timeout).'
                })
            };
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: `Gagal mengambil source: ${err.message}`,
                elapsedMs: elapsed
            })
        };
    }
};