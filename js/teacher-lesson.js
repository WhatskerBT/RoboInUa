/**
 * Режим уроку — те, що вчитель вмикає класу на екран або проєктор.
 *
 * Урок із courses-data.js розбивається на слайди по заголовках (тип 'h'):
 * заголовок починає новий слайд, наступні блоки належать йому. Так конспект
 * сам собою перетворюється на послідовність кроків уроку, і нічого не треба
 * розмічати вручну.
 *
 * Ліворуч — сцена для класу, праворуч — панель учителя, де відмічається,
 * хто опрацював урок. Панель ховається клавішею P, коли екран дублюється
 * на проєктор.
 */

(function () {
  'use strict';

  const root = document.getElementById('lesson-root');
  if (!root) return;

  const classId = TC.param('class');
  const courseId = TC.param('course');
  const lessonN = TC.param('lesson');

  const state = {
    klass: null,
    course: null,
    lesson: null,
    students: [],
    studentProgress: [],
    classStatus: 'planned',
    slides: [],
    index: 0,
    logId: null,
    panelHidden: false,
  };

  /* ────────────────────── текст і блоки уроку ────────────────────── */

  function rich(value) {
    return TC.esc(value)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  const NOTE_ICON = { tip: 'lightbulb', warn: 'warning', info: 'info' };

  function renderBlock(block) {
    if (!block || !block.type) return '';

    switch (block.type) {
      case 'p':
        return `<p>${rich(block.text)}</p>`;
      case 'h':
        return `<h2>${TC.esc(block.text)}</h2>`;
      case 'list': {
        const tag = block.ordered ? 'ol' : 'ul';
        const items = (block.items || []).map((item) => `<li>${rich(item)}</li>`).join('');
        return `<${tag}>${items}</${tag}>`;
      }
      case 'code':
        return `<pre><code>${TC.esc(block.code)}</code></pre>`;
      case 'note': {
        const variant = NOTE_ICON[block.variant] ? block.variant : 'info';
        return `
          <div class="lm-note lm-note--${variant}">
            <span class="material-symbols-rounded icon-filled" aria-hidden="true">${NOTE_ICON[variant]}</span>
            <span>${rich(block.text)}</span>
          </div>`;
      }
      default:
        return '';
    }
  }

  /* Заголовок відкриває слайд; усе до першого заголовка лишається на
     титульному, разом із назвою уроку. */
  function buildSlides(lesson) {
    const slides = [];
    const intro = [];
    const blocks = lesson.blocks || [];
    let current = null;

    blocks.forEach((block) => {
      if (block.type === 'h') {
        if (current) slides.push(current);
        current = { title: block.text, blocks: [] };
        return;
      }
      if (current) current.blocks.push(block);
      else intro.push(block);
    });
    if (current) slides.push(current);

    const titleSlide = { kind: 'title', title: lesson.title, blocks: intro };
    const imageSlides = (lesson.images || []).map((image) => ({ kind: 'image', image }));
    const finalSlide = { kind: 'checkpoint', title: 'Підсумок уроку', text: lesson.checkpoint };

    return [titleSlide].concat(imageSlides, slides, [finalSlide]);
  }

  function slideHtml(slide) {
    if (slide.kind === 'title') {
      return `
        <h1>${TC.esc(slide.title)}</h1>
        ${state.lesson.subtitle ? `<p style="opacity:.75">${TC.esc(state.lesson.subtitle)}</p>` : ''}
        ${slide.blocks.map(renderBlock).join('')}
      `;
    }

    if (slide.kind === 'image') {
      return `
        <figure>
          <img src="${TC.courseAsset(state.course.id, slide.image.src)}" alt="${TC.esc(slide.image.caption || state.lesson.title)}" decoding="async">
          ${slide.image.caption ? `<figcaption>${TC.esc(slide.image.caption)}</figcaption>` : ''}
        </figure>
      `;
    }

    if (slide.kind === 'checkpoint') {
      return `
        <h2>${TC.esc(slide.title)}</h2>
        <div class="lm-note lm-note--tip">
          <span class="material-symbols-rounded icon-filled" aria-hidden="true">check_circle</span>
          <span>${TC.esc(slide.text || 'Урок опрацьовано.')}</span>
        </div>
      `;
    }

    return `
      <h2>${TC.esc(slide.title)}</h2>
      ${slide.blocks.map(renderBlock).join('')}
    `;
  }

  /* ─────────────────────────── панель учителя ─────────────────────────── */

  function rosterHtml() {
    if (!state.students.length) {
      return `<p class="lm-panel-sub">У класі ще немає учнів. Додайте їх на сторінці класу — тоді тут можна буде відмічати, хто опрацював урок.</p>`;
    }

    return state.students.map((student) => {
      const done = state.studentProgress.some(
        (row) => row.studentId === student.id && row.courseId === courseId && row.lesson === lessonN
      );
      return `
        <button type="button" class="lm-student ${done ? 'is-done' : ''}" data-student="${TC.esc(student.id)}" aria-pressed="${done ? 'true' : 'false'}">
          <span class="lm-student-box"><span class="material-symbols-rounded" aria-hidden="true">check</span></span>
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${TC.esc(student.name)}</span>
        </button>
      `;
    }).join('');
  }

  function panelHtml() {
    const doneCount = state.studentProgress.filter(
      (row) => row.courseId === courseId && row.lesson === lessonN
    ).length;

    return `
      <aside class="lm-panel">
        <h2>${TC.esc(state.klass.name)}</h2>
        <p class="lm-panel-sub">Урок ${TC.esc(state.lesson.n)} · ${TC.esc(state.course.title)} · статус: ${TC.STATUS_LABEL[state.classStatus]}</p>

        <div>
          <div class="tc-progress-row" style="margin-bottom:10px">
            <div class="tc-track"><div class="tc-fill" style="width:${state.students.length ? Math.round((doneCount / state.students.length) * 100) : 0}%"></div></div>
            <span>${doneCount}/${state.students.length}</span>
          </div>
          <div class="lm-roster" id="lm-roster">${rosterHtml()}</div>
        </div>

        <div class="lm-panel-foot">
          ${state.students.length ? `
          <button type="button" class="tc-btn" data-action="mark-all">
            <span class="material-symbols-rounded m3-icon-18">done_all</span>
            Відмітити всіх
          </button>` : ''}
          ${state.logId
            ? `<button type="button" class="tc-btn" data-action="finish">
                 <span class="material-symbols-rounded m3-icon-18">check_circle</span>
                 Завершити урок
               </button>`
            : `<button type="button" class="btn btn-primary" data-action="start" style="justify-content:center">
                 <span class="material-symbols-rounded m3-icon-20">play_arrow</span>
                 Почати урок
               </button>`}
          <a class="tc-btn tc-btn--quiet" href="class.html?id=${encodeURIComponent(classId)}">
            <span class="material-symbols-rounded m3-icon-18">arrow_back</span>
            До класу
          </a>
        </div>
      </aside>
    `;
  }

  /* ───────────────────────────── рендер ───────────────────────────── */

  function render() {
    const slide = state.slides[state.index];
    const dots = state.slides.map((_, i) => `
      <button type="button" class="lm-dot ${i === state.index ? 'is-active' : i < state.index ? 'is-seen' : ''}"
        data-slide="${i}" aria-label="Крок ${i + 1}"></button>
    `).join('');

    const diff = { easy: 'Легко', med: 'Середнє', hard: 'Важко' }[state.lesson.difficulty] || '';

    root.className = `lesson-mode ${state.panelHidden ? 'is-panel-hidden' : ''}`;
    root.innerHTML = `
      <div class="lm-stage">
        <div class="lm-top">
          <span class="lm-chip"><span class="material-symbols-rounded" aria-hidden="true">menu_book</span>${TC.esc(state.course.title)}</span>
          <span class="lm-chip"><span class="material-symbols-rounded" aria-hidden="true">label</span>Урок ${TC.esc(state.lesson.n)}</span>
          ${diff ? `<span class="lm-chip">${TC.esc(diff)}</span>` : ''}
          <div class="lm-top-actions">
            <button type="button" class="tc-btn tc-btn--quiet" data-action="fullscreen" title="Повний екран (F)">
              <span class="material-symbols-rounded m3-icon-18">fullscreen</span>
            </button>
            <button type="button" class="tc-btn tc-btn--quiet" data-action="toggle-panel" title="Сховати панель (P)">
              <span class="material-symbols-rounded m3-icon-18">visibility_off</span>
            </button>
          </div>
        </div>

        <div class="lm-slide">${slideHtml(slide)}</div>

        <div class="lm-nav">
          <button type="button" class="tc-btn" data-action="prev" ${state.index === 0 ? 'disabled' : ''}>
            <span class="material-symbols-rounded m3-icon-18">arrow_back</span>
            Назад
          </button>
          <div class="lm-dots">${dots}</div>
          <span class="lm-counter">${state.index + 1} / ${state.slides.length}</span>
          <button type="button" class="tc-btn" data-action="next" ${state.index === state.slides.length - 1 ? 'disabled' : ''}>
            Далі
            <span class="material-symbols-rounded m3-icon-18">arrow_forward</span>
          </button>
        </div>
      </div>

      ${panelHtml()}

      <button type="button" class="tc-btn lm-panel-show" data-action="toggle-panel">
        <span class="material-symbols-rounded m3-icon-18">visibility</span>
        Панель
      </button>
    `;

    if (typeof window.markDecorativeIcons === 'function') window.markDecorativeIcons(root);
  }

  /* ─────────────────────────── навігація ─────────────────────────── */

  /* Номер кроку живе в адресі: випадкове перезавантаження під час уроку
     не скидає показ на початок, а посилання можна лишити собі на потім. */
  function go(index) {
    state.index = Math.max(0, Math.min(state.slides.length - 1, index));
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (window.history && typeof history.replaceState === 'function') {
      history.replaceState(null, '', `#slide=${state.index}`);
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      const request = document.documentElement.requestFullscreen;
      if (request) request.call(document.documentElement).catch(() => { /* браузер відмовив */ });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  /* ─────────────────────────── дії з даними ─────────────────────────── */

  function refreshProgress() {
    return RoboStore.listStudentProgress(classId).then((rows) => {
      state.studentProgress = rows;
      render();
    });
  }

  function toggleStudent(studentId) {
    const done = state.studentProgress.some(
      (row) => row.studentId === studentId && row.courseId === courseId && row.lesson === lessonN
    );
    return RoboStore.setStudentLesson(studentId, courseId, lessonN, !done).then(refreshProgress);
  }

  function markAll() {
    const pending = state.students.filter((student) => !state.studentProgress.some(
      (row) => row.studentId === student.id && row.courseId === courseId && row.lesson === lessonN
    ));
    // Якщо всі вже відмічені — знімаємо відмітки, кнопка працює як перемикач.
    const targets = pending.length ? pending : state.students;
    const value = pending.length > 0;
    return Promise.all(targets.map((student) =>
      RoboStore.setStudentLesson(student.id, courseId, lessonN, value)
    )).then(refreshProgress);
  }

  function startLesson() {
    return RoboStore.startLesson(classId, courseId, lessonN)
      .then((log) => {
        state.logId = log.id;
        if (state.classStatus !== 'done') {
          return RoboStore.setClassLesson(classId, courseId, lessonN, 'active').then(() => {
            state.classStatus = 'active';
          });
        }
        return null;
      })
      .then(render);
  }

  function finishLesson() {
    const present = state.studentProgress
      .filter((row) => row.courseId === courseId && row.lesson === lessonN)
      .map((row) => row.studentId);

    return RoboStore.finishLesson(state.logId, present)
      .then(() => RoboStore.setClassLesson(classId, courseId, lessonN, 'done'))
      .then(() => {
        state.classStatus = 'done';
        state.logId = null;
        render();
      });
  }

  /* ────────────────────────────── події ────────────────────────────── */

  root.addEventListener('click', (event) => {
    const student = event.target.closest('[data-student]');
    if (student) {
      toggleStudent(student.dataset.student);
      return;
    }

    const dot = event.target.closest('[data-slide]');
    if (dot) {
      go(parseInt(dot.dataset.slide, 10));
      return;
    }

    const button = event.target.closest('[data-action]');
    if (!button) return;

    switch (button.dataset.action) {
      case 'prev': go(state.index - 1); break;
      case 'next': go(state.index + 1); break;
      case 'fullscreen': toggleFullscreen(); break;
      case 'toggle-panel':
        state.panelHidden = !state.panelHidden;
        render();
        break;
      case 'mark-all': markAll(); break;
      case 'start': startLesson(); break;
      case 'finish': finishLesson(); break;
      default: break;
    }
  });

  document.addEventListener('keydown', (event) => {
    // Не перехоплюємо клавіші, коли вчитель друкує в полі.
    const tag = (event.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || event.target.isContentEditable) return;

    if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault();
      go(state.index + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      event.preventDefault();
      go(state.index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      go(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      go(state.slides.length - 1);
    } else if (event.key === 'f' || event.key === 'F' || event.key === 'а' || event.key === 'А') {
      toggleFullscreen();
    } else if (event.key === 'p' || event.key === 'P' || event.key === 'з' || event.key === 'З') {
      state.panelHidden = !state.panelHidden;
      render();
    }
  });

  /* ──────────────────────────────  СТАРТ  ────────────────────────────── */

  function fail(text) {
    root.className = 'lesson-mode is-panel-hidden';
    root.innerHTML = `
      <div class="lm-stage">
        <div class="tc-empty" style="margin:auto;max-width:520px">
          <span class="material-symbols-rounded" aria-hidden="true">search_off</span>
          <h3>${TC.esc(text)}</h3>
          <a class="btn btn-primary" href="index.html">
            <span class="material-symbols-rounded m3-icon-20">arrow_back</span>
            До кабінету
          </a>
        </div>
      </div>`;
  }

  TC.requireTeacher().then((teacher) => {
    if (!teacher) return null;
    if (!TC.course(courseId)) return fail('Курс не знайдено');

    // Тексти уроків лежать в окремому файлі курсу — тягнемо саме той,
    // який зараз показуємо класу, а не всю бібліотеку.
    return CourseLibrary.load(courseId).then((course) => {
      state.course = course;
      state.lesson = (course.lessons || []).find((item) => String(item.n) === String(lessonN));
      if (!state.lesson) return fail('Урок не знайдено');
      return loadClassData();
    }).catch((error) => fail(error.message));
  });

  function loadClassData() {
    return Promise.all([
      RoboStore.getClass(classId),
      RoboStore.listStudents(classId),
      RoboStore.listStudentProgress(classId),
      RoboStore.listClassProgress(classId),
    ]).then(([klass, students, studentProgress, classProgress]) => {
      if (!klass) return fail('Клас не знайдено');

      state.klass = klass;
      state.students = students;
      state.studentProgress = studentProgress;
      state.classStatus = TC.statusOf(classProgress, courseId, lessonN);
      state.slides = buildSlides(state.lesson);

      const startAt = parseInt(TC.param('slide'), 10);
      if (!Number.isNaN(startAt)) {
        state.index = Math.max(0, Math.min(state.slides.length - 1, startAt));
      }

      document.title = `Урок ${state.lesson.n}: ${state.lesson.title} — ${klass.name}`;
      render();
      return null;
    });
  }
})();
