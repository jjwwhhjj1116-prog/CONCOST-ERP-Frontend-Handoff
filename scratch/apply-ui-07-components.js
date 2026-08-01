const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (p.endsWith('.tsx')) files.push(p);
  });
  return files;
}

const components = walk('f:/workspace/src/components');

components.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  // Standardize divide-y
  const newContentDivide = content.replace(/divide-[a-z]+-[0-9]+/g, 'divide-[var(--color-border)]');
  if (newContentDivide !== content) {
    content = newContentDivide;
    changed = true;
  }

  // Also standardizing border-[color]-[shade] occasionally used in tables? No, let's just stick to divide for now, as that's what's mentioned.

  if (changed) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Updated divide-y in:', f);
  }
});
