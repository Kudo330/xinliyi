param(
  [int]$Port = 3000,
  [switch]$AllNode
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $projectRoot 'logs\app-server.pid'

function Stop-PortProcess {
  param([int]$TargetPort)

  try {
    $connections = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction Stop
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($processId in $pids) {
      try {
        taskkill /PID $processId /T /F | Out-Null
        Write-Output "Stopped port $TargetPort listener PID $processId"
      } catch {
      }
    }
  } catch {
  }
}

if (Test-Path $pidFile) {
  $recordedPid = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($recordedPid) {
    try {
      taskkill /PID ([int]$recordedPid) /T /F | Out-Null
      Write-Output "Stopped PID $recordedPid"
    } catch {
      Write-Output "PID $recordedPid was not running"
    }
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

Stop-PortProcess -TargetPort $Port

if ($AllNode) {
  Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    try {
      Stop-Process -Id $_.Id -Force -ErrorAction Stop
      Write-Output "Stopped node PID $($_.Id)"
    } catch {
    }
  }
}
