# Miosotys Spa - Booking System

Standalone spa booking system with Google Calendar integration.

## Features

- ✅ Multi-step booking flow (category → service → people → names → calendar → confirmation)
- ✅ Real-time Google Calendar availability checking
- ✅ OAuth 2.0 authentication with Google Workspace
- ✅ Calendar invitations sent to customers
- ✅ Support for individual and group services
- ✅ 12-hour time format (Colombia timezone)
- ✅ Inline form validation
- ✅ Responsive design

## Tech Stack

- **Framework**: Next.js 15.4.6
- **React**: 19.1.0
- **Animations**: GSAP 3.13.0 with @gsap/react 2.1.1
- **Icons**: react-icons 5.4.0
- **Google API**: googleapis 163.0.0

## Installation

```bash
npm install
```

## Setup

1. **Google Calendar OAuth** (already configured):
   - Client ID and Secret in `.env.local`
   - Redirect URI: `http://localhost:3002/api/auth/callback`

2. **Authorize the app**:
   ```
   http://localhost:3002/api/auth/authorize
   ```

3. **Calendar IDs** (already configured):
   - Sala privada: Individual services
   - Sala grupal: Group services

## Running

```bash
npm run dev
```

Opens on **http://localhost:3002**

## Project Structure

```
miosotys-spa-booking/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/           # OAuth flow
│   │   │   │   ├── authorize/
│   │   │   │   ├── callback/
│   │   │   │   └── success/
│   │   │   └── calendar/       # Calendar operations
│   │   │       ├── availability/
│   │   │       └── book/
│   │   ├── layout.jsx          # Root layout
│   │   ├── page.jsx            # Main page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── BookingFlow/        # Main booking component
│   │   ├── Calendar/           # Calendar picker
│   │   ├── AnimatedButton/     # Button component
│   │   └── Copy/               # Text reveal animation
│   └── lib/
│       └── calendar.js         # Google Calendar integration
├── .env.local                  # Environment variables
├── package.json
└── README.md
```

## Integration

To integrate into another site:

1. Copy the entire `miosotys-spa-booking` folder
2. Install dependencies: `npm install`
3. Update `.env.local` with your credentials
4. Run `npm run dev` on any port
5. Or embed as a component in your main site

## Environment Variables

- `GOOGLE_CLIENT_ID`: OAuth client ID
- `GOOGLE_CLIENT_SECRET`: OAuth client secret
- `GOOGLE_REDIRECT_URI`: OAuth callback URL

## Services

### Individual Services (Sala privada)
- Limpieza Facial (60 min)
- Baño de Luna (75 min)
- Exfoliación Corporal (60 min)
- Masaje con Aceite Caliente (60 min)
- Masaje con Piedras Calientes (60 min)
- Masaje de Relajación (60 min)
- Drenaje Linfático (60 min)
- Masaje de Modelación (60 min)
- Miracle Touch (60 min)
- Miracle Face (40 min)

### Group Services (Sala grupal)
- Romántico Oasis para Dos
- Retiro de Reconciliación para Dos
- Paquete de Aniversario
- Tarde de Chicas
- Pasabordo Rápido de Desestrés
- Día de Spa para Mamá e Hija
- Tarde en Familia
- Feliz 15 Años con tus Mejores Amigas
- Celebración de Cumpleaños
- Despedida de Soltera

## Author

Built for Miosotys Spa
