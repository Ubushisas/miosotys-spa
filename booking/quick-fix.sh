#!/bin/bash
cd /Users/lis/miosotys-spa/booking

# 1. Clear EVERYTHING
echo "🧹 Clearing all caches and builds..."
rm -rf .next node_modules/.cache .vercel

# 2. Reinstall
echo "📦 Reinstalling packages..."
npm install --force

# 3. Build locally
echo "🔨 Building locally..."
npm run build

# 4. Deploy without Git
if [ -d "../.git" ]; then
  mv ../.git ../.git.tmp
fi

echo "🚀 Deploying fresh build..."
vercel --prod --yes 2>&1 | tee /tmp/deploy.log

if [ -d "../.git.tmp" ]; then
  mv ../.git.tmp ../.git
fi

URL=$(grep -o 'https://booking-[a-z0-9]*-hello-ubushicoms-projects\.vercel\.app' /tmp/deploy.log | head -1)

if [ -n "$URL" ]; then
  echo "✅ Deployed: $URL"
  vercel alias set $URL booking-beryl-eta.vercel.app
  echo "✅ DONE! Wait 1 minute then test at https://booking-beryl-eta.vercel.app"
else
  echo "❌ Deployment failed"
  cat /tmp/deploy.log
fi
