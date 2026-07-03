# Regression test using PowerShell
$BASE = 'https://textbook-ing.vercel.app'
$ADMIN_EMAIL = if ($env:TEST_ADMIN_EMAIL) { $env:TEST_ADMIN_EMAIL } else { 'admin@textbook-ing.com' }
$ADMIN_PASSWORD = if ($env:TEST_ADMIN_PASSWORD) { $env:TEST_ADMIN_PASSWORD } else { 'admin123' }

$passed = 0
$failed = 0

function Check-Result($name, $condition, $detail) {
    if ($condition) {
        $script:passed++
        Write-Host "  [OK] $name $detail"
    } else {
        $script:failed++
        Write-Host "  [FAIL] $name $detail"
    }
}

function Fetch-Api($url, $method = 'GET', $body = $null, $token = $null) {
    $headers = @{ 'Content-Type' = 'application/json' }
    if ($token) { $headers['Authorization'] = "Bearer $token" }
    try {
        $params = @{
            Uri         = "$BASE$url"
            Method      = $method
            Headers     = $headers
            TimeoutSec  = 30
            ErrorAction = 'Stop'
        }
        if ($body) { $params.Body = $body }
        $resp = Invoke-WebRequest @params -UseBasicParsing
        $data = $resp.Content | ConvertFrom-Json
        return @{ status = $resp.StatusCode; length = $resp.Content.Length; data = $data; error = $null }
    } catch {
        return @{ status = 0; length = 0; data = $null; error = $_.Exception.Message }
    }
}

Write-Host "========================================"
Write-Host "Regression Test"
Write-Host "========================================"

Write-Host "`n=== 1. Public API ==="
$apis = @(
    '/api/news?pageSize=3',
    '/api/news/categories',
    '/api/stats',
    '/api/semesters',
    '/api/colleges',
    '/api/textbooks/hot-searches'
)
foreach ($url in $apis) {
    $r = Fetch-Api $url
    Check-Result $url ($r.status -eq 200 -and $r.data.code -eq 0) "-> $($r.status), $($r.length)b, err=$($r.error)"
}

Write-Host "`n=== 2. Admin Login ==="
$loginBody = @{ email = $ADMIN_EMAIL; password = $ADMIN_PASSWORD } | ConvertTo-Json
$loginR = Fetch-Api '/api/auth/login' 'POST' $loginBody
$adminToken = $null
if ($loginR.data -and $loginR.data.data -and $loginR.data.data.token) {
    $adminToken = $loginR.data.data.token
}
Check-Result 'Admin login' ($loginR.status -eq 200 -and $adminToken) "-> $($loginR.status)"

if (-not $adminToken) {
    Write-Host "`nAdmin login failed." -ForegroundColor Red
    Write-Host "Error: $($loginR.error)"
    Write-Host "Status: $($loginR.status)"
    exit 1
}

Write-Host "`n=== 3. Admin APIs ==="
$adminApis = @(
    '/api/admin/stats',
    '/api/admin/textbooks?page=1&pageSize=5',
    '/api/admin/news?page=1&pageSize=5',
    '/api/admin/users?page=1&pageSize=5',
    '/api/admin/semesters',
    '/api/admin/colleges',
    '/api/admin/courses',
    '/api/admin/categories'
)
foreach ($url in $adminApis) {
    $r = Fetch-Api $url 'GET' $null $adminToken
    Check-Result $url ($r.status -eq 200 -and $r.data.code -eq 0) "-> $($r.status), $($r.length)b"
}

Write-Host "`n=== 4. Textbook Dedup ==="
$tbR = Fetch-Api '/api/admin/textbooks?page=1&pageSize=100' 'GET' $null $adminToken
if ($tbR.data -and $tbR.data.code -eq 0) {
    $textbooks = $tbR.data.data.list
    $titles = $textbooks | ForEach-Object { $_.title }
    $uniqueCount = ($titles | Sort-Object -Unique).Count
    Check-Result 'No duplicates' ($titles.Count -eq $uniqueCount) "-> $($titles.Count) total, $uniqueCount unique"
}

Write-Host "`n=== 5. Homepage ==="
try {
    $homeResp = Invoke-WebRequest -Uri "$BASE/" -TimeoutSec 30 -UseBasicParsing
    Check-Result 'Homepage' ($homeResp.StatusCode -eq 200) "-> $($homeResp.StatusCode), $($homeResp.Content.Length)b"
} catch {
    Check-Result 'Homepage' $false "err=$($_.Exception.Message)"
}

Write-Host "`n========================================"
Write-Host "Result: $passed passed, $failed failed"
Write-Host "========================================"
if ($failed -gt 0) { exit 1 }
