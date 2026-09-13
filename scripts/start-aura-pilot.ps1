# Interactive only. Starting this script NEVER places a call. Preview is the default.
param([switch]$Live)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonPath = Join-Path $projectRoot '.venv/Scripts/python.exe'
if (!(Test-Path -LiteralPath $pythonPath)) { throw 'Install the Python dependencies using README.md first.' }
if (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue) {
    throw 'Port 8080 is busy. Stop the old CallBridge backend with Ctrl+C in its terminal, then run this script again.'
}
$queueSecret = Read-Host 'Paste the dedicated Aura queue secret (hidden; not a database key)' -AsSecureString
$operatorSecret = Read-Host 'Choose a different operator access code, at least 24 characters (hidden)' -AsSecureString
$queueToken = [System.Net.NetworkCredential]::new('', $queueSecret).Password
$operatorToken = [System.Net.NetworkCredential]::new('', $operatorSecret).Password
if ($queueToken.Length -lt 32 -or $operatorToken.Length -lt 24) { throw 'Queue secret must be 32+ characters and the operator code 24+ characters.' }
$variableNames = @('AURA_STORAGE_URL','AURA_STORAGE_TOKEN','CALLBRIDGE_ADMIN_TOKEN','CALLBRIDGE_PUBLIC_DEMO','CALLE_DRY_RUN','CALLE_API_KEY','CALLBRIDGE_ALLOWED_PHONES','HOST','PORT','STORAGE_BACKEND')
$savedVariables = @{}
foreach ($name in $variableNames) { $savedVariables[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
$apiSecret = $null
try {
    $env:AURA_STORAGE_URL = 'https://www.auramanager.app/api/internal/callbridge'
    $env:AURA_STORAGE_TOKEN = $queueToken
    $env:CALLBRIDGE_ADMIN_TOKEN = $operatorToken
    $env:CALLBRIDGE_PUBLIC_DEMO = 'false'
    $env:CALLE_DRY_RUN = 'true'
    $env:CALLE_API_KEY = ''
    $env:CALLBRIDGE_ALLOWED_PHONES = ''
    $env:HOST = '127.0.0.1'
    $env:PORT = '8080'
    $env:STORAGE_BACKEND = 'aura'
    if ($Live) {
        $apiSecret = Read-Host 'Paste your CALL-E API key (hidden)' -AsSecureString
        $testPhone = Read-Host 'Your own consented, approved test number, with + and country code'
        if ($testPhone -notmatch '^\+[1-9]\d{7,14}$') { throw 'Enter a valid international-format number.' }
        $env:CALLE_API_KEY = [System.Net.NetworkCredential]::new('', $apiSecret).Password
        if ([string]::IsNullOrWhiteSpace($env:CALLE_API_KEY)) { throw 'A CALL-E key is required for live mode.' }
        $env:CALLBRIDGE_ALLOWED_PHONES = $testPhone
        $env:CALLE_DRY_RUN = 'false'
    }
    Write-Host 'Private Aura queue starting. No call has been placed.'
    Write-Host 'Use the CallBridge frontend at http://localhost:3000/settings and enter your operator access code.'
    Write-Host 'The frontend must already be running with its API set to http://127.0.0.1:8080.'
    Write-Host 'Do not use the old backend page at port 8080 or the public Render sample demo for private requests.'
    Write-Host 'Keep this terminal open. Ctrl+C stops it; secrets are not saved to a file.'
    & $pythonPath (Join-Path $projectRoot 'apps/python/callbridge/app.py')
} finally {
    foreach ($name in $variableNames) { [Environment]::SetEnvironmentVariable($name, $savedVariables[$name], 'Process') }
    $queueToken = $null
    $operatorToken = $null
    $queueSecret.Dispose()
    $operatorSecret.Dispose()
    if ($apiSecret) { $apiSecret.Dispose() }
}
