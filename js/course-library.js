/**
 * ============================================================
 *  БІБЛІОТЕКА КУРСІВ
 *
 *  ЧОМУ ТАК. Раніше всі курси лежали в одному js/courses-data.js, і кожна
 *  сторінка розділу «Матеріали» тягнула їх усі — сотні кілобайтів заради
 *  одного уроку. Тепер розділення чітке:
 *
 *    js/courses-index.js   — тільки метадані курсів і заголовки уроків
 *                            (назва, підзаголовок, складність). Легкий,
 *                            підключається скрізь, де потрібні каталоги.
 *    js/courses/<id>.js    — повний курс із текстом уроків. Вантажиться
 *                            лише тоді, коли справді відкривають цей курс.
 *
 *  Курс реєструє сам себе викликом registerCourse({...}) — тож файл можна
 *  підключити і статичним <script>, і динамічно через CourseLibrary.load().
 *
 *  Після зміни будь-якого курсу перебудуйте індекс:
 *      powershell -ExecutionPolicy Bypass -File tools\build-course-index.ps1
 * ============================================================
 */

const CourseLibrary = (function () {
  'use strict';

  const loaded = {};
  const pending = {};
  const waiting = {};

  /* Свій шлях до кореня сайту, щоб не залежати від порядку підключення
     скриптів: components.js може ще не існувати на момент виклику. */
  let cachedBase = null;

  function basePath() {
    if (cachedBase !== null) return cachedBase;

    if (typeof getBasePath === 'function') {
      cachedBase = getBasePath();
      return cachedBase;
    }

    const scripts = document.querySelectorAll('script[src]');
    for (const script of scripts) {
      const src = script.getAttribute('src') || '';
      if (!src.includes('course-library.js')) continue;
      const parts = src.split('/');
      const prefix = parts.slice(0, -2);
      cachedBase = prefix.length ? `${prefix.join('/')}/` : './';
      return cachedBase;
    }

    cachedBase = './';
    return cachedBase;
  }

  function register(course) {
    if (!course || !course.id) return;
    loaded[course.id] = course;

    // Файл могли підключити статично — тоді на нього вже чекає load().
    const resolvers = waiting[course.id];
    if (resolvers) {
      delete waiting[course.id];
      resolvers.forEach((resolve) => resolve(course));
    }
  }

  function index() {
    return (typeof COURSE_INDEX !== 'undefined' && Array.isArray(COURSE_INDEX)) ? COURSE_INDEX : [];
  }

  function meta(id) {
    return index().find((item) => item.id === id) || null;
  }

  function get(id) {
    return loaded[id] || null;
  }

  /* Завантажує повний курс. Повторні виклики для того самого id
     повертають ту саму обіцянку — файл підключається рівно один раз. */
  function load(id) {
    if (!id) return Promise.reject(new Error('Не вказано курс.'));
    if (loaded[id]) return Promise.resolve(loaded[id]);
    if (pending[id]) return pending[id];

    pending[id] = new Promise((resolve, reject) => {
      waiting[id] = waiting[id] || [];
      waiting[id].push(resolve);

      const script = document.createElement('script');
      script.src = `${basePath()}js/courses/${id}.js`;
      script.onerror = () => {
        delete pending[id];
        delete waiting[id];
        reject(new Error(`Не вдалося завантажити курс «${id}».`));
      };
      // Якщо файл виконався, але registerCourse чомусь не викликано —
      // не лишаємо сторінку висіти на обіцянці, яка ніколи не справдиться.
      script.onload = () => {
        if (!loaded[id]) {
          delete pending[id];
          delete waiting[id];
          reject(new Error(`Файл курсу «${id}» не зареєстрував жодного курсу.`));
        }
      };
      document.head.appendChild(script);
    });

    return pending[id];
  }

  function lesson(course, n) {
    if (!course || !Array.isArray(course.lessons)) return null;
    return course.lessons.find((item) => String(item.n) === String(n)) || null;
  }

  /* Сусідні уроки для навігації «назад / далі». */
  function neighbours(course, n) {
    const lessons = (course && course.lessons) || [];
    const at = lessons.findIndex((item) => String(item.n) === String(n));
    return {
      index: at,
      total: lessons.length,
      prev: at > 0 ? lessons[at - 1] : null,
      next: at >= 0 && at < lessons.length - 1 ? lessons[at + 1] : null,
    };
  }

  /* ── прогрес проходження, спільний для огляду й сторінки уроку ──
     Ключ той самий, що використовувався до перебудови, тож збережений
     прогрес учнів не загубився. */

  function progressKey(courseId) {
    return `roboinua_course_${courseId}_v1`;
  }

  function readProgress(courseId) {
    try {
      return JSON.parse(localStorage.getItem(progressKey(courseId)) || '{}') || {};
    } catch (error) {
      return {};
    }
  }

  function writeProgress(courseId, state) {
    try {
      localStorage.setItem(progressKey(courseId), JSON.stringify(state));
    } catch (error) {
      /* сховище недоступне — прогрес просто не переживе перезавантаження */
    }
  }

  function setLessonDone(courseId, n, done) {
    const state = readProgress(courseId);
    if (done) state[n] = true;
    else delete state[n];
    writeProgress(courseId, state);
    return state;
  }

  function progressStats(courseId, lessonCount) {
    const state = readProgress(courseId);
    const done = Object.keys(state).filter((key) => state[key]).length;
    return {
      done,
      total: lessonCount,
      percent: lessonCount ? Math.round((done / lessonCount) * 100) : 0,
    };
  }

  return {
    register,
    index,
    meta,
    get,
    load,
    lesson,
    neighbours,
    readProgress,
    setLessonDone,
    progressStats,
    basePath,
  };
})();

window.CourseLibrary = CourseLibrary;
window.registerCourse = CourseLibrary.register;
