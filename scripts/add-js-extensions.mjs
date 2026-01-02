import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '..', 'dist');

// Find all .js files in dist
const files = await glob('**/*.js', { cwd: distDir, absolute: true });

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;

  // Replace local imports without .js extension
  // Match: import ... from './path' or import ... from '../path'
  // But not: import ... from 'package' or import ... from './path.js'
  content = content.replace(
    /from\s+['"](\.\.?\/[^'"]*?)['"]/g,
    (match, path) => {
      // Only add .js if the path doesn't already end with .js
      if (!path.endsWith('.js')) {
        modified = true;
        const pathStr = String(path);
        return match.replace(pathStr, `${pathStr}.js`);
      }
      return match;
    }
  );

  // Replace side-effect imports without .js extension
  // Match: import './path' or import "../path"
  // But not: import 'package' or import './path.js'
  content = content.replace(
    /import\s+['"](\.\.?\/[^'"]*?)['"]/g,
    (match, path) => {
      // Only add .js if the path doesn't already end with .js
      if (!path.endsWith('.js')) {
        modified = true;
        const pathStr = String(path);
        return match.replace(pathStr, `${pathStr}.js`);
      }
      return match;
    }
  );

  if (modified) {
    writeFileSync(file, content, 'utf-8');
    console.log(`Updated imports in ${file.replace(distDir, 'dist')}`);
  }
}

console.log(`Processed ${files.length} files`);
