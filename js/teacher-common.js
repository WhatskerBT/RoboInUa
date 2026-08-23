/**
 * Спільні дрібниці для сторінок кабінету вчителя.
 * Нічого доменного тут немає — уся робота з даними йде через RoboStore.
 */

const TC = (function () {
  'use strict';

  const STATUS_LABEL = {
    planned: 'Заплановано',
    active: 'Триває',
    done: 'Пройдено',
  };

  const STATUS_ICON = {
    planned: 'radio_button_unchecked',
    active: 'play_circle',
    done: 'check_circle',
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initials(name) {
    return String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || '?';
  }

  /* Параметри читаються і з ?query, і з #hash: file:// іноді втрачає query
     при переходах «назад», а hash переживає їх надійно. */
  function param(name) {
    const search = new URLSearchParams(window.location.search);
    if (search.has(name)) return search.get(name);
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return null;
    return new URLSearchParams(hash).get(name);
  }

  /* Кабінету вистачає індексу: списки класів і прогрес оперують номерами
     та назвами уроків. Повний текст курсу вантажить лише режим уроку. */
  function courses() {
    return (typeof CourseLibrary !== 'undefined') ? CourseLibrary.index() : [];
  }

  function course(id) {
    return (typeof CourseLibrary !== 'undefined') ? CourseLibrary.meta(id) : null;
  }

  /* Курс лежить у materials/<id>/, а сторінки кабінету — у teacher/,
     тож картинки уроків потребують власного префікса. */
  function courseAsset(courseId, src) {
    const base = (typeof getBasePath === 'function') ? getBasePath() : '../';
    return `${base}materials/${courseId}/${src}`;
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function fmtDateTime(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('uk-UA', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function message(node, kind, text) {
    if (!node) return;
    node.className = `tc-msg tc-msg--${kind} is-visible`;
    const icon = kind === 'error' ? 'warning' : kind === 'ok' ? 'check_circle' : 'info';
    node.innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">${icon}</span><span>${esc(text)}</span>`;
  }

  function clearMessage(node) {
    if (!node) return;
    node.className = 'tc-msg';
    node.innerHTML = '';
  }

  /* Кожна сторінка кабінету, крім входу, починається з цієї перевірки. */
  function requireTeacher() {
    return RoboStore.currentTeacher().then((teacher) => {
      if (!teacher) {
        const base = (typeof getBasePath === 'function') ? getBasePath() : '../';
        window.location.replace(`${base}teacher/index.html`);
        return null;
      }
      return teacher;
    });
  }

  /* Скільки уроків курсу вже пройдено класом. */
  function courseStats(progressRows, courseId, lessonCount) {
    const rows = progressRows.filter((row) => row.courseId === courseId);
    const done = rows.filter((row) => row.status === 'done').length;
    const active = rows.filter((row) => row.status === 'active').length;
    return {
      done,
      active,
      total: lessonCount,
      percent: lessonCount ? Math.round((done / lessonCount) * 100) : 0,
    };
  }

  function statusOf(progressRows, courseId, lesson) {
    const row = progressRows.find((item) => item.courseId === courseId && item.lesson === lesson);
    return row ? row.status : 'planned';
  }

  /* Клік по уроку крутить статус по колу — швидше за будь-яке меню,
     коли вчитель відмічає прогрес прямо на уроці. */
  function nextStatus(current) {
    if (current === 'planned') return 'active';
    if (current === 'active') return 'done';
    return 'planned';
  }

  function confirmDialog(text) {
    return window.confirm(text);
  }

  /* Українська множина має ТРИ форми, а не дві: 1 учень, 2 учні, 5 учнів.
     Перевірка «=== 1 ? одн. : мн.» давала «2 учнів» — так писати не можна.
     Винятки 11–14 обов'язкові: 11 учнів, а не 11 учень. */
  function plural(count, one, few, many) {
    const n = Math.abs(Math.trunc(count));
    const tens = n % 100;
    if (tens >= 11 && tens <= 14) return many;
    const ones = n % 10;
    if (ones === 1) return one;
    if (ones >= 2 && ones <= 4) return few;
    return many;
  }

  function students(count) {
    return `${count} ${plural(count, 'учень', 'учні', 'учнів')}`;
  }

  /* Файл резервної копії — єдиний спосіб перенести класи на інший
     пристрій, поки дані живуть у localStorage. */
  function downloadJson(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function readJsonFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result));
        } catch (error) {
          reject(new Error('Файл пошкоджено або це не резервна копія.'));
        }
      };
      reader.onerror = () => reject(new Error('Не вдалося прочитати файл.'));
      reader.readAsText(file);
    });
  }

  return {
    STATUS_LABEL,
    STATUS_ICON,
    esc,
    initials,
    param,
    courses,
    course,
    courseAsset,
    fmtDate,
    fmtDateTime,
    message,
    clearMessage,
    requireTeacher,
    courseStats,
    statusOf,
    nextStatus,
    plural,
    students,
    confirmDialog,
    downloadJson,
    readJsonFile,
  };
})();

window.TC = TC;
