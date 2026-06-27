/**
 * Project page renderer.
 * Loads project data by URL and builds the full detail page, including gallery carousel.
 */

(function () {
  'use strict';

  function detectProjectId() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const projectsIndex = parts.indexOf('projects');

    if (projectsIndex !== -1 && parts[projectsIndex + 1]) {
      return parts[projectsIndex + 1];
    }

    return parts[parts.length - 2] || null;
  }

  function initProjectCarousels(root = document) {
    root.querySelectorAll('[data-project-carousel]').forEach((carousel) => {
      const track = carousel.querySelector('[data-carousel-track]');
      const slides = Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
      const thumbs = Array.from(carousel.querySelectorAll('[data-carousel-thumb]'));
      const counter = carousel.querySelector('[data-carousel-counter]');
      const prevButton = carousel.querySelector('[data-carousel-prev]');
      const nextButton = carousel.querySelector('[data-carousel-next]');

      if (!track || slides.length === 0) return;

      let currentIndex = 0;
      let touchStartX = 0;

      function setSlide(nextIndex) {
        currentIndex = (nextIndex + slides.length) % slides.length;
        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        slides.forEach((slide, index) => {
          slide.classList.toggle('is-active', index === currentIndex);
        });

        thumbs.forEach((thumb, index) => {
          const isActive = index === currentIndex;
          thumb.classList.toggle('is-active', isActive);
          thumb.setAttribute('aria-current', isActive ? 'true' : 'false');
        });

        if (counter) {
          counter.textContent = `${currentIndex + 1} / ${slides.length}`;
        }
      }

      prevButton?.addEventListener('click', () => setSlide(currentIndex - 1));
      nextButton?.addEventListener('click', () => setSlide(currentIndex + 1));

      thumbs.forEach((thumb, index) => {
        thumb.addEventListener('click', () => setSlide(index));
      });

      carousel.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          setSlide(currentIndex - 1);
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault();
          setSlide(currentIndex + 1);
        }
      });

      carousel.addEventListener('touchstart', (event) => {
        touchStartX = event.changedTouches[0].clientX;
      }, { passive: true });

      carousel.addEventListener('touchend', (event) => {
        const delta = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) < 40) return;
        setSlide(delta > 0 ? currentIndex - 1 : currentIndex + 1);
      }, { passive: true });

      setSlide(0);
    });
  }

  const projectId = detectProjectId();
  const project = typeof getProjectById === 'function' ? getProjectById(projectId) : null;

  if (!project) {
    document.title = 'Проєкт не знайдено';
    console.error('[project-page] Project not found for id:', projectId);
    return;
  }

  document.title = `${project.title} — Федерація робототехніки Прилуччини`;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', project.excerpt);
  }

  document.documentElement.style.setProperty('--pd-hero-bg', project.heroColor || 'var(--md-primary-container)');

  function getPrevNext() {
    const index = PROJECTS.findIndex((item) => item.id === projectId);
    return {
      prev: index > 0 ? PROJECTS[index - 1] : null,
      next: index < PROJECTS.length - 1 ? PROJECTS[index + 1] : null,
    };
  }

  function statusChipClass(status) {
    return status === 'Активний' ? 'pd-chip status-active' : 'pd-chip status-done';
  }

  function isExternalUrl(value) {
    return /^https?:\/\//i.test(value);
  }

  function renderPage() {
    const main = document.querySelector('main');
    if (!main) return;

    const { prev, next } = getPrevNext();
    const basePath = typeof getBasePath === 'function' ? getBasePath() : '../../';
    const projectHref = (id) => `../${id}/index.html`;

    const descriptionHtml = (project.description || [])
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join('');

    const goalsHtml = (project.goals || []).map((goal) => `
      <div class="pd-goal-item" data-reveal>
        <div class="pd-goal-icon">
          <span class="material-symbols-rounded">check</span>
        </div>
        <span class="pd-goal-text">${goal}</span>
      </div>
    `).join('');

    const resultsHtml = (project.results || []).map((result) => `
      <div class="pd-result-card" data-reveal>
        <span class="material-symbols-rounded icon-filled pd-result-icon">${result.icon}</span>
        <div class="pd-result-value">${result.value}</div>
        <div class="pd-result-label">${result.label}</div>
      </div>
    `).join('');

    const linksHtml = (project.links || []).map((link) => `
      <a href="${link.url}" class="pd-link-btn"${isExternalUrl(link.url) ? ' target="_blank" rel="noopener"' : ''}>
        <span class="material-symbols-rounded m3-icon-18">${link.icon || 'open_in_new'}</span>
        ${link.label}
      </a>
    `).join('');

    const materialsHtml = (project.materials || []).map((material) => {
      const meta = [material.format, material.size].filter(Boolean).join(' • ');
      const label = material.downloadLabel || 'Завантажити';
      const icon = label === 'Переглянути' ? 'open_in_new' : 'download';

      return `
        <a href="${material.url}" class="pd-material-card"${isExternalUrl(material.url) ? ' target="_blank" rel="noopener"' : ''}${material.download === false ? '' : ' download'}>
          <div class="pd-material-top">
            <div class="pd-material-icon">
              <span class="material-symbols-rounded icon-filled">${material.icon || 'library_books'}</span>
            </div>
            ${meta ? `<span class="pd-material-meta">${meta}</span>` : ''}
          </div>
          <h3>${material.title}</h3>
          ${material.description ? `<p>${material.description}</p>` : ''}
          <span class="pd-material-download">
            <span class="material-symbols-rounded m3-icon-18">${icon}</span>
            ${label}
          </span>
        </a>
      `;
    }).join('');

    const galleryHtml = (project.gallery && project.gallery.length) ? `
      <div class="pd-gallery" data-reveal>
        <h2>Фотогалерея</h2>
        <div class="pd-carousel" data-project-carousel tabindex="0" aria-label="Фотогалерея проєкту ${project.title}">
          <div class="pd-carousel-stage">
            <div class="pd-carousel-track" data-carousel-track>
              ${project.gallery.map((src, index) => `
                <figure class="pd-carousel-slide" data-carousel-slide>
                  <img src="${src}" alt="${project.title}: фото ${index + 1}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async">
                </figure>
              `).join('')}
            </div>
            ${project.gallery.length > 1 ? `
              <button type="button" class="pd-carousel-btn prev" data-carousel-prev aria-label="Попереднє фото">
                <span class="material-symbols-rounded">arrow_back</span>
              </button>
              <button type="button" class="pd-carousel-btn next" data-carousel-next aria-label="Наступне фото">
                <span class="material-symbols-rounded">arrow_forward</span>
              </button>
            ` : ''}
            <div class="pd-carousel-meta">
              <span class="pd-carousel-label">Фото з проєкту</span>
              <span class="pd-carousel-counter" data-carousel-counter></span>
            </div>
          </div>
          ${project.gallery.length > 1 ? `
            <div class="pd-carousel-thumbs">
              ${project.gallery.map((src, index) => `
                <button type="button" class="pd-carousel-thumb" data-carousel-thumb aria-label="Показати фото ${index + 1}">
                  <img src="${src}" alt="" loading="lazy" decoding="async">
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    ` : '';

    const infoRows = [
      { icon: 'calendar_month', label: 'Рік', value: project.year },
      { icon: 'label', label: 'Категорія', value: project.tagLabel },
      { icon: 'info', label: 'Статус', value: project.status },
      project.partner ? { icon: 'handshake', label: 'Партнер', value: project.partner } : null,
    ].filter(Boolean).map((row) => `
      <div class="pd-info-row">
        <span class="material-symbols-rounded">${row.icon}</span>
        <div>
          <div class="pd-info-label">${row.label}</div>
          <div class="pd-info-value">${row.value}</div>
        </div>
      </div>
    `).join('');

    const prevButton = prev ? `
      <a href="${projectHref(prev.id)}" class="pd-nav-btn">
        <span class="material-symbols-rounded">arrow_back</span>
        <div>
          <small>Попередній</small>
          ${prev.title}
        </div>
      </a>
    ` : '<span></span>';

    const nextButton = next ? `
      <a href="${projectHref(next.id)}" class="pd-nav-btn" style="flex-direction:row-reverse;text-align:right">
        <span class="material-symbols-rounded">arrow_forward</span>
        <div>
          <small>Наступний</small>
          ${next.title}
        </div>
      </a>
    ` : '<span></span>';

    main.innerHTML = `
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

      <div class="pd-body">
        <div class="pd-main-col">
          ${descriptionHtml ? `
            <div class="pd-description" data-reveal>
              <h2>Про проєкт</h2>
              ${descriptionHtml}
            </div>
          ` : ''}

          ${goalsHtml ? `
            <div class="pd-goals">
              <h2>Цілі та завдання</h2>
              <div class="pd-goal-list">${goalsHtml}</div>
            </div>
          ` : ''}

          ${materialsHtml ? `
            <div class="pd-materials" data-reveal>
              <h2>Навчальні матеріали</h2>
              <div class="pd-materials-grid">${materialsHtml}</div>
            </div>
          ` : ''}

          ${resultsHtml ? `
            <div class="pd-results">
              <h2>Результати</h2>
              <div class="pd-results-grid">${resultsHtml}</div>
            </div>
          ` : ''}

          ${linksHtml ? `
            <div class="pd-links" data-reveal>
              <h2>Корисні посилання</h2>
              <div class="pd-links-row">${linksHtml}</div>
            </div>
          ` : ''}

          ${galleryHtml}
        </div>

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

      <nav class="pd-nav" aria-label="Навігація між проєктами">
        <div class="pd-nav-inner">
          ${prevButton}
          <a href="../index.html" class="pd-nav-all">
            <span class="material-symbols-rounded m3-icon-18">grid_view</span>
            Всі проєкти
          </a>
          ${nextButton}
        </div>
      </nav>
    `;

    if (typeof initScrollReveal === 'function') {
      initScrollReveal();
    }

    initProjectCarousels(main);

    if (typeof window.markDecorativeIcons === 'function') {
      window.markDecorativeIcons(main);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPage);
  } else {
    renderPage();
  }
})();
