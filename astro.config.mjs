import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import wasm from "vite-plugin-wasm";

// sitemap 集成已移除：@astrojs/sitemap 3.x 与底层 sitemap 包在 EdgeOne 构建环境存在路径兼容问题
// （absolute path not allowed / _routes undefined），后续可用 astro-sitemap 插件或静态 robots.txt 替代
import { CONFIG } from "./src/lib/config";

// https://astro.build/config
export default defineConfig({
  site: CONFIG.website,
  trailingSlash: 'ignore',
  compressHTML: false,
  integrations: [tailwind(), react()],
  output: "static",
  vite: {
    plugins: [wasm()]
  }
});
