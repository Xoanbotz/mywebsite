function downloadSource() {
    if (!currentSource) {
        showError('Belum ada source code untuk diunduh.');
        return;
    }

    const blob = new Blob([currentSource], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);

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

    setStatus(`File ${fileName} berhasil diunduh (${(currentSource.length / 1024).toFixed(1)} KB).`, 'idle');
}