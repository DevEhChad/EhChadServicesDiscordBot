const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const srcDir = path.join(__dirname, '..', 'src');

function collectJsFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(collectJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = collectJsFiles(srcDir);

let failures = 0;
for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (err) {
    failures += 1;
    console.error(`✗ ${path.relative(process.cwd(), file)}`);
    console.error(err.stderr?.toString() || err.message);
  }
}

if (failures > 0) {
  console.error(`\n${failures} file(s) failed syntax check.`);
  process.exit(1);
}

console.log(`✓ ${files.length} files passed syntax check.`);
