// npm install — 用 cmd /c 调用 npm.cmd，避免 shell:true 的路径截断
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const log = [];

// 清 node_modules
try { fs.rmSync(path.join(root, 'node_modules'), { recursive: true, force: true }); log.push('rm ok'); }
catch (e) { log.push('rm: ' + e.message); }

// 用 cmd /c 调 npm.cmd（Windows 原生 shell，路径不会被截断）
const r = spawnSync('cmd.exe', ['/c', '"C:\\Program Files\\nodejs\\npm.cmd" install --no-audit --no-fund --legacy-peer-deps --loglevel error'], {
  cwd: root,
  shell: false,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  maxBuffer: 64 * 1024 * 1024,
  env: process.env,
  timeout: 600000,
});

log.push('\nnpm exit=' + r.status);
log.push('\n--- stdout (tail) ---\n' + (r.stdout || '').slice(-3000));
log.push('\n--- stderr (tail) ---\n' + (r.stderr || '').slice(-3000));
log.push('\nnode_modules: ' + fs.existsSync(path.join(root, 'node_modules')));
log.push('astro: ' + fs.existsSync(path.join(root, 'node_modules', 'astro', 'package.json')));
log.push('react: ' + fs.existsSync(path.join(root, 'node_modules', 'react', 'package.json')));

fs.writeFileSync(path.join(root, 'install-log.txt'), log.join('\n'), 'utf8');
console.log('exit=' + r.status + ' astro=' + fs.existsSync(path.join(root, 'node_modules', 'astro', 'package.json')));
