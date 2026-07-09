param(
  [ValidateSet("Notification","Stop")]
  [string]$Event = "Notification"
)

try {
  $title = ""
  if ($Event -eq "Notification") {
    $note = if ($env:CLAUDE_NOTIFICATION) { $env:CLAUDE_NOTIFICATION } else { "Action required" }
    $title = "Claude Code Notification | event=Notification | note=$note"
  }
  else {
    $reason = if ($env:CLAUDE_STOP_REASON) { $env:CLAUDE_STOP_REASON } else { "completed" }
    $title = "Claude Code Task Completed | event=Stop | reason=$reason"
  }

  [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
  $xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent(
    [Windows.UI.Notifications.ToastTemplateType]::ToastText02
  )
  $texts = @($xml.GetElementsByTagName("text"))
  if ($texts.Count -lt 2) { throw "Toast template text nodes not found (count=$($texts.Count))." }
  $texts[0].InnerText = $title
  $texts[1].InnerText = "Claude Code"
  [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Claude Code").Show(
    [Windows.UI.Notifications.ToastNotification]::new($xml)
  )
}
catch {
  try {
    $errorXml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent(
      [Windows.UI.Notifications.ToastTemplateType]::ToastText02
    )
    $errorTexts = @($errorXml.GetElementsByTagName("text"))
    $errorTexts[0].InnerText = "Claude Code Error"
    $errorTexts[1].InnerText = $_.Exception.Message

    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Claude Code").Show(
      [Windows.UI.Notifications.ToastNotification]::new($errorXml)
    )
  }
  catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
  }
}

