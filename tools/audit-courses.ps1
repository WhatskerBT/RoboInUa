# Перевірка змісту курсів: структура даних, типи блоків, розмітка, картинки,
# джерела й ліцензії. Запускати після зміни будь-якого курсу — разом із
# tools\build-course-index.ps1.
#
#     powershell -ExecutionPolicy Bypass -File tools\audit-courses.ps1
#
# Що ловить (те, чого не видно оком, доки не відкриєш кожен урок):
#   * невідомий type блоку — CourseRender віддає порожній рядок, і блок
#     мовчки зникає зі сторінки;
#   * непарні ` або ** — розмітка rich() надрукується буквально;
#   * розрив нумерації уроків, невідомий difficulty, badge, що бреше
#     про кількість уроків;
#   * картинку чи архів, яких немає на диску, і картинки-сироти в теці;
#   * джерело з типом, якого рендерер не знає; credit без ліцензії.
# Зовнішні посилання тут НЕ перевіряються — для них потрібна мережа;
# перелік вивантажується у tools\course-urls.csv поруч зі скриптом.
#
# ПАСТКА: -match у PowerShell регістронезалежний, тож перевірка мохібейку
# мусить бути -cmatch. Інакше «Отвір» (мала «р» + «») летить у помилки.
$ErrorActionPreference = 'Stop'
# Корінь беремо від розташування скрипта, як у build-course-index.ps1.
# З захардкодженим шляхом копія проєкту в іншій теці мовчки аудитувала б стару.
$root = Split-Path -Parent $PSScriptRoot
$coursesDir = Join-Path $root 'js\courses'

$BLOCK_TYPES = @('p', 'h', 'list', 'code', 'note')
$NOTE_VARIANTS = @('tip', 'warn', 'info')
$DIFFS = @('easy', 'med', 'hard')
$SOURCE_TYPES = @('link', 'pdf', 'docx', 'archive')

$issues = @()
function Add-Issue($level, $course, $where, $text) {
    $script:issues += [pscustomobject]@{ Level = $level; Course = $course; Where = $where; Text = $text }
}

function Read-Utf8($path) {
    return [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))
}

# Текст, який проходить через rich(): непарні ` або ** віддрукуються буквально.
function Check-Rich($course, $where, $text) {
    if ($null -eq $text) { return }
    $ticks = ([regex]::Matches($text, '`')).Count
    if ($ticks % 2 -ne 0) { Add-Issue 'ERROR' $course $where "непарна кількість зворотних лапок (``) — розмітка коду зламана" }
    $stars = ([regex]::Matches($text, '\*\*')).Count
    if ($stars % 2 -ne 0) { Add-Issue 'ERROR' $course $where "непарна кількість ** — жирний текст не закрито" }
    # Мохібейк від UTF-8, прочитаного як cp1251: байти D0/D1 стають 'Р'/'С',
    # а другий байт — символом із Latin-1 (°, ¤, µ…) або сербською літерою.
    # Ці пари в українському тексті не трапляються ніколи.
    if ($text -cmatch '[РС][-¿]' -or $text -cmatch '[ЂЃЉЊЌЋЏђљњќћџЅѕЎў]') {
        Add-Issue 'ERROR' $course $where "схоже на подвійне кодування (мохібейк)"
    }
    if ($text -match '\s{3,}') { Add-Issue 'WARN' $course $where "три і більше пробілів поспіль" }
    if ($text -match '(?<![\d\p{L}])\?\?\?|TODO|FIXME|Lorem ipsum') { Add-Issue 'WARN' $course $where "лишився чернетковий маркер" }
}

$allIds = @()
$parsed = @{}
$urls = @()

# Згенерований індекс — щоб перевірити, чи його не забули перезібрати.
$indexById = @{}
$indexPath = Join-Path $root 'js\courses-index.js'
if (Test-Path $indexPath) {
    $raw = Read-Utf8 $indexPath
    $from = $raw.IndexOf('[')
    $to = $raw.LastIndexOf(']')
    if ($from -ge 0 -and $to -gt $from) {
        foreach ($entry in ($raw.Substring($from, $to - $from + 1) | ConvertFrom-Json)) {
            $indexById[$entry.id] = $entry
        }
    }
}
else {
    Add-Issue 'ERROR' '(усі)' 'індекс' 'немає js\courses-index.js — запустіть tools\build-course-index.ps1'
}

