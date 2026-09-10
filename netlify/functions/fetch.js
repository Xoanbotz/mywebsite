/* ==========================================================================
   Netlify Function — /api/fetch
   Ambil HTML + asset (CSS, JS, gambar) secara TERPISAH.
   ========================================================================== */

const axios = require('axios');

const MAX_ASSETS = 30;
const ASSET_TIMEOUT = 8000;
const MAX_ASSET_SIZE = 5 * 1024 * 1024;

/* Helper: fetch asset */
async function fetchAsset(url) {
    try {
        const res = await axios.get(url, {
            timeout: ASSET_TIMEOUT,
            responseType: 'arraybuffer',
            maxRedirects: 5,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SourceCodeCopier/1.0)' },
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

/* Helper: ekstrak URL CSS dari HTML */
function extractCSSUrls(html, baseUrl) {
    const urls = new Set();
    const regex = /<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi;
    const matches = html.match(regex) || [];
    for (const tag of matches) {
        const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
        if (!hrefMatch) continue;
        const href = hrefMatch[1];
        if (href.startsWith('data:') || href.startsWith('blob:')) continue;
        try {
            urls.add(new URL(href, baseUrl).href);
        } catch { /* skip */ }
    }
    return [...urls];
}

/* Helper: ekstrak URL JS dari HTML */
function extractJSUrls(html, baseUrl) {
    const urls = new Set();
    const regex = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const src = match[1];
        if (src.startsWith('data:') || src.startsWith('blob:')) continue;
        try {
            urls.add(new URL(src, baseUrl).href);
        } catch { /* skip */ }
    }
    return [...urls];
}

/* Helper: ekstrak URL gambar dari HTML */
function extractImageUrls(html, baseUrl) {
    const urls = new Set();
    const regex = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const src = match[1];
        if (src.startsWith('data:') || src.startsWith('blob:')) continue;
        try {
            urls.add(new URL(src, baseUrl).href);
        } catch { /* skip */ }
    }
    return [...urls];
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

        const html = typeof response.data === 'string' ? response.data : String(response.data);
        const baseUrl = parsedUrl.href;

        /* Ekstrak semua URL asset */
        const cssUrls = extractCSSUrls(html, baseUrl).slice(0, MAX_ASSETS);
        const jsUrls = extractJSUrls(html, baseUrl).slice(0, MAX_ASSETS);
        const imgUrls = extractImageUrls(html, baseUrl).slice(0, MAX_ASSETS);

        /* Fetch semua asset secara paralel */
        const [cssAssets, jsAssets, imgAssets] = await Promise.all([
            Promise.all(cssUrls.map(async (u) => {
                const asset = await fetchAsset(u);
                return asset ? { url: u, content: asset.buffer.toString('utf-8') } : null;
            })),
            Promise.all(jsUrls.map(async (u) => {
                const asset = await fetchAsset(u);
                return asset ? { url: u, content: asset.buffer.toString('utf-8') } : null;
            })),
            Promise.all(imgUrls.map(async (u) => {
                const asset = await fetchAsset(u);
                if (!asset) return null;
                const mime = asset.contentType || 'image/png';
                const base64 = asset.buffer.toString('base64');
                return { url: u, content: `data:${mime};base64,${base64}`, mime };
            }))
        ]);

        const elapsed = Date.now() - startTime;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                url: baseUrl,
                status: response.status,
                contentType,
                html: {
                    source: html,
                    charCount: html.length,
                    lineCount: html.split(/\r?\n/).length
                },
                css: cssAssets.filter(Boolean),
                js: jsAssets.filter(Boolean),
                images: imgAssets.filter(Boolean),
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