#!/bin/bash

# Backup and cleanup script for backend
echo "🧹 Cleaning up backend - keeping only email functionality..."

# Create backup directory
mkdir -p backup-unused

# Move unused files to backup
echo "📦 Moving unused files to backup..."

# Move unused controllers (keep only what's needed for email)
mv controllers backup-unused/ 2>/dev/null || echo "Controllers already moved"

# Move unused middleware (keep only what's needed)
mv middleware backup-unused/ 2>/dev/null || echo "Middleware already moved"

# Move unused routes (keep only emailRoutes)
mkdir -p backup-unused/routes
mv routes/authRoutes.js backup-unused/routes/ 2>/dev/null || echo "authRoutes already moved"
mv routes/scrapingRoutes.js backup-unused/routes/ 2>/dev/null || echo "scrapingRoutes already moved"
mv routes/userRoutes.js backup-unused/routes/ 2>/dev/null || echo "userRoutes already moved"

# Move scrapers (not needed for email)
mv scrapers backup-unused/ 2>/dev/null || echo "Scrapers already moved"

# Move scripts (not needed for email)
mv scripts backup-unused/ 2>/dev/null || echo "Scripts already moved"

# Move utils (keep only what's needed)
mv utils backup-unused/ 2>/dev/null || echo "Utils already moved"

# Move models (empty anyway)
mv models backup-unused/ 2>/dev/null || echo "Models already moved"

# Replace main files with minimal versions
echo "🔄 Replacing with minimal versions..."
cp server-minimal.js server.js
cp package-minimal.json package.json

echo "✅ Cleanup complete!"
echo "📁 Unused files backed up to: backup-unused/"
echo "🚀 Run 'npm install' to install minimal dependencies"
echo "🎯 Only email notification functionality remains"

# Show final structure
echo ""
echo "📋 Final backend structure:"
find . -name "*.js" -o -name "*.json" | grep -v backup-unused | grep -v node_modules | sort