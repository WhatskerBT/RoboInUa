/**
 * Сторінка класу: учні, прогрес по курсах, індивідуальна матриця та журнал.
 * Рендериться у #tc-root на teacher/class.html.
 */

(function () {
  'use strict';

  const root = document.getElementById('tc-root');
  if (!root) return;

  const classId = TC.param('id');

  const state = {
    teacher: null,
    klass: null,
    students: [],
    classProgress: [],
    studentProgress: [],
    log: [],
    matrixCourse: null,
  };

  /* ───────────────────────── завантаження даних ───────────────────────── */

  function reload() {
    return Promise.all([
      RoboStore.getClass(classId),
      RoboStore.listStudents(classId),
      RoboStore.listClassProgress(classId),
      RoboStore.listStudentProgress(classId),
      RoboStore.listLessonLog(classId),
    ]).then(([klass, students, classProgress, studentProgress, log]) => {
      state.klass = klass;
      state.students = students;
      state.classProgress = classProgress;
      state.studentProgress = studentProgress;
      state.log = log;
      if (!state.matrixCourse) {
        const first = TC.courses()[0];
        state.matrixCourse = first ? first.id : null;
      }
      render();
    });
  }

  /* ───────────────────────────── розмітка ───────────────────────────── */

  function studentsPanel() {
    const list = state.students.map((student) => `
      <div class="tc-student" data-student="${TC.esc(student.id)}">
        <span class="tc-student-avatar">${TC.esc(TC.initials(student.name))}</span>
        <span class="tc-student-name">${TC.esc(student.name)}</span>
        <button type="button" class="tc-icon-btn" data-action="rename-student" title="Перейменувати" aria-label="Перейменувати ${TC.esc(student.name)}">
          <span class="material-symbols-rounded">edit</span>
        </button>
        <button type="button" class="tc-icon-btn" data-action="remove-student" title="Видалити" aria-label="Видалити ${TC.esc(student.name)}">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </div>
    `).join('');

    return `
      <section class="tc-panel">
        <h2>Учні · ${state.students.length}</h2>
        <div class="tc-student-list">
          ${list || '<p class="tc-hint">Список порожній. Додайте учнів — тоді можна буде відмічати індивідуальний прогрес.</p>'}
        </div>

        <form id="tc-add-student">
          <label class="tc-field">
            <span>Додати учня</span>
            <input type="text" name="name" placeholder="Прізвище та ім'я" autocomplete="off">
          </label>
          <button type="submit" class="tc-btn">
            <span class="material-symbols-rounded m3-icon-18">person_add</span>
            Додати
          </button>
        </form>

        <details style="margin-top:16px">
          <summary class="tc-hint" style="cursor:pointer">Додати список одразу</summary>
          <form id="tc-add-many" style="margin-top:12px">
            <label class="tc-field">
              <span>По одному прізвищу в рядку</span>
              <textarea name="names" placeholder="Іваненко Олег&#10;Петренко Марія&#10;Коваль Андрій"></textarea>
            </label>
            <button type="submit" class="tc-btn">
              <span class="material-symbols-rounded m3-icon-18">group_add</span>
              Додати всіх
            </button>
          </form>
        </details>
      </section>
    `;
  }

  function coursesSection() {
    return TC.courses().map((course) => {
      const lessons = course.lessons || [];
      const stats = TC.courseStats(state.classProgress, course.id, lessons.length);

      const tiles = lessons.map((lesson) => {
        const status = TC.statusOf(state.classProgress, course.id, lesson.n);
        const cls = status === 'done' ? 'is-done' : status === 'active' ? 'is-active' : '';
        const href = `lesson.html?class=${encodeURIComponent(classId)}&course=${encodeURIComponent(course.id)}&lesson=${encodeURIComponent(lesson.n)}`;

        return `
          <div class="tc-lesson ${cls}">
            <a class="tc-lesson-link" href="${href}" title="Відкрити режим уроку">
              <span class="tc-lesson-num">${TC.esc(lesson.n)}</span>
              <span class="tc-lesson-title">${TC.esc(lesson.title)}</span>
            </a>
            <button type="button" class="tc-lesson-state" data-action="cycle"
              data-course="${TC.esc(course.id)}" data-lesson="${TC.esc(lesson.n)}"
              title="${TC.STATUS_LABEL[status]} — натисніть, щоб змінити"
              aria-label="Статус уроку ${TC.esc(lesson.n)}: ${TC.STATUS_LABEL[status]}">
              <span class="material-symbols-rounded ${status === 'done' ? 'icon-filled' : ''}">${TC.STATUS_ICON[status]}</span>
            </button>
          </div>
        `;
      }).join('');

      return `
        <section class="tc-course">
          <div class="tc-course-head">
            <div class="tc-course-icon"><span class="material-symbols-rounded icon-filled">${TC.esc(course.icon || 'menu_book')}</span></div>
            <h3>${TC.esc(course.title)}</h3>
            <div class="tc-progress-row">
              <div class="tc-track"><div class="tc-fill" style="width:${stats.percent}%"></div></div>
              <span>${stats.done}/${stats.total}</span>
            </div>
          </div>
          <div class="tc-lessons">${tiles}</div>
        </section>
      `;
    }).join('');
  }

  function matrixSection() {
    const course = TC.course(state.matrixCourse);
    if (!course) return '';

    const lessons = course.lessons || [];
    const options = TC.courses()
      .map((item) => `<option value="${TC.esc(item.id)}" ${item.id === state.matrixCourse ? 'selected' : ''}>${TC.esc(item.title)}</option>`)
      .join('');

    if (!state.students.length) {
      return `
        <section class="tc-panel" style="margin-top:20px">
          <h2>Індивідуальний прогрес</h2>
          <p class="tc-hint">Додайте учнів ліворуч — і тут з'явиться таблиця, у якій можна відмічати, хто саме опрацював кожен урок.</p>
        </section>
      `;
    }

    const head = lessons.map((lesson) => `<th title="${TC.esc(lesson.title)}">${TC.esc(lesson.n)}</th>`).join('');

    const rows = state.students.map((student) => {
      const cells = lessons.map((lesson) => {
        const done = state.studentProgress.some(
          (row) => row.studentId === student.id && row.courseId === course.id && row.lesson === lesson.n
        );
        return `
          <td>
            <button type="button" class="tc-check ${done ? 'is-on' : ''}" data-action="toggle-student"
              data-student="${TC.esc(student.id)}" data-lesson="${TC.esc(lesson.n)}"
              aria-pressed="${done ? 'true' : 'false'}"
              aria-label="${TC.esc(student.name)}, урок ${TC.esc(lesson.n)}">
              <span class="material-symbols-rounded">check</span>
            </button>
          </td>
        `;
      }).join('');

      return `<tr><td class="tc-matrix-name">${TC.esc(student.name)}</td>${cells}</tr>`;
    }).join('');

    return `
      <section class="tc-panel" style="margin-top:20px">
        <div class="tc-course-head" style="margin-bottom:14px">
          <h2 style="margin:0">Індивідуальний прогрес</h2>
          <label class="tc-field" style="margin:0 0 0 auto;min-width:220px">
            <select id="tc-matrix-course" aria-label="Курс для таблиці">${options}</select>
          </label>
        </div>
        <div class="tc-matrix-wrap">
          <table class="tc-matrix">
            <thead><tr><th class="tc-matrix-name">Учень</th>${head}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <p class="tc-hint">Натисніть клітинку, щоб позначити, що учень опрацював урок. Дані зберігаються одразу.</p>
      </section>
    `;
  }

  function logSection() {
    if (!state.log.length) return '';

    const items = state.log.slice(0, 12).map((entry) => {
      const course = TC.course(entry.courseId);
      const present = Array.isArray(entry.present) ? entry.present.length : 0;
      return `
        <div class="tc-log-item">
          <span class="material-symbols-rounded" aria-hidden="true">history</span>
          <span style="flex:1">
            ${TC.esc(course ? course.title : entry.courseId)} · урок ${TC.esc(entry.lesson)}
            ${present ? ` · відмічено ${present}` : ''}
          </span>
          <span class="tc-log-date">${TC.esc(TC.fmtDateTime(entry.startedAt))}</span>
        </div>
      `;
    }).join('');

    return `
      <section class="tc-panel" style="margin-top:20px">
        <h2>Журнал проведених уроків</h2>
        <div class="tc-log">${items}</div>
      </section>
    `;
  }

  function render() {
    if (!state.klass) {
      root.innerHTML = `
        <div class="tc-empty">
          <span class="material-symbols-rounded" aria-hidden="true">search_off</span>
          <h3>Клас не знайдено</h3>
          <p>Можливо, його видалено або посилання відкрито на іншому пристрої.</p>
          <a class="btn btn-primary" href="index.html">
            <span class="material-symbols-rounded m3-icon-20">arrow_back</span>
            До кабінету
          </a>
        </div>`;
      return;
    }

    document.title = `${state.klass.name} — Кабінет вчителя — Федерація робототехніки Прилуччини`;

    root.innerHTML = `
      <div class="tc-bar">
        <div class="tc-bar-avatar"><span class="material-symbols-rounded icon-filled">groups</span></div>
        <div class="tc-bar-id">
          <h1>${TC.esc(state.klass.name)}</h1>
          <p>${state.klass.grade ? TC.esc(state.klass.grade) + ' · ' : ''}${TC.students(state.students.length)}${state.klass.note ? ' · ' + TC.esc(state.klass.note) : ''}</p>
        </div>
        <div class="tc-bar-actions">
          <a class="tc-btn tc-btn--quiet" href="index.html">
            <span class="material-symbols-rounded m3-icon-18">arrow_back</span>
            До кабінету
          </a>
          <button type="button" class="tc-btn" data-action="rename-class">
            <span class="material-symbols-rounded m3-icon-18">edit</span>
            Перейменувати
          </button>
          <button type="button" class="tc-btn" data-action="archive-class">
            <span class="material-symbols-rounded m3-icon-18">${state.klass.archivedAt ? 'unarchive' : 'archive'}</span>
            ${state.klass.archivedAt ? 'Повернути з архіву' : 'В архів'}
          </button>
          <button type="button" class="tc-btn tc-btn--danger" data-action="delete-class">
            <span class="material-symbols-rounded m3-icon-18">delete</span>
            Видалити
          </button>
        </div>
      </div>

      <div class="tc-msg" id="tc-class-msg" role="status" aria-live="polite"></div>

      <div class="tc-split">
        ${studentsPanel()}
        <div>
          <div class="tc-section-head" style="margin-top:0">
            <h2>Курси та уроки</h2>
          </div>
          <p class="tc-hint" style="margin:-8px 0 16px">
            Натисніть назву уроку, щоб відкрити його на екран класу. Кружечок праворуч перемикає статус: заплановано → триває → пройдено.
          </p>
          ${coursesSection()}
          ${matrixSection()}
          ${logSection()}
        </div>
      </div>
    `;

    wire();
    if (typeof window.markDecorativeIcons === 'function') window.markDecorativeIcons(root);
  }

  /* ────────────────────────────── події ────────────────────────────── */

  function wire() {
    const msg = document.getElementById('tc-class-msg');

    const addOne = document.getElementById('tc-add-student');
    if (addOne) {
      addOne.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = event.target.elements.name;
        const name = input.value.trim();
        if (!name) return;
        RoboStore.addStudent(classId, name)
          .then(() => { input.value = ''; return reload(); })
          .catch((error) => TC.message(msg, 'error', error.message));
      });
    }

    const addMany = document.getElementById('tc-add-many');
    if (addMany) {
      addMany.addEventListener('submit', (event) => {
        event.preventDefault();
        const field = event.target.elements.names;
        const names = field.value.split('\n').map((line) => line.trim()).filter(Boolean);
        if (!names.length) return;
        RoboStore.addStudents(classId, names)
          .then((created) => {
            field.value = '';
            TC.message(msg, 'ok', `Додано учнів: ${created.length}.`);
            return reload();
          })
          .catch((error) => TC.message(msg, 'error', error.message));
      });
    }

    const selector = document.getElementById('tc-matrix-course');
    if (selector) {
      selector.addEventListener('change', () => {
        state.matrixCourse = selector.value;
        render();
      });
    }
  }

  function onClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const msg = document.getElementById('tc-class-msg');
    const action = button.dataset.action;

    if (action === 'cycle') {
      const courseId = button.dataset.course;
      const lesson = button.dataset.lesson;
      const next = TC.nextStatus(TC.statusOf(state.classProgress, courseId, lesson));
      RoboStore.setClassLesson(classId, courseId, lesson, next)
        .then(reload)
        .catch((error) => TC.message(msg, 'error', error.message));
      return;
    }

    if (action === 'toggle-student') {
      const studentId = button.dataset.student;
      const lesson = button.dataset.lesson;
      const on = button.classList.contains('is-on');
      // Малюємо новий стан одразу: у класі клацань багато, і чекати на
      // перемальовування всієї таблиці після кожного — надто повільно.
      button.classList.toggle('is-on', !on);
      button.setAttribute('aria-pressed', String(!on));
      RoboStore.setStudentLesson(studentId, state.matrixCourse, lesson, !on)
        .then(() => RoboStore.listStudentProgress(classId))
        .then((rows) => { state.studentProgress = rows; })
        .catch((error) => {
          button.classList.toggle('is-on', on);
          button.setAttribute('aria-pressed', String(on));
          TC.message(msg, 'error', error.message);
        });
      return;
    }

    if (action === 'rename-student') {
      const row = button.closest('[data-student]');
      const student = state.students.find((s) => s.id === row.dataset.student);
      const name = window.prompt('Нове ім\'я учня:', student ? student.name : '');
      if (name === null) return;
      if (!name.trim()) return;
      RoboStore.renameStudent(row.dataset.student, name)
        .then(reload)
        .catch((error) => TC.message(msg, 'error', error.message));
      return;
    }

    if (action === 'remove-student') {
      const row = button.closest('[data-student]');
      const student = state.students.find((s) => s.id === row.dataset.student);
      // Без «його/її»: у списку є і хлопці, і дівчата, а імені для узгодження мало.
    if (!TC.confirmDialog(`Видалити ${student ? student.name : 'учня'} зі списку? Відмітки про пройдені уроки також зникнуть.`)) return;
      RoboStore.removeStudent(row.dataset.student)
        .then(reload)
        .catch((error) => TC.message(msg, 'error', error.message));
      return;
    }

    if (action === 'rename-class') {
      const name = window.prompt('Нова назва класу:', state.klass.name);
      if (name === null || !name.trim()) return;
      RoboStore.updateClass(classId, { name })
        .then(reload)
        .catch((error) => TC.message(msg, 'error', error.message));
      return;
    }

    if (action === 'archive-class') {
      RoboStore.updateClass(classId, { archived: !state.klass.archivedAt })
        .then(reload)
        .catch((error) => TC.message(msg, 'error', error.message));
      return;
    }

    if (action === 'delete-class') {
      if (!TC.confirmDialog(`Видалити клас «${state.klass.name}» разом з усіма учнями та відмітками? Дію не можна скасувати.`)) return;
      RoboStore.deleteClass(classId).then(() => {
        window.location.href = 'index.html';
      });
    }
  }

  /* ──────────────────────────────  СТАРТ  ────────────────────────────── */

  // Делегування вішається один раз: render() підміняє лише вміст root,
  // тож повторна підписка на кожному перемальовуванні дублювала б обробники.
  root.addEventListener('click', onClick);

  TC.requireTeacher().then((teacher) => {
    if (!teacher) return;
    state.teacher = teacher;
    if (!classId) {
      window.location.replace('index.html');
      return;
    }
    reload();
  });
})();
