#!/usr/bin/env node
/**
 * Theme audit: find all Vue and style.css lines that still use dark-only or
 * unpaired theme classes. Outputs THEME_PENDING_AUDIT.md for handoff to an agent.
 *
 * Run: node scripts/audit-theme-pending.mjs
 * (from repo root)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUTPUT_PATH = path.join(ROOT, 'THEME_PENDING_AUDIT.md');

function* walkDir(dir, ext) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walkDir(full, ext);
    } else if (e.isFile() && (ext === null || e.name.endsWith(ext))) {
      yield full;
    }
  }
}

function collectFiles() {
  const files = [];
  for (const f of walkDir(SRC, '.vue')) {
    files.push(path.relative(ROOT, f).split(path.sep).join('/'));
  }
  const stylePath = path.join(SRC, 'style.css');
  if (fs.existsSync(stylePath)) {
    files.push('src/style.css');
  }
  return files.sort();
}

/**
 * Get the "class string" we care about for a given line (and optionally previous line for multiline).
 * We consider the current line and the previous line together to catch split class attributes.
 */
function getClassContext(line, prevLine) {
  const combined = prevLine ? prevLine + '\n' + line : line;
  // Extract class="...", :class="...", and @apply ... (single line)
  const matches = [];
  const classRegex = /(?:class|:class)=["']([^"']*)["']/g;
  let m;
  while ((m = classRegex.exec(combined)) !== null) {
    matches.push(m[1]);
  }
  // :class with dynamic content - take the whole attribute value; we can't parse JS, so treat the line as one blob
  if (/:class=/.test(combined) && !/class=["'][^"']*["']/.test(combined)) {
    matches.push(combined);
  }
  // @apply in style blocks
  if (/@apply\s+/.test(line)) {
    matches.push(line);
  }
  return matches.length ? matches : [line];
}

/**
 * Check if the class string has a dark-only pattern without the corresponding light base.
 * Returns an array of short reason strings (e.g. ['bg-white/ without bg-gray-']).
 */
