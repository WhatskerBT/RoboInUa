/**
 * Site interactions
 * System theme sync, scroll reveal, sticky header, counters and small UI helpers.
 */

const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const THEME_STORAGE_KEY = 'theme';

function getSystemTheme() {
  return systemDarkQuery.matches ? 'dark' : 'light';
}

function getStoredTheme() {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch (error) {
    return null;
  }
}

function getEffectiveTheme() {
  return getStoredTheme() || getSystemTheme();
}

function updateBrowserThemeColor(theme) {
  const color = theme === 'dark' ? '#15131a' : '#f7f9fb';
  let meta = document.querySelector('meta[name="theme-color"][data-dynamic-theme]');

  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.dataset.dynamicTheme = '1';
    document.head.appendChild(meta);
  }

  meta.content = color;
}

function updateThemeToggle(theme) {
  const icon = document.querySelector('[data-theme-icon]');
  if (icon) {
    icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
  }

  const button = document.getElementById('theme-toggle');
  if (button) {
    const label = theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  updateBrowserThemeColor(theme);
  updateThemeToggle(theme);
}

function toggleTheme() {
  const next = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch (error) {
    /* storage unavailable — theme still applies for this session */
  }
  applyTheme(next);
}

function initThemeToggle() {
  const button = document.getElementById('theme-toggle');
  if (button) {
    button.addEventListener('click', toggleTheme);
  }
  updateThemeToggle(getEffectiveTheme());
}

function observeMediaQuery(query, listener) {
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', listener);
    return;
  }

  if (typeof query.addListener === 'function') {
    query.addListener(listener);
  }
}

// Apply as early as possible to avoid a flash of the wrong theme.
applyTheme(getEffectiveTheme());

// Firefox rasterizes backdrop-filter on the CPU, so live blur can't scroll
// smoothly. Flag it so the CSS swaps the live glass for a static frosted look
// in Firefox only — Chromium keeps the real blur.
if (/firefox/i.test(navigator.userAgent)) {
  document.documentElement.classList.add('is-firefox');
}

// Follow the system only while the user hasn't picked a theme explicitly.
observeMediaQuery(systemDarkQuery, () => {
  if (!getStoredTheme()) {
    applyTheme(getSystemTheme());
  }
});

if (document.fonts && document.fonts.load) {
  document.fonts.load("24px 'Material Symbols Rounded'")
    .then(() => document.documentElement.classList.add('icons-ready'))
    .catch(() => document.documentElement.classList.add('icons-ready'));
} else {
  document.documentElement.classList.add('icons-ready');
}

function initScrollReveal() {
  const elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach((element) => element.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const siblings = entry.target.parentElement
        ? Array.from(entry.target.parentElement.querySelectorAll('[data-reveal]'))
        : [entry.target];
      const siblingIndex = Math.max(siblings.indexOf(entry.target), 0);

      entry.target.style.transitionDelay = `${siblingIndex * 80}ms`;
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach((element) => observer.observe(element));
}

function initHeaderScroll() {
  const header = document.querySelector('header');
  if (!header) return;

  const mobileQuery = window.matchMedia('(max-width: 768px)');
  let ticking = false;

  function updateHeader() {
    const scrollY = window.scrollY;
    if (!mobileQuery.matches) {
      header.classList.toggle('scrolled', scrollY > 80);
    } else {
      header.classList.remove('scrolled');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (ticking) return;

    requestAnimationFrame(updateHeader);
    ticking = true;
  }, { passive: true });

  updateHeader();
}

function animateCounters() {
  const statCounters = Array.from(document.querySelectorAll('.stat-card h3')).map((element) => {
    const text = element.textContent;
    const match = text.match(/^(\d+)/);
    if (!match) return null;
    return { element, target: parseInt(match[1], 10), suffix: text.slice(match[1].length) };
  }).filter(Boolean);

  const explicitCounters = Array.from(document.querySelectorAll('[data-counter]')).map((element) => {
    const target = parseInt(element.dataset.counter, 10);
    if (Number.isNaN(target)) return null;
    return { element, target, suffix: '' };
  }).filter(Boolean);

  const counters = [...statCounters, ...explicitCounters];
  if (!counters.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    counters.forEach((data) => {
      data.element.textContent = `${data.target}${data.suffix}`;
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const data = counters.find((c) => c.element === entry.target);
      if (!data) return;

      const duration = 900;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(data.target * eased);

        data.element.textContent = `${current}${data.suffix}`;

        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  counters.forEach((data) => observer.observe(data.element));
}

document.addEventListener('click', (event) => {
  const amountButton = event.target.closest('.amount-btn');
  if (amountButton) {
    document.querySelectorAll('.amount-btn').forEach((button) => button.classList.remove('selected'));
    amountButton.classList.add('selected');

    const customInput = document.getElementById('custom-amount');
    if (customInput && amountButton.dataset.amount) {
      customInput.value = amountButton.dataset.amount;
    }
  }

  const anchor = event.target.closest('a[href*="#"]');
  if (!anchor) return;

  const href = anchor.getAttribute('href') || '';
  const hash = href.split('#')[1];
  if (!hash) return;

  const target = document.getElementById(hash);
  if (!target) return;

  event.preventDefault();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

  // Keep the URL hash in sync so :target styling applies without a second jump.
  if (window.history && typeof history.replaceState === 'function') {
    history.replaceState(null, '', `#${hash}`);
  }
});

/**
 * Hide decorative Material Symbols icons from assistive tech.
 * Any icon glyph without an explicit aria-label is decorative ligature text,
 * so mark it aria-hidden. Safe to call repeatedly (idempotent).
 */
function markDecorativeIcons(root = document) {
  root.querySelectorAll('.material-symbols-rounded:not([aria-hidden]):not([aria-label])')
    .forEach((icon) => icon.setAttribute('aria-hidden', 'true'));
}

window.markDecorativeIcons = markDecorativeIcons;

/**
 * Copy-to-clipboard buttons ([data-copy]). Delegated on document so it also
 * covers the footer email button that components.js injects on every page.
 * Uses the async Clipboard API on secure origins, with an execCommand fallback
 * for file:// / http, and a manual prompt as a last resort.
 */
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.top = '-1000px';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      if (ok) resolve(); else reject(new Error('copy command rejected'));
    } catch (error) {
      reject(error);
    }
  });
}

function flashCopied(button) {
  const label = button.querySelector('.copy-label');
  const icon = button.querySelector('.copy-icon');
  const copiedText = button.getAttribute('data-copied') || 'Скопійовано!';

  if (button._copyTimer) {
    clearTimeout(button._copyTimer);
  } else {
    button._origLabel = label ? label.textContent : '';
    button._origIcon = icon ? icon.textContent : '';
  }

  if (label) label.textContent = copiedText;
  if (icon) icon.textContent = 'check';
  button.classList.add('is-copied');

  button._copyTimer = setTimeout(() => {
    if (label) label.textContent = button._origLabel;
    if (icon) icon.textContent = button._origIcon;
    button.classList.remove('is-copied');
    button._copyTimer = null;
  }, 1800);
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  event.preventDefault();

  const text = button.getAttribute('data-copy');
  copyToClipboard(text)
    .then(() => flashCopied(button))
    .catch(() => {
      // Clipboard unavailable — select the visible address so the user can copy it manually.
      const label = button.querySelector('.copy-label');
      if (label && window.getSelection && document.createRange) {
        const range = document.createRange();
        range.selectNodeContents(label);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
});

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initScrollReveal();
  initHeaderScroll();
  animateCounters();
  markDecorativeIcons();
});
