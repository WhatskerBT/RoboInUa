/**
 * Сторінка ОДНОГО уроку: materials/<id>/lesson.html?n=3
 *
 * Кожен урок тепер має власну адресу — його можна дати учням посиланням,
 * додати в закладки чи роздрукувати окремо. Повний файл курсу вантажиться
 * саме тут і тільки тут.
 */

(function () {
  'use strict';

  const main = document.querySelector('main');
  if (!main) return;

  const esc = CourseRender.esc;
  const base = CourseLibrary.basePath();

  function courseIdFromPath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const at = parts.indexOf('materials');
    if (at !== -1 && parts[at + 1] && parts[at + 1] !== 'lesson.html') return parts[at + 1];
    return parts[parts.length - 2] || null;
  }

  function lessonNumber() {
    const search = new URLSearchParams(window.location.search);
    if (search.has('n')) return search.get('n');
    const hash = window.location.hash.replace(/^#/, '');
    return hash ? new URLSearchParams(hash).get('n') : null;
  }

  const id = courseIdFromPath();
  const meta = CourseLibrary.meta(id);

  function fail(text, backHref, backLabel) {
    main.innerHTML = `
      <div class="course-page" style="padding-top:140px;text-align:center">
        <h1>${esc(text)}</h1>
        <p><a class="btn btn-primary" href="${backHref}">
          <span class="material-symbols-rounded m3-icon-20">arrow_back</span>
          ${esc(backLabel)}
        </a></p>
      </div>`;
  }

  if (!meta) {
    document.title = 'Курс не знайдено — Федерація робототехніки Прилуччини';
    fail('Курс не знайдено', '../index.html', 'До каталогу матеріалів');
    return;
  }

  function render(course, lesson) {
    const nav = CourseLibrary.neighbours(course, lesson.n);
    const stats = CourseLibrary.progressStats(id, (course.lessons || []).length);
    const diff = CourseRender.difficulty(lesson.difficulty);
    const done = !!CourseLibrary.readProgress(id)[lesson.n];

    const prevLink = nav.prev
      ? `<a class="lesson-nav-btn" href="lesson.html?n=${encodeURIComponent(nav.prev.n)}">
           <span class="material-symbols-rounded m3-icon-18">arrow_back</span>
           <span><small>Урок ${esc(nav.prev.n)}</small>${esc(nav.prev.title)}</span>
         </a>`
      : '<span></span>';

    const nextLink = nav.next
      ? `<a class="lesson-nav-btn lesson-nav-btn--next" href="lesson.html?n=${encodeURIComponent(nav.next.n)}">
           <span><small>Урок ${esc(nav.next.n)}</small>${esc(nav.next.title)}</span>
           <span class="material-symbols-rounded m3-icon-18">arrow_forward</span>
         </a>`
      : `<a class="lesson-nav-btn lesson-nav-btn--next" href="index.html">
           <span><small>Курс завершено</small>До огляду курсу</span>
           <span class="material-symbols-rounded m3-icon-18">check_circle</span>
         </a>`;

    main.innerHTML = `
      <div class="course-page lesson-page">
        <nav class="breadcrumbs" aria-label="Навігація">
          <a class="breadcrumb-link" href="${base}index.html">Головна</a>
          <span class="breadcrumb-sep"><span class="material-symbols-rounded m3-icon-16">chevron_right</span></span>
          <a class="breadcrumb-link" href="${base}materials/index.html">Матеріали</a>
          <span class="breadcrumb-sep"><span class="material-symbols-rounded m3-icon-16">chevron_right</span></span>
          <a class="breadcrumb-link" href="index.html">${esc(course.title)}</a>
          <span class="breadcrumb-sep"><span class="material-symbols-rounded m3-icon-16">chevron_right</span></span>
          <span class="breadcrumb-current">Урок ${esc(lesson.n)}</span>
        </nav>

        <!-- Саме div, а не <header>: у styles.css є глобальне правило для
             елемента header (плаваюча скляна пігулка сайту), і будь-який
             <header> усередині сторінки перетворюється на неї. -->
        <div class="lesson-hero">
          <div class="lesson-hero-top">
            <span class="lesson-hero-step">Урок ${esc(lesson.n)} з ${nav.total}</span>
            <span class="lesson-diff ${diff.cls}">${diff.label}</span>
          </div>
          <h1>${esc(lesson.title)}</h1>
          ${lesson.subtitle ? `<p class="lesson-hero-sub">${esc(lesson.subtitle)}</p>` : ''}
          <div class="lesson-hero-progress">
            <div class="cp-track"><div class="cp-fill" style="width:${stats.percent}%"></div></div>
            <span>${stats.done} / ${stats.total} опрацьовано</span>
            <a class="lesson-hero-all" href="index.html">
              <span class="material-symbols-rounded m3-icon-18">list_alt</span>
              Усі уроки
            </a>
          </div>
        </div>

        <article class="lesson lesson--single">
          <div class="lesson-body">
            ${CourseRender.figures(lesson)}
            ${CourseRender.blocks(lesson.blocks)}
            ${CourseRender.sources(lesson)}
            <label class="lesson-check">
              <input type="checkbox" id="lessonDone" ${done ? 'checked' : ''}>
              <span>${esc(lesson.checkpoint || 'Я опрацював цей урок')}</span>
            </label>
          </div>
        </article>

        <nav class="lesson-nav" aria-label="Навігація між уроками">
          ${prevLink}
          <a class="lesson-nav-all" href="index.html">
            <span class="material-symbols-rounded m3-icon-18">grid_view</span>
            Усі уроки
          </a>
          ${nextLink}
        </nav>

        ${CourseRender.credit(course)}
      </div>

      <div id="cta-banner"></div>`;

    const box = document.getElementById('lessonDone');
    box.addEventListener('change', () => {
      CourseLibrary.setLessonDone(id, lesson.n, box.checked);
      const fresh = CourseLibrary.progressStats(id, nav.total);
      const fill = document.querySelector('.lesson-hero-progress .cp-fill');
      const label = document.querySelector('.lesson-hero-progress span');
      if (fill) fill.style.width = `${fresh.percent}%`;
      if (label) label.textContent = `${fresh.done} / ${fresh.total} опрацьовано`;
      document.querySelector('.lesson--single').classList.toggle('is-done', box.checked);
    });

    if (done) document.querySelector('.lesson--single').classList.add('is-done');

    if (typeof renderCtaBanner === 'function') renderCtaBanner();
    if (typeof window.markDecorativeIcons === 'function') window.markDecorativeIcons();

    document.title = `Урок ${lesson.n}: ${lesson.title} — ${course.title}`;
    const description = document.querySelector('meta[name="description"]');
    if (description && lesson.subtitle) description.setAttribute('content', lesson.subtitle);
  }

  function start() {
    const requested = lessonNumber();

    CourseLibrary.load(id)
      .then((course) => {
        // Без номера уроку показуємо перший — посилання на lesson.html
        // без параметра має вести кудись осмислено, а не в помилку.
        const lesson = requested
          ? CourseLibrary.lesson(course, requested)
          : (course.lessons || [])[0];

        if (!lesson) {
          document.title = 'Урок не знайдено';
          fail('Урок не знайдено', 'index.html', 'До огляду курсу');
          return;
        }

        render(course, lesson);
      })
      .catch((error) => {
        fail(error.message, 'index.html', 'До огляду курсу');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
