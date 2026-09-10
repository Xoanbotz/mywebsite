/* ==========================================================================
   Netlify Function — /api/fetch
   Proxy fetch ke URL publik, mengembalikan HTML source.
   ========================================================================== */

const axios = require('axios');

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
            body: JSON.stringify({ success: false, error: 'Format URL tidak valid. Contoh: https://example.com' })
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

        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
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