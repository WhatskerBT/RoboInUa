/**
 * Спільна розмітка уроків для сторінок розділу «Матеріали».
 * Використовують і огляд курсу, і сторінка окремого уроку.
 * (Режим уроку в кабінеті вчителя має власний рендер — там інша подача.)
 */

const CourseRender = (function () {
  'use strict';

  const DIFF = {
    easy: { cls: 'diff-easy', label: 'Легко' },
    med: { cls: 'diff-med', label: 'Середнє' },
    hard: { cls: 'diff-hard', label: 'Важко' },
  };

  const NOTE = {
    tip: { cls: 'note-tip', ico: 'lightbulb' },
    warn: { cls: 'note-warn', ico: 'warning' },
    info: { cls: 'note-info', ico: 'info' },
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Екрануємо, далі `код` у <code>, а **термін** у <strong>.
  function rich(value) {
    return esc(value)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  function difficulty(key) {
    return DIFF[key] || DIFF.med;
  }

  function block(item) {
    if (!item || !item.type) return '';

    switch (item.type) {
      case 'p':
        return `<p>${rich(item.text)}</p>`;

      case 'h':
        return `<h3 class="lesson-h">${esc(item.text)}</h3>`;

      case 'list': {
        const tag = item.ordered ? 'ol' : 'ul';
        const items = (item.items || []).map((entry) => `<li>${rich(entry)}</li>`).join('');
        return `<${tag}>${items}</${tag}>`;
      }

      case 'code':
        return `<pre><code>${esc(item.code)}</code></pre>`;

      case 'note': {
        const note = NOTE[item.variant] || NOTE.info;
        return `
          <div class="lesson-note ${note.cls}">
            <span class="material-symbols-rounded icon-filled note-ico">${note.ico}</span>
            <span>${rich(item.text)}</span>
          </div>`;
      }

      default:
        return '';
    }
  }

  function blocks(list) {
    return (list || []).map(block).join('\n');
  }

  function figures(lesson) {
    const items = (lesson.images || []).map((image) => `
      <figure class="lesson-figure">
        <img src="${encodeURI(image.src)}" alt="${esc(image.caption || lesson.title)}" loading="lazy" decoding="async">
        ${image.caption ? `<figcaption>${esc(image.caption)}</figcaption>` : ''}
      </figure>`).join('');
    return items ? `<div class="lesson-figures">${items}</div>` : '';
  }

  /* Джерело уроку. Буває трьох видів: локальний файл для завантаження,
     PDF для перегляду і зовнішнє посилання на оригінальний проєкт. */
  function oneSource(source) {
    if (!source) return '';

    if (source.type === 'link' && source.url) {
      return `
        <a class="lesson-source" href="${esc(source.url)}" target="_blank" rel="noopener">
          <span class="material-symbols-rounded">open_in_new</span>
          ${esc(source.label || 'Оригінальний матеріал')}
        </a>`;
    }

    if (!source.file) return '';
    const type = (source.type || '').toLowerCase();
    const isView = type === 'pdf';
    const icon = isView ? 'open_in_new' : 'download';
    const label = source.label || (isView ? 'Відкрити оригінал (PDF)'
      : type === 'docx' ? 'Завантажити конспект (DOCX)'
      : type === 'archive' ? 'Завантажити матеріали (архів)'
      : 'Завантажити оригінал');
    const attrs = isView ? ' target="_blank" rel="noopener"' : ' download';

    return `
      <a class="lesson-source" href="${encodeURI(source.file)}"${attrs}>
        <span class="material-symbols-rounded">${icon}</span>
        ${esc(label)}
      </a>`;
  }

  function sources(lesson) {
    if (Array.isArray(lesson.sources) && lesson.sources.length) {
      return lesson.sources.map(oneSource).join('');
    }
    return oneSource(lesson.source);
  }

  /* Блок атрибуції для курсів, адаптованих із чужих відкритих матеріалів.
     Вимога ліцензії CC BY-SA: назвати автора, дати посилання, зазначити
     ліцензію і поширювати похідне на тих самих умовах. */
  function credit(course) {
    if (!course || !course.credit) return '';
    const item = course.credit;
    return `
      <div class="course-credit">
        <span class="material-symbols-rounded m3-icon-20">info</span>
        <p>
          ${esc(item.text)}${item.url ? ` — <a href="${esc(item.url)}" target="_blank" rel="noopener">оригінал</a>` : ''}.
          Ліцензія <strong>${esc(item.licence || 'CC BY-SA')}</strong>; ця адаптація поширюється на тих самих умовах.
        </p>
      </div>`;
  }

  return { esc, rich, difficulty, block, blocks, figures, sources, credit, DIFF };
})();

window.CourseRender = CourseRender;
