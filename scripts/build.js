/**
 * Build site_koncept_pi into ./dist
 * - copies /assets as-is
 * - inlines _partials via <!--#head--> <!--#header--> <!--#footer-->
 * - resolves __ROOT__ to depth-aware relative path
 * - injects photo galleries via <!--#gallery <prefix>-->
 * Source files are NOT modified.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..');
const DIST = path.join(SRC, 'dist');
const PARTIALS = path.join(SRC, '_partials');
const SKIP_DIRS = new Set(['_partials', 'scripts', 'node_modules', 'dist', 'assets']);

function rootPrefix(depth) { return depth === 0 ? '' : '../'.repeat(depth); }

function read(p) { return fs.readFileSync(p, 'utf-8'); }
function write(p, c) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c, 'utf-8'); }
function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name), d = path.join(to, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
function walk(dir, depth, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, depth + 1, out);
    else if (e.name.endsWith('.html')) out.push({ p, depth });
  }
  return out;
}

function loadPartial(name) { return read(path.join(PARTIALS, name)); }

const GALLERY_TITLES = {
  home: { title: 'Производство в фотографиях', label: 'Фотогалерея производства ИТЦ КСК' },
  prod: { title: 'Наша производственная база', label: 'Фотогалерея производства' },
  about: { title: 'ИТЦ КСК глазами сотрудников', label: 'Фотогалерея компании' },
  case: { title: 'Реализованные проекты в фотографиях', label: 'Фотогалерея проектов' },
};

function humanize(file) {
  return file.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]/g, ' ').replace(/^\w/, c => c.toUpperCase());
}

function buildGallery(prefix, rel) {
  const dir = path.join(SRC, 'assets', 'img', 'gallery');
  if (!fs.existsSync(dir)) return '';
  const re = new RegExp('^' + prefix + '-\\d.*\\.(svg|jpe?g|png|webp|avif|gif)$', 'i');
  let imgs = fs.readdirSync(dir).filter(f => re.test(f));
  imgs.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (imgs.length === 0) return '';

  let meta = {};
  try { meta = JSON.parse(read(path.join(dir, 'meta.json'))); } catch (e) { /* optional */ }

  const slides = imgs.map((f, i) =>
    `<li class="gallery__slide${i === 0 ? ' is-active' : ''}"><img src="${rel}assets/img/gallery/${f}" alt="${meta[f] || humanize(f)}" loading="eager"></li>`
  ).join('\n        ');

  const t = GALLERY_TITLES[prefix] || { title: 'Фотогалерея', label: 'Фотогалерея' };

  return `
<section class="section">
  <span class="section__label reveal">ФОТОГАЛЕРЕЯ</span>
  <h2 class="section__title reveal">${t.title}</h2>
  <div class="gallery" aria-roledescription="carousel" aria-label="${t.label}">
    <div class="gallery__viewport">
      <ul class="gallery__track">
        ${slides}
      </ul>
    </div>
    <button class="gallery__btn gallery__btn--prev" type="button" aria-label="Предыдущее фото">‹</button>
    <button class="gallery__btn gallery__btn--next" type="button" aria-label="Следующее фото">›</button>
    <div class="gallery__dots" role="tablist" aria-label="Фотографии"></div>
  </div>
</section>`;
}

function injectPartial(name, rel) { return loadPartial(name).replace(/__ROOT__/g, rel); }

function inject(content, depth) {
  const rel = rootPrefix(depth);
  // resolve __ROOT__ in page body
  content = content.replace(/__ROOT__/g, rel);
  // partials (resolve __ROOT__ inside them too)
  if (content.includes('<!--#head-->')) content = content.replace('<!--#head-->', injectPartial('head.html', rel));
  if (content.includes('<!--#header-->')) content = content.replace('<!--#header-->', injectPartial('header.html', rel));
  if (content.includes('<!--#footer-->')) content = content.replace('<!--#footer-->', injectPartial('footer.html', rel));
  // gallery
  content = content.replace(/<!--#gallery\s+(\w+)-->/g, (_, prefix) => {
    const block = buildGallery(prefix, rel);
    return block || '';
  });
  return content;
}

console.log('Cleaning dist/...');
fs.rmSync(DIST, { recursive: true, force: true });
console.log('Copying assets/...');
copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'));

const pages = walk(SRC, 0);
let count = 0;
for (const { p, depth } of pages) {
  const rel = path.relative(SRC, p);
  const out = path.join(DIST, rel);
  write(out, inject(read(p), depth));
  count++;
}
console.log(`Built ${count} pages -> dist/`);
