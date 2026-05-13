/**
 * ============================================================
 *  PROJECT PAGE RENDERER
 *  Федерація робототехніки Прилуччини
 *
 *  Підключіть цей файл на будь-якій сторінці проєкту.
 *  Він автоматично знаходить поточний проєкт за URL,
 *  рендерить всі секції та breadcrumbs.
 *
 *  Залежності (підключати ДО цього файлу):
 *    - projects-data.js
 *    - components.js
 *    - script.js
 * ============================================================
 */

(function () {
    'use strict';

    // ── Визначаємо поточний id проєкту з URL ──────────────────
    function detectProjectId() {
        // URL виду: …/projects/<id>/index.html
        const parts = window.location.pathname.split('/').filter(Boolean);
        const idx = parts.indexOf('projects');
        if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];

        // Fallback: беремо передостанній сегмент
        return parts[parts.length - 2] || null;
    }

    const PROJECT_ID = detectProjectId();
    const project = (typeof getProjectById === 'function') ? getProjectById(PROJECT_ID) : null;

    if (!project) {
        document.title = 'Проєкт не знайдено';
        console.error('[project-page] Project not found for id:', PROJECT_ID);
        return;
    }

    // ── <title> та <meta> description ─────────────────────────
    document.title = project.title + ' — Федерація робототехніки Прилуччини';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', project.excerpt);

    // ── Hero background ────────────────────────────────────────
    document.documentElement.style.setProperty('--pd-hero-bg', project.heroColor || 'var(--md-primary-container)');

    // ── Navigation (prev / next project) ──────────────────────
    function getPrevNext() {
        const idx = PROJECTS.findIndex(p => p.id === PROJECT_ID);
        const prev = idx > 0 ? PROJECTS[idx - 1] : null;
        const next = idx < PROJECTS.length - 1 ? PROJECTS[idx + 1] : null;
        return { prev, next };
    }

    // ── Chip helper ────────────────────────────────────────────
    function statusChipClass(status) {
        if (status === 'Активний') return 'pd-chip status-active';
        return 'pd-chip status-done';
    }

    // ── Base path (відносний шлях до кореня) ──────────────────
    function base() {
        return (typeof getBasePath === 'function') ? getBasePath() : '../../';
    }

    // ── Render ─────────────────────────────────────────────────
    function renderPage() {
        const main = document.querySelector('main');
        if (!main) return;

        const { prev, next } = getPrevNext();
        const basePath = base();

        // Helper: relative link to another project
        function projectHref(id) {
            return `../${id}/index.html`;
        }

        // ── Description paragraphs ──
        const descHtml = (project.description || [])
            .map(p => `<p>${p}</p>`)
            .join('');

        // ── Goals ──
        const goalsHtml = (project.goals || []).map(g => `
      <div class="pd-goal-item" data-reveal>
        <div class="pd-goal-icon">
          <span class="material-symbols-rounded">check</span>
        </div>
        <span>${g}</span>
      </div>`).join('');

        // ── Results ──
        const resultsHtml = (project.results || []).map(r => `
      <div class="pd-result-card" data-reveal>
        <span class="material-symbols-rounded icon-filled pd-result-icon">${r.icon}</span>
        <div class="pd-result-value">${r.value}</div>
        <div class="pd-result-label">${r.label}</div>
      </div>`).join('');

        // ── External links ──
        const linksHtml = (project.links || []).map(l => `
      <a href="${l.url}" target="_blank" rel="noopener" class="pd-link-btn">
        <span class="material-symbols-rounded m3-icon-18">${l.icon || 'open_in_new'}</span>
        ${l.label}
      </a>`).join('');

        // ── Gallery ──
        const galleryHtml = (project.gallery && project.gallery.length) ? `
      <div class="pd-gallery" data-reveal>
        <h2>Фотографії</h2>
        <div class="pd-gallery-grid">
          ${project.gallery.map(src => `
            <div class="pd-gallery-img">
              <img src="${src}" alt="${project.title}" loading="lazy">
            </div>`).join('')}
        </div>
      </div>` : '';

        // ── Sidebar info rows ──
        const infoRows = [
            { icon: 'calendar_month', label: 'Рік', value: project.year },
            { icon: 'label', label: 'Категорія', value: project.tagLabel },
            { icon: 'info', label: 'Статус', value: project.status },
            project.partner ? { icon: 'handshake', label: 'Партнер', value: project.partner } : null,
        ].filter(Boolean).map(row => `
      <div class="pd-info-row">
        <span class="material-symbols-rounded">${row.icon}</span>
        <div>
          <div class="pd-info-label">${row.label}</div>
          <div class="pd-info-value">${row.value}</div>
        </div>
      </div>`).join('');

        // ── Prev/Next nav ──
        const prevBtn = prev
            ? `<a href="${projectHref(prev.id)}" class="pd-nav-btn">
          <span class="material-symbols-rounded">arrow_back</span>
          <div>
            <small>Попередній</small>
            ${prev.title}
          </div>
        </a>`
            : `<span></span>`;

        const nextBtn = next
            ? `<a href="${projectHref(next.id)}" class="pd-nav-btn" style="flex-direction:row-reverse;text-align:right">
          <span class="material-symbols-rounded">arrow_forward</span>
          <div>
            <small>Наступний</small>
            ${next.title}
          </div>
        </a>`
            : `<span></span>`;

        // ── Full HTML ──
        main.innerHTML = `
      <!-- Hero -->
      <section class="project-detail-hero">
        <div class="pd-hero-inner">
          <a href="../index.html" class="pd-back-link">
            <span class="material-symbols-rounded m3-icon-18">arrow_back</span>
            Всі проєкти
          </a>
          <div class="pd-hero-icon">
            <span class="material-symbols-rounded icon-filled">${project.icon}</span>
          </div>
          <div class="pd-meta-row">
            <span class="pd-chip category">${project.tagLabel}</span>
            <span class="${statusChipClass(project.status)}">${project.status}</span>
            ${project.year ? `<span class="pd-chip">${project.year}</span>` : ''}
            ${project.partner ? `<span class="pd-chip"><span class="material-symbols-rounded m3-icon-16 m3-icon-inline">handshake</span>${project.partner}</span>` : ''}
          </div>
          <h1 class="pd-hero-title">${project.title}</h1>
          <p class="pd-hero-excerpt">${project.excerpt}</p>
        </div>
      </section>

      <!-- Main body: 2-column grid -->
      <div class="pd-body">
        <!-- Left: description + goals + results + links + gallery -->
        <div class="pd-main-col">
          ${descHtml ? `
          <div class="pd-description" data-reveal>
            <h2>Про проєкт</h2>
            ${descHtml}
          </div>` : ''}

          ${goalsHtml ? `
          <div class="pd-goals">
            <h2>Цілі та завдання</h2>
            <div class="pd-goal-list">${goalsHtml}</div>
          </div>` : ''}

          ${resultsHtml ? `
          <div class="pd-results">
            <h2>Результати</h2>
            <div class="pd-results-grid">${resultsHtml}</div>
          </div>` : ''}

          ${linksHtml ? `
          <div class="pd-links" data-reveal>
            <h2>Корисні посилання</h2>
            <div class="pd-links-row">${linksHtml}</div>
          </div>` : ''}

          ${galleryHtml}
        </div>

        <!-- Right: sidebar -->
        <aside class="pd-sidebar">
          <div class="pd-info-card">
            <h3>Деталі проєкту</h3>
            ${infoRows}
          </div>

          <a href="${basePath}donate/index.html" class="btn btn-primary" style="text-align:center;justify-content:center">
            <span class="material-symbols-rounded m3-icon-20">favorite</span>
            Підтримати Федерацію
          </a>

          <a href="../index.html" class="btn btn-secondary" style="text-align:center;justify-content:center">
            <span class="material-symbols-rounded m3-icon-20">grid_view</span>
            Всі проєкти
          </a>
        </aside>
      </div>

      <!-- Prev / Next navigation -->
      <nav class="pd-nav" aria-label="Навігація між проєктами">
        <div class="pd-nav-inner">
          ${prevBtn}
          <a href="../index.html" class="pd-nav-all">
            <span class="material-symbols-rounded m3-icon-18">grid_view</span>
            Всі проєкти
          </a>
          ${nextBtn}
        </div>
      </nav>
    `;

        // Init scroll reveal for dynamically inserted elements
        if (typeof initScrollReveal === 'function') initScrollReveal();
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderPage);
    } else {
        renderPage();
    }
})();
