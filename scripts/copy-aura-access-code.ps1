# Run this yourself when you are ready to unlock the LOCAL CallBridge operator console.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$credentialPath = Join-Path $projectRoot 'data/aura-pilot-credentials.xml'
if (!(Test-Path -LiteralPath $credentialPath)) { throw 'Encrypted pilot credentials have not been configured on this computer.' }
$credentials = Import-Clixml -LiteralPath $credentialPath
try {
    $operatorCode = [System.Net.NetworkCredential]::new('', $credentials.Operator).Password
    Set-Clipboard -Value $operatorCode
    Write-Host 'Copied your private operator access code. Paste it only into http://localhost:3000/settings, then click Unlock operator console.'
    Write-Host 'Do not paste it into chat or the public demo. Clear your clipboard after pasting.'
} finally {
    $operatorCode = $null
    $credentials.Queue.Dispose()
    $credentials.Operator.Dispose()
}
