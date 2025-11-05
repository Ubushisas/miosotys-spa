#!/bin/bash
cd /Users/lis/miosotys-spa/booking

# Remove ALL caches
echo "🧹 Cleaning all caches..."
rm -rf .next
rm -rf .vercel
rm -rf node_modules/.cache

# Hide git temporarily
if [ -d "../.git" ]; then
  mv ../.git ../.git.tmp
fi

echo "🚀 Force deploying with NO CACHE..."
DEPLOY_OUTPUT=$(vercel --prod --yes --force 2>&1)

# Restore git
if [ -d "../.git.tmp" ]; then
  mv ../.git.tmp ../.git
fi

# Extract URL
URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://booking-[a-z0-9]*-hello-ubushicoms-projects\.vercel\.app' | head -1)

if [ -z "$URL" ]; then
  echo "❌ Deployment failed!"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

echo "✅ Deployed to: $URL"
echo "🔗 Updating alias..."
vercel alias set $URL booking-beryl-eta.vercel.app

echo ""
echo "✅ DONE! Changes are at https://booking-beryl-eta.vercel.app"
