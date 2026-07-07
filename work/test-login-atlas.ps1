$root = "H:\web\master-prompt-build-a-full-stack"
$serverDir = "$root\server"

# Start server from server directory (loads server/.env with Atlas URI)
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "node.exe"
$psi.Arguments = "src/index.js"
$psi.WorkingDirectory = $serverDir
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$p = [System.Diagnostics.Process]::Start($psi)

# Wait for server to be ready
Start-Sleep -Seconds 8

# Try login with demo account 1
$body1 = @{email = "kunal@gmail.com"; password = "2212Aryan@3"} | ConvertTo-Json
try {
  $response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method POST -Body $body1 -ContentType "application/json" -ErrorAction Stop
  Write-Output "LOGIN 1 (kunal) SUCCESS: $($response.success)"
} catch {
  Write-Output "LOGIN 1 (kunal) FAILED: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.BaseStream.Position = 0
    $reader.DiscardBufferedData()
    $errorBody = $reader.ReadToEnd()
    Write-Output "Response: $errorBody"
  }
}

# Try login with demo account 2
$body2 = @{email = "aryan@gmail.com"; password = "0902@Aryan3"} | ConvertTo-Json
try {
  $response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method POST -Body $body2 -ContentType "application/json" -ErrorAction Stop
  Write-Output "LOGIN 2 (aryan) SUCCESS: $($response.success)"
} catch {
  Write-Output "LOGIN 2 (aryan) FAILED: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.BaseStream.Position = 0
    $reader.DiscardBufferedData()
    $errorBody = $reader.ReadToEnd()
    Write-Output "Response: $errorBody"
  }
}

# Cleanup
Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
