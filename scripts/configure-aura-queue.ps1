# Create a scoped queue credential, protected locally with Windows DPAPI, and install only
# that credential on the already-linked Aura Vercel project. Never prints secret values.
$ErrorActionPreference = 'Stop'
if ([Environment]::OSVersion.Platform -ne 'Win32NT') { throw 'This credential setup uses Windows user-bound encryption.' }
$projectRoot = Split-Path -Parent $PSScriptRoot
$auraDirectory = Join-Path $projectRoot '.integrations/aura-manager'
$linkPath = Join-Path $auraDirectory '.vercel/project.json'
$link = Get-Content -LiteralPath $linkPath -Raw | ConvertFrom-Json
if ($link.projectId -ne 'prj_CUzgtC97eFp94iVodNzhFQDMe0Zr' -or $link.orgId -ne 'team_UK4gHwB3quJa7oVlo767fhzB') {
    throw 'The pilot worktree is not linked to the expected existing Aura project.'
}
$credentialPath = Join-Path $projectRoot 'data/aura-pilot-credentials.xml'
Push-Location $projectRoot
try {
    & git check-ignore --quiet -- $credentialPath
    if ($LASTEXITCODE -ne 0) { throw 'Credential file must be git-ignored before setup.' }
} finally { Pop-Location }
function New-PilotSecret {
    $bytes = New-Object byte[] 48
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($bytes); return [Convert]::ToBase64String($bytes) }
    finally { $generator.Dispose(); [Array]::Clear($bytes, 0, $bytes.Length) }
}
if (Test-Path -LiteralPath $credentialPath) {
    $credentials = Import-Clixml -LiteralPath $credentialPath
    Write-Host 'Reusing this Windows user''s existing encrypted pilot credentials; no rotation.'
} else {
    $queuePlain = New-PilotSecret
    $operatorPlain = New-PilotSecret
    $credentials = [pscustomobject]@{
        Queue = ConvertTo-SecureString $queuePlain -AsPlainText -Force
        Operator = ConvertTo-SecureString $operatorPlain -AsPlainText -Force
    }
    $null = New-Item -ItemType Directory -Path (Split-Path -Parent $credentialPath) -Force
    $credentials | Export-Clixml -LiteralPath $credentialPath -NoClobber
    $queuePlain = $null
    $operatorPlain = $null
    Write-Host 'Created encrypted, git-ignored local pilot credentials. No plaintext credential file was written.'
}
$token = [System.Net.NetworkCredential]::new('', $credentials.Queue).Password
if ($token.Length -lt 32) { throw 'Stored queue credential is invalid.' }
Push-Location $auraDirectory
try {
    # Stdin avoids command-line and shell-history exposure. No --force: never silently rotate an existing value.
    $token | & npx --offline vercel@54.10.1 env add CALLBRIDGE_STORAGE_TOKEN production --sensitive --yes
    if ($LASTEXITCODE -ne 0) { throw 'Vercel did not confirm installation. Keep the encrypted file; check the existing variable before retrying.' }
    Write-Host 'Dedicated queue credential installed on Aura production. This does not deploy, open the form or place a call.'
} finally {
    Pop-Location
    $token = $null
    $credentials.Queue.Dispose()
    $credentials.Operator.Dispose()
}
