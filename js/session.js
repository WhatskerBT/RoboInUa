/**
 * Мінімальний доступ до сесії — тільки для того, щоб шапка сайту знала,
 * чи увійшов учитель, і показала його ім'я.
 *
 * НАВІЩО ОКРЕМИЙ ФАЙЛ: публічні сторінки (головна, проєкти, заходи) не мають
 * тягнути весь store.js заради однієї кнопки в шапці. Але й дублювати назви
 * ключів сховища у двох місцях не можна — тож ключі оголошені тут, а store.js
 * бере їх звідси. Одне джерело правди, вага — кілька сотень байтів.
 */

const RoboSession = (function () {
  'use strict';

  const KEYS = {
    db: 'roboinua_db_v1',
    session: 'roboinua_session_v1',
    guard: 'roboinua_guard_v1',
  };

  function read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  /* Синхронно, бо шапка малюється одразу: інакше кнопка акаунта встигла б
     блимнути іконкою «увійти» перед ініціалами вчителя. */
  function peek() {
    const session = read(KEYS.session);
    if (!session || !session.teacherId) return null;

    const db = read(KEYS.db);
    if (!db || !Array.isArray(db.teachers)) return null;

    const teacher = db.teachers.find((item) => item.id === session.teacherId);
    if (!teacher) return null;

    return {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      school: teacher.school || '',
    };
  }

  function initials(name) {
    return String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || '?';
  }

  /* Вихід із шапки будь-якої сторінки — без завантаження store.js. */
  function signOut() {
    try {
      localStorage.removeItem(KEYS.session);
    } catch (error) {
      /* сховище недоступне — сесії однаково немає */
    }
  }

  return { KEYS, peek, initials, signOut };
})();

window.RoboSession = RoboSession;
