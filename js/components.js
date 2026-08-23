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

/* Пункт навігації, який з'являється ЛИШЕ для вчителя, що увійшов. Публічне
   меню сайту від цього не змінюється: відвідувач ніколи його не бачить. */
const TEACHER_NAV_ITEM = {
  href: 'teacher/index.html', label: 'Кабінет', page: 'teacher', icon: 'school',
};

let currentPage = '';

function session() {
  return (typeof RoboSession !== 'undefined') ? RoboSession.peek() : null;
}

// Brand mark — squircle badge with the Material Symbols robot; colours follow the theme via CSS.
const LOGO_MARK = `<span class="logo-dot" aria-hidden="true"><span class="material-symbols-rounded icon-filled logo-mark-icon">smart_toy</span></span>`;

function navMarkup(activePage) {
  const teacher = session();
  const items = NAV_ITEMS.slice();
  if (teacher) {
    // Перед кнопкою «Підтримати», щоб вона лишалася останньою.
    items.splice(items.length - 1, 0, TEACHER_NAV_ITEM);
  }

  return items.map((item) => {
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
}

/* Кнопка акаунта + випадне меню. Розмітка будується синхронно з
   RoboSession.peek(), тож шапка одразу малюється у правильному стані —
   без блимання «увійти» перед ініціалами вчителя. */
function accountMarkup() {
  const teacher = session();

  const menu = teacher
    ? `
      <div class="account-menu-id">
        <span class="account-menu-avatar">${initials(teacher.name)}</span>
        <div>
          <strong>${teacher.name}</strong>
          <small>${teacher.school || teacher.email}</small>
        </div>
      </div>
      <a role="menuitem" href="${url('teacher/index.html')}">
        <span class="material-symbols-rounded m3-icon-18">school</span>
        Кабінет вчителя
      </a>
      <a role="menuitem" href="${url('materials/index.html')}">
        <span class="material-symbols-rounded m3-icon-18">menu_book</span>
        Навчальні матеріали
      </a>
      <button type="button" role="menuitem" data-account-signout>
        <span class="material-symbols-rounded m3-icon-18">logout</span>
        Вийти
      </button>`
    : `
      <div class="account-menu-id account-menu-id--guest">
        <span class="account-menu-avatar"><span class="material-symbols-rounded m3-icon-20">account_circle</span></span>
        <div>
          <strong>Кабінет вчителя</strong>
          <small>Класи, прогрес і урок на екран</small>
        </div>
      </div>
      <a role="menuitem" href="${url('teacher/index.html')}">
        <span class="material-symbols-rounded m3-icon-18">login</span>
        Увійти
      </a>
      <a role="menuitem" href="${url('teacher/index.html')}?tab=register">
        <span class="material-symbols-rounded m3-icon-18">person_add</span>
        Створити акаунт
      </a>`;

  const label = teacher ? `${teacher.name} — меню акаунта` : 'Кабінет вчителя';

  return `
    <div class="account-wrap">
      <button type="button" class="account-btn ${teacher ? 'is-signed' : ''}" id="account-btn"
        aria-haspopup="true" aria-expanded="false" aria-controls="account-menu"
        aria-label="${label}" title="${label}">
        <span class="material-symbols-rounded m3-icon-24">account_circle</span>
        <span class="account-initials" aria-hidden="true">${teacher ? initials(teacher.name) : ''}</span>
      </button>
      <div class="account-menu" id="account-menu" role="menu" aria-label="Меню акаунта">${menu}</div>
    </div>`;
}

function renderHeader(activePage = '') {
  const header = document.getElementById('header');
  if (!header) return;

  const supportItem = NAV_ITEMS.find((item) => item.isButton);

  header.outerHTML = `
  <header>
    <a class="logo" href="${url('index.html')}">
      ${LOGO_MARK}
      Федерація робототехніки Прилуччини
    </a>
    <nav class="nav-links" id="nav-links">
      ${navMarkup(activePage)}
    </nav>
    <div class="chrome-actions">
      ${accountMarkup()}
      <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Перемкнути тему" title="Перемкнути тему">
        <span class="material-symbols-rounded m3-icon-20" data-theme-icon>dark_mode</span>
      </button>
    </div>
  </header>
  ${supportItem ? `
  <a class="mobile-support-fab ${activePage === supportItem.page ? 'active' : ''}" href="${url(supportItem.href)}" aria-label="${supportItem.label}" title="${supportItem.label}">
    <span class="material-symbols-rounded m3-icon-24">${supportItem.icon}</span>
  </a>
  ` : ''}
  `;

  wireAccountMenu();
}

let accountDocumentWired = false;

function closeAccountMenu() {
  const wrap = document.querySelector('.account-wrap.is-open');
  if (!wrap) return;
  wrap.classList.remove('is-open');
  const button = wrap.querySelector('.account-btn');
  if (button) button.setAttribute('aria-expanded', 'false');
}

/* Обробники самої кнопки вішаються заново на кожне перемальовування (кнопка
   щоразу нова), а «клік поза меню» і Escape — рівно один раз за сторінку:
   вони шукають меню в момент події, тож переживають перемальовування. */
function wireAccountMenu() {
  const button = document.getElementById('account-btn');
  const wrap = button ? button.closest('.account-wrap') : null;
  if (!button || !wrap) return;

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = wrap.classList.toggle('is-open');
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  if (!accountDocumentWired) {
    accountDocumentWired = true;
    document.addEventListener('click', (event) => {
      const openWrap = document.querySelector('.account-wrap.is-open');
      if (openWrap && !openWrap.contains(event.target)) closeAccountMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAccountMenu();
    });
  }

  const signOut = wrap.querySelector('[data-account-signout]');
  if (signOut) {
    signOut.addEventListener('click', () => {
      if (typeof RoboSession !== 'undefined') RoboSession.signOut();
      // Перезавантаження, а не редирект: на сторінках кабінету охорона сама
      // відправить на екран входу, а на публічних просто оновиться шапка.
      window.location.reload();
    });
  }
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

function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '·';
}

/**
 * Перемалювати те, що залежить від стану акаунта: пункт «Кабінет» у
 * навігації та кнопку з меню. Потрібне після входу чи виходу без
 * перезавантаження сторінки — саме так працює екран кабінету.
 */
function syncAccountButton() {
  const nav = document.getElementById('nav-links');
  if (nav) nav.innerHTML = navMarkup(currentPage);

  const wrap = document.querySelector('.account-wrap');
  if (wrap) {
    wrap.outerHTML = accountMarkup();
    wireAccountMenu();
  }

  if (typeof window.markDecorativeIcons === 'function') window.markDecorativeIcons();
}

function initComponents(activePage = '', options = {}) {
  currentPage = activePage;
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
