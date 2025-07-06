for ($i = 0; $i -lt 15; $i++) {
    Write-Host "`nUpload attempt #$i"
    "mysecretpasscode" | dropzone upload secret.txt
    Start-Sleep -Milliseconds 50
}