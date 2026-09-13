import { test, expect } from '@playwright/test';

/**
 * 冒烟测试：验证 10 个核心工具页可加载、无 JS 报错、关键元素存在。
 * 不测交互（压缩/OCR 等），只测「页面没挂」。
 */
test.describe('工具页冒烟测试', () => {
  const toolPages = [
    { name: '首页', url: '/', expectH1: true },
    { name: '截图', url: '/take-a-screenshot/', expectH1: true },
    { name: '图片压缩', url: '/image-compressor/', expectH1: true },
    { name: '长图拼接', url: '/long-image/', expectH1: true },
    { name: '格式转换', url: '/convert/', expectH1: true },
    { name: '视频转 GIF', url: '/video-convert/', expectH1: true },
    { name: '背景去除', url: '/background-remover/', expectH1: true },
    { name: 'OCR PDF', url: '/ocr-pdf/', expectH1: true },
    { name: '文档查看', url: '/viewer/', expectH1: true },
    { name: '圆角图片', url: '/photo-to-rounded/', expectH1: true },
  ];

  for (const { name, url, expectH1 } of toolPages) {
    test(`${name}页能正常加载`, async ({ page }) => {
      // 收集 JS 报错
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto(url, { waitUntil: 'domcontentloaded' });

      // 1. 页面标题不为空
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);

      // 2. 有 h1（工具页核心标题）
      if (expectH1) {
        await expect(page.locator('h1')).toHaveCount(1, { timeout: 15_000 });
      }

      // 3. 无致命 JS 报错（过滤已知的第三方库 warning）
      const fatalErrors = errors.filter(
        (e) =>
          !e.includes('WASM') &&
          !e.includes('worker') &&
          !e.includes('Download the public') &&
          !e.includes('model'),
      );
      expect(fatalErrors, `页面 JS 报错:\n${fatalErrors.join('\n')}`).toHaveLength(0);

      // 4. 页脚存在（Layout 完整性）
      await expect(page.locator('footer')).toHaveCount(1, { timeout: 10_000 });
    });
  }
});
