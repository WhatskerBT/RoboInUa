# Збирає js\courses-index.js із файлів js\courses\*.js.
#
# Навіщо: сторінки-каталоги (перелік курсів, огляд курсу, кабінет учителя)
# мають знати назви курсів і заголовки уроків, але їм не потрібен текст
# уроків. Індекс дає перше без другого — і важкий файл курсу вантажиться
# лише тоді, коли урок справді відкривають.
#
#     powershell -ExecutionPolicy Bypass -File tools\build-course-index.ps1
#
# Запускайте після КОЖНОЇ зміни курсу: додали урок, перейменували, змінили
# складність — індекс треба перебудувати, інакше каталоги показуватимуть старе.

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$coursesDir = Join-Path $root 'js\courses'
$target = Join-Path $root 'js\courses-index.js'

if (-not (Test-Path $coursesDir)) { throw "Не знайдено теку $coursesDir" }

# Порядок курсів у каталозі. Файли, яких тут немає, додаються в кінець
# за абеткою — так новий курс не загубиться, навіть якщо про список забули.
$order = @(
    'bbc-microbit', 'arduino', 'arduino-sensors', 'pico-intro',   # електроніка
    '3d-modeling', 'blender-intro',                               # 3D
    'scratch-intro', 'scratch-more', 'python-intro',              # програмування
    'web-intro', 'web-more'                                       # веб
)

$files = Get-ChildItem $coursesDir -Filter *.js -File
$courses = @()

foreach ($file in $files) {
    $text = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($file.FullName))

    $open = $text.IndexOf('registerCourse(')
    if ($open -lt 0) { Write-Host "  пропущено (немає registerCourse): $($file.Name)"; continue }

    $start = $text.IndexOf('{', $open)
    $end = $text.LastIndexOf('}')
    if ($start -lt 0 -or $end -le $start) { throw "Не вдалося знайти об'єкт курсу у $($file.Name)" }

    $json = $text.Substring($start, $end - $start + 1)
    try {
        $course = $json | ConvertFrom-Json
    } catch {
        throw "Файл $($file.Name) не є чистим JSON усередині registerCourse(): $($_.Exception.Message)"
    }

    $lessons = @()
    foreach ($lesson in $course.lessons) {
        $entry = [ordered]@{
            n          = $lesson.n
            title      = $lesson.title
            difficulty = $lesson.difficulty
        }
        if ($lesson.subtitle) { $entry['subtitle'] = $lesson.subtitle }
        $lessons += [pscustomobject]$entry
    }

    $entry = [ordered]@{
        id       = $course.id
        title    = $course.title
        icon     = $course.icon
        badge    = $course.badge
        subtitle = $course.subtitle
        summary  = $course.summary
    }
    if ($course.topic) { $entry['topic'] = $course.topic }
    if ($course.prereq) { $entry['prereq'] = $course.prereq }
    if ($course.cover) { $entry['cover'] = $course.cover }
    if ($course.audience) { $entry['audience'] = $course.audience }
    if ($course.credit) { $entry['credit'] = $course.credit }
    if ($course.downloadFile) {
        $entry['downloadFile'] = $course.downloadFile
        $entry['downloadLabel'] = $course.downloadLabel
    }
    # Пояснення, чому уроки на сайті стислі, а повний матеріал — в архіві.
    # Показує course-overview.js під кнопкою завантаження.
    if ($course.archiveNote) { $entry['archiveNote'] = $course.archiveNote }
    $entry['lessons'] = $lessons

    $courses += [pscustomobject]$entry
    Write-Host ("  + {0,-16} {1} уроків" -f $course.id, $lessons.Count)
}

# Сортування за наперед заданим порядком, решта — за абеткою в кінець.
$sorted = $courses | Sort-Object @{
    Expression = {
        $i = $order.IndexOf($_.id)
        if ($i -lt 0) { 1000 } else { $i }
    }
}, id

$body = $sorted | ConvertTo-Json -Depth 12
if ($sorted.Count -eq 1) { $body = "[`n$body`n]" }

$header = @"
/**
 * ============================================================
 *  ІНДЕКС КУРСІВ — метадані та заголовки уроків, БЕЗ тексту уроків.
 *
 *  ФАЙЛ ЗГЕНЕРОВАНО. Руками не редагувати: зміни треба вносити у
 *  js\courses\<id>.js, а потім перезібрати індекс командою
 *      powershell -ExecutionPolicy Bypass -File tools\build-course-index.ps1
 * ============================================================
 */
const COURSE_INDEX =
"@

$text = $header + $body + ";`r`n"
[System.IO.File]::WriteAllBytes($target, [System.Text.Encoding]::UTF8.GetBytes($text))

$size = [math]::Round((Get-Item $target).Length / 1KB, 1)
Write-Host ("Готово: {0} курсів, індекс {1} КБ." -f $sorted.Count, $size)
