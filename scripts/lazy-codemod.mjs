/**
 * Codemod: convert static page imports in route files to React.lazy.
 * Usage: node scripts/lazy-codemod.mjs <file...>
 *
 * Only transforms imports whose specifier contains "pages/"; type imports
 * and *.lazy modules are kept as-is. The named-import clause uses a
 * tempered pattern that cannot span another `import` statement.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('usage: node scripts/lazy-codemod.mjs <route-file...>');
  process.exit(1);
}

// named clause: { ... } that contains no braces and no `import` keyword
const importRe =
  /import\s+(type\s+)?([\w$]+|\{(?:(?!\bimport\b|\bfrom\b)[\s\S])*?\})\s+from\s+(['"][^'"\n]*pages\/[^'"\n]+['"]);?/g;

for (const file of targets) {
  let src = readFileSync(file, 'utf8');
  let converted = 0;

  src = src.replace(importRe, (full, typeKw, clause, specRaw) => {
    if (typeKw) return full;
    const spec = specRaw.slice(1, -1);
    if (/\.lazy\b/.test(spec)) return full;
    converted++;

    if (clause.startsWith('{')) {
      const names = clause
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return names
        .map((n) => {
          const alias = n.match(/^([\w$]+)\s+as\s+([\w$]+)$/);
          if (alias) {
            return `const ${alias[2]} = lazy(() => import('${spec}').then(m => ({ default: m.${alias[1]} })));`;
          }
          return `const ${n} = lazy(() => import('${spec}').then(m => ({ default: m.${n} })));`;
        })
        .join('\n');
    }
    return `const ${clause} = lazy(() => import('${spec}'));`;
  });

  if (converted > 0) {
    if (!/import\s*\{[^}]*\blazy\b[^}]*\}\s*from\s*['"]react['"]/.test(src)) {
      src = `import { lazy } from 'react';\n` + src;
    }
    writeFileSync(file, src);
  }
  console.log(`${file}: ${converted} import group(s) converted`);
}
