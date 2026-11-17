const fs = require('fs');
const path = require('path');

const mdContent = fs.readFileSync(
  path.join(__dirname, '../../毛概的全部的习题.md'),
  'utf-8'
);

// 调试：打印前20行的原始内容
const lines = mdContent.split('\n');
console.log('=== 前20行原始内容 ===');
for (let i = 0; i < Math.min(20, lines.length); i++) {
  console.log(`Line ${i}: [${lines[i]}] startsWith('# '): ${lines[i].startsWith('# ')}`);
}
console.log('');

// 调试：打印所有以 # 开头的行
console.log('=== 所有以 # 开头的行 ===');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('#')) {
    console.log(`Line ${i}: [${lines[i].trim()}]`);
  }
}
