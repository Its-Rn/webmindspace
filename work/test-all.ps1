$ErrorActionPreference = "Stop"
$root = "H:\web\master-prompt-build-a-full-stack"
$base = "http://localhost:5000/api/v1"
$pass = 0; $fail = 0; $bugs = @()
$testEmail = "testuser_$(Get-Random -Max 99999)@example.com"
$testPass = "SecurePass123!"

function Test-Step($name, $script) {
  try { & $script; $script:pass++; Write-Host "  + $name" -ForegroundColor Green }
  catch { $script:fail++; $script:bugs += "[$name] $_"; Write-Host "  x $name : $_" -ForegroundColor Red }
}

function Have($obj, $prop) { $null -ne $obj.PSObject.Properties[$prop] }

Write-Host "=== Starting server ===" -ForegroundColor Cyan
$sp = Start-Process -FilePath "node.exe" -ArgumentList "server/src/index.js" -WorkingDirectory $root -NoNewWindow -PassThru
Start-Sleep -Seconds 10

try {
# ═══ PUBLIC ═══
Write-Host "`n=== PUBLIC ENDPOINTS ===" -ForegroundColor Cyan
Test-Step "Health check" { $r = Invoke-RestMethod -Uri "$base/health/" -ErrorAction Stop;   if ($r.data.status -ne 'ok') { throw "Expected ok" } }
Test-Step "Root info" { $r = Invoke-RestMethod -Uri "$base/" -ErrorAction Stop; if (-not $r.success) { throw "Root failed" } }

# ═══ AUTH ═══
Write-Host "`n=== AUTHENTICATION ===" -ForegroundColor Cyan
$sessionVar = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Test-Step "Register new user" {
  $body = @{ name = "Test User"; email = $testEmail; password = $testPass } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/auth/register" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
  if (-not $r.success) { throw "Registration failed" }
  if (-not $r.data.verificationRequired) { throw "Expected verificationRequired=true" }
}

Test-Step "Register duplicate email" {
  $body = @{ name = "Another"; email = $testEmail; password = $testPass } | ConvertTo-Json
  try { $r = Invoke-RestMethod -Uri "$base/auth/register" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop; throw "No error" }
  catch { if ($_.Exception.Response.StatusCode -ne 409) { throw "Expected 409 got $($_.Exception.Response.StatusCode)" } }
}

Test-Step "Login blocked for unverified user" {
  $body = @{ email = $testEmail; password = $testPass } | ConvertTo-Json
  try { $r = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body $body -ContentType "application/json" -WebSession $sessionVar -ErrorAction Stop; throw "No error" }
  catch { if ($_.Exception.Response.StatusCode -ne 403) { throw "Expected 403 got $($_.Exception.Response.StatusCode)" } }
}

Test-Step "Login wrong password" {
  $body = @{ email = $testEmail; password = "WrongPass1!" } | ConvertTo-Json
  try { $r = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop; throw "No error" }
  catch { if ($_.Exception.Response.StatusCode -ne 401) { throw "Expected 401 got $($_.Exception.Response.StatusCode)" } }
}

Test-Step "Login non-existent user" {
  $body = @{ email = "noone@example.com"; password = "SomePass123!" } | ConvertTo-Json
  try { $r = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop; throw "No error" }
  catch { if ($_.Exception.Response.StatusCode -ne 401) { throw "Expected 401 got $($_.Exception.Response.StatusCode)" } }
}

Test-Step "Auth/me without auth returns 401" {
  try { $r = Invoke-RestMethod -Uri "$base/auth/me" -Method GET -ErrorAction Stop; throw "No error" }
  catch { if ($_.Exception.Response.StatusCode -ne 401) { throw "Expected 401 got $($_.Exception.Response.StatusCode)" } }
}

# Login as admin
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Test-Step "Login as admin" {
  $body = @{ email = "kunal@gmail.com"; password = "2212Aryan@3" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body $body -ContentType "application/json" -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Admin login failed" }
}

Test-Step "Get current user" {
  $r = Invoke-RestMethod -Uri "$base/auth/me" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "me failed" }
  if ($r.data.user.email -ne 'kunal@gmail.com') { throw "Email mismatch" }
}

Test-Step "Logout" {
  $r = Invoke-RestMethod -Uri "$base/auth/logout" -Method POST -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Logout failed" }
}

# Login again for subsequent tests
Test-Step "Re-login as admin" {
  $body = @{ email = "kunal@gmail.com"; password = "2212Aryan@3" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body $body -ContentType "application/json" -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Admin re-login failed" }
}

# ═══ PROFILE ═══
Write-Host "`n=== USER PROFILE ===" -ForegroundColor Cyan
Test-Step "Get own profile" {
  $r = Invoke-RestMethod -Uri "$base/users/me" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "getMyProfile failed" }
  if ($r.data.user.email -ne 'kunal@gmail.com') { throw "Wrong user" }
}

Test-Step "Update profile" {
  $body = @{ name = "Kunal Updated"; title = "Senior Admin" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/users/me" -Method PATCH -Body $body -ContentType "application/json" -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "updateProfile failed" }
  if ($r.data.user.name -ne "Kunal Updated") { throw "Name not updated" }
}

Test-Step "Update profile empty name" {
  $body = @{ name = "" } | ConvertTo-Json
  try { $r = Invoke-RestMethod -Uri "$base/users/me" -Method PATCH -Body $body -ContentType "application/json" -WebSession $adminSession -ErrorAction Stop; throw "No error" }
  catch { if ($_.Exception.Response.StatusCode -ne 400) { throw "Expected 400 got $($_.Exception.Response.StatusCode)" } }
}

# ═══ DASHBOARD ═══
Write-Host "`n=== DASHBOARD ===" -ForegroundColor Cyan
Test-Step "Get dashboard" {
  $r = Invoke-RestMethod -Uri "$base/dashboard/" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Dashboard failed" }
}

Test-Step "Dashboard without auth" {
  try { $r = Invoke-RestMethod -Uri "$base/dashboard/" -Method GET -ErrorAction Stop; throw "No error" }
  catch { if ($_.Exception.Response.StatusCode -ne 401) { throw "Expected 401 got $($_.Exception.Response.StatusCode)" } }
}

# ═══ BLOG ═══
Write-Host "`n=== BLOG ===" -ForegroundColor Cyan
$blogId = $null; $blogSlug = $null

Test-Step "Create blog post" {
  $body = @{ title = "Test Blog $(Get-Random)"; content = "This is **markdown** content."; excerpt = "Short excerpt"; status = "published"; tags = @("test","bug-hunt") } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/blog/" -Method POST -Body $body -ContentType "application/json" -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Create blog failed" }
  $script:blogId = $r.data.post.id; $script:blogSlug = $r.data.post.slug
  if (-not $blogId) { throw "No _id returned" }
  if (-not $blogSlug) { throw "No slug returned" }
}

Test-Step "Get blog by slug" {
  $r = Invoke-RestMethod -Uri "$base/blog/$blogSlug" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Get by slug failed" }
}

Test-Step "Get blog by ID" {
  $r = Invoke-RestMethod -Uri "$base/blog/$blogId" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Get by ID failed" }
}

Test-Step "List blog posts" {
  $r = Invoke-RestMethod -Uri "$base/blog/" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "List blog failed" }
  if ($r.data.posts.Count -lt 1) { throw "Expected posts" }
}

