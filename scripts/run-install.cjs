// 真装依赖 + 跑构建，全部日志落盘 install-log.txt（绕开 bash 输出不可见问题）
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const npmCmd = 'C:/Program Files/nodejs/npm.cmd';
const nodeExe = process.execPath;

function run(args, opts = {}) {
  const r = spawnSync(npmCmd, args, {
    cwd: root,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
    ...opts,
  });
  return {
    status: r.status,
    out: r.stdout ? r.stdout.toString() : '',
    err: r.stderr ? r.stderr.toString() : '',
  };
}

const log = [];
log.push('=== NODE ' + nodeExe + ' ===');

// 1) npm install
const inst = run(['install', '--no-audit', '--no-fund', '--loglevel', 'error'], { timeout: 900000 });
log.push('\n=== npm install exit=' + inst.status + ' ===');
log.push(inst.out.slice(-4000));
log.push(inst.err.slice(-4000));
fs.writeFileSync(path.join(root, 'install-log.txt'), log.join('\n'), 'utf8');
console.log('install done exit=' + inst.status + ' (log: install-log.txt)');
