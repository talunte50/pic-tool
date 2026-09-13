import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import wasm from "vite-plugin-wasm";
import { readdirSync, unlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONFIG } from "./src/lib/config";

// 构建后删除 dist/_astro/ 下 >24MB 的超大文件
// onnxruntime-web 的 ort-wasm-*.wasm（~27MB）超过 EdgeOne 单文件 25MB 限制
// OCR 运行时已从 CDN 加载 wasm（OcrTool.jsx wasmPaths → jsdelivr），本地副本无需部署
function removeLargeFiles(threshold = 24 * 1024 * 1024) {
  return {
    name: 'remove-large-files',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const distDir = fileURLToPath(dir);
        const astroDir = join(distDir, '_astro');
        let removed = [];
        try {
          for (const f of readdirSync(astroDir)) {
            const fp = join(astroDir, f);
            try {
              if (statSync(fp).size > threshold) {
                unlinkSync(fp);
                removed.push(f);
              }
            } catch (e) { /* stat 失败跳过 */ }
          }
        } catch (e) { /* _astro 目录不存在则跳过 */ }
        if (removed.length) {
          console.log(`[remove-large-files] Deleted ${removed.length} file(s) > ${(threshold / 1024 / 1024).toFixed(0)}MB:`);
          for (const f of removed) console.log(`  - ${f}`);
        }
      }
    }
  };
}

// https://astro.build/config
export default defineConfig({
  site: CONFIG.website,
  trailingSlash: 'ignore',
  compressHTML: false,
  integrations: [tailwind(), react(), removeLargeFiles()],
  output: "static",
  vite: {
    plugins: [wasm()]
  }
});
