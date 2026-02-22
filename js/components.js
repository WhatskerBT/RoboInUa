/**
 * Спільні компоненти сайту — Material 3 Expressive
 * Підтримує вкладені підсторінки з автоматичним визначенням шляхів
 * Працює коректно як через file://, так і на веб-сервері
 */

// ============ PATH UTILITIES ============
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
        if (src && src.includes('components.js')) {
            const parts = src.split('/');
            const prefixParts = parts.slice(0, -2);
            if (prefixParts.length === 0) {
                _cachedBasePath = './';
            } else {
                _cachedBasePath = prefixParts.join('/') + '/';
            }
            return _cachedBasePath;
        }
    }

    _cachedBasePath = './';
    return _cachedBasePath;
}

function url(path) {
    return getBasePath() + path;
}

// ============ NAVIGATION CONFIG ============
const NAV_ITEMS = [
    { href: 'index.html', label: 'Головна', page: 'home', icon: 'home' },
    { href: 'projects/index.html', label: 'Проєкти', page: 'projects', icon: 'folder_open' },
    { href: 'events/index.html', label: 'Заходи', page: 'events', icon: 'event' },
    { href: 'donate/index.html', label: 'Підтримати', page: 'donate', icon: 'favorite', isButton: true },
];

// ============ HEADER ============
function renderHeader(activePage = '') {
    const header = document.getElementById('header');
    if (!header) return;

    const navLinks = NAV_ITEMS.map(item => {
        const href = url(item.href);
        const isActive = activePage === item.page;

        if (item.isButton) {
            return `<a href="${href}" class="btn-nav ${isActive ? 'active' : ''}">
        <span class="material-symbols-rounded" style="font-size:18px">${item.icon}</span>
        ${item.label}
      </a>`;
        }
        return `<a href="${href}" ${isActive ? 'class="active"' : ''}>
      ${item.label}
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
    <button class="theme-toggle" onclick="toggleTheme()" title="Перемкнути тему" aria-label="Перемкнути тему">
      <span class="material-symbols-rounded" id="theme-icon">dark_mode</span>
    </button>
    <button class="mobile-toggle" onclick="toggleNav()" aria-label="Меню">
      <span class="material-symbols-rounded">menu</span>
    </button>
  </header>
  `;

    // Update theme icon after render
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
}

// ============ BREADCRUMBS ============
function renderBreadcrumbs(items) {
    const container = document.getElementById('breadcrumbs');
    if (!container) return;

    const crumbs = items.map((item, i) => {
        const isLast = i === items.length - 1;
        if (isLast) {
            return `<span class="breadcrumb-current">${item.label}</span>`;
        }
        return `<a href="${item.href}" class="breadcrumb-link">${item.label}</a>`;
    }).join('<span class="breadcrumb-sep"><span class="material-symbols-rounded" style="font-size:16px">chevron_right</span></span>');

    container.innerHTML = crumbs;
}

// ============ FOOTER ============
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
          <a href="${url('index.html')}"><span class="material-symbols-rounded" style="font-size:16px;vertical-align:middle;margin-right:6px">home</span>Головна</a>
          <a href="${url('projects/index.html')}"><span class="material-symbols-rounded" style="font-size:16px;vertical-align:middle;margin-right:6px">folder_open</span>Проєкти</a>
          <a href="${url('events/index.html')}"><span class="material-symbols-rounded" style="font-size:16px;vertical-align:middle;margin-right:6px">event</span>Заходи</a>
          <a href="${url('donate/index.html')}"><span class="material-symbols-rounded" style="font-size:16px;vertical-align:middle;margin-right:6px">favorite</span>Підтримати</a>
        </div>
      </div>
      <div>
        <h4>Контакти</h4>
        <div class="footer-links">
          <span><span class="material-symbols-rounded" style="font-size:16px;vertical-align:middle;margin-right:6px">mail</span>robofederation.pryluky@gmail.com</span>
          <a href="https://facebook.com/roboinua" target="_blank"><span class="material-symbols-rounded" style="font-size:16px;vertical-align:middle;margin-right:6px">public</span>Facebook</a>
        </div>
      </div>
      <div>
        <h4>Локація</h4>
        <div class="footer-links">
          <span><span class="material-symbols-rounded" style="font-size:16px;vertical-align:middle;margin-right:6px">location_on</span>м. Прилуки</span>
          <span>Чернігівська область</span>
          <span>Україна</span>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      © 2024 ГО «Федерація робототехніки та програмування Прилуччини»
    </div>
  </footer>
  `;
}

// ============ CTA BANNER ============
function renderCtaBanner(containerId = 'cta-banner') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.outerHTML = `
  <section class="cta-section">
    <div class="cta-banner">
      <div class="cta-content">
        <span class="material-symbols-rounded icon-filled" style="font-size:40px;opacity:0.85;margin-bottom:8px">volunteer_activism</span>
        <h2>Підтримайте розвиток робототехніки в громаді</h2>
        <p>Кожен внесок — це обладнання, витратні матеріали та нові можливості для дітей.</p>
      </div>
      <a href="${url('donate/index.html')}" class="btn">
        <span class="material-symbols-rounded" style="font-size:20px">arrow_forward</span>
        Допомогти
      </a>
    </div>
  </section>
  `;
}

// ============ INIT ============
function initComponents(activePage = '', options = {}) {
    renderHeader(activePage);
    renderFooter();

    const ctaBanner = document.getElementById('cta-banner');
    if (ctaBanner) {
        renderCtaBanner();
    }

    if (options.breadcrumbs) {
        renderBreadcrumbs(options.breadcrumbs);
    }
}