Test-Step "Update blog post" {
  $body = @{ title = "Updated Title" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/blog/$blogId" -Method PATCH -Body $body -ContentType "application/json" -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Update blog failed" }
}

Test-Step "Delete blog post" {
  $r = Invoke-RestMethod -Uri "$base/blog/$blogId" -Method DELETE -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Delete blog failed" }
}

Test-Step "Get deleted blog post returns 404" {
  try { $r = Invoke-RestMethod -Uri "$base/blog/$blogId" -Method GET -WebSession $adminSession -ErrorAction Stop; throw "No error" }
  catch { if ($_.Exception.Response.StatusCode -ne 404) { throw "Expected 404 got $($_.Exception.Response.StatusCode)" } }
}

# ═══ TASKS ═══
Write-Host "`n=== TASKS ===" -ForegroundColor Cyan
$taskId = $null

Test-Step "Create task" {
  $body = @{ title = "Test Task $(Get-Random)"; description = "Description"; priority = "high"; status = "pending"; category = "work" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/tasks/" -Method POST -Body $body -ContentType "application/json" -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Create task failed" }
  $script:taskId = $r.data.task.id
}

Test-Step "List tasks" {
  $r = Invoke-RestMethod -Uri "$base/tasks/" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "List tasks failed" }
}

Test-Step "Update task" {
  $body = @{ title = "Updated Task"; status = "in-progress" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/tasks/$taskId" -Method PATCH -Body $body -ContentType "application/json" -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Update task failed" }
}

