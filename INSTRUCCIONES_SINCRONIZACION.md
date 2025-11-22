# Instrucciones para Sincronizar Servicios

## Problema Resuelto

Se han corregido los siguientes problemas:

1. ✅ **Nombre corregido**: "Miosotys" → "Myosotis" en todos los mensajes
2. ✅ **IDs de calendario actualizados**: Ahora usa los IDs correctos del `calendar-settings.json`
3. ✅ **Script de sincronización mejorado**: Sincroniza todos los campos del JSON a la base de datos

## El paquete "Día de Spa para Papá e Hijo" ya está agregado

El servicio está en el archivo `booking/calendar-settings.json` (líneas 157-164):

```json
{
  "id": "papa_hijo",
  "name": "Día de Spa para Papá e Hijo",
  "duration": 150,
  "price": 380000,
  "minPeople": 2,
  "maxPeople": 2,
  "enabled": true
}
```

## Sincronizar servicios en producción (Vercel)

Después del deployment automático de Vercel, necesitas sincronizar la base de datos:

### Opción 1: Usar la API de Admin (Recomendado)

```bash
curl -X POST https://spamyosotis.com/api/admin/sync-settings \
  -H "Authorization: Bearer sync-secret-2025" \
  -H "Content-Type: application/json"
```

O desde el navegador, abrir la consola de Vercel y ejecutar:

```javascript
fetch('/api/admin/sync-settings', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sync-secret-2025',
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log)
```

### Opción 2: Desde Vercel Dashboard

1. Ve a https://vercel.com/hello-ubushicoms-projects/miosotys-spa
2. Ve a la pestaña "Deployments"
3. Espera a que el deployment termine
4. Ve a la pestaña "Functions"
5. Busca `/api/admin/sync-settings`
6. Ejecuta una solicitud POST con el header `Authorization: Bearer sync-secret-2025`

## Verificar que funciona

1. Abre https://spamyosotis.com/catalogo.html
2. Haz clic en "Agendar"
3. Selecciona "En Familia"
4. Deberías ver **dos opciones**:
   - ✅ Día de Spa para Mamá e Hija
   - ✅ Día de Spa para Papá e Hijo (NUEVO)

## Calendario de Google

El sistema ahora usa los IDs correctos del calendario:

- **Sala Individual**: `c_83f3b9184bb03652fe4f7b9858ba4dc022f6ae195245d233c9b7e3603d64dc9a@group.calendar.google.com`
- **Sala Principal**: `c_388f36cd098bb4f42b02cd43b728000ddb283db209570fc4e80c626a177d1f74@group.calendar.google.com`
- **Master Calendar**: `myosotisbymo@gmail.com`

### Sincronización del calendario

El calendario se sincroniza automáticamente en tiempo real. Si creas un evento en Google Calendar:

1. El sistema verifica **AMBOS** calendarios (sala específica + master)
2. Los horarios ocupados NO aparecerán como disponibles
3. Se incluye un buffer de 30 minutos después de cada evento

Si el calendario no se sincroniza:

1. Verifica que el token OAuth esté configurado en Vercel (`GOOGLE_OAUTH_TOKEN`)
2. Verifica que los permisos del calendario incluyan ambos calendarios
3. Revisa los logs en Vercel Dashboard → Functions → Logs

## Mensaje de confirmación corregido

Ahora los mensajes dicen correctamente:

✅ **"Myosotis Spa, Colombia"** (en lugar de "Miosotys")

Esto aplica a:
- Mensajes de WhatsApp
- Descripciones de eventos en Google Calendar
- Emails de confirmación

## Próximos pasos

Una vez que Vercel termine el deployment (1-2 minutos):

1. Ejecuta el comando de sincronización (Opción 1 arriba)
2. Verifica que el nuevo servicio aparezca en la web
3. Haz una prueba de reserva para confirmar que funciona

## Soporte

Si algo no funciona:
- Revisa los logs en Vercel Dashboard
- Verifica que las variables de entorno estén configuradas
- Contacta al desarrollador
