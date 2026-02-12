#!/usr/bin/env bash

echo "🧹 Cleaning project..."
rm -rf node_modules
rm -f package-lock.json
rm -f pnpm-lock.yaml
rm -f yarn.lock
rm -rf .astro
rm -rf .vite

echo "🔄 Reinstalling..."
npm cache verify
npm install

echo "🚀 Done. Run: npm run dev"
