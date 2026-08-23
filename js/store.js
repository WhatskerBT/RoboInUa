/**
 * ============================================================
 *  RoboStore — шар даних для акаунтів учителів, класів і прогресу.
 *
 *  НАВІЩО ЦЕЙ ШАР
 *  Сайт зараз статичний і працює навіть із file://, тож усі дані
 *  живуть у localStorage браузера. Але вся публічна частина цього
 *  модуля — асинхронна (повертає Promise) і оперує доменними
 *  поняттями, а не ключами сховища. Завдяки цьому перехід на хмару
 *  (Supabase тощо) не потребує переписування жодного екрана:
 *  достатньо реалізувати другий адаптер із тим самим інтерфейсом і
 *  підмінити RoboStore.useAdapter(...).
 *
 *  Див. блок ADAPTER CONTRACT нижче — це і є той інтерфейс.
 *
 *  МОДЕЛЬ ДАНИХ
 *   teacher        { id, name, email, school, salt, hash, algo, createdAt }
 *   class          { id, teacherId, name, grade, note, createdAt, archivedAt }
 *   student        { id, classId, name, createdAt }
 *   classProgress  { id, classId, courseId, lesson, status, note, updatedAt }
 *                    status: 'planned' | 'active' | 'done'
 *   studentProgress{ id, studentId, courseId, lesson, done, updatedAt }
 *   lessonLog      { id, classId, courseId, lesson, startedAt, endedAt, present[] }
 * ============================================================
 */

