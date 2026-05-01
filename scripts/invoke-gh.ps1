# Run GitHub CLI (gh) with a full Windows PATH.
# Cursor agent / automation shells often omit Machine-level PATH entries, so `gh` is not found
# even when installed under "C:\Program Files\GitHub CLI\".
$machine = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
$user = [System.Environment]::GetEnvironmentVariable("Path", "User")
$env:Path = ("$machine;$user").Trim(";")

$ghExe = $null
$cmd = Get-Command gh -ErrorAction SilentlyContinue
if ($cmd) {
  $ghExe = $cmd.Source
} else {
  $fallback = Join-Path ${env:ProgramFiles} "GitHub CLI\gh.exe"
  if (Test-Path -LiteralPath $fallback) {
    $ghExe = $fallback
  }
}

if (-not $ghExe) {
  Write-Error "GitHub CLI (gh) not found. Install from https://cli.github.com/"
  exit 1
}

& $ghExe @args
exit $LASTEXITCODE
