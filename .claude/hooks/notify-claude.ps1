Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$inputJson = [Console]::In.ReadToEnd()

try {
    $data = $inputJson | ConvertFrom-Json
    $message = $data.message
} catch {
    $message = ""
}

if ([string]::IsNullOrWhiteSpace($message)) {
    $message = "Claude Code가 입력 또는 승인을 기다리고 있습니다."
}

# 알림음
[System.Media.SystemSounds]::Exclamation.Play()

# Windows 팝업
[System.Windows.Forms.MessageBox]::Show(
    $message,
    "Claude Code 알림",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
)