#!/bin/bash

echo "🏗️ Building Leirisonda Mobile App..."

# Build the web app
echo "📦 Building web assets..."
npm run build

# Copy to native projects
echo "📱 Copying to iOS..."
npx cap copy ios

echo "🤖 Copying to Android..."
npx cap copy android

# Sync native projects
echo "🔄 Syncing iOS..."
npx cap sync ios

echo "🔄 Syncing Android..."
npx cap sync android

echo "✅ Build complete!"
echo ""
echo "📱 To open in Xcode (iOS):"
echo "   npx cap open ios"
echo ""
echo "🤖 To open in Android Studio:"
echo "   npx cap open android"
echo ""
echo "📋 Next steps:"
echo "   1. iOS: Open Xcode, connect iPhone, build & run"
echo "   2. Android: Open Android Studio, connect phone, build & run"