Test-Step "Delete task" {
  $r = Invoke-RestMethod -Uri "$base/tasks/$taskId" -Method DELETE -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Delete task failed" }
}

Test-Step "Create task empty title" {
  $body = @{ title = "" } | ConvertTo-Json
  try { $r = Invoke-RestMethod -Uri "$base/tasks/" -Method POST -Body $body -ContentType "application/json" -WebSession $adminSession -ErrorAction Stop; throw "No error" }
  catch { if ($_.Exception.Response.StatusCode -ne 400) { throw "Expected 400 got $($_.Exception.Response.StatusCode)" } }
}

# ═══ NOTES ═══
Write-Host "`n=== NOTES ===" -ForegroundColor Cyan
$noteId = $null

Test-Step "Create note" {
  $body = @{ title = "Test Note $(Get-Random)"; content = "Note content!"; tags = @("work","ideas"); color = "blue" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/notes/" -Method POST -Body $body -ContentType "application/json" -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Create note failed" }
  $script:noteId = $r.data._id
}

Test-Step "Get note by ID" {
  $r = Invoke-RestMethod -Uri "$base/notes/$noteId" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Get note failed" }
}

Test-Step "List notes" {
  $r = Invoke-RestMethod -Uri "$base/notes/" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "List notes failed" }
}

Test-Step "Get note tags" {
  $r = Invoke-RestMethod -Uri "$base/notes/tags" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Get tags failed" }
}

Test-Step "Update note" {
  $body = @{ title = "Updated Note Title"; isPinned = $true } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/notes/$noteId" -Method PATCH -Body $body -ContentType "application/json" -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Update note failed" }
}

Test-Step "Delete note" {
  $r = Invoke-RestMethod -Uri "$base/notes/$noteId" -Method DELETE -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Delete note failed" }
}

# ═══ TIMELINE ═══
Write-Host "`n=== TIMELINE ===" -ForegroundColor Cyan
$tlId = $null

Test-Step "Create timeline post" {
  $body = @{ content = "Test timeline post $(Get-Random)"; mediaUrl = "" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/timeline/" -Method POST -Body $body -ContentType "application/json" -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Create timeline failed" }
  $script:tlId = $r.data.post.id
}

Test-Step "List timeline" {
  $r = Invoke-RestMethod -Uri "$base/timeline/" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "List timeline failed" }
}

Test-Step "Pin timeline post" {
  $r = Invoke-RestMethod -Uri "$base/timeline/$tlId/pin" -Method PATCH -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Pin timeline failed" }
}

Test-Step "Delete timeline post" {
  $r = Invoke-RestMethod -Uri "$base/timeline/$tlId" -Method DELETE -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Delete timeline failed" }
}

# ═══ CHAT ═══
Write-Host "`n=== CHAT ===" -ForegroundColor Cyan
$convId = $null

Test-Step "Search users" {
  $r = Invoke-RestMethod -Uri "$base/chat/search/users?q=aryan" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Search failed" }
  $list = @($r.data)
  if ($list.Count -eq 0) { throw "No users found" }
}

Test-Step "Get or create conversation" {
  $r2 = Invoke-RestMethod -Uri "$base/admin/users" -Method GET -WebSession $adminSession
  $otherUser = $r2.data.users | Where-Object { $_.email -eq 'aryan@gmail.com' }
  if (-not $otherUser) { throw "Could not find Aryan" }
  $r = Invoke-RestMethod -Uri "$base/chat/conversations/$($otherUser._id)" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Get conversation failed" }
  $script:convId = $r.data._id
}

Test-Step "Send message" {
  $body = @{ content = "Hello from test!" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/chat/conversations/$convId/messages" -Method POST -Body $body -ContentType "application/json" -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Send message failed" }
}

Test-Step "Get messages" {
  $r = Invoke-RestMethod -Uri "$base/chat/conversations/$convId/messages" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Get messages failed" }
  $msgs = @($r.data); if ($msgs.Count -eq 0) { throw "Expected messages" }
}

Test-Step "List conversations" {
  $r = Invoke-RestMethod -Uri "$base/chat/conversations" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "List conversations failed" }
}

# ═══ NOTIFICATIONS ═══
Write-Host "`n=== NOTIFICATIONS ===" -ForegroundColor Cyan
Test-Step "Get notifications" {
  $r = Invoke-RestMethod -Uri "$base/notifications/" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Get notifications failed" }
}

