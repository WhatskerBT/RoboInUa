/**
 * Shared site components.
 * Works for nested pages and local previews via automatic base-path detection.
 */

let _cachedBasePath = null;

function getBasePath() {
  if (_cachedBasePath !== null) return _cachedBasePath;

  const rootMarker = document.documentElement.dataset.siteRoot;
  if (rootMarker) {
    _cachedBasePath = rootMarker;
    return _cachedBasePath;
  }

  const scripts = document.querySelectorAll('script[src]');
  for (const script of scripts) {
    const src = script.getAttribute('src');
    if (!src || !src.includes('components.js')) continue;

    const parts = src.split('/');
    const prefixParts = parts.slice(0, -2);
    _cachedBasePath = prefixParts.length ? `${prefixParts.join('/')}/` : './';
    return _cachedBasePath;
  }

  _cachedBasePath = './';
  return _cachedBasePath;
}

function url(path) {
  return getBasePath() + path;
}

const NAV_ITEMS = [
  { href: 'index.html', label: 'Головна', page: 'home', icon: 'home' },
  { href: 'projects/index.html', label: 'Проєкти', page: 'projects', icon: 'folder_open' },
  { href: 'events/index.html', label: 'Заходи', page: 'events', icon: 'event' },
  { href: 'materials/index.html', label: 'Матеріали', page: 'materials', icon: 'menu_book' },
  { href: 'donate/index.html', label: 'Підтримати', page: 'donate', icon: 'favorite', isButton: true },
];

// Brand mark — squircle badge with the Material Symbols robot; colours follow the theme via CSS.
const LOGO_MARK = `<span class="logo-dot" aria-hidden="true"><span class="material-symbols-rounded icon-filled logo-mark-icon">smart_toy</span></span>`;

function renderHeader(activePage = '') {
  const header = document.getElementById('header');
  if (!header) return;

  const supportItem = NAV_ITEMS.find((item) => item.isButton);
  const navLinks = NAV_ITEMS.map((item) => {
    const href = url(item.href);
    const isActive = activePage === item.page;

    if (item.isButton) {
      return `<a href="${href}" class="btn-nav nav-support-link ${isActive ? 'active' : ''}">
        <span class="material-symbols-rounded m3-icon-18">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
      </a>`;
    }

    return `<a href="${href}" class="${isActive ? 'active' : ''}">
      <span class="material-symbols-rounded m3-icon-20 nav-icon">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
    </a>`;
  }).join('\n      ');

  header.outerHTML = `
  <header>
    <a class="logo" href="${url('index.html')}">
      ${LOGO_MARK}
      Федерація робототехніки Прилуччини
    </a>
    <nav class="nav-links" id="nav-links">
      ${navLinks}
    </nav>
    <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Перемкнути тему" title="Перемкнути тему">
      <span class="material-symbols-rounded m3-icon-20" data-theme-icon>dark_mode</span>
    </button>
  </header>
  ${supportItem ? `
  <a class="mobile-support-fab ${activePage === supportItem.page ? 'active' : ''}" href="${url(supportItem.href)}" aria-label="${supportItem.label}" title="${supportItem.label}">
    <span class="material-symbols-rounded m3-icon-24">${supportItem.icon}</span>
  </a>
  ` : ''}
  `;
}

function renderBreadcrumbs(items) {
  const container = document.getElementById('breadcrumbs');
  if (!container) return;

  const crumbs = items.map((item, index) => {
    const isLast = index === items.length - 1;
    if (isLast) {
      return `<span class="breadcrumb-current">${item.label}</span>`;
    }

    return `<a href="${item.href}" class="breadcrumb-link">${item.label}</a>`;
  }).join('<span class="breadcrumb-sep"><span class="material-symbols-rounded m3-icon-16">chevron_right</span></span>');

  container.innerHTML = crumbs;
}

function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  footer.outerHTML = `
  <footer>
    <div class="footer-grid">
      <div>
        <div class="footer-brand">
          ${LOGO_MARK}
          Федерація робототехніки
        </div>
        <p>ГО «Федерація робототехніки та програмування Прилуччини». Розвиваємо STEM-освіту та допомагаємо школам запускати робототехнічні програми.</p>
      </div>
      <div>
        <h4>Навігація</h4>
        <div class="footer-links">
          <a href="${url('index.html')}"><span class="material-symbols-rounded m3-icon-16 m3-icon-inline">home</span>Головна</a>
          <a href="${url('projects/index.html')}"><span class="material-symbols-rounded m3-icon-16 m3-icon-inline">folder_open</span>Проєкти</a>
          <a href="${url('events/index.html')}"><span class="material-symbols-rounded m3-icon-16 m3-icon-inline">event</span>Заходи</a>
          <a href="${url('materials/index.html')}"><span class="material-symbols-rounded m3-icon-16 m3-icon-inline">menu_book</span>Навчальні матеріали</a>
          <a href="${url('donate/index.html')}"><span class="material-symbols-rounded m3-icon-16 m3-icon-inline">favorite</span>Підтримати</a>
        </div>
      </div>
      <div>
        <h4>Контакти</h4>
        <div class="footer-links">
          <button type="button" class="footer-copy" data-copy="nstekh@gmail.com" data-copied="Пошту скопійовано!" title="Скопіювати пошту">
            <span class="material-symbols-rounded m3-icon-16 m3-icon-inline">mail</span>
            <span class="copy-label">nstekh@gmail.com</span>
            <span class="material-symbols-rounded copy-icon footer-copy-ic">content_copy</span>
          </button>
          <a href="https://facebook.com/roboinua" target="_blank" rel="noopener"><span class="material-symbols-rounded m3-icon-16 m3-icon-inline">public</span>Facebook</a>
        </div>
      </div>
      <div>
        <h4>Локація</h4>
        <div class="footer-links">
          <span><span class="material-symbols-rounded m3-icon-16 m3-icon-inline">location_on</span>м. Прилуки</span>
          <span>Чернігівська область</span>
          <span>Україна</span>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      © ${new Date().getFullYear()} ГО «Федерація робототехніки та програмування Прилуччини»
    </div>
  </footer>
  `;
}

function renderCtaBanner(containerId = 'cta-banner') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.outerHTML = `
  <section class="cta-section">
    <div class="cta-banner">
      <div class="cta-content">
        <span class="material-symbols-rounded icon-filled m3-icon-40" style="opacity:0.85;margin-bottom:8px">volunteer_activism</span>
        <h2>Підтримайте розвиток робототехніки в громаді</h2>
        <p>Кожен внесок — це обладнання, витратні матеріали та нові можливості для дітей.</p>
      </div>
      <a href="${url('donate/index.html')}" class="btn">
        <span class="material-symbols-rounded m3-icon-20">arrow_forward</span>
        Допомогти
      </a>
    </div>
  </section>
  `;
}

function ensureFavicon() {
  if (typeof document === 'undefined' || !document.head) return;
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/svg+xml';
  link.href = url('img/favicon.svg');
}

function initComponents(activePage = '', options = {}) {
  ensureFavicon();
  renderHeader(activePage);
  renderFooter();

  if (document.getElementById('cta-banner')) {
    renderCtaBanner();
  }

  if (options.breadcrumbs) {
    renderBreadcrumbs(options.breadcrumbs);
  }
}
