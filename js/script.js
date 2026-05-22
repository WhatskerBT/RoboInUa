/**
 * Site interactions
 * System theme sync, scroll reveal, sticky header, counters and small UI helpers.
 */

const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function getSystemTheme() {
  return systemDarkQuery.matches ? 'dark' : 'light';
}

function updateBrowserThemeColor() {
  const color = getSystemTheme() === 'dark' ? '#131316' : '#f8fafd';
  let meta = document.querySelector('meta[name="theme-color"][data-dynamic-theme]');

  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.dataset.dynamicTheme = '1';
    document.head.appendChild(meta);
  }

  meta.content = color;
}

function syncThemeWithSystem() {
  document.documentElement.dataset.theme = getSystemTheme();
  updateBrowserThemeColor();
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

syncThemeWithSystem();
observeMediaQuery(systemDarkQuery, syncThemeWithSystem);

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
  let lastScroll = window.scrollY;
  let ticking = false;

  function setHeaderTransform(hidden) {
    if (mobileQuery.matches) {
      header.style.removeProperty('transform');
      return;
    }

    header.style.transform = hidden
      ? 'translateX(-50%) translateY(-120%)'
      : 'translateX(-50%) translateY(0)';
  }

  function updateHeader() {
    const scrollY = window.scrollY;

    if (mobileQuery.matches) {
      header.style.removeProperty('transform');
      lastScroll = scrollY;
      ticking = false;
      return;
    }

    header.classList.toggle('scrolled', scrollY > 80);
    setHeaderTransform(scrollY > lastScroll && scrollY > 200);
    lastScroll = scrollY;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (ticking) return;

    requestAnimationFrame(updateHeader);
    ticking = true;
  }, { passive: true });

  observeMediaQuery(mobileQuery, () => setHeaderTransform(false));
  updateHeader();
}

function animateCounters() {
  const counters = document.querySelectorAll('.stat-card h3');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const element = entry.target;
      const text = element.textContent;
      const match = text.match(/^(\d+)/);
      if (!match) return;

      const target = parseInt(match[1], 10);
      const suffix = text.slice(match[1].length);
      const duration = 900;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);

        element.textContent = `${current}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      }

      requestAnimationFrame(tick);

      observer.unobserve(element);
    });
  }, { threshold: 0.5 });

  counters.forEach((counter) => observer.observe(counter));
}

document.addEventListener('click', (event) => {
  const amountButton = event.target.closest('.amount-btn');
  if (amountButton) {
    document.querySelectorAll('.amount-btn').forEach((button) => button.classList.remove('selected'));
    amountButton.classList.add('selected');

    const customInput = document.getElementById('customAmount') || document.getElementById('custom-amount');
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
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initHeaderScroll();
  animateCounters();
});
