document.documentElement.classList.add('js');
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
if (hamburger && nav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    nav.classList.toggle('open');
  });
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      nav.classList.remove('open');
    });
  });
}
const header = document.getElementById('header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  });
}
function revealAll() {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
}
function revealCheck() {
  const vh = window.innerHeight || document.documentElement.clientHeight;
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < vh * 0.92) el.classList.add('visible');
  });
}
try {
  revealCheck();
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => { revealCheck(); ticking = false; });
    }
  }, { passive: true });
  window.addEventListener('load', revealCheck, { once: true });
  setTimeout(revealCheck, 400);
  setTimeout(revealCheck, 1200);
} catch (e) {
  revealAll();
}
function copyContact(el) {
  const text = '+7 (383) 342-62-39';
  navigator.clipboard.writeText(text).then(() => {
    const btn = el.querySelector('.copy-text');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'COPIED';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  }).catch(() => {});
}
(function initCounters(){
  const obs=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(!e.isIntersecting)return;
      const el=e.target;
      const txt=el.textContent.trim();
      const m=txt.match(/^([\d.]+)([%+\u00d7x]?)$/);
      if(!m)return;
      const target=parseFloat(m[1]),suffix=m[2]||'',dur=1400,start=performance.now();
      el.textContent='0'+suffix;
      !function u(now){
        const p=Math.min((now-start)/dur,1),v=Math.round(target*(1-Math.pow(1-p,3)));
        el.textContent=v+suffix;
        if(p<1)requestAnimationFrame(u);
      }(start);
      obs.unobserve(el);
    });
  },{threshold:.5});
  document.querySelectorAll('.stat-item__number').forEach(el=>obs.observe(el));
})();
(function terminalReveal() {
  const lines = document.querySelectorAll('.hero__terminal-line');
  const blink = document.querySelector('.hero__terminal-blink');
  if (!lines.length) return;
  lines.forEach((line, i) => {
    line.style.opacity = '0';
    line.style.transition = 'opacity .4s ease';
    setTimeout(() => { line.style.opacity = '1'; }, i * 500);
  });
  if (blink) {
    blink.style.display = 'none';
    setTimeout(() => { blink.style.display = 'inline-block'; }, lines.length * 500);
  }
})();
(function initActiveNav() {
  const raw = window.location.pathname.replace(/^\//, '').replace(/index\.html$/, '').replace(/\/$/, '');
  const segs = raw.split('/').filter(Boolean);
  const curTop = segs[0] || '';
  document.querySelectorAll('.header__nav a').forEach(a => {
    let href = (a.getAttribute('href') || '').replace(/__ROOT__/g, '').replace(/^\.\.\//, '');
    const linkTop = href.replace(/index\.html$/, '').split('/').filter(Boolean)[0] || '';
    const isActive = (linkTop === '' && curTop === '') || (linkTop !== '' && linkTop === curTop);
    if (isActive) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
  });
})();
(function breadcrumbSchema() {
  const path = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
  if (path.length === 0) return;
  const items = [{ '@type': 'ListItem', 'position': 1, 'name': 'Главная', 'item': 'https://sksnsk.com/' }];
  let url = 'https://sksnsk.com';
  const labels = { 'solutions': 'Решения', 'grsh.html': 'ГРЩ и ВРУ', 'pumps.html': 'Управление насосами', 'asutp.html': 'АСУ ТП', 'ventilation.html': 'Вентиляция', 'modular.html': 'Модульные системы', 'electrolab.html': 'Электролаборатория', 'production': 'Производство', 'about': 'О компании', 'contacts': 'Контакты', 'cases': 'Проекты', 'tech_lib': 'Библиотека' };
  path.forEach((seg, i) => {
    url += '/' + seg;
    const name = labels[seg] || seg.replace(/-/g, ' ').replace(/\.html$/, '');
    items.push({ '@type': 'ListItem', 'position': i + 2, 'name': name, 'item': url });
  });
  if (items.length < 2) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': items });
  document.head.appendChild(script);
})();
