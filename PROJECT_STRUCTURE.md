# Miosotys Spa Project Structure

## Main Project Directory
**Local Path:** `/Users/pedro/Documents/Websites/miosotys-spa/booking`
**Git Remote:** https://github.com/Ubushisas/miosotys-spa
**Vercel Project:** miosotys-spa
**Production URL:** https://miosotys-spa.vercel.app

## Key Directories
- **Prisma Schema:** `/Users/pedro/Documents/Websites/miosotys-spa/booking/prisma/schema.prisma`
- **Admin Settings API:** `/Users/pedro/Documents/Websites/miosotys-spa/booking/src/app/api/admin/settings/route.ts`
- **Auth Config:** `/Users/pedro/Documents/Websites/miosotys-spa/booking/src/app/api/auth/[...nextauth]/route.ts`
- **Calendar Component:** `/Users/pedro/Documents/Websites/miosotys-spa/booking/src/components/Calendar/Calendar.jsx`
- **Admin Settings Page:** `/Users/pedro/Documents/Websites/miosotys-spa/booking/src/app/admin/settings/page.tsx`

## Database
- **Provider:** Vercel Postgres (Neon)
- **Database Name:** neondb
- **Connection:** POSTGRES_PRISMA_URL (already set on Vercel)

## Deployment
1. Commit changes in `/Users/pedro/Documents/Websites/miosotys-spa/booking`
2. Push to GitHub `main` branch
3. Vercel auto-deploys

## Admin Access
- **Allowed Emails:** hello@ubushi.com, myosotisbymo@gmail.com
