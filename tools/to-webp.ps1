# Конвертує растрові файли проєкту у WebP (кодує Chrome через canvas —
# ffmpeg/ImageMagick/cwebp на цій машині немає).
#
#     powershell -ExecutionPolicy Bypass -File tools\to-webp.ps1 materials\pico-intro\img
#
# Без аргументу обробляє всі *.png та *.jpg у materials\**\img. Поруч із
# кожним файлом з'являється .webp; оригінал НЕ видаляється — перевірте
# результат і приберіть самі.

param(
    [string]$Path = ''
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$toolPage = Join-Path $PSScriptRoot 'to-webp.html'
if (-not (Test-Path $toolPage)) { throw "Не знайдено $toolPage" }

if ($Path) {
    $searchRoot = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path $root $Path }
} else {
    $searchRoot = Join-Path $root 'materials'
}
if (-not (Test-Path $searchRoot)) { throw "Не знайдено $searchRoot" }

$sources = Get-ChildItem $searchRoot -Recurse -File -Include *.png, *.jpg, *.jpeg |
    Where-Object { $_.DirectoryName -like '*\img' -or $Path }

if (-not $sources) { Write-Host 'Нема чого конвертувати.'; exit 0 }

# Шляхи для сторінки — відносні від tools\, з прямими скісними.
$relatives = @()
foreach ($file in $sources) {
    $rel = $file.FullName.Substring($root.Length + 1).Replace('\', '/')
    $relatives += ('../' + $rel)
}

$listFile = Join-Path $PSScriptRoot 'to-webp-list.js'
$listJs = 'const TO_WEBP_LIST = ' + ($relatives | ConvertTo-Json) + ';'
[System.IO.File]::WriteAllText($listFile, $listJs, (New-Object System.Text.UTF8Encoding($false)))

$chrome = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw 'Chrome не знайдено — він потрібен як кодувальник WebP.' }

$work = Join-Path $env:TEMP ("roboinua-webp-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
$downloads = Join-Path $work 'out'
$profileDir = Join-Path $work 'profile'
New-Item -ItemType Directory -Force -Path $downloads, (Join-Path $profileDir 'Default') | Out-Null

$prefs = @{
    download = @{ default_directory = $downloads; prompt_for_download = $false }
    savefile = @{ default_directory = $downloads }
} | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText((Join-Path $profileDir 'Default\Preferences'), $prefs, (New-Object System.Text.UTF8Encoding($false)))

Write-Host ("Конвертую {0} файлів…" -f $relatives.Count)

# --allow-file-access-from-files: без нього canvas «отруюється» чужим
# джерелом і toBlob кидає SecurityError.
# Без --virtual-time-budget: він рубає кодування на пів дорозі.
$proc = Start-Process -FilePath $chrome -PassThru -WindowStyle Hidden -ArgumentList @(
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--allow-file-access-from-files', "--user-data-dir=$profileDir",
    ('file:///' + $toolPage.Replace('\', '/'))
)

$hit = $null
$lastSize = -1
for ($i = 0; $i -lt 600; $i++) {
    Start-Sleep -Milliseconds 500
    $hit = Get-ChildItem $downloads -Filter 'to-webp-result.json' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($hit) {
        if ($hit.Length -gt 0 -and $hit.Length -eq $lastSize) { break }
        $lastSize = $hit.Length
        $hit = $null
    }
    if ($proc.HasExited -and -not $hit) { break }
}

if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*$profileDir*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

if (-not $hit) {
    throw 'Chrome не віддав результат. Відкрийте tools\to-webp.html у звичайному браузері — там буде видно лог.'
}

$parsed = [System.IO.File]::ReadAllText($hit.FullName, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
$written = 0
$savedBefore = 0
$savedAfter = 0

foreach ($entry in $parsed.files.PSObject.Properties) {
    $relative = $entry.Name -replace '^\.\./', ''
    $source = Join-Path $root ($relative -replace '/', '\')
    $target = [System.IO.Path]::ChangeExtension($source, '.webp')

    $bytes = [Convert]::FromBase64String($entry.Value)
    [System.IO.File]::WriteAllBytes($target, $bytes)

    $savedBefore += (Get-Item $source).Length
    $savedAfter += $bytes.Length
    $written++
}

Remove-Item $listFile -Force -ErrorAction SilentlyContinue
Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue

Write-Host $parsed.log
Write-Host ("Готово: {0} файлів, {1:N0} КБ -> {2:N0} КБ." -f $written, ($savedBefore / 1KB), ($savedAfter / 1KB))
if ($parsed.failed -ne 0) { Write-Host ("Не вдалося: {0}" -f $parsed.failed) }
