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

const pages = walk('f:/workspace/src/app');

pages.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  // 1. Remove redundant padding from early returns: `<div className="p-6">` -> `<div>` or just leave them if they are small error messages. Let's make error messages `<div className="py-10 text-center text-[var(--color-text-sub)]">`
  content = content.replace(/<div className="p-6[^"]*">([^<]*로그인[^<]*)<\/div>/g, '<div className="py-10 text-center text-[var(--color-text-sub)]">$1</div>');
  content = content.replace(/<div className="p-6[^"]*">([^<]*권한이 없습니다[^<]*)<\/div>/g, '<div className="py-10 text-center text-[var(--color-danger)] font-bold">$1</div>');

  // 2. Standardize main wrapper. We look for `return (\n    <div className="...`
  // It's safer to use a regex that matches `return\s*\(\s*<div\s+className="([^"]+)"`
  const mainReturnMatch = content.match(/return\s*\(\s*<div\s+className=["']([^"']+)["']/);
  if (mainReturnMatch) {
    let classes = mainReturnMatch[1];
    
    // Extract max-w
    let maxW = '';
    const maxWMatch = classes.match(/max-w-[a-z0-9]+/);
    if (maxWMatch) maxW = maxWMatch[0];

    // Build standardized classes
    let newClasses = `w-full mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500`;
    if (maxW) newClasses = `${maxW} ` + newClasses;

    // Apply replacement
    const newContent = content.replace(mainReturnMatch[0], `return (\n    <div className="${newClasses}"`);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }

  // 3. Standardize divide-y
  const newContentDivide = content.replace(/divide-[a-z]+-[0-9]+/g, 'divide-[var(--color-border)]');
  if (newContentDivide !== content) {
    content = newContentDivide;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Updated:', f);
  }
});
