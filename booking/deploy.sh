#!/bin/bash
# Automatic deployment script for Miosotys Booking

echo "🚀 Deploying to Vercel..."

# Deploy to production
DEPLOYMENT_URL=$(vercel --prod --yes | tail -n 1)

echo "✅ Deployed to: $DEPLOYMENT_URL"
echo "🔗 Setting alias to booking-beryl-eta.vercel.app..."

# Update alias
vercel alias set $DEPLOYMENT_URL booking-beryl-eta.vercel.app

echo "✅ Done! Your changes are live at https://booking-beryl-eta.vercel.app"
