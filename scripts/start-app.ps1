param(
  [int]$Port = 3000,
  [ValidateSet('dev', 'release')]
  [string]$Mode = 'dev'
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$logsDir = Join-Path $projectRoot 'logs'
$pidFile = Join-Path $logsDir 'app-server.pid'
$outLog = Join-Path $logsDir 'app-server.out.log'
$errLog = Join-Path $logsDir 'app-server.err.log'
$healthUrl = "http://127.0.0.1:$Port/"

function Test-AppReady {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 5
    if ($response.StatusCode -ne 200) {
      return $false
    }

    $cssMatch = [regex]::Match($response.Content, '/_next/static/css/[^"]+\.css')
    if (-not $cssMatch.Success) {
      return $false
    }

    $cssUrl = "http://localhost:$Port$($cssMatch.Value)"
    $cssResponse = Invoke-WebRequest -UseBasicParsing $cssUrl -TimeoutSec 5
    return $cssResponse.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Get-ListeningPid {
  param([int]$TargetPort)

  try {
    $connection = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction Stop |
      Select-Object -First 1
    return $connection.OwningProcess
  } catch {
    return $null
  }
}

function Stop-PortProcess {
  param([int]$TargetPort)

  try {
    $connections = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction Stop
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($processId in $pids) {
      try {
        taskkill /PID $processId /T /F | Out-Null
      } catch {
      }
    }
  } catch {
  }
}

if (!(Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir | Out-Null
}

if (Test-Path $pidFile) {
  $existingPid = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($existingPid) {
    try {
      taskkill /PID ([int]$existingPid) /T /F | Out-Null
    } catch {
    }
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

Stop-PortProcess -TargetPort $Port

if ($Mode -eq 'release') {
  if (Test-Path $projectRoot\.next) {
    Remove-Item -Recurse -Force "$projectRoot\.next"
  }

  Push-Location $projectRoot
  try {
    npm run build
  } finally {
    Pop-Location
  }
}

$startCommand = if ($Mode -eq 'release') {
  "Set-Location '$projectRoot'; npm run start -- --port $Port"
} else {
  "Set-Location '$projectRoot'; npm run dev -- --hostname 127.0.0.1 --port $Port"
}
$process = Start-Process powershell.exe `
  -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $startCommand `
  -RedirectStandardOutput $outLog `
  -RedirectStandardError $errLog `
  -PassThru `
  -WindowStyle Hidden

$deadline = (Get-Date).AddSeconds(30)
$healthy = $false
$listeningPid = $null

while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 1
  if (Test-AppReady -Url $healthUrl) {
    $healthy = $true
    $listeningPid = Get-ListeningPid -TargetPort $Port
    break
  }
}

if (-not $healthy) {
  try {
    taskkill /PID $process.Id /T /F | Out-Null
  } catch {
  }
  throw "Server failed health check on $healthUrl. Check $outLog and $errLog."
}

if ($listeningPid) {
  Set-Content -Path $pidFile -Value $listeningPid -Encoding ascii
} else {
  Set-Content -Path $pidFile -Value $process.Id -Encoding ascii
}

Write-Output "Server started on $healthUrl ($Mode)"
Write-Output "PID: $($process.Id)"
Write-Output "OUT: $outLog"
Write-Output "ERR: $errLog"
