<#
.SYNOPSIS
  Smoke test for the FL Tase3 storefront.

.DESCRIPTION
  Starts (or reuses) the Next production server and measures route
  response times. The server is polled every 250ms until it returns
  HTTP 200 (15s timeout) instead of blindly sleeping.

  The server keeps running after the test so follow-up runs reuse it.
  Rebuild only happens when application code changed (pass -Build).

.EXAMPLE
  ./scripts/smoke.ps1
  ./scripts/smoke.ps1 -Urls "/shop","/shop?category=birthday"
  ./scripts/smoke.ps1 -Build
  ./scripts/smoke.ps1 -Stop
#>

[CmdletBinding()]
param(
  [string[]]$Urls = @(
    "/",
    "/shop",
    "/shop?category=birthday",
    "/product/birthday-bliss-box"
  ),
  [int]$Runs = 2,
  [switch]$Build,
  [switch]$Stop
)

$ErrorActionPreference = "Stop"

$BaseUrl = "http://localhost:3111"
$Port = 3111
$PidFile = Join-Path $env:TEMP "fltase3-server.pid"
$ErrLog = Join-Path $env:TEMP "fltase3-server.err"
$OutLog = Join-Path $env:TEMP "fltase3-server.out"
$TimeoutMs = 15000
$PollMs = 250

function Get-ManagedServerPid {
  if (Test-Path -LiteralPath $PidFile) {
    $raw = Get-Content -LiteralPath $PidFile -Raw -ErrorAction SilentlyContinue
    if ($raw) { return [int]$raw.Trim() }
  }
  return $null
}

function Test-Ready {
  try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/" -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Stop-ManagedServer {
  $serverPid = Get-ManagedServerPid
  if ($serverPid) {
    Stop-Process -Id $serverPid -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $PidFile -ErrorAction SilentlyContinue
    Write-Host "stopped server pid $serverPid"
  } else {
    Write-Host "no managed server pid recorded"
  }
}

if ($Stop) {
  Stop-ManagedServer
  return
}

if ($Build) {
  Write-Host "building..."
  & npm run build
  if ($LASTEXITCODE -ne 0) { throw "build failed" }
  # a new build needs a fresh server
  Stop-ManagedServer
}

function Start-ServerWithPolling {
  if (Test-Ready) {
    Write-Host "server already running at $BaseUrl"
    return
  }

  $stalePid = Get-ManagedServerPid
  if ($stalePid) {
    Write-Host "stale server pid $stalePid not responding - recycling"
    Stop-Process -Id $stalePid -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $PidFile -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 300
  }

  $nodeArgs = @("node_modules\next\dist\bin\next", "start", "-p", "$Port")
  $process = Start-Process -FilePath "node" -ArgumentList $nodeArgs -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput $OutLog -RedirectStandardError $ErrLog
  Set-Content -LiteralPath $PidFile -Value $process.Id
  Write-Host "started server pid $($process.Id), polling every ${PollMs}ms..."

  $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  while ($stopwatch.ElapsedMilliseconds -lt $TimeoutMs) {
    if (Test-Ready) {
      Write-Host ("ready after {0}ms" -f $stopwatch.ElapsedMilliseconds)
      return
    }
    Start-Sleep -Milliseconds $PollMs
  }

  Stop-ManagedServer
  throw "server did not become ready within ${TimeoutMs}ms"
}

Start-ServerWithPolling

function Invoke-Route {
  param([string]$Url)

  $bodyFile = Join-Path $env:TEMP "fltase3-smoke-body.html"
  if (Test-Path -LiteralPath $bodyFile) { Remove-Item -LiteralPath $bodyFile -Force }

  $raw = curl.exe -s -o $bodyFile -w "%{http_code} %{time_total}" --max-time 20 "$BaseUrl$Url"
  $parts = ("$raw").Split(" ", [StringSplitOptions]::RemoveEmptyEntries)

  $status = if ($parts.Count -gt 0) { $parts[0] } else { "000" }
  $seconds = if ($parts.Count -gt 1) { [double]$parts[1] } else { 0.0 }
  $bytes = if (Test-Path -LiteralPath $bodyFile) { (Get-Item -LiteralPath $bodyFile).Length } else { 0 }

  [pscustomobject]@{ Url = $Url; Status = $status; Seconds = $seconds; Bytes = $bytes }
}

Write-Host ""
$results = @()
foreach ($url in $Urls) {
  for ($run = 1; $run -le $Runs; $run++) {
    $result = Invoke-Route -Url $url
    $results += $result
    "{0,-42} run{1}  {2}s  {3}  {4} bytes" -f $url, $run, $result.Seconds.ToString("0.000"), $result.Status, $result.Bytes
  }
}

Write-Host ""
$failures = $results | Where-Object { $_.Status -ne "200" }
if ($failures) {
  Write-Host "FAILED routes:"
  $failures | Format-Table -AutoSize
} else {
  Write-Host "all routes returned 200"
}

if (Test-Path -LiteralPath $ErrLog) {
  $errors = Get-Content -LiteralPath $ErrLog -Raw -ErrorAction SilentlyContinue
  if (-not [string]::IsNullOrWhiteSpace($errors)) {
    Write-Host "SERVER ERRORS:"
    Write-Host $errors
  } else {
    Write-Host "no server errors"
  }
} else {
  Write-Host "no server error log"
}
