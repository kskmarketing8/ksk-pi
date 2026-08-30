/**
 * Automated verification gates for ITC KSK — site_koncept_pi
 * Usage: node scripts/verify.js
 * Exits 0 if all pass, 1 if any fail.
 */
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..');
const errors = [];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['_partials', 'scripts', 'node_modules', 'dist', 'assets'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const pages = walk(SITE);
console.log(`Scanned ${pages.length} HTML pages`);

// Also validate links inside _partials (nav lives there, resolved from site root)
const partialDir = path.join(SITE, '_partials');
let partialPages = [];
if (fs.existsSync(partialDir)) {
  partialPages = fs.readdirSync(partialDir)
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(partialDir, f));
  console.log(`Scanned ${partialPages.length} partial(s)\n`);
}
const allForLinks = pages.concat(partialPages);

// 1. Hard constraint: no form fields / inputs
const formRe = /<form|type="email"|<input|<textarea|<select/i;
let formHits = 0;
for (const p of pages) {
  if (formRe.test(fs.readFileSync(p, 'utf8'))) {
    errors.push('FORM FIELD forbidden: ' + path.relative(SITE, p));
    formHits++;
  }
}

// 2. Internal links resolve
const hrefRe = /href="([^"]+)"/gi;
let linkChecks = 0, linkFails = 0;
for (const p of allForLinks) {
  let c = fs.readFileSync(p, 'utf-8');
  const isPartial = p.includes('_partials');
  if (isPartial) c = c.replace(/__ROOT__/g, ''); // partials resolve from site root
  const dir = isPartial ? SITE : path.dirname(p);
  let m;
  while ((m = hrefRe.exec(c))) {
    const href = m[1].trim();
    if (/^(tel:|mailto:|https?:\/\/|#|javascript:|data:)/i.test(href)) continue;
    linkChecks++;
    const clean = href.split('#')[0];
    if (!clean) continue;
    if (!fs.existsSync(path.resolve(dir, clean))) {
      errors.push(`BROKEN LINK ${href} in ` + path.relative(SITE, p));
      linkFails++;
    }
  }
}

// 3. Legal pages exist
const legal = ['privacy.html', 'terms.html'];
for (const f of legal) {
  if (!fs.existsSync(path.join(SITE, f))) errors.push('MISSING legal page: ' + f);
}

console.log('Hard constraint (no forms):', formHits === 0 ? 'PASS' : `FAIL (${formHits})`);
console.log(`Internal links: ${linkChecks} checked, ${linkFails} broken`);
console.log('Legal pages:', legal.every(f => fs.existsSync(path.join(SITE, f))) ? 'PASS' : 'FAIL');

if (errors.length) {
  console.log('\nERRORS:');
  for (const e of errors) console.log('  x ' + e);
  process.exit(1);
} else {
  console.log('\nAll gates passed');
  process.exit(0);
}
