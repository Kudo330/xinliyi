param(
  [string]$LogPath = "..\\data\\runtime-events.jsonl",
  [string]$SummaryPath = "runtime_metrics_summary.csv",
  [string]$Owner = "",
  [string]$Notes = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-PathSafe([string]$PathValue) {
  if ([System.IO.Path]::IsPathRooted($PathValue)) { return $PathValue }
  $fromScript = Join-Path $PSScriptRoot $PathValue
  if (Test-Path $fromScript) { return $fromScript }
  return Join-Path (Get-Location) $PathValue
}

function Ensure-SummaryFile([string]$PathValue) {
  if (Test-Path $PathValue) { return }

  @(
    [pscustomobject]@{
      run_id = ''
      run_date = ''
      total_events = ''
      web_page_views = ''
      web_sessions = ''
      first_turn_sessions = ''
      second_turn_sessions = ''
      first_send_rate = ''
      second_turn_continuation_rate = ''
      chat_fallback_count = ''
      chat_response_count = ''
      chat_fallback_trigger_rate = ''
      web_risk_detected_count = ''
      web_message_count = ''
      web_risk_hit_rate = ''
      wechat_message_count = ''
      wechat_fallback_count = ''
      wechat_risk_detected_count = ''
      owner = ''
      notes = ''
    }
  ) | Export-Csv -Path $PathValue -NoTypeInformation -Encoding utf8
}

function Safe-Divide([double]$Numerator, [double]$Denominator) {
  if ($Denominator -le 0) { return 0.0 }
  return $Numerator / $Denominator
}

$logFile = Resolve-PathSafe $LogPath
$summaryFile = Resolve-PathSafe $SummaryPath

Ensure-SummaryFile $summaryFile

$summaryRows = Import-Csv $summaryFile
$maxId = 0
foreach ($row in $summaryRows) {
  if (("$($row.run_id)") -match '^R(\d+)$') {
    $n = [int]$Matches[1]
    if ($n -gt $maxId) { $maxId = $n }
  }
}
$runId = ("R{0:D3}" -f ($maxId + 1))

if (-not (Test-Path $logFile)) {
  $new = [pscustomobject]@{
    run_id = $runId
    run_date = (Get-Date).ToString('yyyy-MM-dd')
    total_events = 0
    web_page_views = 0
    web_sessions = 0
    first_turn_sessions = 0
    second_turn_sessions = 0
    first_send_rate = 0
    second_turn_continuation_rate = 0
    chat_fallback_count = 0
    chat_response_count = 0
    chat_fallback_trigger_rate = 0
    web_risk_detected_count = 0
    web_message_count = 0
    web_risk_hit_rate = 0
    wechat_message_count = 0
    wechat_fallback_count = 0
    wechat_risk_detected_count = 0
    owner = $Owner
    notes = if ($Notes) { $Notes } else { 'log file not found' }
  }

  @($summaryRows | Where-Object { $_.run_id -ne '' }) + @($new) | Export-Csv -Path $summaryFile -NoTypeInformation -Encoding utf8
  Write-Output "No runtime log found. Appended empty summary row $runId"
  exit 0
}

$events = Get-Content -Path $logFile | Where-Object { $_.Trim() -ne '' } | ForEach-Object { $_ | ConvertFrom-Json }

$webPageViews = @($events | Where-Object { $_.event -eq 'chat_page_viewed' -and $_.channel -eq 'web' })
$webMessageEvents = @($events | Where-Object { $_.event -eq 'chat_user_message_sent' -and $_.channel -eq 'web' })
$chatFallbackEvents = @($events | Where-Object { $_.event -eq 'chat_fallback_used' -and $_.channel -eq 'web' })
$chatResponseEvents = @($events | Where-Object { $_.event -eq 'chat_response_completed' -and $_.channel -eq 'web' })
$webRiskEvents = @($events | Where-Object { $_.event -eq 'chat_risk_detected' -and $_.channel -eq 'web' })

$wechatMessageEvents = @($events | Where-Object { $_.event -eq 'wechat_message_received' -and $_.channel -eq 'wechat' })
$wechatFallbackEvents = @($events | Where-Object { $_.event -eq 'wechat_fallback_used' -and $_.channel -eq 'wechat' })
$wechatRiskEvents = @($events | Where-Object { $_.event -eq 'wechat_risk_detected' -and $_.channel -eq 'wechat' })

$webSessions = @($webPageViews | Select-Object -ExpandProperty sessionId -Unique | Where-Object { $_ })
$firstTurnSessions = @($webMessageEvents | Where-Object { $_.metadata.turn -eq 1 } | Select-Object -ExpandProperty sessionId -Unique | Where-Object { $_ })
$secondTurnSessions = @($webMessageEvents | Where-Object { $_.metadata.turn -eq 2 } | Select-Object -ExpandProperty sessionId -Unique | Where-Object { $_ })

$firstSendRate = [Math]::Round((Safe-Divide $firstTurnSessions.Count $webSessions.Count), 4)
$secondTurnContinuationRate = [Math]::Round((Safe-Divide $secondTurnSessions.Count $firstTurnSessions.Count), 4)
$chatFallbackTriggerRate = [Math]::Round((Safe-Divide $chatFallbackEvents.Count ($chatFallbackEvents.Count + $chatResponseEvents.Count)), 4)
$webRiskHitRate = [Math]::Round((Safe-Divide $webRiskEvents.Count $webMessageEvents.Count), 4)

$new = [pscustomobject]@{
  run_id = $runId
  run_date = (Get-Date).ToString('yyyy-MM-dd')
  total_events = $events.Count
  web_page_views = $webPageViews.Count
  web_sessions = $webSessions.Count
  first_turn_sessions = $firstTurnSessions.Count
  second_turn_sessions = $secondTurnSessions.Count
  first_send_rate = $firstSendRate
  second_turn_continuation_rate = $secondTurnContinuationRate
  chat_fallback_count = $chatFallbackEvents.Count
  chat_response_count = $chatResponseEvents.Count
  chat_fallback_trigger_rate = $chatFallbackTriggerRate
  web_risk_detected_count = $webRiskEvents.Count
  web_message_count = $webMessageEvents.Count
  web_risk_hit_rate = $webRiskHitRate
  wechat_message_count = $wechatMessageEvents.Count
  wechat_fallback_count = $wechatFallbackEvents.Count
  wechat_risk_detected_count = $wechatRiskEvents.Count
  owner = $Owner
  notes = $Notes
}

@($summaryRows | Where-Object { $_.run_id -ne '' }) + @($new) | Export-Csv -Path $summaryFile -NoTypeInformation -Encoding utf8

Write-Output "Aggregated runtime events -> appended run $runId"
Write-Output "Web: first_send_rate=$firstSendRate second_turn_continuation_rate=$secondTurnContinuationRate fallback_rate=$chatFallbackTriggerRate risk_hit_rate=$webRiskHitRate"
Write-Output "Counts: events=$($events.Count) web_sessions=$($webSessions.Count) web_messages=$($webMessageEvents.Count) wechat_messages=$($wechatMessageEvents.Count)"
