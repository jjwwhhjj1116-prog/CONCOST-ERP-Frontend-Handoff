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

const allFiles = [...walk('f:/workspace/src/app'), ...walk('f:/workspace/src/components')];

allFiles.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // Backgrounds
  content = content.replace(/\bbg-white\b/g, 'bg-[var(--color-surface)]');
  content = content.replace(/\bbg-gray-50\b/g, 'bg-[var(--color-bg)]');
  
  // Texts
  content = content.replace(/\btext-gray-900\b/g, 'text-[var(--color-text-main)]');
  content = content.replace(/\btext-gray-800\b/g, 'text-[var(--color-text-main)]');
  content = content.replace(/\btext-gray-700\b/g, 'text-[var(--color-text-main)]');
  
  content = content.replace(/\btext-gray-600\b/g, 'text-[var(--color-text-sub)]');
  content = content.replace(/\btext-gray-500\b/g, 'text-[var(--color-text-sub)]');
  content = content.replace(/\btext-gray-400\b/g, 'text-[var(--color-text-sub)]');
  
  // Borders
  content = content.replace(/\bborder-gray-100\b/g, 'border-[var(--color-border)]');
  content = content.replace(/\bborder-gray-200\b/g, 'border-[var(--color-border)]');
  content = content.replace(/\bborder-gray-300\b/g, 'border-[var(--color-border-strong)]');

  // Also catch bg-gray-50/50 etc if any
  content = content.replace(/\bbg-gray-50\/50\b/g, 'bg-[var(--color-bg)]/50');
  content = content.replace(/\bbg-gray-50\/30\b/g, 'bg-[var(--color-bg)]/30');

  // Fix up divide colors just in case
  content = content.replace(/\bdivide-gray-100\b/g, 'divide-[var(--color-border)]');
  content = content.replace(/\bdivide-gray-200\b/g, 'divide-[var(--color-border)]');

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Migrated colors in:', f);
  }
});
