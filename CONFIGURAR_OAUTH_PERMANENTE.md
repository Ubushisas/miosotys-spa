# 🔐 Configurar OAuth Permanente para Google Calendar

## ❌ Problema Actual

El calendario de Google **NO está bloqueando horarios** porque el token OAuth está expirado o no existe.

## ✅ Solución: Generar Token Permanente

Vamos a generar un **refresh token** que se renueva automáticamente y nunca expira.

---

## 📋 PASO 1: Obtener Credenciales de Google Cloud

### 1.1 Ve a Google Cloud Console

https://console.cloud.google.com/apis/credentials

### 1.2 Verifica/Crea las credenciales OAuth

1. Si ya tienes credenciales OAuth 2.0, ábrelas
2. Si no, crea nuevas:
   - Click en "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Myosotis Spa Calendar"

### 1.3 Configura las Redirect URIs

Agrega estas URIs autorizadas:
```
http://localhost:3002/api/auth/callback
https://miosotys-spa.vercel.app/api/auth/callback
```

### 1.4 Copia las credenciales

Guarda en un lugar seguro:
- **Client ID**: algo como `xxxxx.apps.googleusercontent.com`
- **Client Secret**: algo como `GOCSPX-xxxxx`

---

## 📋 PASO 2: Crear archivo .env.local

En tu computadora, en la carpeta `/booking` del proyecto:

1. Crea un archivo llamado `.env.local` (sin nada antes del punto)
2. Pega este contenido (reemplaza con tus valores):

```bash
# Google Calendar OAuth
GOOGLE_CLIENT_ID=TU-CLIENT-ID-AQUI.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=TU-CLIENT-SECRET-AQUI
GOOGLE_REDIRECT_URI=http://localhost:3002/api/auth/callback

# Database (cópialo de Vercel)
POSTGRES_PRISMA_URL=postgresql://...

# NextAuth (cópialo de Vercel)
NEXTAUTH_SECRET=...

# Admin
ADMIN_SECRET=sync-secret-2025
```

**⚠️ IMPORTANTE**: Para obtener `POSTGRES_PRISMA_URL` y `NEXTAUTH_SECRET`:
1. Ve a https://vercel.com/hello-ubushicoms-projects/miosotys-spa
2. Settings → Environment Variables
3. Busca estas variables y cópialas

---

## 📋 PASO 3: Ejecutar el Script

### 3.1 Instala las dependencias (si no lo has hecho)

```bash
cd /Users/pedro/Documents/Websites/miosotys-spa/booking
npm install
```

### 3.2 Ejecuta el generador de token

```bash
node scripts/generate-oauth-token.js
```

### 3.3 Sigue las instrucciones

El script te dará una URL. Ábrela en el navegador:

1. **IMPORTANTE**: Inicia sesión con **myosotisbymo@gmail.com**
2. Acepta todos los permisos
3. Te redirigirá a `http://localhost:3002/api/auth/callback?code=...`
4. Copia **TODO el código** después de `code=` (es largo)
5. Pégalo en la terminal

### 3.4 Guarda el token

El script te mostrará un JSON largo. Guárdalo, lo necesitarás en el siguiente paso.

Ejemplo:
```json
{"access_token":"ya29.xxx","refresh_token":"1//xxx","scope":"https://www.googleapis.com/auth/calendar","token_type":"Bearer","expiry_date":1234567890}
```

**✅ IMPORTANTE**: Verifica que tenga `"refresh_token"` en el JSON. Si no lo tiene, lee las instrucciones del script.

---

## 📋 PASO 4: Configurar en Vercel

### 4.1 Ve a Vercel

https://vercel.com/hello-ubushicoms-projects/miosotys-spa

### 4.2 Settings → Environment Variables

### 4.3 Busca o crea la variable `GOOGLE_OAUTH_TOKEN`

- Si existe: Click en los 3 puntos → Edit
- Si no existe: Click en "Add New"

### 4.4 Configura la variable

- **Key**: `GOOGLE_OAUTH_TOKEN`
- **Value**: Pega el JSON completo que te dio el script
- **Environments**: Selecciona "Production, Preview, and Development"
- Click en "Save"

### 4.5 También agrega estas variables (si no existen)

1. `GOOGLE_CLIENT_ID` - Tu Client ID
2. `GOOGLE_CLIENT_SECRET` - Tu Client Secret
3. `GOOGLE_REDIRECT_URI` - `https://miosotys-spa.vercel.app/api/auth/callback`

---

## 📋 PASO 5: Redeploy

### 5.1 Ve a Deployments

https://vercel.com/hello-ubushicoms-projects/miosotys-spa/deployments

### 5.2 Redeploy el último

1. Click en los 3 puntos del deployment más reciente
2. Click en "Redeploy"
3. Confirma

### 5.3 Espera 2-3 minutos

---

## 📋 PASO 6: Verificar que Funcione

### 6.1 Verifica en los logs

1. Ve a https://vercel.com/hello-ubushicoms-projects/miosotys-spa
2. Click en el último deployment
3. Click en "Functions"
4. Busca `/api/calendar/availability`
5. Deberías ver logs como:
   ```
   🔍 Checking calendars: { room: "5f7b7d0...", master: "myosotisbymo@gmail.com" }
   📊 Events found: { room: [{ summary: "Experiencia...", start: "2025-11-25T09:00:00-05:00" }], master: [...] }
   ```

### 6.2 Prueba en la web

1. Ve a https://miosotys-spa.vercel.app
2. Selecciona "Día de Spa para Papá e Hijo"
3. Selecciona 25 de noviembre de 2025
4. **Los horarios 9:00-12:00 deberían estar BLOQUEADOS** ✅

---

## 🔧 Solución de Problemas

### El script dice "No se generó refresh_token"

**Causa**: Ya autorizaste la app antes.

**Solución**:
1. Ve a https://myaccount.google.com/permissions
2. Busca "Myosotis Spa Calendar" o tu app
3. Click en "Remove Access"
4. Vuelve a ejecutar el script

### Los horarios siguen disponibles después de configurar

**Posibles causas**:

1. **Token mal configurado**: Verifica que el JSON esté completo y correcto
2. **IDs de calendario incorrectos**: Verifica que los IDs sean exactamente:
   - Sala Individual: `44b404aad9e13f877c9af362787bf2a0212fbcad1a073bfa3439392167bd0c5f@group.calendar.google.com`
   - Sala Principal: `5f7b7d0630cdbfe75c87101e63c334ccc2a875971b4c26d4a39003210b5bf393@group.calendar.google.com`
   - Master: `myosotisbymo@gmail.com`

3. **Permisos del calendario**: Asegúrate de que `myosotisbymo@gmail.com` tenga acceso de lectura a las salas Individual y Principal

### Error "invalid_grant" al generar el token

**Causa**: El código expiró o ya se usó.

**Solución**: Ejecuta el script de nuevo desde el principio.

---

## 🎯 Resultado Final

Una vez configurado correctamente:

✅ Los eventos que crees en Google Calendar **bloquearán automáticamente** esos horarios en la web
✅ El token se renovará automáticamente (nunca expirará)
✅ El sistema verificará AMBOS calendarios (sala + master)
✅ Se agregará el buffer time configurado en /admin

---

¿Listo para empezar? Comienza con el PASO 1.
