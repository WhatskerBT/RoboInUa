/**
 * Каталог курсів на сторінці «Матеріали».
 *
 * Будується з js/courses-index.js — тексти уроків тут не потрібні.
 * Додали курс у js/courses/ і перезібрали індекс
 * (tools\build-course-index.ps1) — картка з'явиться сама.
 *
 * ПРОДУКТИВНІСТЬ. Розмітка будується РІВНО ОДИН РАЗ. Пошук і чипи лише
 * ховають/показують уже наявні картки. Раніше кожне натискання клавіші
 * перебудовувало весь innerHTML: браузер викидав і заново створював десяток
 * <img>, зі скролу знову запускалась анімація появи, а initScrollReveal()
 * щоразу створював НОВИЙ IntersectionObserver (старі ніхто не відключав).
 * Через це сторінка підвисала просто від набирання запиту.
 */

(function () {
  'use strict';

  const root = document.getElementById('courses');
  if (!root || typeof CourseLibrary === 'undefined') return;

  const LEVEL = {
    easy: 'Початковий',
    med: 'Середній',
    hard: 'Просунутий',
  };

  const courses = CourseLibrary.index();
  const state = { topic: 'all', query: '' };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Рівень визначаємо за ПЕРШИМ уроком: людині, яка обирає курс, важливо
     знати, з чого доведеться починати, а не наскільки складно буде в кінці. */
  function entryLevel(course) {
    const first = (course.lessons || [])[0];
    return LEVEL[first && first.difficulty] || LEVEL.med;
  }

  /* Прогрес читається з localStorage один раз на завантаження сторінки —
     не на кожен символ у пошуку. */
  const stats = {};
  courses.forEach((course) => {
    stats[course.id] = CourseLibrary.progressStats(course.id, (course.lessons || []).length);
  });

  /* Рядок для пошуку теж готуємо наперед, щоб фільтр був простим порівнянням. */
  const haystack = {};
  courses.forEach((course) => {
    haystack[course.id] = [course.title, course.subtitle, course.summary, course.topic, course.audience]
      .filter(Boolean).join(' ').toLowerCase();
  });

  function matches(course, query) {
    return !query || haystack[course.id].includes(query);
  }

  function fits(course, query) {
    const inTopic = state.topic === 'all' || course.topic === state.topic;
    return inTopic && matches(course, query);
  }

  /* ── «Продовжити навчання» ──
     Показуємо лише розпочаті курси й ведемо одразу на потрібний урок,
     а не на початок курсу. */
  function resumeStrip() {
    const started = courses
      .map((course) => ({ course, s: stats[course.id] }))
      .filter((item) => item.s.done > 0 && item.s.done < item.s.total);

    if (!started.length) return '';

    const cards = started.map(({ course, s }) => {
      const progress = CourseLibrary.readProgress(course.id);
      const next = (course.lessons || []).find((lesson) => !progress[lesson.n]);
      // Трапляється лише за дубльованих `n` в уроках курсу; тоді картки не буде,
      // і секцію теж не показуємо — інакше лишиться заголовок над порожньою рамкою.
      if (!next) return '';

      return `
        <a class="resume-card" href="${esc(course.id)}/lesson.html?n=${encodeURIComponent(next.n)}">
          <span class="resume-icon"><span class="material-symbols-rounded icon-filled">${esc(course.icon)}</span></span>
          <div class="resume-body">
            <strong>${esc(course.title)}</strong>
            <small>Урок ${esc(next.n)}: ${esc(next.title)}</small>
            <span class="resume-track"><span class="resume-fill" style="width:${s.percent}%"></span></span>
          </div>
          <span class="resume-go"><span class="material-symbols-rounded">play_arrow</span></span>
        </a>`;
    }).join('');

    if (!cards) return '';

    return `
      <section class="resume-strip" aria-label="Продовжити навчання">
        <h2><span class="material-symbols-rounded icon-filled m3-icon-20">history</span>Продовжити навчання</h2>
        <div class="resume-grid">${cards}</div>
      </section>`;
  }

  /* ── картка курсу ── */
  function card(course, position) {
    const total = (course.lessons || []).length;
    const s = stats[course.id];
    const finished = total > 0 && s.done === total;

    // Є обкладинка — показуємо фото; немає — кольорова панель з іконкою.
    // Обкладинки нарізані рівно під 640x360, тож браузер не масштабує
    // (і не тримає в пам'яті) зайві мегапікселі.
    // Перший ряд карток видно одразу — його не відкладаємо, решту лінуємо.
    const eager = position < 3;
    const media = course.cover
      ? `<img src="${esc(course.id)}/${esc(course.cover)}" alt=""
             loading="${eager ? 'eager' : 'lazy'}" ${eager ? 'fetchpriority="high"' : ''}
             decoding="async" width="640" height="360">`
      : `<span class="course-card-media-icon"><span class="material-symbols-rounded icon-filled">${esc(course.icon)}</span></span>`;

    return `
      <a class="course-card${finished ? ' is-finished' : ''}" href="${esc(course.id)}/index.html"
         role="listitem" data-course="${esc(course.id)}">
        <div class="course-card-media">
          ${media}
          <div class="course-card-chips">
            <span class="course-chip"><span class="material-symbols-rounded m3-icon-16">menu_book</span>${esc(course.badge)}</span>
            <span class="course-chip">${esc(entryLevel(course))}</span>
            ${course.prereq ? '<span class="course-chip course-chip--next"><span class="material-symbols-rounded m3-icon-16">trending_up</span>Продовження</span>' : ''}
          </div>
          ${finished ? '<span class="course-card-done"><span class="material-symbols-rounded icon-filled m3-icon-18">check_circle</span>Пройдено</span>' : ''}
        </div>

        <div class="course-card-body">
          <div class="course-card-head">
            <span class="course-card-icon"><span class="material-symbols-rounded icon-filled">${esc(course.icon)}</span></span>
            <h3>${esc(course.title)}</h3>
          </div>
          <p>${esc(course.subtitle || course.summary)}</p>

          ${s.done > 0 ? `
          <div class="course-card-progress">
            <span class="cp-track"><span class="cp-fill" style="width:${s.percent}%"></span></span>
            <span>${s.done} / ${s.total}</span>
          </div>` : ''}

          <span class="course-card-cta">
            ${s.done > 0 ? (finished ? 'Переглянути ще раз' : 'Продовжити') : 'Почати курс'}
            <span class="material-symbols-rounded">arrow_forward</span>
          </span>
        </div>
      </a>`;
  }

  /* ── панель фільтрів ── */
  const topicNames = [];
  courses.forEach((course) => {
    if (course.topic && !topicNames.includes(course.topic)) topicNames.push(course.topic);
  });

  function chip(id, label) {
    return `
      <button class="filter-btn ${id === 'all' ? 'active' : ''}" type="button"
        data-topic-filter="${esc(id)}" aria-pressed="${id === 'all' ? 'true' : 'false'}">
        <span class="filter-btn-check" aria-hidden="true">
          <span class="material-symbols-rounded m3-icon-18">check</span>
        </span>
        <span class="filter-btn-label">${esc(label)}</span>
        <span class="filter-btn-count"></span>
      </button>`;
  }

  /* ── одноразова побудова ── */
  root.innerHTML = `
    ${resumeStrip()}

    <div class="projects-toolbar" role="search">
      <label class="projects-search" for="course-search">
        <span class="projects-search-icon" aria-hidden="true">
          <span class="material-symbols-rounded m3-icon-24">search</span>
        </span>
        <input id="course-search" type="search" autocomplete="off"
          placeholder="Пошук за темою, назвою чи аудиторією…" aria-label="Пошук курсів">
        <button type="button" class="projects-search-clear" aria-label="Очистити пошук">
          <span class="material-symbols-rounded m3-icon-20">close</span>
        </button>
      </label>
      <div class="projects-results-count" aria-live="polite"></div>
    </div>

    <div class="filter-bar projects-chip-bar" role="group" aria-label="Теми курсів">
      ${chip('all', 'Усі')}
      ${topicNames.map((name) => chip(name, name[0].toUpperCase() + name.slice(1))).join('')}
    </div>

    <div class="course-catalog" role="list" aria-label="Курси">${courses.map(card).join('')}</div>

    <div class="projects-empty" role="status">
      <span class="material-symbols-rounded">search_off</span>
      <h3>Нічого не знайдено</h3>
      <p>Спробуйте змінити запит або обрати іншу тему.</p>
    </div>
  `;

  const input = root.querySelector('#course-search');
  const searchBox = root.querySelector('.projects-search');
  const countBox = root.querySelector('.projects-results-count');
  const grid = root.querySelector('.course-catalog');
  const empty = root.querySelector('.projects-empty');
  const chipButtons = Array.from(root.querySelectorAll('[data-topic-filter]'));

  // Картки в тому самому порядку, що й courses — далі працюємо з вузлами
  // напряму, без жодного querySelector на кожен символ запиту.
  // Зв'язок позиційний, тому страхуємось: якщо card() колись почне повертати
  // порожній рядок, масиви зсунуться і фільтр ховатиме не ті картки — мовчки.
  const cardNodes = courses.map((course) => grid.querySelector(`[data-course="${course.id}"]`));
  if (cardNodes.some((node) => !node)) {
    console.error('Каталог курсів: не для кожного курсу знайшлася картка.');
  }

  /* ── фільтрація: лише перемикання класів на вже наявних вузлах ── */
  function apply() {
    const query = state.query.trim().toLowerCase();
    let shown = 0;

    courses.forEach((course, i) => {
      const ok = fits(course, query);
      if (ok) shown++;
      if (cardNodes[i]) cardNodes[i].classList.toggle('is-hidden', !ok);
    });

    chipButtons.forEach((button) => {
      const id = button.dataset.topicFilter;
      const active = state.topic === id;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');

      const n = courses.filter((course) =>
        (id === 'all' || course.topic === id) && matches(course, query)).length;
      const slot = button.querySelector('.filter-btn-count');
      if (slot.textContent !== String(n)) slot.textContent = String(n);
    });

    grid.classList.toggle('is-hidden', shown === 0);
    empty.classList.toggle('is-visible', shown === 0);
    searchBox.classList.toggle('has-value', Boolean(state.query));

    countBox.innerHTML = (state.query || state.topic !== 'all')
      ? `Знайдено <strong>${shown}</strong> із ${courses.length}`
      : `Усього <strong>${courses.length}</strong> курсів`;
  }

  input.addEventListener('input', () => {
    state.query = input.value;
    apply();
  });

  // Escape очищає пошук — так само, як у каталозі проєктів.
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !state.query) return;
    event.preventDefault();
    state.query = '';
    input.value = '';
    apply();
  });

  root.querySelector('.projects-search-clear').addEventListener('click', () => {
    state.query = '';
    input.value = '';
    apply();
    input.focus();
  });

  chipButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.topic = button.dataset.topicFilter;
      apply();
    });
  });

  apply();
  if (typeof window.markDecorativeIcons === 'function') window.markDecorativeIcons(root);
})();
