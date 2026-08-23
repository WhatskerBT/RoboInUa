/**
 * Кабінет вчителя — вхід, реєстрація та список класів.
 * Рендериться у #tc-root на teacher/index.html.
 */

(function () {
  'use strict';

  const root = document.getElementById('tc-root');
  if (!root) return;

  /* ─────────────────────────── ЕКРАН ВХОДУ ─────────────────────────── */

  const BENEFITS = [
    {
      icon: 'groups',
      title: 'Класи та групи',
      text: 'Список учнів, який вводиться один раз і далі просто працює — у журналі, у прогресі й на уроці.',
    },
    {
      icon: 'trending_up',
      title: 'Прогрес по уроках',
      text: 'Видно, що клас уже пройшов, що триває зараз і хто саме з учнів опрацював кожне заняття.',
    },
    {
      icon: 'play_circle',
      title: 'Режим уроку',
      text: 'Конспект курсу розгортається покроковими слайдами — виводьте його на екран або проєктор просто на занятті.',
    },
  ];

  // Час показу форми: заповнення за пару секунд означає автозаповнювач.
  let formShownAt = Date.now();

  function benefitsHtml() {
    return BENEFITS.map((item) => `
      <div class="tc-benefit">
        <div class="tc-benefit-icon"><span class="material-symbols-rounded icon-filled">${item.icon}</span></div>
        <div>
          <h3>${TC.esc(item.title)}</h3>
          <p>${TC.esc(item.text)}</p>
        </div>
      </div>
    `).join('');
  }

  function renderAuth(preferTab) {
    const tab = preferTab === 'register' ? 'register' : 'login';
    formShownAt = Date.now();

    root.innerHTML = `
      <div class="tc-auth-split">
        <aside class="tc-auth-intro">
          <span class="section-label">Навіщо це</span>
          <h2>Ведіть заняття, а не таблиці</h2>
          <div class="tc-benefit-list">${benefitsHtml()}</div>
          <div class="tc-msg tc-msg--info is-visible">
            <span class="material-symbols-rounded" aria-hidden="true">cloud_off</span>
            <span>Акаунт зберігається у цьому браузері на цьому пристрої. Щоб перенести класи на інший комп'ютер, скористайтеся резервною копією в кабінеті.</span>
          </div>
        </aside>

        <div class="tc-auth">
          <div class="tc-tabs" role="tablist">
            <button type="button" class="tc-tab ${tab === 'login' ? 'is-active' : ''}" data-tab="login" role="tab">Увійти</button>
            <button type="button" class="tc-tab ${tab === 'register' ? 'is-active' : ''}" data-tab="register" role="tab">Створити акаунт</button>
          </div>

          <div class="tc-msg" id="tc-auth-msg" role="status" aria-live="polite"></div>

          <form class="tc-auth-form ${tab === 'login' ? 'is-active' : ''}" data-form="login" novalidate>
            <label class="tc-field">
              <span>Електронна пошта</span>
              <input type="email" name="email" autocomplete="username" required>
            </label>
            <label class="tc-field">
              <span>Пароль</span>
              <input type="password" name="password" autocomplete="current-password" required>
            </label>
            <button type="submit" class="btn btn-primary">
              <span class="material-symbols-rounded m3-icon-20">login</span>
              Увійти
            </button>
          </form>

          <form class="tc-auth-form ${tab === 'register' ? 'is-active' : ''}" data-form="register" novalidate>
            <label class="tc-field">
              <span>Ім'я та прізвище</span>
              <input type="text" name="name" autocomplete="name" required>
            </label>
            <label class="tc-field">
              <span>Школа або заклад <em>(необов'язково)</em></span>
              <input type="text" name="school" autocomplete="organization">
            </label>
            <label class="tc-field">
              <span>Електронна пошта</span>
              <input type="email" name="email" autocomplete="username" required>
            </label>
            <label class="tc-field">
              <span>Пароль <em>(мінімум 6 символів)</em></span>
              <input type="password" name="password" autocomplete="new-password" required>
              <span class="tc-strength" aria-hidden="true">
                <span class="tc-track"><span class="tc-fill" data-strength-fill style="width:0"></span></span>
                <span class="tc-strength-label" data-strength-label></span>
              </span>
            </label>

            <!-- Приманка для ботів: поле сховане від людей і зчитувачів екрана,
                 тож заповнити його може лише скрипт, що бачить лише HTML. -->
            <div class="tc-hp" aria-hidden="true">
              <label>Залиште це поле порожнім
                <input type="text" name="website" tabindex="-1" autocomplete="off">
              </label>
            </div>

            <label class="tc-field tc-challenge">
              <span>Контрольне питання</span>
              <div class="tc-challenge-row">
                <span class="tc-challenge-q" data-challenge-question>Готуємо питання…</span>
                <input type="text" inputmode="numeric" name="challengeAnswer" autocomplete="off"
                  aria-label="Відповідь на контрольне питання" required>
                <button type="button" class="tc-icon-btn tc-challenge-refresh" data-refresh-challenge
                  title="Інше питання" aria-label="Показати інше питання">
                  <span class="material-symbols-rounded">autorenew</span>
                </button>
              </div>
            </label>

            <button type="submit" class="btn btn-primary">
              <span class="material-symbols-rounded m3-icon-20">person_add</span>
              Створити акаунт
            </button>
          </form>
        </div>
      </div>
    `;

    const msg = document.getElementById('tc-auth-msg');
    const registerForm = root.querySelector('[data-form="register"]');
    let challengeId = null;

    function loadChallenge() {
      const field = registerForm.querySelector('[data-challenge-question]');
      const input = registerForm.elements.challengeAnswer;
      return RoboStore.newChallenge()
        .then((challenge) => {
          challengeId = challenge.id;
          field.textContent = challenge.question;
          if (input) input.value = '';
        })
        .catch(() => {
          field.textContent = 'Не вдалося отримати питання.';
        });
    }

    root.querySelectorAll('.tc-tab').forEach((button) => {
      button.addEventListener('click', () => {
        TC.clearMessage(msg);
        formShownAt = Date.now();
        root.querySelectorAll('.tc-tab').forEach((b) => b.classList.toggle('is-active', b === button));
        root.querySelectorAll('.tc-auth-form').forEach((form) => {
          form.classList.toggle('is-active', form.dataset.form === button.dataset.tab);
        });
        if (button.dataset.tab === 'register' && !challengeId) loadChallenge();
      });
    });

    registerForm.querySelector('[data-refresh-challenge]').addEventListener('click', loadChallenge);

    // Підказка про надійність пароля: без заборон, лише орієнтир.
    const passwordInput = registerForm.elements.password;
    passwordInput.addEventListener('input', () => {
      const value = passwordInput.value;
      let score = 0;
      if (value.length >= 6) score++;
      if (value.length >= 10) score++;
      if (/[A-Za-zА-Яа-яЇїІіЄєҐґ]/.test(value) && /\d/.test(value)) score++;
      if (/[^\w\s]/.test(value)) score++;

      const labels = ['', 'простий', 'непоганий', 'надійний', 'дуже надійний'];
      registerForm.querySelector('[data-strength-fill]').style.width = `${score * 25}%`;
      registerForm.querySelector('[data-strength-label]').textContent = value ? labels[score] : '';
    });

    root.querySelector('[data-form="login"]').addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.target);
      TC.clearMessage(msg);
      RoboStore.login({ email: data.get('email'), password: data.get('password') })
        .then(() => boot())
        .catch((error) => TC.message(msg, 'error', error.message));
    });

    registerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.target);
      TC.clearMessage(msg);

      RoboStore.register({
        name: data.get('name'),
        school: data.get('school'),
        email: data.get('email'),
        password: data.get('password'),
        guard: {
          honeypot: data.get('website'),
          elapsedMs: Date.now() - formShownAt,
          challengeId,
          challengeAnswer: data.get('challengeAnswer'),
        },
      })
        .then(() => boot())
        .catch((error) => {
          TC.message(msg, 'error', error.message);
          // Питання одноразове — після будь-якої відмови видаємо нове,
          // інакше повторна спроба впиралася б у «термін дії минув».
          loadChallenge();
        });
    });

    if (tab === 'register') loadChallenge();

    if (!RoboStore.storageAvailable) {
      TC.message(msg, 'error', 'Браузер блокує локальне сховище — акаунт не збережеться. Вимкніть приватний режим або дозвольте дані сайтів.');
    }

    if (typeof window.markDecorativeIcons === 'function') window.markDecorativeIcons(root);
  }

  /* ────────────────────────── ЕКРАН КАБІНЕТУ ────────────────────────── */

  /* Куди вчителю повертатися: перший непройдений урок того курсу,
     який клас уже почав. Якщо жодного курсу не починали — підказки немає. */
  function resumePoint(progressRows) {
    for (const course of TC.courses()) {
      const rows = progressRows.filter((row) => row.courseId === course.id);
      if (!rows.length) continue;

      const active = rows.find((row) => row.status === 'active');
      if (active) return { course, lesson: active.lesson };

      const next = (course.lessons || []).find(
        (lesson) => !rows.some((row) => row.lesson === lesson.n && row.status === 'done')
      );
      if (next) return { course, lesson: next.n };
    }
    return null;
  }

  function classCard(item, students, progressRows) {
    const lessonTotal = TC.courses().reduce((sum, course) => sum + (course.lessons || []).length, 0);
    const doneTotal = progressRows.filter((row) => row.status === 'done').length;
    const percent = lessonTotal ? Math.round((doneTotal / lessonTotal) * 100) : 0;
    const resume = resumePoint(progressRows);

    const resumeButton = resume
      ? `<a class="tc-btn" href="lesson.html?class=${encodeURIComponent(item.id)}&course=${encodeURIComponent(resume.course.id)}&lesson=${encodeURIComponent(resume.lesson)}">
           <span class="material-symbols-rounded m3-icon-18">play_arrow</span>
           Урок ${TC.esc(resume.lesson)} · ${TC.esc(resume.course.title)}
         </a>`
      : '';

    return `
      <article class="tc-class-card ${item.archivedAt ? 'is-archived' : ''}">
        <div class="tc-class-top">
          <div class="tc-class-icon"><span class="material-symbols-rounded icon-filled">groups</span></div>
          <div style="min-width:0">
            <h3>${TC.esc(item.name)}</h3>
            <div class="tc-class-meta">
              ${item.grade ? TC.esc(item.grade) + ' · ' : ''}${TC.students(students.length)}${item.archivedAt ? ' · в архіві' : ''}
            </div>
          </div>
        </div>
        ${item.note ? `<p class="tc-class-note">${TC.esc(item.note)}</p>` : ''}
        <div class="tc-progress-row">
          <div class="tc-track"><div class="tc-fill" style="width:${percent}%"></div></div>
          <span>${doneTotal}/${lessonTotal}</span>
        </div>
        <div class="tc-class-actions">
          <a class="tc-btn" href="class.html?id=${encodeURIComponent(item.id)}">
            <span class="material-symbols-rounded m3-icon-18">arrow_forward</span>
            Відкрити
          </a>
          ${resumeButton}
        </div>
      </article>
    `;
  }

  function renderDashboard(teacher) {
    RoboStore.listClasses(teacher.id).then((classes) => {
      const perClass = classes.map((item) => Promise.all([
        RoboStore.listStudents(item.id),
        RoboStore.listClassProgress(item.id),
      ]).then(([students, progress]) => ({ item, students, progress })));

      Promise.all(perClass).then((rows) => {
        const cards = rows.map((row) => classCard(row.item, row.students, row.progress)).join('');

        root.innerHTML = `
          <div class="tc-bar">
            <div class="tc-bar-avatar">${TC.esc(TC.initials(teacher.name))}</div>
            <div class="tc-bar-id">
              <h1>${TC.esc(teacher.name)}</h1>
              <p>${TC.esc(teacher.school || teacher.email)}</p>
            </div>
            <div class="tc-bar-actions">
              <button type="button" class="tc-btn" id="tc-export">
                <span class="material-symbols-rounded m3-icon-18">download</span>
                Резервна копія
              </button>
              <button type="button" class="tc-btn" id="tc-import-btn">
                <span class="material-symbols-rounded m3-icon-18">upload</span>
                Відновити
              </button>
              <input type="file" id="tc-import" accept="application/json,.json" hidden>
              <button type="button" class="tc-btn tc-btn--quiet" id="tc-logout">
                <span class="material-symbols-rounded m3-icon-18">logout</span>
                Вийти
              </button>
            </div>
          </div>

          <div class="tc-msg" id="tc-dash-msg" role="status" aria-live="polite"></div>

          ${RoboStore.isLocal ? `
          <div class="tc-msg tc-msg--info is-visible">
            <span class="material-symbols-rounded" aria-hidden="true">cloud_off</span>
            <span>Дані зберігаються лише в цьому браузері. Перед зміною пристрою чи чищенням історії зробіть резервну копію — інакше журнал класів буде втрачено.</span>
          </div>` : ''}

          ${teacher.weakHash ? `
          <div class="tc-msg tc-msg--info is-visible">
            <span class="material-symbols-rounded" aria-hidden="true">warning</span>
            <span>Пароль захищено спрощеним алгоритмом, бо браузер не дав доступу до криптографії. Це нормально для локальної роботи, але не покладайтеся на нього як на справжній захист.</span>
          </div>` : ''}

          <div class="tc-section-head">
            <h2>Мої класи</h2>
            <button type="button" class="btn btn-primary" id="tc-new-class">
              <span class="material-symbols-rounded m3-icon-20">add</span>
              Новий клас
            </button>
          </div>

          ${classes.length ? `<div class="tc-class-grid">${cards}</div>` : `
          <div class="tc-empty">
            <span class="material-symbols-rounded" aria-hidden="true">groups</span>
            <h3>Класів поки немає</h3>
            <p>Створіть перший клас або групу — далі можна буде додати учнів, відмічати пройдені уроки й вмикати режим уроку на екран.</p>
            <button type="button" class="btn btn-primary" id="tc-new-class-empty">
              <span class="material-symbols-rounded m3-icon-20">add</span>
              Створити клас
            </button>
          </div>`}

          <dialog class="tc-dialog" id="tc-class-dialog">
            <form method="dialog" class="tc-dialog-body" id="tc-class-form">
              <h2>Новий клас</h2>
              <label class="tc-field">
                <span>Назва класу або гуртка</span>
                <input type="text" name="name" placeholder="Наприклад: 8-А або Гурток робототехніки" required>
              </label>
              <div class="tc-field-row">
                <label class="tc-field">
                  <span>Паралель <em>(необов'язково)</em></span>
                  <input type="text" name="grade" placeholder="8 клас">
                </label>
                <label class="tc-field">
                  <span>Рік <em>(необов'язково)</em></span>
                  <input type="text" name="note" placeholder="2026/2027">
                </label>
              </div>
              <div class="tc-dialog-actions">
                <button type="button" class="tc-btn tc-btn--quiet" data-close>Скасувати</button>
                <button type="submit" class="btn btn-primary">
                  <span class="material-symbols-rounded m3-icon-20">check</span>
                  Створити
                </button>
              </div>
            </form>
          </dialog>
        `;

        wireDashboard(teacher);
      });
    });
  }

  function openDialog(dialog) {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function wireDashboard(teacher) {
    const msg = document.getElementById('tc-dash-msg');
    const dialog = document.getElementById('tc-class-dialog');

    ['tc-new-class', 'tc-new-class-empty'].forEach((id) => {
      const button = document.getElementById(id);
      if (button) button.addEventListener('click', () => openDialog(dialog));
    });

    dialog.querySelector('[data-close]').addEventListener('click', () => closeDialog(dialog));

    document.getElementById('tc-class-form').addEventListener('submit', (event) => {
      const data = new FormData(event.target);
      // method="dialog" закриє вікно сам; нам лишається створити запис.
      RoboStore.createClass(teacher.id, {
        name: data.get('name'),
        grade: data.get('grade'),
        note: data.get('note'),
      })
        .then(() => renderDashboard(teacher))
        .catch((error) => {
          event.preventDefault();
          window.alert(error.message);
        });
    });

    document.getElementById('tc-logout').addEventListener('click', () => {
      RoboStore.logout().then(() => boot());
    });

    document.getElementById('tc-export').addEventListener('click', () => {
      RoboStore.exportAll()
        .then((payload) => {
          const stamp = new Date().toISOString().slice(0, 10);
          TC.downloadJson(`roboinua-kabinet-${stamp}.json`, payload);
          TC.message(msg, 'ok', 'Резервну копію збережено у теку завантажень.');
        })
        .catch((error) => TC.message(msg, 'error', error.message));
    });

    const fileInput = document.getElementById('tc-import');
    document.getElementById('tc-import-btn').addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;

      TC.readJsonFile(file)
        .then((payload) => RoboStore.importAll(payload, { replace: false }))
        .then((result) => {
          TC.message(msg, 'ok', `Відновлено з копії. Нових записів додано: ${result.added || 0}.`);
          fileInput.value = '';
          return RoboStore.currentTeacher();
        })
        .then((current) => {
          // Імпорт міг принести інші акаунти — показуємо той, під яким сидимо.
          if (current) renderDashboard(current);
          else boot();
        })
        .catch((error) => {
          fileInput.value = '';
          TC.message(msg, 'error', error.message);
        });
    });

    if (typeof window.markDecorativeIcons === 'function') window.markDecorativeIcons(root);
  }

  /* ──────────────────────────────  СТАРТ  ────────────────────────────── */

  function boot() {
    RoboStore.currentTeacher()
      .then((teacher) => {
        if (teacher) renderDashboard(teacher);
        else renderAuth(TC.param('tab'));
        if (typeof syncAccountButton === 'function') syncAccountButton();
      })
      .catch(() => renderAuth());
  }

  boot();
})();
