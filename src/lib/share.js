/**
 * 工具链分享链接：把当前参数编码进 URL hash（#opt=...），
 * 页面加载时解析并应用。hash 方案无需服务端、刷新不丢、可跨页携带。
 */

export function buildShareUrl(params) {
    const url = new URL(window.location.href);
    const opt = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') opt.set(k, String(v));
    });
    const q = opt.toString();
    if (q) url.hash = `opt=${encodeURIComponent(q)}`;
    else url.hash = '';
    return url.toString();
}

export function readShareParams() {
    const h = window.location.hash || '';
    const m = h.match(/opt=([^&]+)/);
    if (!m) return null;
    try {
        const parsed = new URLSearchParams(decodeURIComponent(m[1]));
        const obj = {};
        parsed.forEach((v, k) => (obj[k] = v));
        return Object.keys(obj).length ? obj : null;
    } catch {
        return null;
    }
}

export function clearShareHash() {
    if (window.location.hash.startsWith('#opt=')) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }
}

export async function copyShareLink(params) {
    const url = buildShareUrl(params);
    try {
        await navigator.clipboard.writeText(url);
        return url;
    } catch {
        return url;
    }
}
