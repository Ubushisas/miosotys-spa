# Miosotys Spa

Monorepo containing both the catalog website and booking system.

## Structure

```
/
├── docs/          # Static catalog website (GitHub Pages)
└── booking/       # Next.js booking system (Vercel)
```

## Catalog (GitHub Pages)

The static catalog website is served from the `/docs` directory via GitHub Pages.

**Live URL**: https://ubushisas.github.io/miosotys-spa/

## Booking System (Vercel)

The booking system is a Next.js application with Google Calendar integration.

**Tech Stack**:
- Next.js 15.4.6
- React 19
- Google Calendar API
- Tailwind CSS
- GSAP & Framer Motion

**Local Development**:
```bash
cd booking
npm install
npm run dev
```

**Vercel Deployment**:
1. Root Directory: `booking`
2. Build Command: `npm run build`
3. Output Directory: `.next`
4. Install Command: `npm install`

## Environment Variables

Required for booking system:

```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/calendar/auth/callback
```