const RoboStore = (function () {
  'use strict';

  // Ключі оголошені в js/session.js — його підключають усі сторінки, бо шапка
  // теж має знати про сесію. Тутешній fallback потрібен лише на випадок,
  // якщо store.js колись підключать без session.js.
  const KEYS = (typeof RoboSession !== 'undefined' && RoboSession.KEYS) || {
    db: 'roboinua_db_v1',
    session: 'roboinua_session_v1',
    guard: 'roboinua_guard_v1',
  };

  const DB_KEY = KEYS.db;
  const SESSION_KEY = KEYS.session;
  const GUARD_KEY = KEYS.guard;
  const PBKDF2_ITERATIONS = 150000;

  /* ─────────────────────── правила захисту від спаму ───────────────────────
     Це клієнтські обмеження, і вони чесно називаються саме так: очистивши
     сховище браузера, їх можна обійти. Сенс у двох речах. По-перше, вони
     ріжуть саме те, що реально трапляється тут і зараз, — автозаповнювачі
     форм, скрипти-переборщики паролів і випадкове «наклацування» десятків
     акаунтів. По-друге, це та сама логіка, яку хмарний адаптер має виконувати
     на сервері: правила зібрані в одному місці, з тими самими повідомленнями,
     тож переносяться разом із кодом. Справжній антиспам без сервера
     неможливий — і вдавати протилежне було б гірше, ніж не робити нічого. */
  const GUARD_RULES = {
    minFormMs: 3000,               // швидше за 3 с форму заповнює лише скрипт
    minGapMs: 30 * 1000,           // пауза між двома реєстраціями поспіль
    maxPerDay: 3,                  // акаунтів на добу з одного браузера
    challengeTtlMs: 10 * 60 * 1000, // скільки живе контрольне питання
    loginFreeAttempts: 5,          // невдалих спроб до першого блокування
    loginBaseLockMs: 60 * 1000,    // перше блокування
    loginMaxLockMs: 15 * 60 * 1000, // стеля блокування
  };

  /* ─────────────────────────── дрібні утиліти ─────────────────────────── */

  function uid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'id-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function toHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function randomSalt() {
    const bytes = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return toHex(bytes.buffer);
  }

  /* Порівняння за сталий час — щоб час відповіді не підказував,
     наскільки хеш близький до правильного. */
  function safeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  /* ───────────────────────────── хешування ───────────────────────────── */

  const subtle = (window.crypto && window.crypto.subtle) || null;

  /* Запасний хеш на випадок, коли crypto.subtle недоступний (небезпечний
     контекст, старий браузер). Він слабший за PBKDF2, тому позначається
     окремим algo — інтерфейс показує це користувачу чесно, а не вдає
     захист, якого немає. */
  function weakHash(password, salt) {
    const input = salt + '::' + password;
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ code, 16777619) >>> 0;
      h2 = Math.imul(h2 + code + i, 2246822519) >>> 0;
    }
    let out = '';
    for (let round = 0; round < 8; round++) {
      h1 = Math.imul(h1 ^ (h2 >>> 7), 2654435761) >>> 0;
      h2 = Math.imul(h2 ^ (h1 >>> 5), 2246822519) >>> 0;
      out += h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
    }
    return out.slice(0, 64);
  }

  async function derivePassword(password, salt) {
    if (!subtle) {
      return { hash: weakHash(password, salt), algo: 'weak-fallback' };
    }

    try {
      const encoder = new TextEncoder();
      const key = await subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
      const bits = await subtle.deriveBits({
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      }, key, 256);
      return { hash: toHex(bits), algo: 'pbkdf2-sha256-' + PBKDF2_ITERATIONS };
    } catch (error) {
      return { hash: weakHash(password, salt), algo: 'weak-fallback' };
    }
  }

  /* Перевірка рахує хеш ТИМ САМИМ алгоритмом, яким його створювали, —
     інакше акаунти, заведені у слабкому контексті, перестали б відкриватися
     після переїзду на https. */
  async function verifyPassword(password, teacher) {
    if (!teacher || !teacher.salt || !teacher.hash) return false;
    if (teacher.algo === 'weak-fallback') {
      return safeEqual(weakHash(password, teacher.salt), teacher.hash);
    }
    const derived = await derivePassword(password, teacher.salt);
    return safeEqual(derived.hash, teacher.hash);
  }

  /* ───────────────────────── захист від спаму ───────────────────────── */

  function readGuard() {
    try {
      const raw = localStorage.getItem(GUARD_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return {
        signups: (parsed && Array.isArray(parsed.signups)) ? parsed.signups : [],
        challenges: (parsed && Array.isArray(parsed.challenges)) ? parsed.challenges : [],
        logins: (parsed && parsed.logins && typeof parsed.logins === 'object') ? parsed.logins : {},
      };
    } catch (error) {
      return { signups: [], challenges: [], logins: {} };
    }
  }

  function writeGuard(guard) {
    try {
      localStorage.setItem(GUARD_KEY, JSON.stringify(guard));
    } catch (error) {
      /* якщо лічильники не збереглися — краще пустити користувача далі,
         ніж замкнути його через несправне сховище */
    }
  }

  function waitText(ms) {
    const seconds = Math.max(1, Math.ceil(ms / 1000));
    if (seconds < 60) return `${seconds} с`;
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) return `${minutes} хв`;
    return `${Math.ceil(minutes / 60)} год`;
  }

  const NUMBER_WORDS = [
    'нуль', 'один', 'два', 'три', 'чотири', "п'ять",
    'шість', 'сім', 'вісім', "дев'ять", 'десять', 'одинадцять', 'дванадцять',
  ];

  /* Контрольне питання видає сам сховищний шар і сам його перевіряє —
     сторінка правильної відповіді не бачить. Числа словами, щоб примітивний
     скрипт не витяг їх регуляркою з тексту питання. */
  function createChallenge() {
    const guard = readGuard();
    const now = Date.now();

    const a = 2 + Math.floor(Math.random() * 8);
    const b = 2 + Math.floor(Math.random() * 7);
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    // Рівні числа віднімати не пропонуємо: «сім мінус сім» читається як помилка.
    const plus = Math.random() < 0.6 || a === b;

    const answer = plus ? a + b : big - small;
    const question = plus
      ? `Скільки буде ${NUMBER_WORDS[a]} плюс ${NUMBER_WORDS[b]}?`
      : `Скільки буде ${NUMBER_WORDS[big]} мінус ${NUMBER_WORDS[small]}?`;

    const challenge = { id: uid(), answer, createdAt: now };
    guard.challenges = guard.challenges
      .filter((item) => now - item.createdAt < GUARD_RULES.challengeTtlMs)
      .slice(-4)
      .concat(challenge);
    writeGuard(guard);

    return { id: challenge.id, question };
  }

  function assertSignupAllowed(check) {
    const info = check || {};
    const guard = readGuard();
    const now = Date.now();

    // Приманка: поле сховане від людей, тож заповнити його може лише робот.
    if (info.honeypot) {
      throw new Error('Не вдалося створити акаунт. Спробуйте ще раз.');
    }

    if (!(info.elapsedMs >= GUARD_RULES.minFormMs)) {
      throw new Error('Форму заповнено надто швидко. Перевірте дані й натисніть ще раз.');
    }

    const recent = guard.signups.filter((ts) => now - ts < 24 * 60 * 60 * 1000);
    if (recent.length >= GUARD_RULES.maxPerDay) {
      const oldest = Math.min.apply(null, recent);
      const left = 24 * 60 * 60 * 1000 - (now - oldest);
      throw new Error(`З цього браузера вже створено ${GUARD_RULES.maxPerDay} акаунти за добу. Наступний — за ${waitText(left)}.`);
    }

    const last = recent.length ? Math.max.apply(null, recent) : 0;
    if (last && now - last < GUARD_RULES.minGapMs) {
      throw new Error(`Зачекайте ${waitText(GUARD_RULES.minGapMs - (now - last))} перед створенням наступного акаунта.`);
    }

    const challenge = guard.challenges.find((item) => item.id === info.challengeId);
    if (!challenge || now - challenge.createdAt > GUARD_RULES.challengeTtlMs) {
      throw new Error('Термін дії контрольного питання минув. Оновіть питання й спробуйте ще раз.');
    }
    if (parseInt(info.challengeAnswer, 10) !== challenge.answer) {
      throw new Error('Неправильна відповідь на контрольне питання.');
    }

    // Питання одноразове: інакше одну відповідь можна крутити в циклі.
    guard.challenges = guard.challenges.filter((item) => item.id !== challenge.id);
    guard.signups = recent;
    writeGuard(guard);
  }

  function noteSignup() {
    const guard = readGuard();
    guard.signups = guard.signups
      .filter((ts) => Date.now() - ts < 24 * 60 * 60 * 1000)
      .concat(Date.now());
    writeGuard(guard);
  }

  function assertLoginAllowed(email) {
    const guard = readGuard();
    const entry = guard.logins[email];
    if (entry && entry.lockedUntil && entry.lockedUntil > Date.now()) {
      throw new Error(`Забагато невдалих спроб. Вхід буде доступний за ${waitText(entry.lockedUntil - Date.now())}.`);
    }
  }

  /* Кожна наступна невдала спроба подвоює паузу — перебір паролів стає
     безглуздим ще до того, як дійде до другого десятка варіантів. */
  function noteLoginFail(email) {
    const guard = readGuard();
    const entry = guard.logins[email] || { fails: 0, lockedUntil: 0 };
    entry.fails += 1;

    if (entry.fails >= GUARD_RULES.loginFreeAttempts) {
      const overflow = entry.fails - GUARD_RULES.loginFreeAttempts;
      const lock = Math.min(
        GUARD_RULES.loginBaseLockMs * Math.pow(2, overflow),
        GUARD_RULES.loginMaxLockMs
      );
      entry.lockedUntil = Date.now() + lock;
    }

    guard.logins[email] = entry;
    writeGuard(guard);
  }

  function noteLoginSuccess(email) {
    const guard = readGuard();
    delete guard.logins[email];
    writeGuard(guard);
  }

  /* ───────────────────────── локальний адаптер ───────────────────────── */

  const EMPTY_DB = {
    version: 1,
    teachers: [],
    classes: [],
    students: [],
    classProgress: [],
    studentProgress: [],
    lessonLog: [],
  };

  function readDb() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) return JSON.parse(JSON.stringify(EMPTY_DB));
      const parsed = JSON.parse(raw);
      return Object.assign(JSON.parse(JSON.stringify(EMPTY_DB)), parsed);
    } catch (error) {
      return JSON.parse(JSON.stringify(EMPTY_DB));
    }
  }

  function writeDb(db) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      return true;
    } catch (error) {
      // Квота вичерпана або сховище вимкнене — кажемо про це вголос,
      // бо мовчазна втрата журналу класу гірша за помилку.
      throw new Error('Не вдалося зберегти дані: сховище браузера недоступне або переповнене.');
    }
  }

  function readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeSession(session) {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      /* сесія просто не переживе перезавантаження */
    }
  }

  function publicTeacher(teacher) {
    if (!teacher) return null;
    return {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      school: teacher.school || '',
      createdAt: teacher.createdAt,
      weakHash: teacher.algo === 'weak-fallback',
    };
  }

  const LocalAdapter = {
    name: 'local',

    /* ── авторизація ── */

    /* Контрольне питання для форми реєстрації. Правильної відповіді
       сторінка не отримує — лише id, який повертає назад у register(). */
    async newChallenge() {
      return createChallenge();
    },

    async register({ name, email, password, school, guard }) {
      const db = readDb();
      const cleanEmail = normalizeEmail(email);

      if (!name || !String(name).trim()) throw new Error('Вкажіть ім\'я та прізвище.');
      if (!cleanEmail) throw new Error('Вкажіть електронну пошту.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) throw new Error('Пошта виглядає некоректно.');
      if (!password || password.length < 6) throw new Error('Пароль має містити щонайменше 6 символів.');
      if (db.teachers.some((t) => t.email === cleanEmail)) {
        throw new Error('Акаунт із такою поштою вже існує на цьому пристрої.');
      }

      // Перевірки на спам — після перевірок полів: описка в паролі не має
      // спалювати контрольне питання, яке людина вже правильно розв'язала.
      assertSignupAllowed(guard);

      const salt = randomSalt();
      const { hash, algo } = await derivePassword(password, salt);

      const teacher = {
        id: uid(),
        name: String(name).trim(),
        email: cleanEmail,
        school: String(school || '').trim(),
        salt,
        hash,
        algo,
        createdAt: nowIso(),
      };

      db.teachers.push(teacher);
      writeDb(db);
      noteSignup();
      writeSession({ teacherId: teacher.id, startedAt: nowIso() });
      return publicTeacher(teacher);
    },

    async login({ email, password }) {
      const cleanEmail = normalizeEmail(email);
      assertLoginAllowed(cleanEmail);

      const db = readDb();
      const teacher = db.teachers.find((t) => t.email === cleanEmail);
      // Однакове повідомлення для «немає акаунта» і «хибний пароль» —
      // щоб форма не перетворилася на перевірку, хто зареєстрований.
      const ok = teacher && await verifyPassword(password, teacher);
      if (!ok) {
        noteLoginFail(cleanEmail);
        throw new Error('Неправильна пошта або пароль.');
      }

      noteLoginSuccess(cleanEmail);
      writeSession({ teacherId: teacher.id, startedAt: nowIso() });
      return publicTeacher(teacher);
    },

    async logout() {
      writeSession(null);
      return true;
    },

    async currentTeacher() {
      const session = readSession();
      if (!session || !session.teacherId) return null;
      const db = readDb();
      return publicTeacher(db.teachers.find((t) => t.id === session.teacherId));
    },

    async updateProfile(teacherId, patch) {
      const db = readDb();
      const teacher = db.teachers.find((t) => t.id === teacherId);
      if (!teacher) throw new Error('Акаунт не знайдено.');
      if (patch.name !== undefined) teacher.name = String(patch.name).trim();
      if (patch.school !== undefined) teacher.school = String(patch.school).trim();
      writeDb(db);
      return publicTeacher(teacher);
    },

    async changePassword(teacherId, { currentPassword, newPassword }) {
      const db = readDb();
      const teacher = db.teachers.find((t) => t.id === teacherId);
      if (!teacher) throw new Error('Акаунт не знайдено.');
      if (!await verifyPassword(currentPassword, teacher)) throw new Error('Поточний пароль неправильний.');
      if (!newPassword || newPassword.length < 6) throw new Error('Новий пароль має містити щонайменше 6 символів.');

      const salt = randomSalt();
      const { hash, algo } = await derivePassword(newPassword, salt);
      teacher.salt = salt;
      teacher.hash = hash;
      teacher.algo = algo;
      writeDb(db);
      return true;
    },

    /* ── класи ── */

    async listClasses(teacherId) {
      const db = readDb();
      return db.classes
        .filter((c) => c.teacherId === teacherId)
        .sort((a, b) => {
          if (Boolean(a.archivedAt) !== Boolean(b.archivedAt)) return a.archivedAt ? 1 : -1;
          return a.name.localeCompare(b.name, 'uk');
        });
    },

    async getClass(classId) {
      const db = readDb();
      return db.classes.find((c) => c.id === classId) || null;
    },

    async createClass(teacherId, { name, grade, note }) {
      if (!name || !String(name).trim()) throw new Error('Вкажіть назву класу або групи.');
      const db = readDb();
      const item = {
        id: uid(),
        teacherId,
        name: String(name).trim(),
        grade: String(grade || '').trim(),
        note: String(note || '').trim(),
        createdAt: nowIso(),
        archivedAt: null,
      };
      db.classes.push(item);
      writeDb(db);
      return item;
    },

    async updateClass(classId, patch) {
      const db = readDb();
      const item = db.classes.find((c) => c.id === classId);
      if (!item) throw new Error('Клас не знайдено.');
      ['name', 'grade', 'note'].forEach((field) => {
        if (patch[field] !== undefined) item[field] = String(patch[field]).trim();
      });
      if (patch.archived !== undefined) item.archivedAt = patch.archived ? nowIso() : null;
      writeDb(db);
      return item;
    },

    /* Видалення класу забирає з собою учнів і весь прогрес — інакше в базі
       накопичуються сироти, які потім спливають у звітах. */
    async deleteClass(classId) {
      const db = readDb();
      const studentIds = db.students.filter((s) => s.classId === classId).map((s) => s.id);
      db.classes = db.classes.filter((c) => c.id !== classId);
      db.students = db.students.filter((s) => s.classId !== classId);
      db.classProgress = db.classProgress.filter((p) => p.classId !== classId);
      db.studentProgress = db.studentProgress.filter((p) => !studentIds.includes(p.studentId));
      db.lessonLog = db.lessonLog.filter((l) => l.classId !== classId);
      writeDb(db);
      return true;
    },

    /* ── учні ── */

    async listStudents(classId) {
      const db = readDb();
      return db.students
        .filter((s) => s.classId === classId)
        .sort((a, b) => a.name.localeCompare(b.name, 'uk'));
    },

    async addStudent(classId, name) {
      if (!name || !String(name).trim()) throw new Error('Вкажіть ім\'я учня.');
      const db = readDb();
      const item = { id: uid(), classId, name: String(name).trim(), createdAt: nowIso() };
      db.students.push(item);
      writeDb(db);
      return item;
    },

    /* Масове додавання — вчитель вставляє список із журналу одним блоком. */
    async addStudents(classId, names) {
      const db = readDb();
      const created = [];
      names.map((n) => String(n).trim()).filter(Boolean).forEach((name) => {
        const item = { id: uid(), classId, name, createdAt: nowIso() };
        db.students.push(item);
        created.push(item);
      });
      writeDb(db);
      return created;
    },

    async renameStudent(studentId, name) {
      const db = readDb();
      const item = db.students.find((s) => s.id === studentId);
      if (!item) throw new Error('Учня не знайдено.');
      item.name = String(name).trim();
      writeDb(db);
      return item;
    },

    async removeStudent(studentId) {
      const db = readDb();
      db.students = db.students.filter((s) => s.id !== studentId);
      db.studentProgress = db.studentProgress.filter((p) => p.studentId !== studentId);
      db.lessonLog.forEach((log) => {
        if (Array.isArray(log.present)) log.present = log.present.filter((id) => id !== studentId);
      });
      writeDb(db);
      return true;
    },

    /* ── прогрес класу по уроках ── */

    async listClassProgress(classId) {
      const db = readDb();
      return db.classProgress.filter((p) => p.classId === classId);
    },

    async setClassLesson(classId, courseId, lesson, status, note) {
      const db = readDb();
      let item = db.classProgress.find(
        (p) => p.classId === classId && p.courseId === courseId && p.lesson === lesson
      );

      if (!status || status === 'planned') {
        // «Заплановано» — це відсутність запису, а не окремий стан у базі.
        db.classProgress = db.classProgress.filter((p) => p !== item);
        writeDb(db);
        return null;
      }

      if (!item) {
        item = { id: uid(), classId, courseId, lesson, status, note: '', updatedAt: nowIso() };
        db.classProgress.push(item);
      }

      item.status = status;
      if (note !== undefined) item.note = String(note || '');
      item.updatedAt = nowIso();
      writeDb(db);
      return item;
    },

    /* ── прогрес окремих учнів ── */

    async listStudentProgress(classId) {
      const db = readDb();
      const ids = db.students.filter((s) => s.classId === classId).map((s) => s.id);
      return db.studentProgress.filter((p) => ids.includes(p.studentId));
    },

    async setStudentLesson(studentId, courseId, lesson, done) {
      const db = readDb();
      const index = db.studentProgress.findIndex(
        (p) => p.studentId === studentId && p.courseId === courseId && p.lesson === lesson
      );

      if (!done) {
        if (index !== -1) db.studentProgress.splice(index, 1);
        writeDb(db);
        return null;
      }

      if (index === -1) {
        const item = { id: uid(), studentId, courseId, lesson, done: true, updatedAt: nowIso() };
        db.studentProgress.push(item);
        writeDb(db);
        return item;
      }

      db.studentProgress[index].updatedAt = nowIso();
      writeDb(db);
      return db.studentProgress[index];
    },

    /* ── журнал проведених уроків ── */

    async startLesson(classId, courseId, lesson) {
      const db = readDb();
      const item = {
        id: uid(),
        classId,
        courseId,
        lesson,
        startedAt: nowIso(),
        endedAt: null,
        present: [],
      };
      db.lessonLog.push(item);
      writeDb(db);
      return item;
    },

    async finishLesson(logId, presentIds) {
      const db = readDb();
      const item = db.lessonLog.find((l) => l.id === logId);
      if (!item) return null;
      item.endedAt = nowIso();
      if (Array.isArray(presentIds)) item.present = presentIds.slice();
      writeDb(db);
      return item;
    },

    async listLessonLog(classId) {
      const db = readDb();
      return db.lessonLog
        .filter((l) => l.classId === classId)
        .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
    },

    /* ── перенесення даних між пристроями ── */

    async exportAll() {
      const db = readDb();
      // Хеші паролів у вивантаженні залишаються: інакше після імпорту
      // на іншому пристрої вчитель не зможе увійти під своїм паролем.
      return { exportedAt: nowIso(), source: 'roboinua-local', db };
    },

    async importAll(payload, { replace = false } = {}) {
      if (!payload || !payload.db) throw new Error('Файл не схожий на резервну копію Федерації.');
      const incoming = payload.db;
      if (replace) {
        writeDb(Object.assign(JSON.parse(JSON.stringify(EMPTY_DB)), incoming));
        writeSession(null);
        return { mode: 'replace' };
      }

      // Злиття: усе, чого ще немає за id, додається. Наявні записи не чіпаємо,
      // щоб імпорт старішої копії не затер свіжіші відмітки на цьому пристрої.
      const db = readDb();
      let added = 0;
      Object.keys(EMPTY_DB).forEach((key) => {
        if (!Array.isArray(EMPTY_DB[key]) || !Array.isArray(incoming[key])) return;
        const known = new Set(db[key].map((row) => row.id));
        incoming[key].forEach((row) => {
          if (row && row.id && !known.has(row.id)) {
            db[key].push(row);
            added++;
          }
        });
      });
      writeDb(db);
      return { mode: 'merge', added };
    },

    async wipeAll() {
      try {
        localStorage.removeItem(DB_KEY);
        localStorage.removeItem(SESSION_KEY);
      } catch (error) {
        /* нічого не вдієш */
      }
      return true;
    },
  };

  /* ────────────────────────── ADAPTER CONTRACT ──────────────────────────
     Хмарний адаптер має реалізувати рівно ці методи з тими самими
     сигнатурами та Promise-поверненнями:

       newChallenge()                         → {id, question}
       register({name,email,password,school,guard}) → teacher
         guard = {honeypot, elapsedMs, challengeId, challengeAnswer}
         Сервер зобов'язаний перевірити ці поля САМ (і додати обмеження
         за IP та підтвердження пошти) — клієнтські лічильники з localStorage
         у хмарі не варті нічого.
       login({email,password})                → teacher
         має тримати блокування після серії невдалих спроб
       logout()                               → true
       currentTeacher()                       → teacher | null
       updateProfile(teacherId, patch)        → teacher
       changePassword(teacherId, {...})       → true

       listClasses(teacherId) / getClass(classId)
       createClass(teacherId, {...}) / updateClass(classId, patch) / deleteClass(classId)

       listStudents(classId) / addStudent(classId, name) / addStudents(classId, names)
       renameStudent(studentId, name) / removeStudent(studentId)

       listClassProgress(classId) / setClassLesson(classId, courseId, lesson, status, note)
       listStudentProgress(classId) / setStudentLesson(studentId, courseId, lesson, done)

       startLesson(classId, courseId, lesson) / finishLesson(logId, presentIds)
       listLessonLog(classId)

       exportAll() / importAll(payload, opts) / wipeAll()

     Підключення: RoboStore.useAdapter(SupabaseAdapter). Жоден екран
     кабінету не знає, який адаптер активний, тож UI не змінюється.
     ────────────────────────────────────────────────────────────────────── */

  let active = LocalAdapter;

  const api = {
    useAdapter(adapter) {
      active = adapter;
    },
    get adapterName() {
      return active.name;
    },
    /* Чи це локальне сховище (даних немає на інших пристроях) — інтерфейс
       показує про це попередження, щоб вчитель не втратив журнал. */
    get isLocal() {
      return active.name === 'local';
    },
    get storageAvailable() {
      try {
        const probe = '__roboinua_probe__';
        localStorage.setItem(probe, '1');
        localStorage.removeItem(probe);
        return true;
      } catch (error) {
        return false;
      }
    },
  };

  // Проксі всіх доменних методів на активний адаптер.
  [
    'newChallenge', 'register', 'login', 'logout', 'currentTeacher', 'updateProfile', 'changePassword',
    'listClasses', 'getClass', 'createClass', 'updateClass', 'deleteClass',
    'listStudents', 'addStudent', 'addStudents', 'renameStudent', 'removeStudent',
    'listClassProgress', 'setClassLesson', 'listStudentProgress', 'setStudentLesson',
    'startLesson', 'finishLesson', 'listLessonLog',
    'exportAll', 'importAll', 'wipeAll',
  ].forEach((method) => {
    api[method] = function (...args) {
      if (typeof active[method] !== 'function') {
        return Promise.reject(new Error(`Адаптер «${active.name}» не підтримує ${method}().`));
      }
      return Promise.resolve(active[method](...args));
    };
  });

  return api;
})();

window.RoboStore = RoboStore;
