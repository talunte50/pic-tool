// 全项目品牌重命名：ShotEasy/shot-easy/shoteasy → pic-tool/pic_tool
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dirs = ['src', 'public', 'tests'];
const exts = /\.(js|mjs|cjs|ts|jsx|tsx|astro|md|json|html|svg|css|ya?ml)$/i;

let filesChanged = 0, totalReplacements = 0;

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue;
      walk(full);
    } else if (exts.test(name)) {
      processFile(full);
    }
  }
}

function processFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  let c = content;
  let n = 0;

  // 按特定顺序替换，避免部分覆盖
  const rules = [
    [/ShotEasy/g, 'pic-tool'],
    [/shot-easy/g, 'pic-tool'],
    [/shoteasy/g, 'pic-tool'],
    [/shoteasy/g, 'pic-tool'],
    [/SHOTEASY/g, 'PIC-TOOL'],
  ];

  for (const [re, replacement] of rules) {
    const matches = c.match(re);
    if (matches) {
      n += matches.length;
      c = c.replace(re, replacement);
    }
  }

  if (n > 0) {
    fs.writeFileSync(file, c, 'utf8');
    filesChanged++;
    totalReplacements += n;
    console.log(`  ${file.replace(root, '')}  (${n} 处替换)`);
  }
}

// 处理指定目录
for (const d of dirs) {
  walk(path.join(root, d));
}

console.log(`\n共修改 ${filesChanged} 个文件，共替换 ${totalReplacements} 处`);
