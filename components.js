/**
 * Спільні компоненти сайту
 * Редагуйте header та footer тут - зміни застосуються на всіх сторінках
 */

// ============ HEADER COMPONENT ============
function renderHeader(activePage = '') {
  const header = document.getElementById('header');
  if (!header) return;

  header.outerHTML = `
  <header>
    <a class="logo" href="index.html">
      <span class="logo-dot"></span>
      Федерація робототехніки Прилуччини
    </a>
    <button class="mobile-toggle" onclick="toggleNav()">☰</button>
    <nav class="nav-links" id="nav-links">
      <a href="index.html" ${activePage === 'home' ? 'class="active"' : ''}>Головна</a>
      <a href="projects.html" ${activePage === 'projects' ? 'class="active"' : ''}>Проєкти</a>
      <a href="events.html" ${activePage === 'events' ? 'class="active"' : ''}>Заходи</a>
      <a href="donate.html" class="btn-nav ${activePage === 'donate' ? 'active' : ''}">Підтримати</a>
    </nav>
  </header>
  `;
}

// ============ FOOTER COMPONENT ============
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
          <a href="index.html">Головна</a>
          <a href="projects.html">Проєкти</a>
          <a href="events.html">Заходи</a>
          <a href="donate.html">Підтримати</a>
        </div>
      </div>
      <div>
        <h4>Контакти</h4>
        <div class="footer-links">
          <span>robofederation.pryluky@gmail.com</span>
          <a href="https://facebook.com/roboinua" target="_blank">Facebook</a>
        </div>
      </div>
      <div>
        <h4>Локація</h4>
        <div class="footer-links">
          <span>м. Прилуки</span>
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

// ============ CTA BANNER COMPONENT ============
function renderCtaBanner(containerId = 'cta-banner') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.outerHTML = `
  <section class="cta-section">
    <div class="cta-banner">
      <div>
        <h2>Підтримайте розвиток робототехніки в громаді</h2>
        <p>Кожен внесок — це обладнання, витратні матеріали та нові можливості для дітей.</p>
      </div>
      <a href="donate.html" class="btn">Допомогти →</a>
    </div>
  </section>
  `;
}

// ============ INIT COMPONENTS ============
function initComponents(activePage = '') {
  renderHeader(activePage);
  renderFooter();
  
  // CTA banner (optional - only if element exists)
  const ctaBanner = document.getElementById('cta-banner');
  if (ctaBanner) {
    renderCtaBanner();
  }
}

