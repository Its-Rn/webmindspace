$root = "H:\web\master-prompt-build-a-full-stack"

# Start server from root (uses in-memory MongoDB via root .env)
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "node.exe"
$psi.Arguments = "server/src/index.js"
$psi.WorkingDirectory = $root
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$p = [System.Diagnostics.Process]::Start($psi)

Start-Sleep -Seconds 10

# First login as admin
$loginBody = @{email = "kunal@gmail.com"; password = "2212Aryan@3"} | ConvertTo-Json
try {
  $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -SessionVariable "session"
  Write-Output "ADMIN LOGIN SUCCESS"

  # Now try to create a new user (admin only route)
  $createBody = @{
    name = "Test User"
    email = "testuser@example.com"
    password = "TestPass123!"
    role = "user"
    isEmailVerified = $true
    isActive = $true
  } | ConvertTo-Json

  $createResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/admin/users" -Method POST -Body $createBody -ContentType "application/json" -WebSession $session -ErrorAction Stop
  Write-Output "CREATE USER SUCCESS: $($createResponse | ConvertTo-Json -Compress)"

  # Try duplicate email
  try {
    $dupResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/admin/users" -Method POST -Body $createBody -ContentType "application/json" -WebSession $session -ErrorAction Stop
    Write-Output "DUPLICATE SHOULD HAVE FAILED"
  } catch {
    Write-Output "DUPLICATE REJECTED: $($_.Exception.Message)"
  }

  # List users to verify new user appears
  $listResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/admin/users" -Method GET -WebSession $session -ErrorAction Stop
  $users = $listResponse.data.data.users
  $newUser = $users | Where-Object { $_.email -eq "testuser@example.com" }
  if ($newUser) {
    Write-Output "NEW USER FOUND IN LIST: $($newUser.name) / $($newUser.email) / role=$($newUser.role)"
  } else {
    Write-Output "NEW USER NOT FOUND IN LIST"
  }

} catch {
  Write-Output "FAILED: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.BaseStream.Position = 0
    $reader.DiscardBufferedData()
    Write-Output "Response: $($reader.ReadToEnd())"
  }
}

Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
