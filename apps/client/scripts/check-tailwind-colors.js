// oxlint-disable no-console -- CLI script: console output is intentional
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const srcDir = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src');

const NATIVE_COLOR =
  /\b(?:bg|text|border|outline|ring|fill|stroke|from|to|via|divide|placeholder|caret|decoration|accent|shadow)-(?:(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}|white|black)\b/g;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return entry.name === 'generated' ? [] : walk(join(dir, entry.name));
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [join(dir, entry.name)] : [];
  });
}

const violations = walk(srcDir).flatMap((path) =>
  readFileSync(path, 'utf8')
    .split('\n')
    .flatMap((line, i) =>
      [...line.matchAll(NATIVE_COLOR)].map((match) => `${relative(srcDir, path)}:${i + 1}\t${match[0]}`),
    ),
);

if (violations.length > 0) {
  console.error(
    `\nForbidden native Tailwind colors (${violations.length}). Use a DSFR decision instead (var(--…) / colors.decisions.*):\n`,
  );
  console.error(violations.join('\n'));
  console.error('\nSee the palette in Storybook: Design Tokens / Couleurs.\n');
  process.exit(1);
}

console.log('OK: no native Tailwind colors.');