Test-Step "Get unread count" {
  $r = Invoke-RestMethod -Uri "$base/notifications/unread-count" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Unread count failed" }
}

Test-Step "Mark all as read" {
  $r = Invoke-RestMethod -Uri "$base/notifications/read-all" -Method PATCH -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Mark all read failed" }
}

Test-Step "404 notification" {
  try { $r = Invoke-RestMethod -Uri "$base/notifications/000000000000000000000000/read" -Method PATCH -WebSession $adminSession -ErrorAction Stop; throw "No error" }
  catch { if ($_.Exception.Response.StatusCode -ne 404) { throw "Expected 404 got $($_.Exception.Response.StatusCode)" } }
}

# ═══ ADMIN ═══
Write-Host "`n=== ADMIN ===" -ForegroundColor Cyan
$newUserId = $null

Test-Step "Admin dashboard stats" {
  $r = Invoke-RestMethod -Uri "$base/admin/dashboard" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Admin dashboard failed" }
  if (-not (Have $r.data "counts")) { throw "Missing counts" }
  if ($r.data.counts.users -lt 2) { throw "Expected >=2 users" }
}

Test-Step "Admin list users" {
  $r = Invoke-RestMethod -Uri "$base/admin/users" -Method GET -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "List users failed" }
  if ($r.data.users.Count -eq 0) { throw "Expected users" }
  if (-not (Have $r.data "pagination")) { throw "Missing pagination" }
}

Test-Step "Admin search users" {
  $r = Invoke-RestMethod -Uri "$base/admin/users?search=kunal" -Method GET -WebSession $adminSession -ErrorAction Stop
  if ($r.data.users.Count -eq 0) { throw "Expected matches" }
}

Test-Step "Admin create user" {
  $body = @{ name = "Created By Admin"; email = "admincreated_$(Get-Random)@example.com"; password = "StrongPass123!"; role = "user"; isEmailVerified = $true; isActive = $true } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/admin/users" -Method POST -Body $body -ContentType "application/json" -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Create user failed" }
  $script:newUserId = $r.data.id
}

Test-Step "Admin toggle user active" {
  $r = Invoke-RestMethod -Uri "$base/admin/users/$newUserId/toggle-active" -Method PATCH -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Toggle active failed" }
  if ($r.data.isActive -ne $false) { throw "Expected isActive=false" }
}

Test-Step "Admin toggle user admin" {
  $r = Invoke-RestMethod -Uri "$base/admin/users/$newUserId/toggle-admin" -Method PATCH -WebSession $adminSession -ErrorAction Stop
  if (-not $r.success) { throw "Toggle admin failed" }
  if ($r.data.role -ne "admin") { throw "Expected role=admin" }
}

Test-Step "Admin create duplicate email" {
  $body = @{ name = "Dup"; email = "kunal@gmail.com"; password = "SomePass123!"; role = "user" } | ConvertTo-Json
  try { $r = Invoke-RestMethod -Uri "$base/admin/users" -Method POST -Body $body -ContentType "application/json" -WebSession $adminSession -ErrorAction Stop; throw "No error" }
  catch { if ($_.Exception.Response.StatusCode -ne 409) { throw "Expected 409 got $($_.Exception.Response.StatusCode)" } }
}

# ═══ ACCESS CONTROL ═══
Write-Host "`n=== ACCESS CONTROL ===" -ForegroundColor Cyan
$userSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Test-Step "Login as regular user" {
  $body = @{ email = "aryan@gmail.com"; password = "0902@Aryan3" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body $body -ContentType "application/json" -WebSession $userSession -ErrorAction Stop
  if (-not $r.success) { throw "User login failed" }
}

Test-Step "Regular user cannot access admin" {
  try { $r = Invoke-RestMethod -Uri "$base/admin/dashboard" -Method GET -WebSession $userSession -ErrorAction Stop; throw "No error" }
  catch { if ($_.Exception.Response.StatusCode -ne 403) { throw "Expected 403 got $($_.Exception.Response.StatusCode)" } }
}

} finally {
  Start-Sleep 2
  Write-Host "`n=== RESULTS ===" -ForegroundColor Cyan
  Write-Host "Passed: $pass" -ForegroundColor Green
  Write-Host "Failed: $fail" -ForegroundColor Red
  if ($bugs.Count -gt 0) {
    Write-Host "`nBUGS FOUND:" -ForegroundColor Yellow
    $bugs | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
  }
  Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
}
