#!/bin/bash

# FWC-HRMS Vercel Deployment Script
# This script helps deploy the frontend to Vercel

echo "🚀 FWC-HRMS Vercel Deployment Script"
echo "====================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel first:"
    vercel login
fi

echo "📦 Building frontend..."
cd apps/frontend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    cd ../..
    
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo "🎉 Deployment successful!"
        echo "📱 Your app is now live on Vercel!"
    else
        echo "❌ Deployment failed. Check the logs above."
    fi
else
    echo "❌ Build failed. Please fix the errors and try again."
fi
