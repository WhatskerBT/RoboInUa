# Генератор мініатюр для стрічки галереї на сторінках проєктів.
#
# Навіщо: .pd-carousel-thumb показує картинку ~90x67, а без мініатюр туди
# вантажилося повнорозмірне фото 1600x900 — ×17.8 зайвого й помітні лаги.
#
# Як користуватись: додала нові фото в projects\<id>\ і прописала їх у
# js\projects-data.js — запусти цей скрипт. Він зробить мініатюри лише для
# тих фото, у яких їх ще немає; наявні не чіпає й не перезаписує.
#
#     powershell -ExecutionPolicy Bypass -File tools\make-thumbs.ps1
#
# Стороннього софту не треба — кодує сам Chrome через canvas.

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$toolPage = Join-Path $PSScriptRoot 'make-thumbs.html'
$projectsDir = Join-Path $root 'projects'

if (-not (Test-Path $toolPage)) { throw "Не знайдено $toolPage" }

$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $chrome) { throw 'Chrome не знайдено — він потрібен як кодувальник WebP.' }

$work = Join-Path $env:TEMP ("roboinua-thumbs-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
$downloads = Join-Path $work 'out'
$profile = Join-Path $work 'profile'
New-Item -ItemType Directory -Force -Path $downloads, (Join-Path $profile 'Default') | Out-Null

# Кажемо Chrome складати завантаження в нашу теку, а не в Downloads користувача.
$prefs = @{
  download = @{ default_directory = $downloads; prompt_for_download = $false }
  savefile = @{ default_directory = $downloads }
} | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText((Join-Path $profile 'Default\Preferences'), $prefs, (New-Object System.Text.UTF8Encoding($false)))

$url = 'file:///' + $toolPage.Replace('\', '/')
$started = Get-Date
Write-Host 'Генерую мініатюри…'

# --allow-file-access-from-files: без нього кожне фото на file:// рахується
#   чужим джерелом, canvas «отруюється» і toBlob кидає SecurityError.
# Без --virtual-time-budget: він змушує Chrome завершитись, щойно сторінка
#   здається «тихою», і рубає кодування на пів дорозі. Тому запускаємо Chrome
#   у фоні, чекаємо на сам файл результату, а тоді закриваємо.
$proc = Start-Process -FilePath $chrome -PassThru -WindowStyle Hidden -ArgumentList @(
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--allow-file-access-from-files', "--user-data-dir=$profile", $url
)

function Find-Result {
  $hit = Get-ChildItem $downloads -Filter 'roboinua-thumbs.json' -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $hit) {
    # Запасний шлях: Chrome проігнорував налаштування й поклав файл у Downloads.
    $hit = Get-ChildItem "$env:USERPROFILE\Downloads" -Filter 'roboinua-thumbs.json' -ErrorAction SilentlyContinue |
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
  Where-Object { $_.CommandLine -like "*$profile*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

if (-not $json) {
  Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
  throw 'Chrome не віддав результат. Відкрий tools\make-thumbs.html у звичайному браузері — там буде видно лог.'
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
  $target = Join-Path $projectsDir ($entry.Name -replace '/', '\')
  $dir = Split-Path -Parent $target
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  [System.IO.File]::WriteAllBytes($target, [Convert]::FromBase64String($entry.Value))
  $kb = [math]::Round((Get-Item $target).Length / 1KB)
  Write-Host ("  + {0}  ({1} KB)" -f $entry.Name, $kb)
  $written++
}

Remove-Item $json.FullName -Force -ErrorAction SilentlyContinue
Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue

if ($written -eq 0) {
  Write-Host 'Усі мініатюри вже на місці — нічого робити.'
} else {
  Write-Host ("Готово: створено {0} мініатюр." -f $written)
}
