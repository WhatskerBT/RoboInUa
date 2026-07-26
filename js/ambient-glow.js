/**
 * Ambient image glow — active only in [data-theme="dark"].
 *
 * Technique: JS reads img.src and writes it into --glow-src on the host
 * container. CSS ::before picks it up, scales & blurs it into a colour haze.
 * This works on file:// because background-image never triggers canvas taint.
 * Canvas extraction is attempted on top for an extra coloured box-shadow.
 */

(function () {
  'use strict';

  /* ── helpers ──────────────────────────────────────────────── */

  function isDark() {
    return document.documentElement.dataset.theme === 'dark';
  }

  // Glow is deliberately limited to the hero image only (the project-detail
  // gallery is handled by its own block below). Grid cards — project/featured —
  // and every other image get NO glow: a blurred full-image bitmap layer behind
  // each of dozens of cards was the dominant dark-mode scroll cost. Returning
  // null here makes attach() bail for anything outside the hero.
  const CONTAINER_SELECTORS = '.hero-stats-imgwrap';

  function bestContainer(img) {
    return img.closest(CONTAINER_SELECTORS);
  }

  /* ── optional canvas colour for box-shadow boost ──────────── */

  let canvasBlocked = false; // set on first SecurityError (e.g. file://)

  function tryDominantColor(img) {
    if (canvasBlocked) return null;
    const SIZE = 32;
    const c = document.createElement('canvas');
    c.width = c.height = SIZE;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    let px;
    try {
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      px = ctx.getImageData(0, 0, SIZE, SIZE).data;
    } catch (_) { canvasBlocked = true; return null; }

    let rS = 0, gS = 0, bS = 0, n = 0;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i+1], b = px[i+2], a = px[i+3];
      if (a < 128) continue;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const sat = mx === 0 ? 0 : (mx - mn) / mx;
      const lum = (mx + mn) / 510;
      if (lum < 0.07 || lum > 0.95 || sat < 0.18) continue;
      rS += r; gS += g; bS += b; n++;
    }
    if (!n) {
      for (let i = 0; i < px.length; i += 4) {
        if (px[i+3] < 128) continue;
        rS += px[i]; gS += px[i+1]; bS += px[i+2]; n++;
      }
    }
    return n ? { r: rS/n|0, g: gS/n|0, b: bS/n|0 } : null;
  }

  /* ── apply / clear ────────────────────────────────────────── */

  function applyGlow(img, container) {
    if (!isDark()) return;
    if (!img || !img.complete || !img.naturalWidth) return;

    // Primary glow: works on file:// — CSS ::before reads this variable.
    container.style.setProperty('--glow-src', `url(${JSON.stringify(img.src)})`);

    // Bonus: canvas colour → extra box-shadow (silently skipped on file://).
    const col = tryDominantColor(img);
    if (col) {
      const { r, g, b } = col;
      container.style.setProperty('--amb-r', r);
      container.style.setProperty('--amb-g', g);
      container.style.setProperty('--amb-b', b);
      // Kept modest on purpose: very large blur/spread shadows enlarge the
      // hero's paint-invalidation rect, which costs paint as it scrolls (Firefox
      // especially). Tightened (was 46/10 + 104/32) since the wrap can't be
      // GPU-composited. Pairs with the CSS ::before haze.
      container.style.boxShadow =
        `0 0 36px 8px rgba(${r},${g},${b},0.50),` +
        `0 0 72px 18px rgba(${r},${g},${b},0.20)`;
    }
  }

  function clearGlow(container) {
    container.style.removeProperty('--glow-src');
    container.style.removeProperty('--amb-r');
    container.style.removeProperty('--amb-g');
    container.style.removeProperty('--amb-b');
    container.style.removeProperty('box-shadow');
  }

  function attach(img, container) {
    if (!container) return;
    const run = () => applyGlow(img, container);
    if (img.complete && img.naturalWidth) run();
    else img.addEventListener('load', run, { once: true });
  }

  /* ── page ambient colour for text blocks ─────────────────── */

  let pageColorSet = false;

  function setPageColor(img) {
    if (pageColorSet || !img.complete || !img.naturalWidth) return;
    const col = tryDominantColor(img);
    if (!col) return;
    const root = document.documentElement;
    root.style.setProperty('--page-amb-r', col.r);
    root.style.setProperty('--page-amb-g', col.g);
    root.style.setProperty('--page-amb-b', col.b);
    pageColorSet = true;
  }

  function attachPageColor(img) {
    if (img.complete && img.naturalWidth) setPageColor(img);
    else img.addEventListener('load', () => setPageColor(img), { once: true });
  }

  /* ── universal scan ───────────────────────────────────────── */

  const MIN_SIZE = 80;

  function shouldSkip(img) {
    const w = img.naturalWidth || img.width || img.offsetWidth;
    if (w < MIN_SIZE) return true;
    if (img.closest('header, nav, footer, [aria-hidden="true"]')) return true;
    return false;
  }

  function scanImages() {
    if (!isDark()) {
      document.querySelectorAll('[style*="--glow-src"]').forEach(clearGlow);
      pageColorSet = false;
      return;
    }

    // Page primary image for text-block tinting
    const hero = document.querySelector('.hero-stats-img') ||
      document.querySelector('[data-carousel-slide] img') ||
      document.querySelector('img');
    if (hero && !shouldSkip(hero)) attachPageColor(hero);

    // Glow every meaningful image
    document.querySelectorAll('img').forEach(img => {
      if (shouldSkip(img)) return;
      attach(img, bestContainer(img));
    });

    // Project detail gallery: glow on [data-project-carousel] (NOT pd-carousel-stage
    // which must keep overflow:hidden for the slide track to work).
    const carousel = document.querySelector('[data-project-carousel]');
    if (carousel) {
      const slides = carousel.querySelectorAll('[data-carousel-slide]');
      if (slides.length) {
        const updateGlow = () => {
          const active = Array.from(slides).find(s => s.classList.contains('is-active')) || slides[0];
          const img = active && active.querySelector('img');
          if (img) attach(img, carousel); // target = carousel wrapper, not stage
        };
        updateGlow();
        slides.forEach(slide =>
          new MutationObserver(updateGlow).observe(slide, { attributes: true, attributeFilter: ['class'] })
        );
      }
    }
  }

  /* ── bootstrap ────────────────────────────────────────────── */

  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn) : fn();

  ready(() => requestAnimationFrame(scanImages));

  // Theme toggle
  new MutationObserver(() => { pageColorSet = false; setTimeout(scanImages, 60); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Dynamic content (project grid / featured carousel rendered by JS).
  // Batch via rAF so rapid DOM insertions don't trigger N synchronous passes.
  const pendingNodes = [];
  let domScanPending = false;

  new MutationObserver(muts => {
    if (!isDark()) return;
    muts.forEach(m => m.addedNodes.forEach(node => {
      if (node instanceof Element) pendingNodes.push(node);
    }));
    if (!domScanPending) {
      domScanPending = true;
      requestAnimationFrame(() => {
        domScanPending = false;
        pendingNodes.splice(0).forEach(node => {
          node.querySelectorAll('img').forEach(img => {
            if (shouldSkip(img)) return;
            attach(img, bestContainer(img));
            if (!pageColorSet) attachPageColor(img);
          });
        });
      });
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
