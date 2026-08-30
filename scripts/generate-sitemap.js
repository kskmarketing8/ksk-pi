/**
 * Generate sitemap.xml for site_koncept_pi
 * Usage: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..');
const BASE_URL = 'https://sksnsk.com';

const EXCLUDE_DIRS = ['_partials', 'scripts', 'assets', 'node_modules'];
const EXCLUDE_FILES = ['offline.html'];

function walk(dir, depth) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry.name)) {
        files.push(...walk(full, depth + 1));
      }
    } else if (entry.isFile() && entry.name.endsWith('.html') && !EXCLUDE_FILES.includes(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function getPriority(name, depth, isIndex) {
  if (depth === 0 && name === 'index.html') return '1.0';
  if (name === 'index.html') return '0.9';
  if (depth === 0) return '0.8';
  return '0.7';
}

function getChangefreq(name) {
  if (name === 'index.html') return 'daily';
  return 'monthly';
}

const files = walk(SITE_DIR, 0);

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

for (const file of files) {
  const rel = path.relative(SITE_DIR, file).replace(/\\/g, '/');
  const name = path.basename(file);
  const depth = rel.split('/').length - 1;
  const isIndex = name === 'index.html';
  const stat = fs.statSync(file);

  let url = BASE_URL + '/' + rel;
  if (isIndex) {
    url = BASE_URL + '/' + rel.replace(/\/index\.html$/, '/');
  }

  const lastmod = stat.mtime.toISOString().split('T')[0];
  const changefreq = getChangefreq(name);
  const priority = getPriority(name, depth, isIndex);

  xml += '  <url>\n';
  xml += '    <loc>' + url + '</loc>\n';
  xml += '    <lastmod>' + lastmod + '</lastmod>\n';
  xml += '    <changefreq>' + changefreq + '</changefreq>\n';
  xml += '    <priority>' + priority + '</priority>\n';
  xml += '  </url>\n';
}

xml += '</urlset>\n';

fs.writeFileSync(path.join(SITE_DIR, 'sitemap.xml'), xml, 'utf-8');
console.log('sitemap.xml generated — ' + files.length + ' URLs');
