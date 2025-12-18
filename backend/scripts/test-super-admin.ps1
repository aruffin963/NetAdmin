# Script de test du Super Admin (Windows PowerShell)
# Usage: .\backend\scripts\test-super-admin.ps1

param(
    [string]$ApiUrl = "http://localhost:5000/api",
    [string]$Username = $env:SUPER_ADMIN_USERNAME -or "admin",
    [SecureString]$Password
)

# Convert environment variable or default to SecureString if not provided
if (-not $Password) {
    $plainPassword = if ($env:SUPER_ADMIN_PASSWORD) { $env:SUPER_ADMIN_PASSWORD } else { "MySecureAdminPassword123!" }
    $Password = ConvertTo-SecureString $plainPassword -AsPlainText -Force
}

Write-Host "🔐 Test du Super Admin" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  API URL: $ApiUrl"
Write-Host "  Username: $Username"
Write-Host ""

# Préparer le body
# Convert SecureString to plain text for API call
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

$body = @{
    username = $Username
    password = $plainPassword
} | ConvertTo-Json

# Test de connexion
Write-Host "🔑 Tentative de connexion..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod `
        -Uri "$ApiUrl/auth/login" `
        -Method Post `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body $body

    Write-Host ""
    Write-Host "📝 Réponse du serveur:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor White

    if ($response.success) {
        Write-Host ""
        Write-Host "✅ Connexion réussie!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Informations utilisateur:" -ForegroundColor Yellow
        Write-Host "  Username: $($response.user.username)"
        Write-Host "  Is Admin: $($response.user.isAdmin)"
        Write-Host "  Is Super Admin: $($response.user.isSuperAdmin)"
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Échec de connexion" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Assurez-vous que:" -ForegroundColor Yellow
    Write-Host "  1. Le serveur est en cours d'exécution (npm run dev)"
    Write-Host "  2. SUPER_ADMIN_USERNAME et SUPER_ADMIN_PASSWORD_HASH sont configurés dans .env"
    Write-Host "  3. Les identifiants sont corrects"
    Write-Host "  4. L'API répond sur $ApiUrl"
}
