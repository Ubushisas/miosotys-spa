# Miosotys Spa - Deployment Ready Checklist

## ✅ Completed Updates

### Frontend (Catalog - /docs/catalogo.html)

#### 1. **Spa Individual Services** - 7 services total
- ✅ Limpieza Facial Básica ($90,000, 60 min)
- ✅ Limpieza Facial Completa ($120,000, 80 min)
- ✅ Limpieza Facial Elixir de la Juventud ($170,000, 100 min)
- ✅ Baño de Luna ($140,000, 70 min)
- ✅ Exfoliación Corporal ($130,000, 80 min)
- ✅ Veloterapia ($110,000, 70 min)
- ✅ Masaje con Piedras Calientes ($110,000, 70 min)

#### 2. **Spa para Amigas** - Updated prices and added new service
- ✅ Tarde de Chicas ($240,000)
- ✅ Pasabordo Rápido de Desestrés ($130,000)
- ✅ Experiencia de Renovación Corporal ($210,000) - NEW

#### 3. **Spa para Niñas** - Updated names and prices
- ✅ Día de Spa para Adolescentes ($240,000, minPeople: 4)
- ✅ Aventura Spa para Preadolescentes ($250,000, minPeople: 4)

#### 4. **Spa Familiar** - Removed one service
- ✅ Día de Spa para Mamá e Hija ($380,000)
- ✅ Removed "Tarde en Familia"

#### 5. **Spa para Parejas** - Updated prices
- ✅ Romántico Oasis para Dos ($470,000)
- ✅ Retiro de Reconciliación para Dos ($540,000)
- ✅ Paquete de Aniversario ($400,000)

#### 6. **Eventos Especiales** - Updated all descriptions and prices
- ✅ Feliz 15 Años con tus Mejores Amigas ($370,000, 210 min, 4-6 people)
- ✅ Celebración de Cumpleaños ($280,000-$1,600,000, 170 min, 4-6 people)
- ✅ Despedida de Soltera ($350,000-$1,995,000, 210 min, 4-6 people)

#### 7. **UI Updates**
- ✅ Navigation buttons reorganized to 3x2 grid
- ✅ Spa Luxury section hidden from navigation
- ✅ "Agendar" button enabled for all services
- ✅ Image mappings added for all new services

### Backend (Booking System - /booking)

#### 1. **calendar-settings.json** - All services updated
- ✅ Individual services: 7 services with correct durations and prices
- ✅ Parejas: Updated prices
- ✅ Amigas: Updated prices, added new service
- ✅ Niñas: Updated names, prices, minPeople
- ✅ Familia: Only one service remains
- ✅ Eventos: Updated prices and minPeople (4-6)

#### 2. **Debug Logging Added**
- ✅ Console logs to debug service matching in CalendlyBooking.jsx

## 📋 Pre-Deployment Steps

### 1. Update Production URL in catalog
File: `/Users/lis/miosotys-spa/docs/catalogo.html` (line 1114)

**Current (Local):**
```javascript
const bookingUrl = `http://localhost:3002?service=${encodedService}&v=${timestamp}`;
```

**Change to (Production):**
```javascript
const bookingUrl = `https://miosotys-spa.vercel.app?service=${encodedService}&v=${timestamp}`;
```

### 2. Remove Debug Console Logs (Optional)
File: `/Users/lis/miosotys-spa/booking/src/components/CalendlyBooking/CalendlyBooking.jsx` (lines 261-284)

Remove or comment out the console.log statements for production.

### 3. Verify Environment Variables
Ensure `.env.local` in booking folder has production settings:
- ✅ Database connections
- ✅ Google Calendar API credentials
- ✅ OAuth tokens

## 🚀 Deployment Commands

### Deploy Frontend (Catalog)
```bash
cd /Users/lis/miosotys-spa/docs
# Upload to GitHub Pages or your hosting
```

### Deploy Backend (Booking System)
```bash
cd /Users/lis/miosotys-spa/booking
vercel --prod
```

## 🧪 Testing Checklist

After deployment, test:
- [ ] All 7 "Spa Individual" services show booking calendar with service info header
- [ ] Service names match between catalog and calendar
- [ ] Prices display correctly
- [ ] Durations are accurate
- [ ] Images load for all services
- [ ] "Agendar" button works for all services
- [ ] Navigation buttons in 3x2 grid layout
- [ ] Group services show people count selector
- [ ] Calendar availability works correctly

## 📝 Notes

- All service names in catalog MUST match exactly with calendar-settings.json
- Special characters (á, ñ, etc.) are properly encoded
- Price field empty in services where price is in description
- Images reused appropriately for similar services

## 🔧 Known Issues to Monitor

1. **Service Info Container**: Check if top container (service name, duration, location) appears for all new services
2. **Service Matching**: Verify console logs show services are being found correctly
3. **Image Loading**: Ensure all images load on production (check paths)

---

**Last Updated:** 2025-11-12
**Status:** ✅ Ready for Deployment
