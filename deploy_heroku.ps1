# Job Monitor Platform - Heroku PowerShell Deploy Utility
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Job Monitor Platform - Heroku Deploy Utility" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$AppName = Read-Host "Enter your Heroku App Name"
if ([string]::IsNullOrWhiteSpace($AppName)) {
    Write-Host "[ERROR] Heroku App Name cannot be empty." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[Step 1/5] Running pre-deployment verification (Linter & Type Check)..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Linting failed! Deployment aborted." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[Step 2/5] Compiling TypeScript Backend and React Frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed! Deployment aborted." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[Step 3/5] Setting Heroku container stack and environment variables..." -ForegroundColor Yellow
heroku stack:set container -a $AppName
heroku config:set NODE_ENV=production IS_LOCAL=false FEATURE_PLAYWRIGHT=true -a $AppName

Write-Host ""
Write-Host "[Step 4/5] Configuring Git remote..." -ForegroundColor Yellow
git remote remove heroku 2>$null
git remote add heroku "https://git.heroku.com/$AppName.git"

Write-Host ""
Write-Host "[Step 5/5] Pushing container build to Heroku..." -ForegroundColor Yellow
git push heroku main --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "[NOTICE] Trying 'git push heroku master:main --force'..." -ForegroundColor Cyan
    git push heroku master:main --force
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Deployment successfully submitted to Heroku!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps in your Heroku Dashboard ($AppName):"
Write-Host "1. Go to Settings -> Reveal Config Vars."
Write-Host "2. Verify SUPABASE_URL, SUPABASE_SERVICE_KEY, and RESEND_API_KEY are configured."
Write-Host "3. Stream live logs using: heroku logs --tail -a $AppName"
Write-Host "=========================================="
