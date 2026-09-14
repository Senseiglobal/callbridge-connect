# Interactive credential entry only. No network requests, login attempts or phone calls.
$ErrorActionPreference = 'Stop'
if ([Environment]::OSVersion.Platform -ne 'Win32NT') {
    throw 'This helper requires Windows user-bound credential encryption.'
}
$projectRoot = Split-Path -Parent $PSScriptRoot
$credentialPath = Join-Path $projectRoot 'data/calle-api-key.xml'
if (Test-Path -LiteralPath $credentialPath) {
    throw 'An encrypted CALL-E key is already saved. It has not been overwritten.'
}
& git -C $projectRoot check-ignore --quiet -- $credentialPath
if ($LASTEXITCODE -ne 0) { throw 'The credential file must be excluded from Git before saving.' }

$apiSecret = $null
$keyPlain = $null
try {
    Write-Host 'CallBridge private key setup'
    Write-Host 'Paste ONLY the CALL-E API key at the masked prompt below, then press Enter.'
    Write-Host 'Do not paste it into chat. Ctrl+C cancels. This does not enable or place calls.'
    $apiSecret = Read-Host 'CALL-E API key (hidden)' -AsSecureString
    $keyPlain = [System.Net.NetworkCredential]::new('', $apiSecret).Password
    if ([string]::IsNullOrWhiteSpace($keyPlain) -or $keyPlain -match '\s' -or $keyPlain.Length -gt 8192) {
        throw 'Enter only the key, without spaces, quotes, or line breaks. Nothing was saved.'
    }
    if ($keyPlain.StartsWith('"') -or $keyPlain.StartsWith("'")) {
        throw 'Paste only the key, without surrounding quotes. Nothing was saved.'
    }
    $null = New-Item -ItemType Directory -Path (Split-Path -Parent $credentialPath) -Force
    $apiSecret | Export-Clixml -LiteralPath $credentialPath -NoClobber
    Write-Host 'CALL-E key saved, encrypted for your Windows account, and excluded from Git and Docker.'
    Write-Host 'The key has not yet been checked with CALL-E. Live calls remain disabled.'
    Write-Host 'Clear your clipboard, then return to Codex and say: key saved.'
} finally {
    $keyPlain = $null
    if ($apiSecret) { $apiSecret.Dispose() }
}
