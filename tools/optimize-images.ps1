# Оптимізує зображення сайту: зменшує до розумної ширини й перекодовує
# у WebP. Кодує Chrome через canvas — ffmpeg/cwebp/ImageMagick тут немає.
#
#     powershell -ExecutionPolicy Bypass -File tools\optimize-images.ps1 -Path materials
#     powershell -ExecutionPolicy Bypass -File tools\optimize-images.ps1 -Path materials\arduino\img -Quality 0.9
#     powershell -ExecutionPolicy Bypass -File tools\optimize-images.ps1 -WhatIf
#
# ГОЛОВНЕ ПРАВИЛО: файл замінюється, ЛИШЕ якщо новий менший принаймні на
# -MinGain відсотків. Перекодування вже стиснутого WebP часто дає більший
# файл — такі результати просто відкидаються, і нічого не псується.
#
# Оригінали у форматах PNG/JPG після успішної заміни видаляються (лишається
# .webp). WebP перезаписується на місці.

param(
    [string]$Path = 'materials',
    [double]$Quality = 0.85,
    [int]$MaxWidth = 1400,
    [int]$MinGain = 5,
    [switch]$IncludeWebp,
    [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$toolPage = Join-Path $PSScriptRoot 'optimize-images.html'
if (-not (Test-Path $toolPage)) { throw "Не знайдено $toolPage" }

$searchRoot = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path $root $Path }
if (-not (Test-Path $searchRoot)) { throw "Не знайдено $searchRoot" }

$extensions = @('.png', '.jpg', '.jpeg')
if ($IncludeWebp) { $extensions += '.webp' }

$sources = @()
if (Test-Path $searchRoot -PathType Leaf) {
    $sources = @(Get-Item $searchRoot)
} else {
    $sources = Get-ChildItem $searchRoot -Recurse -File |
        Where-Object { $extensions -contains $_.Extension.ToLower() } |
        Where-Object { $_.FullName -notmatch '_originals-fullres|_pre-webp-backup' }
}

if (-not $sources) { Write-Host 'Нема чого оптимізувати.'; exit 0 }

$list = @()
foreach ($file in $sources) {
    $relative = $file.FullName.Substring($root.Length + 1).Replace('\', '/')
    $list += [pscustomobject]@{
        path = '../' + $relative
        size = $file.Length
    }
}

$listFile = Join-Path $PSScriptRoot 'optimize-list.js'

# ConvertTo-Json для ОДНОГО елемента віддає об'єкт, а не масив із одного
# елемента — сторінка тоді не бачить .length і мовчки зависає. Тому масив
# із однієї позиції загортаємо вручну.
$listJson = $list | ConvertTo-Json -Depth 4
if ($list.Count -eq 1) { $listJson = "[`n$listJson`n]" }

$listJs = 'const OPTIMIZE_SETTINGS = ' +
    (@{ maxWidth = $MaxWidth; quality = $Quality } | ConvertTo-Json -Compress) + ";`r`n" +
    'const OPTIMIZE_LIST = ' + $listJson + ';'
[System.IO.File]::WriteAllText($listFile, $listJs, (New-Object System.Text.UTF8Encoding($false)))

$chrome = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw 'Chrome не знайдено — він потрібен як кодувальник WebP.' }

$work = Join-Path $env:TEMP ("roboinua-opt-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
$downloads = Join-Path $work 'out'
$profileDir = Join-Path $work 'profile'
New-Item -ItemType Directory -Force -Path $downloads, (Join-Path $profileDir 'Default') | Out-Null

$prefs = @{
    download = @{ default_directory = $downloads; prompt_for_download = $false }
    savefile = @{ default_directory = $downloads }
} | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText((Join-Path $profileDir 'Default\Preferences'), $prefs, (New-Object System.Text.UTF8Encoding($false)))

Write-Host ("Обробляю {0} файлів (ширина <= {1}, якість {2})…" -f $list.Count, $MaxWidth, $Quality)

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
for ($i = 0; $i -lt 900; $i++) {
    Start-Sleep -Milliseconds 500
    $found = Get-ChildItem $downloads -Filter 'optimize-result.json' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        if ($found.Length -gt 0 -and $found.Length -eq $lastSize) { $hit = $found; break }
        $lastSize = $found.Length
    }
    if ($proc.HasExited -and -not $found) { break }
}

if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*$profileDir*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

if (-not $hit) {
    Remove-Item $listFile -Force -ErrorAction SilentlyContinue
    Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
    throw 'Chrome не віддав результат. Відкрийте tools\optimize-images.html у звичайному браузері — там буде видно лог.'
}

$parsed = [System.IO.File]::ReadAllText($hit.FullName, [System.Text.Encoding]::UTF8) | ConvertFrom-Json

$replaced = 0
$skipped = 0
$before = 0
$after = 0
$removedOriginals = 0

foreach ($entry in $parsed.files.PSObject.Properties) {
    $relative = $entry.Name -replace '^\.\./', ''
    $source = Join-Path $root ($relative -replace '/', '\')
    if (-not (Test-Path $source)) { continue }

    $originalSize = (Get-Item $source).Length
    $newSize = [int]$entry.Value.newSize
    $target = [System.IO.Path]::ChangeExtension($source, '.webp')
    $sameFile = ($target -eq $source)

    # Для не-WebP оригіналів виграш рахуємо завжди: навіть трохи більший
    # WebP кращий за PNG, бо формат сайту єдиний. Для WebP — лише реальна
    # економія, інакше перекодування тільки псує якість.
    $gain = if ($originalSize -gt 0) { (1 - $newSize / $originalSize) * 100 } else { 0 }
    $worthIt = if ($sameFile) { $gain -ge $MinGain } else { $true }

    if (-not $worthIt) {
        $skipped++
        continue
    }

    if ($WhatIf) {
        Write-Host ("  [WhatIf] {0}  {1:N0} -> {2:N0} B" -f $relative, $originalSize, $newSize)
        $replaced++
        $before += $originalSize
        $after += $newSize
        continue
    }

    [System.IO.File]::WriteAllBytes($target, [Convert]::FromBase64String($entry.Value.data))
    $before += $originalSize
    $after += $newSize
    $replaced++

    # PNG/JPG після заміни видаляємо — WebP їх повністю замінює.
    # SVG НІКОЛИ не видаляємо: це векторний оригінал, з якого растр можна
    # перегенерувати будь-якого розміру, а назад — уже ні.
    if (-not $sameFile) {
        if ($source.ToLower().EndsWith('.svg')) {
            Write-Host ("  (векторний оригінал збережено: {0})" -f $relative)
        } else {
            Remove-Item -LiteralPath $source -Force
            $removedOriginals++
        }
    }
}

Remove-Item $listFile -Force -ErrorAction SilentlyContinue
Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue

Write-Host $parsed.log
Write-Host ''
Write-Host ("Замінено: {0} | залишено як було: {1} | видалено оригіналів: {2}" -f $replaced, $skipped, $removedOriginals)
if ($before -gt 0) {
    Write-Host ("Обсяг: {0:N0} КБ -> {1:N0} КБ (мінус {2:N0}%)" -f ($before / 1KB), ($after / 1KB), ((1 - $after / $before) * 100))
}
if ($parsed.failed -ne 0) { Write-Host ("Не вдалося обробити: {0}" -f $parsed.failed) }
