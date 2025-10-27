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

## Important: After Deployment

After deploying the booking system to Vercel:

1. Update `GOOGLE_REDIRECT_URI` in Vercel environment variables with your actual domain
2. Update the booking URL in `/docs/catalogo.html` (line 837) from `http://localhost:3002` to your Vercel URL
3. Add the callback URL to Google Cloud Console OAuth credentials
