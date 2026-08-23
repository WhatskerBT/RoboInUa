# Автоматичний прогін tools\guard-test.html у headless Chrome.
#
# Навіщо окремий скрипт: PBKDF2 на 150 000 ітерацій рахується довше, ніж
# headless Chrome чекає перед знімком екрана, тож результат тест віддає
# файлом, а цей скрипт його дочікується й друкує в консоль.
#
#     powershell -ExecutionPolicy Bypass -File tools\run-guard-test.ps1
#
# Тест працює у ВЛАСНОМУ профілі Chrome, тож локальні дані вашого браузера
# він не чіпає.

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$page = Join-Path $PSScriptRoot 'guard-test.html'
if (-not (Test-Path $page)) { throw "Не знайдено $page" }

$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $chrome) { throw 'Chrome не знайдено.' }

$work = Join-Path $env:TEMP ("roboinua-guard-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
$downloads = Join-Path $work 'out'
$profileDir = Join-Path $work 'profile'
New-Item -ItemType Directory -Force -Path $downloads, (Join-Path $profileDir 'Default') | Out-Null

$prefs = @{
  download = @{ default_directory = $downloads; prompt_for_download = $false }
  savefile = @{ default_directory = $downloads }
} | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText((Join-Path $profileDir 'Default\Preferences'), $prefs, (New-Object System.Text.UTF8Encoding($false)))

$url = 'file:///' + $page.Replace('\', '/') + '?run=1'
Write-Host 'Виконую перевірки…'

$proc = Start-Process -FilePath $chrome -PassThru -WindowStyle Hidden -ArgumentList @(
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  "--user-data-dir=$profileDir", $url
)

$hit = $null
for ($i = 0; $i -lt 90; $i++) {
  Start-Sleep -Milliseconds 500
  $hit = Get-ChildItem $downloads -Filter 'guard-result.txt' -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($hit -and $hit.Length -gt 0) { break }
  if ($proc.HasExited -and -not $hit) { break }
}

if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like "*$profileDir*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

if (-not $hit) {
  Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
  throw 'Chrome не віддав результат. Відкрийте tools\guard-test.html у звичайному браузері — там буде видно лог.'
}

$text = [System.IO.File]::ReadAllText($hit.FullName, [System.Text.Encoding]::UTF8)
Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue

Write-Host $text
if ($text -like 'ПРОВАЛЕНО*' -or $text -like 'ТЕСТ ВПАВ*') { exit 1 }
