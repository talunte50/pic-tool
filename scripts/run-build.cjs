// 直跑 astro build（绕开 bash 噪音），输出构建日志到 build-log.txt
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const out = fs.realpathSync.native ? null : null;

const args = [path.join(root, 'node_modules', 'astro', 'astro.js'), 'build'];
const res = spawnSync(process.execPath, args, {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
  shell: false,
  maxBuffer: 10 * 1024 * 1024,
});

const stdout = res.stdout ? res.stdout.toString() : '';
const stderr = res.stderr ? res.stderr.toString() : '';
const log = `EXIT_CODE=${res.status}\n\n--- STDOUT ---\n${stdout}\n\n--- STDERR ---\n${stderr}\n`;
fs.writeFileSync(path.join(root, 'build-log.txt'), log, 'utf8');
console.log('BUILD LOG WRITTEN to build-log.txt, exit=' + res.status);
