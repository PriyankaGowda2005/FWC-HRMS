@echo off
REM FWC-HRMS Vercel Deployment Script for Windows
REM This script helps deploy the frontend to Vercel

echo 🚀 FWC-HRMS Vercel Deployment Script
echo =====================================

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Check if user is logged in to Vercel
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔐 Please login to Vercel first:
    vercel login
)

echo 📦 Building frontend...
cd apps\frontend
call npm run build

if %errorlevel% equ 0 (
    echo ✅ Build successful!
    cd ..\..
    
    echo 🚀 Deploying to Vercel...
    vercel --prod
    
    if %errorlevel% equ 0 (
        echo 🎉 Deployment successful!
        echo 📱 Your app is now live on Vercel!
    ) else (
        echo ❌ Deployment failed. Check the logs above.
    )
) else (
    echo ❌ Build failed. Please fix the errors and try again.
)

pause
