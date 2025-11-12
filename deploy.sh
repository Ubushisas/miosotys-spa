#!/bin/bash

echo "🚀 Miosotys Spa Deployment Script"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Deploy Backend to Vercel
echo -e "${BLUE}📦 Deploying Backend (Booking System)...${NC}"
cd booking

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm i -g vercel
fi

# Deploy to production
echo -e "${GREEN}Deploying to Vercel production...${NC}"
vercel --prod

echo ""
echo -e "${GREEN}✅ Backend deployment complete!${NC}"
echo ""

# Instructions for frontend
cd ..
echo -e "${BLUE}📄 Frontend Deployment Instructions:${NC}"
echo "=================================="
echo ""
echo "The frontend (catalog) is in the /docs folder."
echo "To deploy to GitHub Pages:"
echo ""
echo "1. Push all changes to GitHub:"
echo "   git add ."
echo "   git commit -m \"Update services and calendar integration\""
echo "   git push origin main"
echo ""
echo "2. Go to GitHub repository settings"
echo "3. Navigate to Pages section"
echo "4. Ensure 'Deploy from branch: main /docs' is selected"
echo "5. GitHub Pages will automatically deploy"
echo ""
echo -e "${GREEN}✅ Deployment script complete!${NC}"
echo ""
echo "📋 Don't forget to test:"
echo "  - All service bookings work"
echo "  - Service info appears correctly"
echo "  - Images load properly"
echo "  - Calendar availability is accurate"
