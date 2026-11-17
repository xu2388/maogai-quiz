const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../electron');
const destDir = path.join(__dirname, '../dist-electron');

// 创建目标目录
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// 复制文件
const files = ['main.js', 'preload.js'];
for (const file of files) {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  fs.copyFileSync(src, dest);
  console.log(`已复制: ${file}`);
}

console.log('Electron 文件复制完成');
