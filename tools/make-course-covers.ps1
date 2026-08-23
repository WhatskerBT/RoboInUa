# Генератор обкладинок для каталогу курсів (сторінка «Матеріали»).
#
# Навіщо: картка каталогу показує медіа 16:9 шириною ~320-420 px, а туди
# вантажилась повнорозмірна ілюстрація уроку (до 1400x875). Десять таких —
# ~24 МБ декодованого растру в пам'яті, через що сторінка підвисала.
#
# Робить materials\<id>\img\cover.webp — 640x360, центральний кроп (той самий,
# що робить object-fit: cover, тож вигляд картки не змінюється).
#
#     powershell -ExecutionPolicy Bypass -File tools\make-course-covers.ps1
#
# Перелік джерел (з якої ілюстрації робиться обкладинка кожного курсу) лежить
# у tools\make-course-covers.html, у таблиці SOURCES. Стороннього софту не
# треба — кодує сам Chrome через canvas. Наявні cover.webp перезаписуються.

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$toolPage = Join-Path $PSScriptRoot 'make-course-covers.html'
$materialsDir = Join-Path $root 'materials'

if (-not (Test-Path $toolPage)) { throw "Не знайдено $toolPage" }

$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $chrome) { throw 'Chrome не знайдено — він потрібен як кодувальник WebP.' }

$work = Join-Path $env:TEMP ("roboinua-covers-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
$downloads = Join-Path $work 'out'
$chromeProfile = Join-Path $work 'profile'
New-Item -ItemType Directory -Force -Path $downloads, (Join-Path $chromeProfile 'Default') | Out-Null

# Кажемо Chrome складати завантаження в нашу теку, а не в Downloads користувача.
$prefs = @{
  download = @{ default_directory = $downloads; prompt_for_download = $false }
  savefile = @{ default_directory = $downloads }
} | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText((Join-Path $chromeProfile 'Default\Preferences'), $prefs, (New-Object System.Text.UTF8Encoding($false)))

$url = 'file:///' + $toolPage.Replace('\', '/')
$started = Get-Date
Write-Host 'Генерую обкладинки…'

# --allow-file-access-from-files: без нього кожне фото на file:// рахується
#   чужим джерелом, canvas «отруюється» і toBlob кидає SecurityError.
# Без --virtual-time-budget: він рубає кодування на пів дорозі. Тому запускаємо
#   Chrome у фоні, чекаємо на сам файл результату, а тоді закриваємо.
$proc = Start-Process -FilePath $chrome -PassThru -WindowStyle Hidden -ArgumentList @(
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--allow-file-access-from-files', "--user-data-dir=$chromeProfile", $url
)

function Find-Result {
  $hit = Get-ChildItem $downloads -Filter 'roboinua-covers.json' -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $hit) {
    # Запасний шлях: Chrome проігнорував налаштування й поклав файл у Downloads.
    $hit = Get-ChildItem "$env:USERPROFILE\Downloads" -Filter 'roboinua-covers.json' -ErrorAction SilentlyContinue |
      Where-Object { $_.LastWriteTime -gt $started } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  }
  return $hit
}

$json = $null
$lastSize = -1
for ($i = 0; $i -lt 600; $i++) {
  Start-Sleep -Milliseconds 500
  $hit = Find-Result
  if ($hit) {
    # Дочекатись, доки розмір перестане рости — інакше зловимо недописаний файл.
    if ($hit.Length -gt 0 -and $hit.Length -eq $lastSize) { $json = $hit; break }
    $lastSize = $hit.Length
  }
  if ($proc.HasExited -and -not $hit) { break }
}

if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like "*$chromeProfile*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

if (-not $json) {
  Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
  throw 'Chrome не віддав результат. Відкрий tools\make-course-covers.html у звичайному браузері — там буде видно лог.'
}

$parsed = [System.IO.File]::ReadAllText($json.FullName, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
$data = $parsed.files
if ($parsed.failed -ne 0) {
  Write-Host '--- лог сторінки ---'
  Write-Host $parsed.log
  Write-Host '--------------------'
}

$written = 0
foreach ($entry in $data.PSObject.Properties) {
  $target = Join-Path $materialsDir ($entry.Name -replace '/', '\')
  $dir = Split-Path -Parent $target
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  [System.IO.File]::WriteAllBytes($target, [Convert]::FromBase64String($entry.Value))
  $kb = [math]::Round((Get-Item $target).Length / 1KB, 1)
  Write-Host ("  + {0}  ({1} KB)" -f $entry.Name, $kb)
  $written++
}

Remove-Item $json.FullName -Force -ErrorAction SilentlyContinue
Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ("Готово: {0} обкладинок." -f $written)
Write-Host 'Не забудь: поле cover у js\courses\<id>.js має вказувати на img/cover.webp,'
Write-Host 'а після зміни — перезібрати індекс (tools\build-course-index.ps1).'