foreach ($file in (Get-ChildItem $coursesDir -Filter *.js -File | Sort-Object Name)) {
    $name = [IO.Path]::GetFileNameWithoutExtension($file.Name)
    $text = Read-Utf8 $file.FullName
    $open = $text.IndexOf('registerCourse(')
    if ($open -lt 0) { Add-Issue 'ERROR' $name 'файл' 'немає registerCourse()'; continue }
    $start = $text.IndexOf('{', $open)
    $end = $text.LastIndexOf('}')
    try {
        $course = $text.Substring($start, $end - $start + 1) | ConvertFrom-Json
    } catch {
        Add-Issue 'ERROR' $name 'файл' "не чистий JSON: $($_.Exception.Message)"
        continue
    }
    $parsed[$name] = $course
    $allIds += $course.id
    if ($course.id -ne $name) { Add-Issue 'ERROR' $name 'id' "id='$($course.id)' не збігається з іменем файлу" }
}

foreach ($name in ($parsed.Keys | Sort-Object)) {
    $course = $parsed[$name]
    $dir = Join-Path $root "materials\$name"

    # ── оболонки сторінок ──
    foreach ($shell in 'index.html', 'lesson.html') {
        if (-not (Test-Path (Join-Path $dir $shell))) { Add-Issue 'ERROR' $name 'сторінки' "немає materials\$name\$shell" }
    }

    # ── обов'язкові поля ──
    foreach ($field in 'title', 'subtitle', 'icon', 'badge', 'summary') {
        if (-not $course.$field) { Add-Issue 'ERROR' $name 'метадані' "порожнє поле '$field'" }
    }
    foreach ($field in 'topic', 'audience', 'cover') {
        if (-not $course.$field) { Add-Issue 'WARN' $name 'метадані' "немає поля '$field'" }
    }
    Check-Rich $name 'summary' $course.summary
    Check-Rich $name 'subtitle' $course.subtitle
    Check-Rich $name 'title' $course.title
    Check-Rich $name 'audience' $course.audience
    Check-Rich $name 'archiveNote' $course.archiveNote
    if ($course.credit) { Check-Rich $name 'credit' $course.credit.text }

    if ($course.prereq -and $allIds -notcontains $course.prereq) {
        Add-Issue 'ERROR' $name 'метадані' "prereq='$($course.prereq)' — такого курсу немає"
    }

    $lessons = @($course.lessons)
    if (-not $lessons.Count) { Add-Issue 'ERROR' $name 'уроки' 'жодного уроку'; continue }

    # badge на кшталт «6 уроків» / «8 занять» має збігатися з кількістю
    if ($course.badge -match '(\d+)') {
        $claimed = [int]$Matches[1]
        if ($claimed -ne $lessons.Count) {
            Add-Issue 'ERROR' $name 'метадані' "badge каже '$($course.badge)', а уроків $($lessons.Count)"
        }
    }

    if ($course.cover) {
        $coverPath = Join-Path $dir ($course.cover -replace '/', '\')
        if (-not (Test-Path $coverPath)) { Add-Issue 'ERROR' $name 'обкладинка' "немає файлу $($course.cover)" }
    }

    if ($course.downloadFile) {
        # шлях відносно materials\<id>\ — саме звідти його відкриває сторінка курсу
        $dl = Join-Path $dir ($course.downloadFile -replace '/', '\')
        if (-not (Test-Path $dl)) { Add-Issue 'ERROR' $name 'завантаження' "немає файлу $($course.downloadFile)" }
        if (-not $course.downloadLabel) { Add-Issue 'WARN' $name 'завантаження' 'є downloadFile, але немає downloadLabel' }
    }

    if ($course.credit) {
        if (-not $course.credit.text) { Add-Issue 'ERROR' $name 'ліцензія' 'credit без тексту' }
        if (-not $course.credit.url) { Add-Issue 'WARN' $name 'ліцензія' 'credit без посилання на оригінал' }
        if (-not $course.credit.licence) { Add-Issue 'WARN' $name 'ліцензія' 'credit без назви ліцензії' }
        if ($course.credit.url) { $urls += [pscustomobject]@{ Course = $name; Where = 'credit'; Url = $course.credit.url } }
    }

    # ── уроки ──
    $usedImages = @()
    $titles = @()
    $i = 0
    foreach ($lesson in $lessons) {
        $i++
        $tag = "урок $($lesson.n)"

        if ("$($lesson.n)" -ne "$i") { Add-Issue 'ERROR' $name 'нумерація' "$i-й урок має n='$($lesson.n)'" }
        if (-not $lesson.title) { Add-Issue 'ERROR' $name $tag 'без назви' }
        if (-not $lesson.subtitle) { Add-Issue 'WARN' $name $tag 'без підзаголовка' }
        if ($DIFFS -notcontains $lesson.difficulty) { Add-Issue 'ERROR' $name $tag "difficulty='$($lesson.difficulty)' — має бути easy/med/hard" }
        if (-not $lesson.checkpoint) { Add-Issue 'WARN' $name $tag 'без checkpoint (буде типове «Я опрацював цей урок»)' }
        if ($titles -contains $lesson.title) { Add-Issue 'WARN' $name $tag "назва повторюється: «$($lesson.title)»" }
        $titles += $lesson.title
        Check-Rich $name "$tag / title" $lesson.title
        Check-Rich $name "$tag / subtitle" $lesson.subtitle
        Check-Rich $name "$tag / checkpoint" $lesson.checkpoint

        # блоки
        $blocks = @($lesson.blocks)
        if (-not $blocks.Count) { Add-Issue 'ERROR' $name $tag 'жодного блоку тексту' }
        # Поріг навмисно низький: оглядовий урок на 4 блоки — нормально, а от
        # 1–2 блоки означають, що урок недописали. Реальну «стіну тексту»
        # ловить окрема перевірка «жодного заголовка» нижче.
        elseif ($blocks.Count -lt 3) { Add-Issue 'WARN' $name $tag "лише $($blocks.Count) блоків — урок, схоже, недописаний" }

        $headings = 0
        $b = 0
        foreach ($block in $blocks) {
            $b++
            $bt = "$tag / блок $b"
            if (-not $block.type) { Add-Issue 'ERROR' $name $bt 'блок без type — не відрендериться'; continue }
            if ($BLOCK_TYPES -notcontains $block.type) {
                Add-Issue 'ERROR' $name $bt "тип '$($block.type)' рендерер не знає — блок зникне зі сторінки"
                continue
            }
            switch ($block.type) {
                'p' {
                    if (-not $block.text) { Add-Issue 'ERROR' $name $bt 'абзац без тексту' }
                    Check-Rich $name $bt $block.text
                }
                'h' {
                    $headings++
                    if (-not $block.text) { Add-Issue 'ERROR' $name $bt 'заголовок без тексту' }
                    Check-Rich $name $bt $block.text
                }
                'note' {
                    if (-not $block.text) { Add-Issue 'ERROR' $name $bt 'нотатка без тексту' }
                    if ($block.variant -and $NOTE_VARIANTS -notcontains $block.variant) {
                        Add-Issue 'ERROR' $name $bt "variant='$($block.variant)' невідомий — покажеться як info"
                    }
                    if (-not $block.variant) { Add-Issue 'WARN' $name $bt 'нотатка без variant' }
                    Check-Rich $name $bt $block.text
                }
                'code' {
                    if (-not $block.code) { Add-Issue 'ERROR' $name $bt 'блок коду порожній' }
                }
                'list' {
                    $items = @($block.items)
                    if (-not $items.Count) { Add-Issue 'ERROR' $name $bt 'список без пунктів' }
                    $k = 0
                    foreach ($item in $items) {
                        $k++
                        if (-not $item) { Add-Issue 'ERROR' $name $bt "пункт $k порожній" }
                        Check-Rich $name "$bt / пункт $k" $item
                    }
                }
            }
        }
        if ($headings -eq 0) { Add-Issue 'WARN' $name $tag 'жодного заголовка (h) — у режимі уроку буде один суцільний слайд' }

        # картинки
        foreach ($image in @($lesson.images)) {
            if (-not $image) { continue }
            if (-not $image.src) { Add-Issue 'ERROR' $name $tag 'картинка без src'; continue }
            $usedImages += ($image.src -replace '/', '\')
            $path = Join-Path $dir ($image.src -replace '/', '\')
            if (-not (Test-Path $path)) { Add-Issue 'ERROR' $name $tag "немає файлу картинки $($image.src)" }
            if (-not $image.caption) { Add-Issue 'WARN' $name $tag "картинка $($image.src) без підпису (alt візьметься з назви уроку)" }
        }

        # джерела
        $srcList = @()
        if ($lesson.sources) { $srcList = @($lesson.sources) }
        elseif ($lesson.source) { $srcList = @($lesson.source) }
        foreach ($source in $srcList) {
            if (-not $source) { continue }
            if ($SOURCE_TYPES -notcontains $source.type) { Add-Issue 'ERROR' $name $tag "джерело з типом '$($source.type)' — рендерер знає лише link/pdf/docx/archive" }
            if ($source.type -eq 'link') {
                if (-not $source.url) { Add-Issue 'ERROR' $name $tag 'джерело-посилання без url' }
                else { $urls += [pscustomobject]@{ Course = $name; Where = $tag; Url = $source.url } }
            } else {
                if (-not $source.file) { Add-Issue 'ERROR' $name $tag "джерело типу '$($source.type)' без file" }
                else {
                    $fp = Join-Path $dir ($source.file -replace '/', '\')
                    if (-not (Test-Path $fp)) { Add-Issue 'ERROR' $name $tag "немає файлу джерела $($source.file)" }
                }
            }
        }

        if ($course.credit -and -not $srcList.Count) {
            Add-Issue 'WARN' $name $tag 'запозичений курс, але в уроці немає посилання на оригінал'
        }
    }

    # ── чи не застарів індекс ──
    # Найімовірніша регресія цієї архітектури: змінили курс і забули запустити
    # build-course-index.ps1. Помилки не буде — каталог і кабінет учителя просто
    # показуватимуть старе, і жодна інша перевірка цього не побачить.
    $meta = $indexById[$name]
    if (-not $meta) {
        Add-Issue 'ERROR' $name 'індекс' 'курсу немає в js\courses-index.js — перезберіть індекс'
    }
    else {
        if (@($meta.lessons).Count -ne $lessons.Count) {
            Add-Issue 'ERROR' $name 'індекс' "в індексі $(@($meta.lessons).Count) уроків, у файлі курсу $($lessons.Count) — перезберіть індекс"
        }
        foreach ($field in 'title', 'subtitle', 'badge', 'summary', 'topic', 'audience', 'cover', 'prereq', 'archiveNote') {
            if ([string]$meta.$field -ne [string]$course.$field) {
                Add-Issue 'ERROR' $name 'індекс' "поле '$field' в індексі не збігається з файлом курсу — перезберіть індекс"
            }
        }
        $pairs = [math]::Min(@($meta.lessons).Count, $lessons.Count)
        for ($k = 0; $k -lt $pairs; $k++) {
            if ([string]$meta.lessons[$k].title -ne [string]$lessons[$k].title) {
                Add-Issue 'ERROR' $name 'індекс' "назва уроку $($k + 1) в індексі не збігається з файлом курсу — перезберіть індекс"
            }
        }
    }

    # ── картинки на диску, на які ніхто не посилається ──
    $imgDir = Join-Path $dir 'img'
    if (Test-Path $imgDir) {
        foreach ($file in (Get-ChildItem $imgDir -File)) {
            $rel = 'img\' + $file.Name
            if ($file.Name -eq 'cover.webp') { continue }
            if ($usedImages -notcontains $rel) {
                Add-Issue 'WARN' $name 'картинки' "$rel лежить у теці, але жоден урок його не показує"
            }
        }
    }
}

# ── звіт ──
"=== АУДИТ ЗМІСТУ КУРСІВ ==="
"курсів: $($parsed.Count), уроків: $(($parsed.Values | ForEach-Object { @($_.lessons).Count } | Measure-Object -Sum).Sum)"
"зовнішніх посилань: $($urls.Count) (унікальних: $(($urls.Url | Sort-Object -Unique).Count))"
""
$err = @($issues | Where-Object { $_.Level -eq 'ERROR' })
$warn = @($issues | Where-Object { $_.Level -eq 'WARN' })
"ПОМИЛОК: $($err.Count)   ЗАУВАЖЕНЬ: $($warn.Count)"
""
if ($err.Count) {
    "--- ПОМИЛКИ ---"
    $err | ForEach-Object { "  [{0}] {1}: {2}" -f $_.Course, $_.Where, $_.Text }
    ""
}
if ($warn.Count) {
    "--- ЗАУВАЖЕННЯ ---"
    $warn | Group-Object Course | ForEach-Object {
        "  {0}:" -f $_.Name
        $_.Group | ForEach-Object { "     {0}: {1}" -f $_.Where, $_.Text }
    }
}

$urls | Export-Csv -Path (Join-Path $PSScriptRoot 'course-urls.csv') -NoTypeInformation -Encoding UTF8
"`nпосилання збережено у course-urls.csv"

# Ненульовий код виходу, коли є ПОМИЛКИ, — щоб скрипт можна було ставити
# гейтом перед заливкою: `powershell -File tools\audit-courses.ps1; if ($?) {...}`.
exit $(if ($err.Count) { 1 } else { 0 })
