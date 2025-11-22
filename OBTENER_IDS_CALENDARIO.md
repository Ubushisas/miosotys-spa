# Cómo Obtener los IDs de Calendario de Google

## Problema Actual

Los eventos que creas en Google Calendar no están bloqueando los horarios en el sitio web. Esto puede ser porque los IDs de calendario en el código son incorrectos.

## Necesitamos los IDs de estos 3 calendarios:

1. **Myosotis Spa** (calendario master - azul en tu screenshot)
2. **Sala grupal** (morado)
3. **Sala individual** (turquesa/cian)

## Pasos para obtener cada ID:

### Paso 1: Abre Google Calendar
Ve a https://calendar.google.com

### Paso 2: Por cada calendario

1. Busca el calendario en la lista de la izquierda (bajo "Mis calendarios")
2. Haz clic en los **3 puntos** al lado del nombre del calendario
3. Selecciona **"Configuración y uso compartido"**
4. Baja hasta la sección **"Integrar calendario"**
5. Copia el **"ID del calendario"** (se ve algo así: `c_xxxxxxxxxxxxx@group.calendar.google.com`)

### Paso 3: Envíame los IDs

Necesito que me envíes los 3 IDs en este formato:

```
Myosotis Spa (master): [pega el ID aquí]
Sala grupal: [pega el ID aquí]
Sala individual: [pega el ID aquí]
```

## IDs Actuales en el Código (pueden estar mal)

```javascript
// En calendar.js:
MASTER_CALENDAR_ID = 'myosotisbymo@gmail.com'
Sala Individual = 'c_83f3b9184bb03652fe4f7b9858ba4dc022f6ae195245d233c9b7e3603d64dc9a@group.calendar.google.com'
Sala Principal = 'c_388f36cd098bb4f42b02cd43b728000ddb283db209570fc4e80c626a177d1f74@group.calendar.google.com'
```

## Una vez que me des los IDs correctos:

1. Los actualizaré en el código
2. Haremos push a GitHub
3. Vercel hará deploy automático
4. Los eventos empezarán a bloquear horarios correctamente

## Mientras tanto - Ver los logs

Una vez que Vercel haga el próximo deploy, puedes ver los logs para verificar qué está pasando:

1. Ve a https://vercel.com/hello-ubushicoms-projects/miosotys-spa
2. Click en "Deployments"
3. Click en el deployment más reciente
4. Click en "Functions"
5. Busca `/api/calendar/availability`
6. Verás logs como:
   ```
   🔍 Checking calendars: { room: "...", master: "..." }
   📊 Events found: { room: [...], master: [...] }
   ```

Estos logs te dirán si el sistema está encontrando los eventos o no.

## Error 405 Not Allowed

El endpoint `/api/admin/sync-settings` funciona con método POST. El error 405 que viste es normal hasta que Vercel termine de hacer deploy. Una vez que el deploy esté listo (1-2 minutos), el comando funcionará.
