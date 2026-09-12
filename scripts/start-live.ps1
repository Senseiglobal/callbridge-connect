# Interactive local setup only. Starting this script NEVER places a call.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonPath = Join-Path $projectRoot '.venv/Scripts/python.exe'
if (!(Test-Path -LiteralPath $pythonPath)) { throw 'Install the Python dependencies using README.md first.' }
if (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue) {
    throw 'Port 8080 is already in use. Stop the old CallBridge backend with Ctrl+C in its terminal first.'
}
$keySecret = Read-Host 'Paste your CALL-E API key (hidden)' -AsSecureString
$codeSecret = Read-Host 'Choose a separate operator access code, at least 24 characters (hidden)' -AsSecureString
$testPhone = Read-Host 'Your own consented test number in international format, starting with +'
if ($testPhone -notmatch '^\+[1-9]\d{7,14}$') { throw 'The number must start with + and contain its country code.' }
$operatorCode = [System.Net.NetworkCredential]::new('', $codeSecret).Password
if ($operatorCode.Length -lt 24) { throw 'Use an operator access code with at least 24 characters.' }
try {
    $env:CALLE_API_KEY = [System.Net.NetworkCredential]::new('', $keySecret).Password
    $env:CALLBRIDGE_ADMIN_TOKEN = $operatorCode
    $env:CALLBRIDGE_ALLOWED_PHONES = $testPhone
    $env:CALLBRIDGE_PUBLIC_DEMO = 'false'
    $env:CALLE_DRY_RUN = 'false'
    $env:HOST = '127.0.0.1'
    $env:PORT = '8080'
    $env:STORAGE_BACKEND = 'local'
    $env:CALLBRIDGE_DB = Join-Path $projectRoot 'data/live-pilot.db'
    Write-Host 'Backend starting. No call has been placed. Unlock Settings at http://localhost:3000/settings.'
    Write-Host 'Keep this window open; Ctrl+C stops the local backend. Do not share screenshots of secrets.'
    & $pythonPath (Join-Path $projectRoot 'apps/python/callbridge/app.py')
} finally {
    Remove-Item Env:CALLE_API_KEY, Env:CALLBRIDGE_ADMIN_TOKEN, Env:CALLBRIDGE_ALLOWED_PHONES -ErrorAction SilentlyContinue
    $operatorCode = $null
    $keySecret.Dispose()
    $codeSecret.Dispose()
}
