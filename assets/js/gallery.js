/**
 * Gallery carousel for KSK site_koncept_pi.
 * Vanilla JS, no dependencies. Reads slide count from DOM (.gallery__slide),
 * so the number of photos shown is driven entirely by what build.js injected
 * from the assets/img/gallery/<prefix>-* files.
 *
 * Transition: crossfade (opacity) with a subtle zoom on the active photo.
 */
(function () {
  'use strict';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initGallery(root) {
    var track = root.querySelector('.gallery__track');
    if (!track) return;
    var slides = Array.prototype.slice.call(track.children);
    var n = slides.length;

    var prevBtn = root.querySelector('.gallery__btn--prev');
    var nextBtn = root.querySelector('.gallery__btn--next');
    var dotsWrap = root.querySelector('.gallery__dots');

    // No photos -> drop the whole block.
    if (n === 0) { root.parentNode && root.parentNode.removeChild(root); return; }

    var index = 0;
    var timer = null;

    function show(i) {
      index = (i + n) % n;
      slides.forEach(function (s, si) { s.classList.toggle('is-active', si === index); });
      if (dotsWrap) {
        var dots = dotsWrap.children;
        for (var d = 0; d < dots.length; d++) {
          var on = d === index;
          dots[d].classList.toggle('is-active', on);
          dots[d].setAttribute('aria-selected', on ? 'true' : 'false');
        }
      }
      root.setAttribute('aria-roledescription', 'слайд ' + (index + 1) + ' из ' + n);
    }

    // Single photo -> static, no controls.
    if (n <= 1) {
      show(0);
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      if (dotsWrap) dotsWrap.style.display = 'none';
      return;
    }

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'gallery__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Фото ' + (i + 1));
      dot.addEventListener('click', function () { show(i); reset(); });
      dotsWrap.appendChild(dot);
    });

    function next() { show(index + 1); }
    function prev() { show(index - 1); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { stop(); if (!prefersReduced) timer = setInterval(next, 1250); }
    function reset() { stop(); start(); }

    if (nextBtn) nextBtn.addEventListener('click', function () { next(); reset(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); reset(); });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { next(); reset(); }
      else if (e.key === 'ArrowLeft') { prev(); reset(); }
    });

    start();
    if (!prefersReduced) {
      root.addEventListener('mouseenter', stop);
      root.addEventListener('mouseleave', start);
      root.addEventListener('focusin', stop);
      root.addEventListener('focusout', start);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else start();
      });
    }

    // Touch swipe
    var startX = null;
    root.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); reset(); }
      startX = null;
    }, { passive: true });

    show(0);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var galleries = document.querySelectorAll('.gallery');
    Array.prototype.forEach.call(galleries, initGallery);
  });
})();
