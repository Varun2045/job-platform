@echo off
echo ==========================================
echo Job Monitor Platform - Heroku Deploy Utility
echo ==========================================
echo.

set /p APP_NAME="Enter your Heroku App Name: "

echo.
echo [Step 1/5] Running pre-deployment verification (Linter & Type Check)...
call npm run lint
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Linting failed! Deployment aborted.
    exit /b %ERRORLEVEL%
)

echo.
echo [Step 2/5] Compiling TypeScript Backend and React Frontend...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed! Deployment aborted.
    exit /b %ERRORLEVEL%
)

echo.
echo [Step 3/5] Setting Heroku container stack and environment variables...
call heroku stack:set container -a %APP_NAME%
call heroku config:set NODE_ENV=production IS_LOCAL=false FEATURE_PLAYWRIGHT=true -a %APP_NAME%

echo.
echo [Step 4/5] Configuring Git remote...
call git remote remove heroku >nul 2>&1
call git remote add heroku https://git.heroku.com/%APP_NAME%.git

echo.
echo [Step 5/5] Pushing container build to Heroku...
call git push heroku main --force
if %ERRORLEVEL% NEQ 0 (
    echo [NOTICE] If your local branch is 'master', trying 'git push heroku master:main --force'...
    call git push heroku master:main --force
)

echo.
echo ==========================================
echo Deployment successfully submitted to Heroku!
echo ==========================================
echo.
echo Next Steps in your Heroku Dashboard (%APP_NAME%):
echo 1. Go to Settings -> Reveal Config Vars.
echo 2. Verify SUPABASE_URL, SUPABASE_SERVICE_KEY, and RESEND_API_KEY are configured.
echo 3. Stream live logs using: heroku logs --tail -a %APP_NAME%
echo ==========================================
pause
