/**
 * Курс для розділу «Матеріали».
 * Реєструється сам — файл підключають лише ті сторінки, яким цей курс
 * справді потрібен (огляд курсу бере метадані з js/courses-index.js).
 * Вміст — чистий JSON, щоб tools\build-course-index.ps1 міг його розібрати.
 *
 * ДЖЕРЕЛО: адаптовано з навчального шляху «More web» Raspberry Pi Foundation
 * (CC BY-SA 4.0). Ілюстрації — з тих самих проєктів.
 */
registerCourse(
{
  "id": "web-more",
  "title": "Веб: JavaScript",
  "subtitle": "Шість проєктів: сайт оживає — кнопки, теми, анімації прокрутки та вікторина",
  "icon": "javascript",
  "topic": "веб",
  "prereq": "web-intro",
  "badge": "6 проєктів",
  "cover": "img/cover.webp",
  "summary": "Продовження курсу «Веб: HTML і CSS». HTML дає структуру, CSS — вигляд, а JavaScript додає поведінку: реакцію на кліки, зміну вмісту, темну тему, анімації під час прокрутки й перевірку відповідей. За шість проєктів сторінки перетворюються на застосунки.",
  "audience": "Ті, хто вже зробив статичну сторінку: школярі 12–17 років, учителі інформатики",
  "credit": {
    "text": "Адаптовано з навчального шляху «More web» Raspberry Pi Foundation, ілюстрації — звідти ж",
    "url": "https://projects.raspberrypi.org/en/pathways/more-web",
    "licence": "CC BY-SA 4.0"
  },
  "lessons": [
    {
      "n": "1",
      "title": "Ласкаво просимо в Антарктиду",
      "subtitle": "Багатосторінковий сайт: навігація, сітка та доступні кольори",
      "difficulty": "easy",
      "sources": [
        { "type": "link", "url": "https://projects.raspberrypi.org/en/projects/welcome-to-antarctica", "label": "Оригінальний проєкт: Welcome to Antarctica" }
      ],
      "images": [
        { "src": "img/lesson1-1.webp", "caption": "Сайт про Антарктиду з навігацією та великим героїчним зображенням" }
      ],
      "blocks": [
        { "type": "p", "text": "Зробимо **сайт про місце, куди більшість із нас ніколи не потрапить, — Антарктиду**. На відміну від попереднього курсу, тут не одна сторінка, а кілька: головна, про тварин і про клімат." },
        { "type": "h", "text": "Кілька сторінок і посилання між ними" },
        { "type": "p", "text": "Кожна сторінка — окремий `.html`-файл у тій самій теці. Посилання між ними — звичайні відносні шляхи, без жодного `http`." },
        { "type": "code", "code": "<!-- у index.html -->\n<a href=\"wildlife.html\">Тварини</a>\n<a href=\"climate.html\">Клімат</a>\n\n<!-- у wildlife.html повертаємось назад -->\n<a href=\"index.html\">Головна</a>" },
        { "type": "note", "variant": "tip", "text": "Один файл стилів на всі сторінки. Підключіть `style.css` у кожній — і сайт виглядатиме цілісним, а правку кольору треба буде зробити один раз." },
        { "type": "h", "text": "Панель навігації" },
        { "type": "code", "code": "<nav class=\"navbar\">\n  <a href=\"index.html\" class=\"logo\">Антарктида</a>\n  <ul>\n    <li><a href=\"index.html\">Головна</a></li>\n    <li><a href=\"wildlife.html\">Тварини</a></li>\n    <li><a href=\"climate.html\">Клімат</a></li>\n  </ul>\n</nav>" },
        { "type": "code", "code": ".navbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 14px 24px;\n  background: #0b3d5c;\n  position: sticky;      /* лишається вгорі при прокрутці */\n  top: 0;\n}\n\n.navbar ul {\n  display: flex;\n  gap: 20px;\n  list-style: none;      /* прибрати крапки списку */\n  margin: 0;\n  padding: 0;\n}\n\n.navbar a {\n  color: #fff;\n  text-decoration: none;\n}" },
        { "type": "note", "variant": "info", "text": "Меню роблять саме списком `<ul>`. Візуально крапки прибирає `list-style: none`, а для програм читання з екрана лишається зрозуміла структура: «список із трьох пунктів»." },
        { "type": "h", "text": "Героїчне зображення" },
        { "type": "code", "code": ".hero {\n  height: 60vh;\n  background-image: url(\"antarctica.jpg\");\n  background-size: cover;\n  background-position: center;\n  display: grid;\n  place-items: center;\n  color: #fff;\n  text-shadow: 0 2px 12px rgba(0, 0, 0, .6);\n}" },
        { "type": "h", "text": "Сітка карток" },
        { "type": "code", "code": ".kartky {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));\n  gap: 20px;\n  padding: 40px 24px;\n}" },
        { "type": "h", "text": "Доступні кольори" },
        { "type": "p", "text": "Світло-сірий текст на білому виглядає стильно на екрані дизайнера й нечитабельно — на дешевому шкільному моніторі при денному світлі. Правило просте: **контраст тексту й фону має бути щонайменше 4,5 : 1**." },
        { "type": "list", "ordered": false, "items": [
          "Перевірити контраст можна безкоштовними інструментами на кшталт WebAIM Contrast Checker.",
          "Не передавайте зміст **лише** кольором: «червоні пункти обов'язкові» — погано, бо частина людей не розрізняє червоний і зелений. Додайте значок або слово.",
          "Розмір основного тексту — від 16 пікселів. Менше читають лише з примусу."
        ] },
        { "type": "h", "text": "Виклик" },
        { "type": "list", "ordered": false, "items": [
          "Додайте четверту сторінку — про дослідницькі станції.",
          "Зробіть поточний пункт меню виділеним (окремий клас `active`).",
          "Перевірте сайт на телефоні: чи не ламається меню на вузькому екрані?"
        ] }
      ],
      "checkpoint": "Я зробив сайт із кількох сторінок зі спільними стилями, зібрав липку панель навігації на flexbox, додав героїчне зображення й сітку карток, і перевірив контраст кольорів."
    },
    {
      "n": "2",
      "title": "Конструктор супергероя",
      "subtitle": "Перший JavaScript: зміна тексту, показ і приховування, темна тема",
      "difficulty": "med",
      "sources": [
        { "type": "link", "url": "https://projects.raspberrypi.org/en/projects/comic-character", "label": "Оригінальний проєкт: Comic character" }
      ],
      "images": [
        { "src": "img/lesson2-1.webp", "caption": "Інтерактивний сайт, де користувач створює власного супергероя" }
      ],
      "blocks": [
        { "type": "p", "text": "**Сайт, на якому користувач створює власного супергероя.** Тут з'являється третя мова вебу — **JavaScript**. Якщо HTML — це скелет, а CSS — одяг, то JavaScript — м'язи: він змушує сторінку реагувати." },
        { "type": "h", "text": "Як підключити" },
        { "type": "code", "code": "<!-- наприкінці <body>, перед закриваючим тегом -->\n<script src=\"script.js\"></script>\n</body>" },
        { "type": "note", "variant": "warn", "text": "Саме **наприкінці** `<body>`. Якщо підключити скрипт у `<head>`, він виконається до того, як браузер створить елементи сторінки, — і не знайде нічого, чим керувати." },
        { "type": "h", "text": "Крок 1. Знайти елемент і змінити текст" },
        { "type": "code", "code": "<h2 id=\"imya-heroya\">Безіменний</h2>\n<input id=\"pole-imeni\" type=\"text\" placeholder=\"Ім'я героя\">\n<button id=\"knopka\">Застосувати</button>" },
        { "type": "code", "code": "const zagolovok = document.getElementById(\"imya-heroya\");\nconst pole = document.getElementById(\"pole-imeni\");\nconst knopka = document.getElementById(\"knopka\");\n\nknopka.addEventListener(\"click\", function () {\n  zagolovok.textContent = pole.value;\n});" },
        { "type": "list", "ordered": false, "items": [
          "`document.getElementById(\"…\")` — знайти елемент за його `id`.",
          "`.textContent` — текст усередині елемента; присвоєння змінює його миттєво.",
          "`.value` — те, що написано в полі введення.",
          "`addEventListener(\"click\", …)` — «коли натиснуть, виконай оце». Це той самий обробник події, що `коли спрайт натиснуто` у Scratch."
        ] },
        { "type": "h", "text": "Крок 2. Показати й сховати" },
        { "type": "code", "code": "<img id=\"plashch\" src=\"plashch.png\" alt=\"Плащ героя\">\n<button id=\"knopka-plashcha\">Показати / сховати плащ</button>" },
        { "type": "code", "code": "const plashch = document.getElementById(\"plashch\");\nconst knopkaPlashcha = document.getElementById(\"knopka-plashcha\");\n\nknopkaPlashcha.addEventListener(\"click\", function () {\n  plashch.classList.toggle(\"hidden\");\n});" },
        { "type": "code", "code": "/* у файлі стилів */\n.hidden {\n  display: none;\n}" },
        { "type": "note", "variant": "tip", "text": "Правильний підхід: JavaScript **не задає стилі напряму**, а додає й прибирає класи. Уся зовнішність лишається в CSS, і поміняти вигляд можна, не торкаючись коду." },
        { "type": "h", "text": "Крок 3. Світла й темна тема" },
        { "type": "code", "code": "<button id=\"tema\">Змінити тему</button>" },
        { "type": "code", "code": "const knopkaTemy = document.getElementById(\"tema\");\n\nknopkaTemy.addEventListener(\"click\", function () {\n  const temna = document.body.classList.toggle(\"dark\");\n  localStorage.setItem(\"tema\", temna ? \"dark\" : \"light\");\n});\n\n// відновити вибір при завантаженні сторінки\nif (localStorage.getItem(\"tema\") === \"dark\") {\n  document.body.classList.add(\"dark\");\n}" },
        { "type": "code", "code": "body {\n  background: #fff;\n  color: #14161a;\n}\n\nbody.dark {\n  background: #15131a;\n  color: #f2f4f7;\n}" },
        { "type": "p", "text": "**`localStorage`** — це маленька комірка пам'яті браузера. Записане туди переживає перезавантаження сторінки й закриття вкладки. Саме так сайти пам'ятають вибрану тему." },
        { "type": "h", "text": "Крок 4. Гортання зображень" },
        { "type": "code", "code": "<img id=\"kostyum\" src=\"heroy1.png\" alt=\"Костюм героя\">\n<button id=\"dali\">Наступний костюм</button>" },
        { "type": "code", "code": "const kartynky = [\"heroy1.png\", \"heroy2.png\", \"heroy3.png\"];\nlet potochna = 0;\nconst zobrazhennya = document.getElementById(\"kostyum\");\n\ndocument.getElementById(\"dali\").addEventListener(\"click\", function () {\n  potochna = potochna + 1;\n  if (potochna >= kartynky.length) {\n    potochna = 0;              // по колу\n  }\n  zobrazhennya.src = kartynky[potochna];\n});" },
        { "type": "h", "text": "Виклик" },
        { "type": "list", "ordered": false, "items": [
          "Додайте вибір кольору костюма через `<input type=\"color\">`.",
          "Зробіть кнопку «Випадковий герой», яка вибирає все навмання.",
          "Збережіть створеного героя в `localStorage`, щоб він лишався після перезавантаження."
        ] }
      ],
      "checkpoint": "Я підключив JavaScript, навчився знаходити елементи за id, змінювати текст і зображення, перемикати класи замість прямих стилів і зберігати вибір користувача в localStorage."
    },
    {
      "n": "3",
      "title": "Анімована історія",
      "subtitle": "Реакція на прокрутку, поява елементів і відкладене завантаження зображень",
      "difficulty": "med",
      "sources": [
        { "type": "link", "url": "https://projects.raspberrypi.org/en/projects/animated-story", "label": "Оригінальний проєкт: Animated story" }
      ],
      "images": [
        { "src": "img/lesson3-1.webp", "caption": "Історія, у якій текст і картинки з'являються під час прокрутки" }
      ],
      "blocks": [
        { "type": "p", "text": "**Інтерактивна історія, у якій текст і персонажі оживають, коли читач гортає сторінку.** Прийом, який ви бачили на десятках сучасних сайтів, — і він простіший, ніж здається." },
        { "type": "h", "text": "Ідея у двох кроках" },
        { "type": "list", "ordered": true, "items": [
          "У CSS елемент спочатку **невидимий і трохи зміщений**.",
          "JavaScript помічає, що елемент з'явився в полі зору, і додає йому клас — CSS плавно повертає його на місце."
        ] },
        { "type": "code", "code": ".zyavlyayetsya {\n  opacity: 0;\n  transform: translateY(40px);\n  transition: opacity .6s ease, transform .6s ease;\n}\n\n.zyavlyayetsya.vydno {\n  opacity: 1;\n  transform: translateY(0);\n}" },
        { "type": "h", "text": "Хто стежить за появою" },
        { "type": "p", "text": "Раніше для цього рахували позицію прокрутки вручну — і сторінка помітно гальмувала. Тепер є **`IntersectionObserver`**: браузер сам повідомляє, коли елемент потрапив у видиму частину." },
        { "type": "code", "code": "const elementy = document.querySelectorAll(\".zyavlyayetsya\");\n\nconst sposterigach = new IntersectionObserver(function (zapysy) {\n  zapysy.forEach(function (zapys) {\n    if (zapys.isIntersecting) {\n      zapys.target.classList.add(\"vydno\");\n      sposterigach.unobserve(zapys.target);   // спрацювало один раз — досить\n    }\n  });\n}, { threshold: 0.2 });                      // 20% елемента у полі зору\n\nelementy.forEach(function (element) {\n  sposterigach.observe(element);\n});" },
        { "type": "note", "variant": "info", "text": "`querySelectorAll` знаходить **усі** елементи за CSS-селектором і повертає список. `getElementById` — лише один. Друге швидше, перше зручніше, коли елементів багато." },
        { "type": "h", "text": "Відкладене завантаження зображень" },
        { "type": "p", "text": "Довга історія з десятком картинок вантажилася б болісно довго. Одне слово в HTML вирішує проблему: браузер завантажить зображення лише тоді, коли читач до нього догортає." },
        { "type": "code", "code": "<img src=\"scena3.jpg\" alt=\"Герой заходить до печери\" loading=\"lazy\" width=\"800\" height=\"500\">" },
        { "type": "note", "variant": "warn", "text": "Обов'язково вказуйте `width` і `height`. Інакше браузер не знає, скільки місця займе картинка, і текст стрибатиме під час завантаження — читач втратить рядок, який саме читав." },
        { "type": "h", "text": "Повага до тих, кому анімація заважає" },
        { "type": "p", "text": "Частині людей рух на екрані спричиняє запаморочення. У системах є налаштування «зменшити рух», і його треба поважати:" },
        { "type": "code", "code": "@media (prefers-reduced-motion: reduce) {\n  .zyavlyayetsya {\n    opacity: 1;\n    transform: none;\n    transition: none;\n  }\n}" },
        { "type": "h", "text": "Виклик" },
        { "type": "list", "ordered": false, "items": [
          "Зробіть, щоб елементи з'являлися по черзі з невеликою затримкою.",
          "Додайте бічне меню з посиланнями на розділи історії.",
          "Зробіть смужку прогресу читання вгорі сторінки."
        ] }
      ],
      "checkpoint": "Я зробив історію, у якій елементи з'являються під час прокрутки через IntersectionObserver, увімкнув відкладене завантаження зображень і додав повагу до налаштування «зменшити рух»."
    },
    {
      "n": "4",
      "title": "Обери улюблене",
      "subtitle": "Кнопки змінюють увесь вигляд сторінки, а вибір запам'ятовується",
      "difficulty": "med",
      "sources": [
        { "type": "link", "url": "https://projects.raspberrypi.org/en/projects/pick-your-favourite", "label": "Оригінальний проєкт: Pick your favourite" }
      ],
      "images": [
        { "src": "img/lesson4-1.webp", "caption": "Фан-сторінка, вміст і кольори якої змінюються за вибором користувача" }
      ],
      "blocks": [
        { "type": "p", "text": "**Фан-сторінка, на якій користувач обирає варіант — і змінюється весь вигляд сторінки**: кольори, тексти, зображення. Улюблена команда, гурт, серіал, порода котів — тема ваша." },
        { "type": "h", "text": "Дані окремо від коду" },
        { "type": "p", "text": "Найважливіша ідея уроку: **не пишіть три майже однакові функції для трьох варіантів**. Опишіть варіанти як дані, а код лишіть один." },
        { "type": "code", "code": "const varianty = {\n  dynamo: {\n    nazva: \"Динамо\",\n    kolir: \"#1e5fa8\",\n    gaslo: \"Синьо-білі кольори з 1927 року\",\n    foto: \"dynamo.jpg\"\n  },\n  shakhtar: {\n    nazva: \"Шахтар\",\n    kolir: \"#e87a1e\",\n    gaslo: \"Помаранчево-чорна витримка\",\n    foto: \"shakhtar.jpg\"\n  },\n  polissya: {\n    nazva: \"Полісся\",\n    kolir: \"#2f8f4e\",\n    gaslo: \"Зелене серце Житомира\",\n    foto: \"polissya.jpg\"\n  }\n};" },
        { "type": "p", "text": "Така конструкція називається **об'єктом**: набір пар «ключ — значення». Доступ до вкладеного значення — через крапку або квадратні дужки: `varianty.dynamo.nazva` або `varianty[\"dynamo\"][\"nazva\"]`." },
        { "type": "h", "text": "Одна функція на всі варіанти" },
        { "type": "code", "code": "function zastosuvaty(klyuch) {\n  const v = varianty[klyuch];\n\n  document.getElementById(\"nazva\").textContent = v.nazva;\n  document.getElementById(\"gaslo\").textContent = v.gaslo;\n  document.getElementById(\"foto\").src = v.foto;\n  document.documentElement.style.setProperty(\"--aktsent\", v.kolir);\n\n  localStorage.setItem(\"ulyublene\", klyuch);\n}" },
        { "type": "note", "variant": "tip", "text": "`style.setProperty(\"--aktsent\", …)` змінює **CSS-змінну** одразу для всієї сторінки. Один рядок JavaScript перефарбовує все, що на цю змінну спирається, — кнопки, рамки, заголовки." },
        { "type": "h", "text": "Кнопки без копіювання коду" },
        { "type": "code", "code": "<button class=\"vybir\" data-klyuch=\"dynamo\">Динамо</button>\n<button class=\"vybir\" data-klyuch=\"shakhtar\">Шахтар</button>\n<button class=\"vybir\" data-klyuch=\"polissya\">Полісся</button>" },
        { "type": "code", "code": "document.querySelectorAll(\".vybir\").forEach(function (knopka) {\n  knopka.addEventListener(\"click\", function () {\n    zastosuvaty(knopka.dataset.klyuch);\n  });\n});" },
        { "type": "p", "text": "Атрибути, що починаються з `data-`, — це власні дані, які можна причепити просто до HTML-елемента. У JavaScript вони доступні через `.dataset`. Додати четверту команду тепер = дописати один рядок HTML і один блок даних. Код не змінюється взагалі." },
        { "type": "h", "text": "Пам'ять між візитами" },
        { "type": "code", "code": "const zbereglosya = localStorage.getItem(\"ulyublene\");\nzastosuvaty(zbereglosya || \"dynamo\");     // або збережене, або типове" },
        { "type": "note", "variant": "info", "text": "Запис `a || b` означає «візьми `a`, а якщо його немає — візьми `b`». Дуже поширений спосіб задати значення за замовчуванням." },
        { "type": "h", "text": "Виклик" },
        { "type": "list", "ordered": false, "items": [
          "Додайте четвертий варіант — переконайтеся, що код міняти не довелося.",
          "Підсвічуйте кнопку поточного вибору окремим класом.",
          "Додайте кнопку «Скинути», яка очищає збережений вибір."
        ] }
      ],
      "checkpoint": "Я описав варіанти сторінки об'єктом даних, написав одну функцію, що застосовує будь-який із них, зв'язав кнопки через data-атрибути й зберіг вибір користувача між візитами."
    },
    {
      "n": "5",
      "title": "Вікторина",
      "subtitle": "Вебзастосунок: масив питань, перевірка відповідей і підрахунок балів",
      "difficulty": "hard",
      "sources": [
        { "type": "link", "url": "https://projects.raspberrypi.org/en/projects/quiz-time", "label": "Оригінальний проєкт: Quiz time" }
      ],
      "images": [
        { "src": "img/lesson5-1.webp", "caption": "Вікторина з анімованою зміною питань і підрахунком результату" }
      ],
      "blocks": [
        { "type": "p", "text": "**Вікторина на будь-яку тему**: історія, природа, спорт, кіно, робототехніка. Це вже не сторінка, а невеликий застосунок — зі станом, логікою й результатом." },
        { "type": "h", "text": "Питання як дані" },
        { "type": "code", "code": "const pytannya = [\n  {\n    tekst: \"Скільки цифрових контактів на Arduino Uno?\",\n    varianty: [\"10\", \"14\", \"20\"],\n    pravylna: 1                 // нумерація з нуля!\n  },\n  {\n    tekst: \"Яка мова задає структуру вебсторінки?\",\n    varianty: [\"CSS\", \"HTML\", \"Python\"],\n    pravylna: 1\n  },\n  {\n    tekst: \"Що робить блок «завжди» у Scratch?\",\n    varianty: [\"Повторює вічно\", \"Виконує раз\", \"Зупиняє гру\"],\n    pravylna: 0\n  }\n];" },
        { "type": "h", "text": "Стан застосунку" },
        { "type": "p", "text": "Будь-який застосунок має **стан** — кілька змінних, які повністю описують, що зараз відбувається. У вікторині їх дві." },
        { "type": "code", "code": "let nomer = 0;      // яке питання показуємо\nlet bal = 0;        // скільки правильних" },
        { "type": "h", "text": "Показати питання" },
        { "type": "code", "code": "function pokazaty() {\n  const p = pytannya[nomer];\n\n  document.getElementById(\"pytannya\").textContent = p.tekst;\n  document.getElementById(\"progres\").textContent =\n    \"Питання \" + (nomer + 1) + \" з \" + pytannya.length;\n\n  const spysok = document.getElementById(\"varianty\");\n  spysok.innerHTML = \"\";                    // прибрати попередні кнопки\n\n  p.varianty.forEach(function (tekst, indeks) {\n    const knopka = document.createElement(\"button\");\n    knopka.textContent = tekst;\n    knopka.addEventListener(\"click\", function () {\n      pereviryty(indeks);\n    });\n    spysok.appendChild(knopka);\n  });\n}" },
        { "type": "p", "text": "Тут кнопки **створюються кодом**, а не пишуться в HTML. Це важливий крок: розмітка більше не фіксована, вона будується з даних. Саме так працюють усі сучасні вебзастосунки." },
        { "type": "h", "text": "Перевірка та перехід далі" },
        { "type": "code", "code": "function pereviryty(vybir) {\n  if (vybir === pytannya[nomer].pravylna) {\n    bal = bal + 1;\n  }\n\n  nomer = nomer + 1;\n\n  if (nomer < pytannya.length) {\n    pokazaty();\n  } else {\n    pokazatyResultat();\n  }\n}\n\nfunction pokazatyResultat() {\n  document.getElementById(\"pytannya\").textContent = \"Готово!\";\n  document.getElementById(\"varianty\").innerHTML = \"\";\n  document.getElementById(\"progres\").textContent =\n    \"Ваш результат: \" + bal + \" з \" + pytannya.length;\n}\n\npokazaty();          // запуск" },
        { "type": "note", "variant": "warn", "text": "Порівняння в JavaScript пишуть трьома знаками: `===`. Два знаки (`==`) мовчки перетворюють типи, і `\"1\" == 1` виявляється істиною. Для новачка це джерело помилок, які важко знайти." },
        { "type": "h", "text": "Анімація зміни питання" },
        { "type": "code", "code": ".karta {\n  transition: opacity .25s ease, transform .25s ease;\n}\n\n.karta.znykaye {\n  opacity: 0;\n  transform: translateX(-30px);\n}" },
        { "type": "code", "code": "const karta = document.getElementById(\"karta\");\nkarta.classList.add(\"znykaye\");\nsetTimeout(function () {\n  pokazaty();\n  karta.classList.remove(\"znykaye\");\n}, 250);" },
        { "type": "h", "text": "Виклик" },
        { "type": "list", "ordered": false, "items": [
          "Показуйте після відповіді, чи вона правильна, перед переходом до наступного питання.",
          "Перемішуйте питання випадково при кожному запуску.",
          "Збережіть найкращий результат у `localStorage` і показуйте його як рекорд."
        ] }
      ],
      "checkpoint": "Я зробив вікторину: описав питання масивом об'єктів, тримав стан у двох змінних, будував кнопки відповідей кодом, перевіряв вибір і показував підсумковий результат."
    },
    {
      "n": "6",
      "title": "Поділися своїм світом",
      "subtitle": "Підсумковий проєкт: інтерактивний сайт на власну тему",
      "difficulty": "hard",
      "sources": [
        { "type": "link", "url": "https://projects.raspberrypi.org/en/projects/share-your-world", "label": "Оригінальний проєкт: Share your world" }
      ],
      "images": [
        { "src": "img/lesson6-1.webp", "caption": "Приклади підсумкових проєктів на різні теми" }
      ],
      "blocks": [
        { "type": "p", "text": "Підсумкова робота курсу — **інтерактивний сайт про частину вашого світу**. Про своє місто, гурток, захоплення, домашню тварину, шкільний проєкт, улюблену справу. Тему обираєте ви; вимоги стосуються лише того, що сайт має вміти." },
        { "type": "h", "text": "Вимоги" },
        { "type": "list", "ordered": true, "items": [
          "Щонайменше **дві сторінки** зі спільною навігацією.",
          "Щонайменше **три різні дії JavaScript** — наприклад: перемикач теми, кнопка, що змінює вміст, поява елементів під час прокрутки.",
          "Одна річ, що **запам'ятовується** через `localStorage`.",
          "Зображення з осмисленим `alt` і `loading=\"lazy\"`.",
          "Сайт коректно виглядає на телефоні й читабельний за контрастом."
        ] },
        { "type": "h", "text": "Порядок роботи" },
        { "type": "list", "ordered": true, "items": [
          "**Вміст.** Напишіть тексти. Без них немає що програмувати.",
          "**Структура.** Розкладіть по сторінках і секціях чистим HTML.",
          "**Вигляд.** CSS: палітра змінними, пара шрифтів, сітка.",
          "**Поведінка.** Аж тепер JavaScript — по одній дії за раз, перевіряючи кожну.",
          "**Перевірка.** Вузьке вікно, клавіатура замість миші, консоль браузера без червоних помилок."
        ] },
        { "type": "note", "variant": "tip", "text": "Клавіша **F12** відкриває інструменти розробника. Вкладка **Console** показує помилки JavaScript із номером рядка. Звичка заглядати туди при кожній дивній поведінці економить години." },
        { "type": "h", "text": "Часті помилки та як їх упізнати" },
        { "type": "list", "ordered": false, "items": [
          "**`Cannot read properties of null`** — `getElementById` не знайшов елемент. Перевірте написання `id` і те, що скрипт підключено наприкінці `<body>`.",
          "**Кнопка не реагує** — забули `addEventListener` або помилилися в селекторі.",
          "**Усе працює один раз і ламається** — стан не скидається; перевірте змінні, які мали повернутися до початкових значень.",
          "**На телефоні з'їхало** — десь фіксована ширина в пікселях замість `max-width`."
        ] },
        { "type": "h", "text": "Що взяти з попередніх уроків" },
        { "type": "list", "ordered": false, "items": [
          "**Урок 1** — кілька сторінок, навігація, сітка, доступні кольори.",
          "**Урок 2** — пошук елементів, зміна тексту, класи, темна тема, `localStorage`.",
          "**Урок 3** — поява під час прокрутки й відкладене завантаження зображень.",
          "**Урок 4** — дані окремо від коду, `data`-атрибути, одна функція на всі варіанти.",
          "**Урок 5** — стан застосунку, побудова елементів кодом, перевірка й підрахунок."
        ] },
        { "type": "note", "variant": "info", "text": "Опублікувати результат можна безкоштовно через GitHub Pages: завантажуєте файли в репозиторій, вмикаєте Pages у налаштуваннях — і сайт має справжню адресу, якою можна поділитися." },
        { "type": "h", "text": "Виклик" },
        { "type": "list", "ordered": false, "items": [
          "Додайте форму зворотного зв'язку з перевіркою заповнення полів.",
          "Зробіть просту гру або вікторину як окрему сторінку.",
          "Покажіть сайт людині, яка про вашу тему нічого не знає, і послухайте, що їй незрозуміло."
        ] }
      ],
      "checkpoint": "Я самостійно зробив інтерактивний сайт на власну тему: кілька сторінок, три різні дії JavaScript, збереження вибору користувача, доступні кольори й коректний вигляд на телефоні."
    }
  ]
}
);
