/**
 * Сторінка огляду курсу: materials/<id>/index.html
 *
 * Свідомо працює ЛИШЕ з індексом (js/courses-index.js) — тексти уроків тут
 * не потрібні, тож важкий файл курсу не вантажиться взагалі. Він знадобиться
 * тільки коли відкриють конкретний урок.
 */

(function () {
  'use strict';

  function courseIdFromPath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const at = parts.indexOf('materials');
    if (at !== -1 && parts[at + 1] && parts[at + 1] !== 'index.html') return parts[at + 1];
    return parts[parts.length - 2] || null;
  }

  const id = courseIdFromPath();
  const course = CourseLibrary.meta(id);
  const main = document.querySelector('main');
  const base = CourseLibrary.basePath();

  if (!course) {
    document.title = 'Курс не знайдено — Федерація робототехніки Прилуччини';
    if (main) {
      main.innerHTML = `
        <div class="course-page" style="padding-top:140px;text-align:center">
          <h1>Курс не знайдено</h1>
          <p><a class="btn btn-primary" href="../index.html">До каталогу матеріалів</a></p>
        </div>`;
    }
    return;
  }

  const esc = CourseRender.esc;
  const lessons = course.lessons || [];

  /* Курс-продовження чесно попереджає, з чого починати. Без цього
     людина відкриває «Scratch: далі» першим і губиться на другому уроці. */
  function prereqNote() {
    if (!course.prereq) return '';
    const before = CourseLibrary.meta(course.prereq);
    if (!before) return '';

    return `
      <p class="course-prereq">
        <span class="material-symbols-rounded m3-icon-18 m3-icon-inline">trending_up</span>
        Це продовження. Спершу радимо пройти
        <a href="../${esc(before.id)}/index.html">${esc(before.title)}</a>.
      </p>`;
  }

  function lessonCards(progress) {
    return lessons.map((lesson, position) => {
      const done = !!progress[lesson.n];
      const diff = CourseRender.difficulty(lesson.difficulty);

      return `
        <a class="lesson-card ${done ? 'is-done' : ''}" href="lesson.html?n=${encodeURIComponent(lesson.n)}">
          <div class="lesson-card-num">${esc(lesson.n)}</div>
          <div class="lesson-card-body">
            <h3>${esc(lesson.title)}</h3>
            ${lesson.subtitle ? `<p>${esc(lesson.subtitle)}</p>` : ''}
            <div class="lesson-card-meta">
              <span class="lesson-diff ${diff.cls}">${diff.label}</span>
              ${done ? '<span class="lesson-card-done"><span class="material-symbols-rounded icon-filled m3-icon-16">check_circle</span>Опрацьовано</span>' : ''}
            </div>
          </div>
          <span class="lesson-card-go" aria-hidden="true">
            <span class="material-symbols-rounded">${position === 0 ? 'play_arrow' : 'arrow_forward'}</span>
          </span>
        </a>`;
    }).join('');
  }

  function render() {
    const progress = CourseLibrary.readProgress(id);
    const stats = CourseLibrary.progressStats(id, lessons.length);

    // «Продовжити» веде на перший неопрацьований урок, а не завжди на перший.
    const next = lessons.find((lesson) => !progress[lesson.n]) || lessons[0];
    const started = stats.done > 0;

    const download = course.downloadFile
      ? `<a class="btn btn-secondary" href="${encodeURI(course.downloadFile)}" download>
           <span class="material-symbols-rounded m3-icon-20">download</span>
           ${esc(course.downloadLabel || 'Завантажити курс')}
         </a>`
      : '';

    main.innerHTML = `
      <div class="course-page">
        <nav class="breadcrumbs" aria-label="Навігація">
          <a class="breadcrumb-link" href="${base}index.html">Головна</a>
          <span class="breadcrumb-sep"><span class="material-symbols-rounded m3-icon-16">chevron_right</span></span>
          <a class="breadcrumb-link" href="${base}materials/index.html">Матеріали</a>
          <span class="breadcrumb-sep"><span class="material-symbols-rounded m3-icon-16">chevron_right</span></span>
          <span class="breadcrumb-current">${esc(course.title)}</span>
        </nav>

        <div class="course-hero">
          <div class="course-hero-head">
            <div class="course-hero-icon">
              <span class="material-symbols-rounded icon-filled">${esc(course.icon || 'menu_book')}</span>
            </div>
            <span class="course-hero-badge">
              <span class="material-symbols-rounded m3-icon-16">school</span>
              ${esc(course.badge || 'Курс')}
            </span>
          </div>
          <h1>${esc(course.title)}</h1>
          ${course.subtitle ? `<p class="course-hero-sub">${esc(course.subtitle)}</p>` : ''}
          ${course.summary ? `<p class="course-hero-summary">${esc(course.summary)}</p>` : ''}
          ${course.audience ? `
          <p class="course-audience">
            <span class="material-symbols-rounded m3-icon-18 m3-icon-inline">groups</span>
            ${esc(course.audience)}
          </p>` : ''}
          ${prereqNote()}
          <div class="course-hero-actions">
            <a class="btn btn-primary" href="lesson.html?n=${encodeURIComponent(next.n)}">
              <span class="material-symbols-rounded m3-icon-20">play_arrow</span>
              ${started ? `Продовжити з уроку ${esc(next.n)}` : 'Почати навчання'}
            </a>
            ${download}
          </div>
          ${course.archiveNote ? `
          <p class="course-archive-note">
            <span class="material-symbols-rounded m3-icon-18 m3-icon-inline">archive</span>
            ${esc(course.archiveNote)}
          </p>` : ''}
        </div>

        <div class="course-progress" aria-label="Прогрес курсу">
          <span class="cp-label"><span class="material-symbols-rounded icon-filled">trending_up</span>Прогрес</span>
          <div class="cp-track"><div class="cp-fill" style="width:${stats.percent}%"></div></div>
          <span class="cp-pct">${stats.done} / ${stats.total}</span>
          ${started ? '<button type="button" class="cp-reset" id="cpReset">Скинути</button>' : ''}
        </div>

        <section class="lesson-list" aria-label="Уроки курсу">
          <h2 class="lesson-list-title">
            <span class="material-symbols-rounded icon-filled">list_alt</span>
            Уроки курсу
          </h2>
          <p class="lesson-list-hint">Кожен урок — окрема сторінка. Можна проходити підряд або відкрити саме той, що потрібен зараз.</p>
          <div class="lesson-cards">${lessonCards(progress)}</div>
        </section>

        ${CourseRender.credit(course)}
      </div>

      <div id="cta-banner"></div>`;

    const reset = document.getElementById('cpReset');
    if (reset) {
      reset.addEventListener('click', () => {
        if (!window.confirm('Скинути весь прогрес цього курсу?')) return;
        try {
          localStorage.removeItem(`roboinua_course_${id}_v1`);
        } catch (error) {
          /* нічого не вдієш */
        }
        render();
      });
    }

    if (typeof renderCtaBanner === 'function') renderCtaBanner();
    if (typeof window.markDecorativeIcons === 'function') window.markDecorativeIcons();
    if (typeof window.initScrollReveal === 'function') window.initScrollReveal();
  }

  document.title = `${course.title} — Навчальні матеріали — Федерація робототехніки Прилуччини`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta && course.summary) meta.setAttribute('content', course.summary);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
