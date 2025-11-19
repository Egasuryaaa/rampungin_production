# Quick Test - Admin Panel Features
# Test all admin endpoints

$BASE_URL = "http://localhost:3000/api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ADMIN PANEL API - QUICK TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as Admin
Write-Host "[1/10] Login sebagai Admin..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@rampungin.id"
        password = "password123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody -ErrorAction Stop

    if ($loginResponse.status -eq "success") {
        Write-Host "✓ Login berhasil" -ForegroundColor Green
        $adminToken = $loginResponse.data.token
    } else {
        Write-Host "✗ Login gagal" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    Write-Host "Note: Pastikan sudah ada user dengan email admin@rampungin.id dan password password123" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Headers untuk semua request
$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

# Step 2: Get Dashboard
Write-Host "[2/10] Mengambil Dashboard Statistics..." -ForegroundColor Yellow
try {
    $dashboard = Invoke-RestMethod -Uri "$BASE_URL/admin/dashboard" -Method GET -Headers @{"Authorization"="Bearer $adminToken"} -ErrorAction Stop
    Write-Host "✓ Dashboard berhasil dimuat" -ForegroundColor Green
    Write-Host "  Total Users: $($dashboard.data.users.total)" -ForegroundColor Gray
    Write-Host "  - Client: $($dashboard.data.users.client)" -ForegroundColor Gray
    Write-Host "  - Tukang: $($dashboard.data.users.tukang)" -ForegroundColor Gray
    Write-Host "  - Admin: $($dashboard.data.users.admin)" -ForegroundColor Gray
    Write-Host "  Pending Topup: $($dashboard.data.finance.pending_topup)" -ForegroundColor Gray
    Write-Host "  Pending Withdrawal: $($dashboard.data.finance.pending_withdrawal)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Step 3: Get All Users
Write-Host "[3/10] Mengambil List Users..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$BASE_URL/admin/users?limit=5" -Method GET -Headers @{"Authorization"="Bearer $adminToken"} -ErrorAction Stop
    Write-Host "✓ Users berhasil dimuat" -ForegroundColor Green
    Write-Host "  Total: $($users.data.pagination.total) users" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Step 4: Get Categories
Write-Host "[4/10] Mengambil List Kategori..." -ForegroundColor Yellow
try {
    $categories = Invoke-RestMethod -Uri "$BASE_URL/admin/categories" -Method GET -Headers @{"Authorization"="Bearer $adminToken"} -ErrorAction Stop
    Write-Host "✓ Kategori berhasil dimuat" -ForegroundColor Green
    Write-Host "  Total: $($categories.data.Count) kategori" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Step 5: Create Category
Write-Host "[5/10] Membuat Kategori Baru..." -ForegroundColor Yellow
try {
    $categoryBody = @{
        nama = "Tukang Test - $(Get-Date -Format 'HHmmss')"
        deskripsi = "Kategori untuk testing admin panel"
    } | ConvertTo-Json

    $newCategory = Invoke-RestMethod -Uri "$BASE_URL/admin/categories" -Method POST -Headers $headers -Body $categoryBody -ErrorAction Stop
    Write-Host "✓ Kategori berhasil dibuat" -ForegroundColor Green
    Write-Host "  ID: $($newCategory.data.id)" -ForegroundColor Gray
    Write-Host "  Nama: $($newCategory.data.nama)" -ForegroundColor Gray
    $script:testCategoryId = $newCategory.data.id
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    $script:testCategoryId = $null
}

Write-Host ""

# Step 6: Update Category
if ($script:testCategoryId) {
    Write-Host "[6/10] Update Kategori..." -ForegroundColor Yellow
    try {
        $updateBody = @{
            nama = "Tukang Test Updated - $(Get-Date -Format 'HHmmss')"
            deskripsi = "Kategori sudah diupdate"
        } | ConvertTo-Json

        $updated = Invoke-RestMethod -Uri "$BASE_URL/admin/categories/$($script:testCategoryId)" -Method PUT -Headers $headers -Body $updateBody -ErrorAction Stop
        Write-Host "✓ Kategori berhasil diupdate" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "[6/10] Skip Update Kategori" -ForegroundColor Gray
}

Write-Host ""

# Step 7: Get Unverified Tukang
Write-Host "[7/10] Mengambil Unverified Tukang..." -ForegroundColor Yellow
try {
    $unverified = Invoke-RestMethod -Uri "$BASE_URL/admin/verifications/tukang" -Method GET -Headers @{"Authorization"="Bearer $adminToken"} -ErrorAction Stop
    Write-Host "✓ Data berhasil dimuat" -ForegroundColor Green
    Write-Host "  Unverified Tukang: $($unverified.data.pagination.total)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Step 8: Get Pending Topup
Write-Host "[8/10] Mengambil Pending Topup..." -ForegroundColor Yellow
try {
    $topup = Invoke-RestMethod -Uri "$BASE_URL/admin/finance/topup" -Method GET -Headers @{"Authorization"="Bearer $adminToken"} -ErrorAction Stop
    Write-Host "✓ Data berhasil dimuat" -ForegroundColor Green
    Write-Host "  Pending Topup: $($topup.data.pagination.total)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Step 9: Get Pending Withdrawal
Write-Host "[9/10] Mengambil Pending Withdrawal..." -ForegroundColor Yellow
try {
    $withdrawal = Invoke-RestMethod -Uri "$BASE_URL/admin/finance/withdrawal" -Method GET -Headers @{"Authorization"="Bearer $adminToken"} -ErrorAction Stop
    Write-Host "✓ Data berhasil dimuat" -ForegroundColor Green
    Write-Host "  Pending Withdrawal: $($withdrawal.data.pagination.total)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Step 10: Get All Transactions
Write-Host "[10/10] Mengambil Transactions..." -ForegroundColor Yellow
try {
    $transactions = Invoke-RestMethod -Uri "$BASE_URL/admin/transactions?limit=5" -Method GET -Headers @{"Authorization"="Bearer $adminToken"} -ErrorAction Stop
    Write-Host "✓ Data berhasil dimuat" -ForegroundColor Green
    Write-Host "  Total Transactions: $($transactions.data.pagination.total)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Cleanup: Delete Test Category
if ($script:testCategoryId) {
    Write-Host "[CLEANUP] Menghapus Test Category..." -ForegroundColor Yellow
    try {
        Invoke-RestMethod -Uri "$BASE_URL/admin/categories/$($script:testCategoryId)" -Method DELETE -Headers @{"Authorization"="Bearer $adminToken"} -ErrorAction Stop | Out-Null
        Write-Host "✓ Test category berhasil dihapus" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ALL TESTS COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin Panel Features:" -ForegroundColor Cyan
Write-Host "  Dashboard Statistics" -ForegroundColor Green
Write-Host "  User Management" -ForegroundColor Green
Write-Host "  Category CRUD" -ForegroundColor Green
Write-Host "  Tukang Verification" -ForegroundColor Green
Write-Host "  Topup Verification" -ForegroundColor Green
Write-Host "  Withdrawal Verification" -ForegroundColor Green
Write-Host "  Transaction Monitoring" -ForegroundColor Green
Write-Host ""
Write-Host "Untuk test lengkap, lihat: API_ADMIN_DOCUMENTATION.md" -ForegroundColor Yellow
