#!/bin/bash

set -e  # Stop on first error

echo "=============================="
echo " Marine Maintenance App Setup "
echo "=============================="
echo ""

echo "📁 Moving to project directory..."
cd "/c/Users/grich/OneDrive/Documents/Worthy Marine/Marine-Maintenance-App/marine-maintenance-app"
echo "✅ Directory set to: $(pwd)"
echo ""

echo "🔄 Pulling latest changes from GitHub..."
git pull
echo "✅ Git pull complete"
echo ""

echo "📦 Installing dependencies..."
npm install
echo "✅ npm install complete"
echo ""

echo "🧠 Opening project in VS Code..."
code .
echo "✅ VS Code opened"
echo ""

echo "🚀 Starting development server..."
npm run dev
