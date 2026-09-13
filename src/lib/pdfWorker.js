// pdf.worker 的正确加载策略。
//
// 问题背景：Vite/Astro 会把 `import('pdfjs-dist/build/pdf.worker.mjs?url')`
// 打包成 dist/_astro/pdf.worker.<hash>.mjs。部分静态托管（如 EdgeOne Pages）
// 不认识 .mjs 扩展名，会以 application/octet-stream 返回，浏览器按严格 MIME
// 规则拒绝执行，pdf.js 就会抛 "Setting up fake worker failed"。
//
// 解决：先用 HEAD 请求探测本地 bundle 的 MIME；只有在 MIME 确实是 JS 时才用本地，
// 否则回退到 jsdelivr CDN（始终返回 application/javascript）。
// 这样既能保住「本地优先、不依赖外网」，又能在托管环境缺 MIME 配置时自动自愈。

const CDN_WORKER =
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';

function isJsMime(contentType) {
  const ct = String(contentType || '').toLowerCase();
  if (!ct) return false;
  // octet-stream 与 text/html 是最常见的两种情况：前者 MIME 未配置，后者是 404 兜底页
  if (ct.indexOf('octet-stream') !== -1) return false;
  if (ct.indexOf('text/html') !== -1) return false;
  return (
    ct.indexOf('javascript') !== -1 ||
    ct.indexOf('ecmascript') !== -1 ||
    ct.indexOf('text/plain') !== -1
  );
}

async function usable(url) {
  if (!url) return false;
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'force-cache' });
    if (!res.ok) {
      // 部分 CDN/网关不支持 HEAD，改用带 range 的 GET 再试一次
      const g = await fetch(url, {
        method: 'GET',
        cache: 'force-cache',
        headers: { Range: 'bytes=0-1' },
      });
      return g.ok && isJsMime(g.headers.get('content-type'));
    }
    return isJsMime(res.headers.get('content-type'));
  } catch (e) {
    return false;
  }
}

// 返回可直接赋给 pdfjsLib.GlobalWorkerOptions.workerSrc 的地址
export async function resolvePdfWorkerSrc() {
  try {
    const mod = await import('pdfjs-dist/build/pdf.worker.mjs?url');
    const local = mod && mod.default;
    if (await usable(local)) return local;
  } catch (e) {
    /* 打包产物不可用，走 CDN */
  }
  return CDN_WORKER;
}
