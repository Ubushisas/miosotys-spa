# Miosotys Spa - Complete Project Structure

## Production URLs
- **Main Site**: https://spamyosotis.com (GitHub Pages)
- **Booking Backend**: https://miosotys-spa.vercel.app (Vercel)
- **Admin Panel**: https://miosotys-spa.vercel.app/admin/settings

## Project Location
**Main Production Repo**: `/Users/pedro/Documents/Websites/miosotys-spa-live/`

### Directory Structure
```
miosotys-spa-live/
├── docs/                    # Static site (deployed to GitHub Pages)
│   ├── index.html          # Homepage
│   ├── catalogo.html       # Services catalog with booking iframe
│   ├── styles.css
│   ├── script.js
│   ├── Assets/             # Fonts
│   └── Test_Images/        # All images
│       ├── Catálogo/       # Package images
│       └── Test2/          # Hero images
│
├── booking/                # Next.js app (deployed to Vercel)
│   ├── src/
│   │   ├── app/           # Next.js 15 app directory
│   │   ├── components/
│   │   │   └── CalendlyBooking/
│   │   │       ├── CalendlyBooking.jsx  # Main booking component
│   │   │       └── CalendlyBooking.css
│   │   └── lib/
│   │       └── calendar.js              # Google Calendar integration
│   ├── .env.local         # ⚠️ CRITICAL - Environment variables
│   ├── package.json
│   └── vercel.json
│
└── .vercel/
    └── project.json       # Links to Vercel deployment
```

## Critical Files to Backup

### 1. Environment Variables (.env.local)
**Location**: `/Users/pedro/Documents/Websites/miosotys-spa-live/booking/.env.local`
**Contains**:
- Google OAuth credentials
- Google Calendar API tokens
- Twilio credentials
- WhatsApp configuration

### 2. Vercel Project Link
**Location**: `/Users/pedro/Documents/Websites/miosotys-spa-live/.vercel/project.json`
```json
{"projectId":"prj_EiuMLzNnabaO1VLP7GP2Fpypxo1i","orgId":"team_s0nyrl88IB4PAdNIJYdqjpIX","projectName":"miosotys-spa"}
```

## Working Local Environment

### Localhost:8080 (Static Site)
**Directory**: `/Users/pedro/Documents/Websites/miosotys-spa-complete/docs/`
**Run**: Already running on port 8080
**URL**: http://localhost:8080

### Localhost:3002 (Booking Backend)
**Directory**: `/Users/pedro/Documents/Websites/miosotys-spa-live/booking/`
**Run**: `npm run dev`
**URL**: http://localhost:3002

## Key Integrations

### 1. Google Calendar
- **Files**: `booking/src/lib/calendar.js`
- **Calendars**:
  - Sala Individual: `44b404aad9e13f877c9af362787bf2a0212fbcad1a073bfa3439392167bd0c5f@group.calendar.google.com`
  - Sala Principal: `5f7b7d0630cdbfe75c87101e63c334ccc2a875971b4c26d4a39003210b5bf393@group.calendar.google.com`
- **Timezone**: Colombia (UTC-5) - Fixed in lines 219-242

### 2. WhatsApp Redirect
- **File**: `booking/src/components/CalendlyBooking/CalendlyBooking.jsx:367-372`
- **Uses**: `window.top.location.href` to escape iframe
- **Format**: `wa.me/573XXXXXXXXX?text=...`

### 3. Twilio SMS
- **Working**: Confirmed working on localhost:8080
- **Credentials**: In `.env.local`

### 4. Lunch Break Blocking
- **File**: `booking/src/lib/calendar.js:148-160`
- **Time**: 12:30 PM - 2:00 PM Colombia time

## Deployment Workflow

### GitHub Pages (Frontend)
1. Push to `main` branch at `miosotys-spa-live`
2. GitHub auto-deploys `/docs` folder
3. Live at https://spamyosotis.com

### Vercel (Backend)
1. Push to `main` branch at `miosotys-spa-live`
2. Vercel auto-deploys `/booking` folder
3. Live at https://miosotys-spa.vercel.app

## Backup Command
```bash
# Create timestamped backup
tar -czf ~/Desktop/miosotys-backup-$(date +%Y%m%d).tar.gz \
  /Users/pedro/Documents/Websites/miosotys-spa-live/ \
  /Users/pedro/Documents/Websites/miosotys-spa-complete/docs/
```

## Recent Fixes (Deployed)

1. ✅ **WhatsApp redirect in iframe** (commit 1f7a660)
   - Changed to `window.top.location.href`

2. ✅ **Static site deployment** (commit eae4520)
   - Deployed localhost:8080 to production
   - Updated iframe URL to Vercel

3. ✅ **Colombia timezone** (commit 399f3ae)
   - Fixed calendar bookings to use UTC-5
   - All times now correct in Google Calendar

## Status: Production Ready ✅
- Frontend: Live on GitHub Pages
- Backend: Live on Vercel
- Calendar: Syncing correctly in Colombia time
- WhatsApp: Working from iframe
- Twilio: Confirmed working
- Lunch break: Blocking 12:30-2:00 PM
