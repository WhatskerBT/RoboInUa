/**
 * Course page renderer (Матеріали → інтерактивні курси).
 * Reads the course by URL id from COURSES (courses-data.js) and builds an
 * interactive lesson page: sticky progress, table of contents, lesson cards
 * with checkpoints. Progress is saved per course in localStorage.
 */

(function () {
  'use strict';

  function detectCourseId() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const materialsIndex = parts.indexOf('materials');
    if (materialsIndex !== -1 && parts[materialsIndex + 1] && parts[materialsIndex + 1] !== 'index.html') {
      return parts[materialsIndex + 1];
    }
    // fallback: <id>/index.html → the folder name
    return parts[parts.length - 2] || null;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Escape, then turn `inline code` (backtick-wrapped) into <code> spans.
  function richText(value) {
    return escapeHtml(value).replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  const DIFF = {
    easy: { cls: 'diff-easy', label: 'Легко' },
    med: { cls: 'diff-med', label: 'Середнє' },
    hard: { cls: 'diff-hard', label: 'Важко' },
  };

  const NOTE = {
    tip: { cls: 'note-tip', ico: 'lightbulb' },
    warn: { cls: 'note-warn', ico: 'warning' },
    info: { cls: 'note-info', ico: 'info' },
  };

  function renderBlock(block) {
    if (!block || !block.type) return '';

    switch (block.type) {
      case 'p':
        return `<p>${richText(block.text)}</p>`;

      case 'h':
        return `<h3 class="lesson-h">${escapeHtml(block.text)}</h3>`;

      case 'list': {
        const tag = block.ordered ? 'ol' : 'ul';
        const items = (block.items || []).map((item) => `<li>${richText(item)}</li>`).join('');
        return `<${tag}>${items}</${tag}>`;
      }

      case 'code':
        return `<pre><code>${escapeHtml(block.code)}</code></pre>`;

      case 'note': {
        const note = NOTE[block.variant] || NOTE.info;
        return `
          <div class="lesson-note ${note.cls}">
            <span class="material-symbols-rounded icon-filled note-ico">${note.ico}</span>
            <span>${richText(block.text)}</span>
          </div>`;
      }

      default:
        return '';
    }
  }

  function sourceLink(lesson) {
    if (!lesson.source || !lesson.source.file) return '';
    const type = (lesson.source.type || '').toLowerCase();
    const isView = type === 'pdf';
    const icon = isView ? 'open_in_new' : 'download';
    const label = isView ? 'Відкрити оригінал (PDF)'
      : type === 'docx' ? 'Завантажити конспект (DOCX)'
      : type === 'archive' ? 'Завантажити матеріали (архів)'
      : 'Завантажити оригінал';
    const attrs = isView ? ' target="_blank" rel="noopener"' : ' download';
    return `
      <a class="lesson-source" href="${encodeURI(lesson.source.file)}"${attrs}>
        <span class="material-symbols-rounded">${icon}</span>
        ${label}
      </a>`;
  }

  function renderFigures(lesson) {
    const figures = (lesson.images || []).map((image) => `
      <figure class="lesson-figure">
        <img src="${encodeURI(image.src)}" alt="${escapeHtml(image.caption || lesson.title)}" loading="lazy" decoding="async">
        ${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ''}
      </figure>`).join('');
    return figures ? `<div class="lesson-figures">${figures}</div>` : '';
  }

  function renderLesson(lesson) {
    const diff = DIFF[lesson.difficulty] || DIFF.med;
    const body = (lesson.blocks || []).map(renderBlock).join('\n');
    const checkpoint = lesson.checkpoint || 'Я опрацював цей урок';

    return `
      <article class="lesson" id="lesson-${escapeHtml(lesson.n)}" data-reveal>
        <div class="lesson-head">
          <div class="lesson-num">${escapeHtml(lesson.n)}</div>
          <div class="lesson-titles">
            <h2>${escapeHtml(lesson.title)}</h2>
            ${lesson.subtitle ? `<div class="lesson-sub">${escapeHtml(lesson.subtitle)}</div>` : ''}
          </div>
          <span class="lesson-diff ${diff.cls}">${diff.label}</span>
        </div>
        <div class="lesson-body">
          ${renderFigures(lesson)}
          ${body}
          ${sourceLink(lesson)}
          <label class="lesson-check">
            <input type="checkbox" data-lesson="${escapeHtml(lesson.n)}">
            <span>${escapeHtml(checkpoint)}</span>
          </label>
        </div>
      </article>`;
  }

  function renderTocItem(lesson) {
    return `
      <li>
        <a href="#lesson-${escapeHtml(lesson.n)}" data-toc="${escapeHtml(lesson.n)}">
          <span class="toc-num">${escapeHtml(lesson.n)}</span>
          <span class="toc-title">${escapeHtml(lesson.title)}</span>
          <span class="material-symbols-rounded icon-filled toc-check">check_circle</span>
        </a>
      </li>`;
  }

  function renderPage(course) {
    const main = document.querySelector('main');
    if (!main) return;

    const basePath = typeof getBasePath === 'function' ? getBasePath() : '../../';
    const download = course.downloadFile
      ? `<a class="btn btn-secondary" href="${encodeURI(course.downloadFile)}" download>
           <span class="material-symbols-rounded m3-icon-20">download</span>
           ${escapeHtml(course.downloadLabel || 'Завантажити курс')}
         </a>`
      : '';

    const lessons = (course.lessons || []).map(renderLesson).join('\n');
    const toc = (course.lessons || []).map(renderTocItem).join('\n');

    main.innerHTML = `
      <div class="course-page">
        <nav class="breadcrumbs" aria-label="Навігація">
          <a class="breadcrumb-link" href="${basePath}index.html">Головна</a>
          <span class="breadcrumb-sep"><span class="material-symbols-rounded m3-icon-16">chevron_right</span></span>
          <a class="breadcrumb-link" href="${basePath}materials/index.html">Матеріали</a>
          <span class="breadcrumb-sep"><span class="material-symbols-rounded m3-icon-16">chevron_right</span></span>
          <span class="breadcrumb-current">${escapeHtml(course.title)}</span>
        </nav>

        <div class="course-hero">
          <div class="course-hero-head">
            <div class="course-hero-icon">
              <span class="material-symbols-rounded icon-filled">${escapeHtml(course.icon || 'menu_book')}</span>
            </div>
            <span class="course-hero-badge">
              <span class="material-symbols-rounded m3-icon-16">school</span>
              ${escapeHtml(course.badge || 'Курс')}
            </span>
          </div>
          <h1>${escapeHtml(course.title)}</h1>
          ${course.subtitle ? `<p class="course-hero-sub">${escapeHtml(course.subtitle)}</p>` : ''}
          ${course.summary ? `<p class="course-hero-summary">${escapeHtml(course.summary)}</p>` : ''}
          <div class="course-hero-actions">
            <a class="btn btn-primary" href="#lesson-${escapeHtml((course.lessons[0] || {}).n)}">
              <span class="material-symbols-rounded m3-icon-20">play_arrow</span>
              Почати навчання
            </a>
            ${download}
          </div>
        </div>

        <div class="course-progress" aria-label="Прогрес курсу">
          <span class="cp-label"><span class="material-symbols-rounded icon-filled">trending_up</span>Прогрес</span>
          <div class="cp-track"><div class="cp-fill" id="cpFill"></div></div>
          <span class="cp-pct" id="cpPct">0%</span>
          <button type="button" class="cp-reset" id="cpReset">Скинути</button>
        </div>

        <nav class="course-toc" aria-label="Зміст курсу">
          <h2><span class="material-symbols-rounded icon-filled">list_alt</span>Зміст курсу</h2>
          <ol class="course-toc-list">${toc}</ol>
        </nav>

        <div class="course-lessons">${lessons}</div>

        <div class="course-done" id="courseDone">
          <span class="material-symbols-rounded icon-filled">emoji_events</span>
          <div>
            <h2>Курс пройдено! 🎉</h2>
            <p>Ви опрацювали всі уроки курсу «${escapeHtml(course.title)}». Вітаємо!</p>
          </div>
        </div>
      </div>

      <div id="cta-banner"></div>`;

    // Re-render the CTA banner now that its placeholder exists.
    if (typeof renderCtaBanner === 'function') {
      renderCtaBanner();
    }
  }

  function initProgress(course) {
    const KEY = `roboinua_course_${course.id}_v1`;
    let state = {};
    try {
      state = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    } catch (e) {
      state = {};
    }

    const boxes = Array.from(document.querySelectorAll('.lesson-check input'));
    const fill = document.getElementById('cpFill');
    const pct = document.getElementById('cpPct');
    const done = document.getElementById('courseDone');

    function save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch (e) {
        /* storage may be unavailable — progress just won't persist */
      }
    }

    function syncLesson(box) {
      const n = box.dataset.lesson;
      const lesson = box.closest('.lesson');
      if (lesson) lesson.classList.toggle('is-done', box.checked);
      const tocItem = document.querySelector(`[data-toc="${CSS.escape(n)}"]`);
      if (tocItem) tocItem.classList.toggle('is-done', box.checked);
    }

    function update() {
      const total = boxes.length;
      const complete = boxes.filter((b) => b.checked).length;
      const percent = total ? Math.round((complete / total) * 100) : 0;
      if (fill) fill.style.width = percent + '%';
      if (pct) pct.textContent = percent + '%';
      if (done) done.classList.toggle('is-visible', total > 0 && complete === total);
    }

    boxes.forEach((box) => {
      box.checked = !!state[box.dataset.lesson];
      syncLesson(box);
      box.addEventListener('change', () => {
        state[box.dataset.lesson] = box.checked;
        save();
        syncLesson(box);
        update();
      });
    });

    const reset = document.getElementById('cpReset');
    if (reset) {
      reset.addEventListener('click', () => {
        if (!window.confirm('Скинути весь прогрес цього курсу?')) return;
        state = {};
        try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
        boxes.forEach((box) => {
          box.checked = false;
          syncLesson(box);
        });
        update();
      });
    }

    update();
  }

  function init() {
    const id = detectCourseId();
    const course = (typeof COURSES !== 'undefined' && Array.isArray(COURSES))
      ? COURSES.find((item) => item.id === id)
      : null;

    if (!course) {
      document.title = 'Курс не знайдено — Федерація робототехніки Прилуччини';
      const main = document.querySelector('main');
      if (main) {
        main.innerHTML = `
          <div class="course-page" style="padding-top:140px;text-align:center">
            <h1 class="course-hero" style="padding-top:0">Курс не знайдено</h1>
            <p><a class="btn btn-primary" href="../index.html">До каталогу матеріалів</a></p>
          </div>`;
      }
      return;
    }

    document.title = `${course.title} — Навчальні матеріали — Федерація робототехніки Прилуччини`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && course.summary) meta.setAttribute('content', course.summary);

    renderPage(course);
    initProgress(course);

    // Injected after the site's DOMContentLoaded pass — re-run the helpers so
    // freshly created nodes get their scroll-reveal and a11y treatment.
    if (typeof window.markDecorativeIcons === 'function') {
      window.markDecorativeIcons();
    }
    if (typeof window.initScrollReveal === 'function') {
      window.initScrollReveal();
    } else {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('revealed'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
