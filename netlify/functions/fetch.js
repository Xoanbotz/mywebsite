/* ==========================================================================
   Netlify Function — /api/fetch
   Proxy fetch ke URL publik, mengembalikan HTML source.
   ========================================================================== */

const fetch = require('node-fetch');

exports.handler = async (event) => {
    /* CORS headers */
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    /* Handle preflight */
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

    /* Validasi input */
    if (!url) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Parameter "url" wajib diisi.' })
        };
    }

    /* Validasi format URL */
    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Format URL tidak valid. Contoh: https://example.com' })
        };
    }

    /* Batasi http/https aja */
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Hanya URL http atau https yang diizinkan.' })
        };
    }

    const startTime = Date.now();

    try {
        const response = await fetch(parsedUrl.href, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SourceCodeCopier/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 15000
        });

        if (!response.ok) {
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: `Website mengembalikan status ${response.status} ${response.statusText}.`
                })
            };
        }

        const contentType = response.headers.get('content-type') || '';
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

        const html = await response.text();
        const elapsed = Date.now() - startTime;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                url: parsedUrl.href,
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

        if (err.name === 'AbortError' || err.type === 'request-timeout') {
            return {
                statusCode: 504,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Waktu permintaan habis (timeout). Website terlalu lama merespons.'
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