function checkDarkOnly(classStr) {
  const reasons = [];
  const s = classStr;

  // Backgrounds: bg-white/5, bg-white/10, etc. without bg-gray-
  if (/\bbg-white\/\d+/.test(s) && !/\bbg-gray-/.test(s)) {
    reasons.push('bg-white/N without bg-gray-');
  }

  // Dark backgrounds without light equivalents: bg-slate-950, bg-black, bg-gray-900, etc. without bg-gray-50/100/200 or dark: prefix
  // Exclude modal overlays (bg-black/50, bg-black/80) which are intentionally dark
  const hasDarkBg = /\b(bg-slate-(900|950)|bg-gray-(800|900))\b/.test(s);
  const hasDarkBgOverlay = /\bbg-black\/\d+/.test(s); // Modal overlays - intentionally dark
  const hasLightBg = /\bbg-(gray-(50|100|200)|white)\b/.test(s);
  const hasDarkPrefix = /\bdark:bg-/.test(s);
  // Check if it's already theme-aware (has both light and dark variants)
  const isThemeAware = hasLightBg && hasDarkPrefix;
  if (hasDarkBg && !hasLightBg && !hasDarkPrefix && !isThemeAware) {
    reasons.push('dark background (bg-slate-950/bg-gray-900) without light mode equivalent');
  }

  // Dark gradients without light equivalents: bg-gradient with from-slate-950/from-black without dark: prefix or light bg
  // Only match if "from-" is NOT prefixed with "dark:"
  const hasDarkGradient = /\bbg-gradient.*(?<!dark:)(?:^|\s)from-(slate-(900|950)|black|gray-(800|900))/.test(s);
  // Simpler check: look for bg-gradient with from-slate/from-black that doesn't have dark: prefix before "from"
  const hasDarkGradientSimple = /\bbg-gradient[^d]*(?:^|\s)from-(slate-(900|950)|black|gray-(800|900))/.test(s) && !/\bdark:from-/.test(s);
  if (hasDarkGradientSimple && !hasLightBg && !isThemeAware) {
    reasons.push('dark gradient (bg-gradient from-slate-950/from-black) without light mode equivalent');
  }

  // Rings: ring-white/ without ring-gray-
  if (/\bring-white\//.test(s) && !/\bring-gray-/.test(s)) {
    reasons.push('ring-white/ without ring-gray-');
  }

  // Borders: border-white/ without border-gray-
  if (/\bborder-white\//.test(s) && !/\bborder-gray-/.test(s)) {
    reasons.push('border-white/ without border-gray-');
  }

  // Placeholders: placeholder-white/ without placeholder-gray-
  if (/\bplaceholder-white\//.test(s) && !/\bplaceholder-gray-/.test(s)) {
    reasons.push('placeholder-white/ without placeholder-gray-');
  }

  // Text: text-white or text-white/N without text-gray-, unless it's a solid primary/danger button
  // Also flag if text-white is used with dark backgrounds that aren't theme-aware
  const hasPrimaryButton = /\b(bg-primary-600|bg-blue-600|bg-red-600|bg-green-600)\b/.test(s);
  const hasDarkBgWithTextWhite = (hasDarkBg || hasDarkGradient) && /\btext-white\b/.test(s) && !hasDarkBgOverlay;
  const hasDarkTextPrefix = /\bdark:text-white/.test(s);
  if (
    (/\btext-white\b/.test(s) || /\btext-white\/\d+/.test(s)) &&
    !/\btext-gray-/.test(s) &&
    !hasPrimaryButton &&
    !hasDarkTextPrefix && // Allow text-white if dark:text-white is also present (theme-aware)
    !hasDarkBgOverlay // Allow text-white on modal overlays
  ) {
    if (hasDarkBgWithTextWhite && !isThemeAware) {
      reasons.push('text-white with dark background that lacks light mode equivalent');
    } else if (!hasDarkBgWithTextWhite) {
      reasons.push('text-white without text-gray- (and not primary/danger button)');
    }
  }

  // @apply in style: standalone text-white or bg-white/ etc.
  if (/@apply\s+/.test(s)) {
    if (/\btext-white\b/.test(s) && !/\btext-gray-/.test(s) && !hasPrimaryButton) {
      reasons.push('@apply text-white without text-gray-');
    }
    if (/\bbg-white\/\d+/.test(s) && !/\bbg-gray-/.test(s)) {
      reasons.push('@apply bg-white/N without bg-gray-');
    }
  }

  return reasons;
}

function auditFile(relPath) {
  const absPath = path.join(ROOT, relPath);
  const content = fs.readFileSync(absPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const pending = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = i > 0 ? lines[i - 1] : '';
    const classContexts = getClassContext(line, prevLine);

    for (const ctx of classContexts) {
      const reasons = checkDarkOnly(ctx);
      if (reasons.length > 0) {
        const snippet = line.trim().slice(0, 100);
        pending.push({
          lineNum: i + 1,
          reasons,
          snippet: snippet + (line.trim().length > 100 ? '...' : ''),
        });
        break; // one entry per line
      }
    }
  }

  return pending;
}

function main() {
  const files = collectFiles();
  const results = [];
  let totalLines = 0;

  for (const relPath of files) {
    const pending = auditFile(relPath);
    if (pending.length > 0) {
      results.push({ path: relPath, pending });
      totalLines += pending.length;
    }
  }

  // Write THEME_PENDING_AUDIT.md
  const lines = [
    '# Theme pending audit',
    '',
    'Generated by `node scripts/audit-theme-pending.mjs`. Do not edit by hand.',
    '',
    '## Summary',
    '',
    `- **Files with pending items:** ${results.length}`,
    `- **Total lines to review:** ${totalLines}`,
    '',
    '## Per-file list',
    '',
  ];

  for (const { path: filePath, pending } of results) {
    lines.push(`### ${filePath}`);
    lines.push('');
    lines.push(`**${pending.length} line(s)**`);
    lines.push('');
    for (const { lineNum, reasons, snippet } of pending) {
      lines.push(`- **L${lineNum}** ${reasons.join('; ')}`);
      lines.push(`  \`${snippet.replace(/`/g, '\\`')}\``);
      lines.push('');
    }
    lines.push('');
  }

  fs.writeFileSync(OUTPUT_PATH, lines.join('\n'), 'utf8');
  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(`Files with pending: ${results.length}, total lines: ${totalLines}`);
}

main();
