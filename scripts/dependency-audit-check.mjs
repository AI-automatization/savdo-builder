#!/usr/bin/env node
// CI-PNPM-AUDIT-001 — проверка новых high/critical advisories против baseline.
//
// Логика:
//  1. Прогон `pnpm audit --prod --audit-level=high --json`.
//  2. Парсинг advisories, фильтр на severity in {high, critical}.
//  3. Сравнение с .github/dependency-audit-baseline.json (acceptedAdvisoryIds).
//  4. Если есть НОВЫЕ (не в baseline) — exit 1, иначе exit 0.
//
// Зачем такой подход: pnpm audit --audit-level=high даёт бинарный pass/fail без
// возможности «эти знаю, ок, эти новые — нет». Baseline ловит регрессы:
// добавили новую уязвимость → CI красный, пока не обработали.
//
// Использование:
//   node scripts/dependency-audit-check.mjs
//   node scripts/dependency-audit-check.mjs --include-moderate  # отчёт без fail

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const args = new Set(process.argv.slice(2));
const includeModerate = args.has('--include-moderate');

const BASELINE_PATH = resolve('.github/dependency-audit-baseline.json');

let baseline;
try {
  baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
} catch (err) {
  console.error(`[dependency-audit] Baseline не найден или невалидный: ${BASELINE_PATH}`);
  console.error(err?.message || err);
  process.exit(2);
}
const accepted = new Set(baseline.acceptedAdvisoryIds || []);

console.log(`[dependency-audit] baseline: ${accepted.size} accepted IDs`);

let raw = '';
try {
  raw = execSync('pnpm audit --prod --audit-level=moderate --json', {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
} catch (err) {
  // pnpm audit выходит с non-zero когда есть findings — это нормально, нам нужен stdout.
  raw = err?.stdout?.toString() || '';
  if (!raw) {
    console.error('[dependency-audit] pnpm audit упал без вывода');
    console.error(err?.stderr?.toString() || err?.message || err);
    process.exit(2);
  }
}

let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error('[dependency-audit] Не удалось распарсить вывод pnpm audit как JSON');
  console.error(raw.slice(0, 500));
  process.exit(2);
}

const advs = Object.values(data.advisories || {});
const high = advs.filter((a) => a.severity === 'high' || a.severity === 'critical');
const moderate = advs.filter((a) => a.severity === 'moderate');

const idOf = (a) => a.github_advisory_id || String(a.id);

const newHigh = high.filter((a) => !accepted.has(idOf(a)));
const baselinedHigh = high.filter((a) => accepted.has(idOf(a)));

console.log('');
console.log(`[dependency-audit] high/critical всего: ${high.length}`);
console.log(`  в baseline (известные): ${baselinedHigh.length}`);
console.log(`  НОВЫЕ (валит CI):       ${newHigh.length}`);
if (includeModerate) {
  console.log(`[dependency-audit] moderate (информативно): ${moderate.length}`);
}

if (newHigh.length > 0) {
  console.error('');
  console.error('::error::Новые high/critical advisories не в baseline');
  for (const a of newHigh) {
    console.error('');
    console.error(`  ${idOf(a)} [${a.severity}] ${a.module_name}`);
    console.error(`    Title:   ${a.title}`);
    console.error(`    Vuln:    ${a.vulnerable_versions}`);
    console.error(`    Patched: ${a.patched_versions}`);
    console.error(`    URL:     ${a.url}`);
  }
  console.error('');
  console.error('Что делать:');
  console.error('  1. Бампнуть зависимость до patched-версии — лучший вариант.');
  console.error('  2. Если фикс upstream ещё не доступен — добавить ID в');
  console.error('     .github/dependency-audit-baseline.json → acceptedAdvisoryIds');
  console.error('     с явным owner-ом фикса в acceptedNotes.');
  console.error('  3. НЕ глушить baseline\'ом ради зелёного CI. Это безопасность.');
  process.exit(1);
}

if (baselinedHigh.length > 0) {
  console.log('');
  console.log('[dependency-audit] Известные advisories (в baseline):');
  for (const a of baselinedHigh) {
    const note = baseline.acceptedNotes?.[idOf(a)] || '(no note)';
    console.log(`  ${idOf(a)} [${a.severity}] ${a.module_name} — ${note}`);
  }
}

if (includeModerate && moderate.length > 0) {
  console.log('');
  console.log('[dependency-audit] Moderate advisories (информативно, не валит CI):');
  for (const a of moderate) {
    console.log(`  ${idOf(a)} ${a.module_name}: ${a.title}`);
  }
}

console.log('');
console.log('[dependency-audit] ✅ Новых high/critical advisories нет.');
process.exit(0);
