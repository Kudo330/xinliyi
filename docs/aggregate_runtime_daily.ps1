param(
  [string]$LogPath = "..\\data\\runtime-events.jsonl",
  [string]$SummaryPath = "runtime_metrics_daily.csv",
  [int]$Days = 7
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-PathSafe([string]$PathValue) {
  if ([System.IO.Path]::IsPathRooted($PathValue)) { return $PathValue }
  $fromScript = Join-Path $PSScriptRoot $PathValue
  if (Test-Path $fromScript) { return $fromScript }
  return Join-Path (Get-Location) $PathValue
}

function Safe-Divide([double]$Numerator, [double]$Denominator) {
  if ($Denominator -le 0) { return 0.0 }
  return $Numerator / $Denominator
}

$logFile = Resolve-PathSafe $LogPath
$summaryFile = Resolve-PathSafe $SummaryPath

if (-not (Test-Path $logFile)) {
  @(
    [pscustomobject]@{
      date = ''
      total_events = ''
      web_page_views = ''
      web_sessions = ''
      first_turn_sessions = ''
      second_turn_sessions = ''
      first_send_rate = ''
      second_turn_continuation_rate = ''
      web_message_count = ''
      chat_response_count = ''
      chat_fallback_count = ''
      chat_fallback_trigger_rate = ''
      web_risk_detected_count = ''
      web_risk_hit_rate = ''
      wechat_message_count = ''
      wechat_fallback_count = ''
      wechat_risk_detected_count = ''
    }
  ) | Export-Csv -Path $summaryFile -NoTypeInformation -Encoding utf8
  Write-Output "No runtime log found. Wrote empty daily summary to $summaryFile"
  exit 0
}

$events = Get-Content -Path $logFile | Where-Object { $_.Trim() -ne '' } | ForEach-Object {
  $row = $_ | ConvertFrom-Json
  $rowDate = [DateTime]::Parse($row.timestamp)
  [pscustomobject]@{
    event = $row.event
    channel = $row.channel
    sessionId = $row.sessionId
    metadata = $row.metadata
    timestamp = $rowDate
    date = $rowDate.ToString('yyyy-MM-dd')
  }
}

$startDate = (Get-Date).Date.AddDays(-($Days - 1))
$dateWindow = 0..($Days - 1) | ForEach-Object { $startDate.AddDays($_).ToString('yyyy-MM-dd') }

$rows = foreach ($day in $dateWindow) {
  $dayEvents = @($events | Where-Object { $_.date -eq $day })

  $webPageViews = @($dayEvents | Where-Object { $_.event -eq 'chat_page_viewed' -and $_.channel -eq 'web' })
  $webMessageEvents = @($dayEvents | Where-Object { $_.event -eq 'chat_user_message_sent' -and $_.channel -eq 'web' })
  $chatFallbackEvents = @($dayEvents | Where-Object { $_.event -eq 'chat_fallback_used' -and $_.channel -eq 'web' })
  $chatResponseEvents = @($dayEvents | Where-Object { $_.event -eq 'chat_response_completed' -and $_.channel -eq 'web' })
  $webRiskEvents = @($dayEvents | Where-Object { $_.event -eq 'chat_risk_detected' -and $_.channel -eq 'web' })

  $wechatMessageEvents = @($dayEvents | Where-Object { $_.event -eq 'wechat_message_received' -and $_.channel -eq 'wechat' })
  $wechatFallbackEvents = @($dayEvents | Where-Object { $_.event -eq 'wechat_fallback_used' -and $_.channel -eq 'wechat' })
  $wechatRiskEvents = @($dayEvents | Where-Object { $_.event -eq 'wechat_risk_detected' -and $_.channel -eq 'wechat' })

  $webSessions = @($webPageViews | Select-Object -ExpandProperty sessionId -Unique | Where-Object { $_ })
  $firstTurnSessions = @($webMessageEvents | Where-Object { $_.metadata.turn -eq 1 } | Select-Object -ExpandProperty sessionId -Unique | Where-Object { $_ })
  $secondTurnSessions = @($webMessageEvents | Where-Object { $_.metadata.turn -eq 2 } | Select-Object -ExpandProperty sessionId -Unique | Where-Object { $_ })

  [pscustomobject]@{
    date = $day
    total_events = $dayEvents.Count
    web_page_views = $webPageViews.Count
    web_sessions = $webSessions.Count
    first_turn_sessions = $firstTurnSessions.Count
    second_turn_sessions = $secondTurnSessions.Count
    first_send_rate = [Math]::Round((Safe-Divide $firstTurnSessions.Count $webSessions.Count), 4)
    second_turn_continuation_rate = [Math]::Round((Safe-Divide $secondTurnSessions.Count $firstTurnSessions.Count), 4)
    web_message_count = $webMessageEvents.Count
    chat_response_count = $chatResponseEvents.Count
    chat_fallback_count = $chatFallbackEvents.Count
    chat_fallback_trigger_rate = [Math]::Round((Safe-Divide $chatFallbackEvents.Count ($chatFallbackEvents.Count + $chatResponseEvents.Count)), 4)
    web_risk_detected_count = $webRiskEvents.Count
    web_risk_hit_rate = [Math]::Round((Safe-Divide $webRiskEvents.Count $webMessageEvents.Count), 4)
    wechat_message_count = $wechatMessageEvents.Count
    wechat_fallback_count = $wechatFallbackEvents.Count
    wechat_risk_detected_count = $wechatRiskEvents.Count
  }
}

$rows | Export-Csv -Path $summaryFile -NoTypeInformation -Encoding utf8
Write-Output "Wrote $($rows.Count) daily rows to $summaryFile"
