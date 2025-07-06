# download-test.ps1
$downloadToken = Read-Host "Enter base64 download token"
$passcode = Read-Host "Enter passcode"
$attempts = 15

for ($i = 0; $i -lt $attempts; $i++) {
    Write-Host "`nAttempt #$i"
    try {
        Write-Output "$passcode"|dropzone download $downloadToken
    } catch {
        Write-Host "❌ Download failed: $_"
    }
    Start-Sleep -Milliseconds 50
}
