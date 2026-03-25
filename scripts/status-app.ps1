param(
  [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $projectRoot 'logs\app-server.pid'
$healthUrl = "http://127.0.0.1:$Port/"

$pidValue = $null
if (Test-Path $pidFile) {
  $pidValue = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
}

$listeningPids = @()
try {
  $listeningPids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop |
    Select-Object -ExpandProperty OwningProcess -Unique
} catch {
}

$statusCode = ''
$cssStatusCode = ''
$cssPath = ''

try {
  $response = Invoke-WebRequest -UseBasicParsing $healthUrl -TimeoutSec 5
  $statusCode = $response.StatusCode
  $cssMatch = [regex]::Match($response.Content, '/_next/static/css/[^"]+\.css')
  if ($cssMatch.Success) {
    $cssPath = $cssMatch.Value
    $cssResponse = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$Port$cssPath" -TimeoutSec 5
    $cssStatusCode = $cssResponse.StatusCode
  }
} catch {
  $statusCode = 'DOWN'
}

[pscustomobject]@{
  Port = $Port
  RecordedPid = $pidValue
  ListeningPids = if ($listeningPids.Count -gt 0) { $listeningPids -join ',' } else { 'n/a' }
  HomeStatus = $statusCode
  CssPath = $cssPath
  CssStatus = $cssStatusCode
}
