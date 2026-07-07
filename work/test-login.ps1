$root = "H:\web\master-prompt-build-a-full-stack"
Set-Location $root

# Start server
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "node.exe"
$psi.Arguments = "server/src/index.js"
$psi.WorkingDirectory = $root
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$p = [System.Diagnostics.Process]::Start($psi)

# Wait for server to be ready
Start-Sleep -Seconds 8

# Try login
$body = @{email = "kunal@gmail.com"; password = "2212Aryan@3"} | ConvertTo-Json
try {
  $response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
  Write-Output "LOGIN SUCCESS: $($response | ConvertTo-Json -Compress)"
} catch {
  Write-Output "LOGIN FAILED: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.BaseStream.Position = 0
    $reader.DiscardBufferedData()
    $errorBody = $reader.ReadToEnd()
    Write-Output "Response body: $errorBody"
  }
}

# Cleanup
Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
