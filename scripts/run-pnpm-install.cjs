// 用本地 pnpm 装依赖 + 跑构建，日志落盘
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pnpm = 'E:/workbuddy/pnpm-pkg/node_modules/pnpm/pnpm.exe';
const log = [];
fs.rmSync(path.join(root, 'node_modules'), { recursive: true, force: true });

// 1) pnpm install
let out;
try {
  out = execSync(`"${pnpm}" install --no-frozen-lockfile --reporter=append-only`, {
    cwd: root, encoding: 'utf8', timeout: 600000,
    env: { ...process.env, PNPM_HOME: '' },
  });
  log.push('=== pnpm install OK ===\n' + out.slice(-2000));
} catch (e) {
  log.push('=== pnpm install FAIL ===\n' + (e.stdout || '') + '\n' + (e.stderr || e.message));
}

// 2) 验证
log.push('\nnode_modules exists: ' + fs.existsSync(path.join(root, 'node_modules')));
log.push('astro pkg: ' + fs.existsSync(path.join(root, 'node_modules', 'astro', 'package.json')));
fs.writeFileSync(path.join(root, 'install-log.txt'), log.join('\n'), 'utf8');
console.log('done. node_modules=' + fs.existsSync(path.join(root, 'node_modules')));
