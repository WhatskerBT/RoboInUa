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
  { href: 'donate/index.html', label: 'Підтримати', page: 'donate', icon: 'favorite', isButton: true },
];

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
      <span class="logo-dot"></span>
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
          <span class="logo-dot"></span>
          Федерація робототехніки
        </div>
        <p>ГО «Федерація робототехніки та програмування міста Прилуки та Прилуцького району». Розвиваємо STEM-освіту та допомагаємо школам запускати робототехнічні програми.</p>
      </div>
      <div>
        <h4>Навігація</h4>
        <div class="footer-links">
          <a href="${url('index.html')}"><span class="material-symbols-rounded m3-icon-16 m3-icon-inline">home</span>Головна</a>
          <a href="${url('projects/index.html')}"><span class="material-symbols-rounded m3-icon-16 m3-icon-inline">folder_open</span>Проєкти</a>
          <a href="${url('events/index.html')}"><span class="material-symbols-rounded m3-icon-16 m3-icon-inline">event</span>Заходи</a>
          <a href="${url('donate/index.html')}"><span class="material-symbols-rounded m3-icon-16 m3-icon-inline">favorite</span>Підтримати</a>
        </div>
      </div>
      <div>
        <h4>Контакти</h4>
        <div class="footer-links">
          <span><span class="material-symbols-rounded m3-icon-16 m3-icon-inline">mail</span>robofederation.pryluky@gmail.com</span>
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
      © 2026 ГО «Федерація робототехніки та програмування Прилуччини»
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

function initComponents(activePage = '', options = {}) {
  renderHeader(activePage);
  renderFooter();

  if (document.getElementById('cta-banner')) {
    renderCtaBanner();
  }

  if (options.breadcrumbs) {
    renderBreadcrumbs(options.breadcrumbs);
  }
}
