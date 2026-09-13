// 给光斑已删但 <main> 仍是 plain class 的页面补单一极淡 brand 晕染，清理空行
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'src', 'pages');
const plainMain = '<main class="relative overflow-hidden min-h-screen flex flex-col">';
const tintMain = '<main class="relative overflow-hidden min-h-screen flex flex-col bg-[radial-gradient(60%_40%_at_50%_0%,rgba(79,70,229,0.10),transparent_70%)]">';
const glowPattern = /w-80 h-60 bg-(blue|purple|sky)-\d+ blur-\[80px\]/;
const blankRe = /\n{3,}/g;
let changed = 0;
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.(astro|jsx|js)$/.test(name)) process(full);
  }
}
function process(file) {
  let c = fs.readFileSync(file, 'utf8');
  if (c.includes(plainMain)) {
    c = c.split(plainMain).join(tintMain);
    c = c.replace(blankRe, '\n\n');
    fs.writeFileSync(file, c);
    changed++;
    console.log('tinted: ' + file.replace(__dirname, ''));
  }
}
walk(root);
console.log('done, files changed: ' + changed);
