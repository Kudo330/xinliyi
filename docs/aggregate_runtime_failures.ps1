param(
  [string]$LogPath = "..\\data\\runtime-events.jsonl",
  [string]$OutputPath = "runtime_failure_samples.csv",
  [int]$Limit = 100
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-PathSafe([string]$PathValue) {
  if ([System.IO.Path]::IsPathRooted($PathValue)) { return $PathValue }
  $fromScript = Join-Path $PSScriptRoot $PathValue
  if (Test-Path $fromScript) { return $fromScript }
  return Join-Path (Get-Location) $PathValue
}

$logFile = Resolve-PathSafe $LogPath
$outputFile = Resolve-PathSafe $OutputPath

if (-not (Test-Path $logFile)) {
  @(
    [pscustomobject]@{
      timestamp = ''
      channel = ''
      event = ''
      session_id = ''
      reason = ''
      risk_level = ''
      emotion = ''
      message_length = ''
      message_preview = ''
      notes = ''
    }
  ) | Export-Csv -Path $outputFile -NoTypeInformation -Encoding utf8
  Write-Output "No runtime log found. Wrote empty failure sample file to $outputFile"
  exit 0
}

$events = Get-Content -Path $logFile | Where-Object { $_.Trim() -ne '' } | ForEach-Object { $_ | ConvertFrom-Json }

$failureEvents = @(
  $events | Where-Object {
    $_.event -in @('chat_fallback_used', 'chat_risk_detected', 'chat_request_invalid', 'wechat_fallback_used', 'wechat_risk_detected')
  }
) | Sort-Object {
  [DateTime]::Parse($_.timestamp)
} -Descending | Select-Object -First $Limit

$rows = $failureEvents | ForEach-Object {
  $riskLevel = ''
  if ($null -ne $_.metadata) {
    if ($null -ne $_.metadata.riskLevel -and "$($_.metadata.riskLevel)" -ne '') {
      $riskLevel = "$($_.metadata.riskLevel)"
    } elseif ($null -ne $_.metadata.level -and "$($_.metadata.level)" -ne '') {
      $riskLevel = "$($_.metadata.level)"
    }
  }

  [pscustomobject]@{
    timestamp = $_.timestamp
    channel = $_.channel
    event = $_.event
    session_id = $_.sessionId
    reason = $_.metadata.reason
    risk_level = $riskLevel
    emotion = $_.metadata.emotion
    message_length = $_.metadata.messageLength
    message_preview = $_.metadata.messagePreview
    notes = if ($_.metadata.reasons) { ($_.metadata.reasons -join '|') } else { '' }
  }
}

if (-not $rows -or $rows.Count -eq 0) {
  $rows = @(
    [pscustomobject]@{
      timestamp = ''
      channel = ''
      event = ''
      session_id = ''
      reason = ''
      risk_level = ''
      emotion = ''
      message_length = ''
      message_preview = ''
      notes = ''
    }
  )
}

$rows | Export-Csv -Path $outputFile -NoTypeInformation -Encoding utf8
Write-Output "Wrote $($failureEvents.Count) failure samples to $outputFile"
