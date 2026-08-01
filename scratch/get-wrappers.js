const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (file === 'page.tsx') files.push(p);
  });
  return files;
}

walk('f:/workspace/src/app').forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  // Find all returns and get the last one's className
  const matches = [...content.matchAll(/return\s*(?:\([\s\S]*?)?(?:<div|<main)[^>]*?className=["'](.*?)["']/g)];
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    console.log(f.replace('f:\\workspace\\src\\app\\', ''), ':', lastMatch[1]);
  }
});
