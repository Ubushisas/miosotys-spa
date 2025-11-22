/**
 * Script para generar token OAuth de Google Calendar
 * Este token se renovará automáticamente y no expirará
 *
 * Ejecutar: node scripts/generate-oauth-token.js
 */

require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const readline = require('readline');

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function generateToken() {
  log('\n🔐 Generador de Token OAuth para Google Calendar\n', 'bright');

  // Verificar que las credenciales existan
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    log('❌ Error: Faltan las credenciales de Google', 'yellow');
    log('\nAsegúrate de tener estas variables en .env.local:', 'yellow');
    log('  GOOGLE_CLIENT_ID=...', 'yellow');
    log('  GOOGLE_CLIENT_SECRET=...', 'yellow');
    log('  GOOGLE_REDIRECT_URI=http://localhost:3002/api/auth/callback\n', 'yellow');
    process.exit(1);
  }

  // Crear cliente OAuth2
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3002/api/auth/callback'
  );

  // Generar URL de autorización
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Esto genera un refresh token
    prompt: 'consent', // Fuerza a mostrar el consentimiento para obtener refresh token
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  });

  log('📋 PASO 1: Autorizar la aplicación\n', 'cyan');
  log('Abre esta URL en tu navegador:\n', 'blue');
  log(authUrl, 'green');
  log('\n⚠️  IMPORTANTE: Asegúrate de iniciar sesión con la cuenta myosotisbymo@gmail.com\n', 'yellow');

  // Esperar el código de autorización
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise((resolve) => {
    rl.question(colors.cyan + '📋 PASO 2: Pega el código de autorización aquí: ' + colors.reset, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  log('\n⏳ Obteniendo tokens...', 'yellow');

  try {
    // Intercambiar el código por tokens
    const { tokens } = await oauth2Client.getToken(code);

    log('\n✅ ¡Token generado exitosamente!\n', 'green');

    // Mostrar el token
    const tokenString = JSON.stringify(tokens);

    log('═══════════════════════════════════════════════════════════', 'bright');
    log('📋 COPIA ESTE TOKEN Y GUÁRDALO EN VERCEL', 'bright');
    log('═══════════════════════════════════════════════════════════\n', 'bright');

    log('Variable de entorno: GOOGLE_OAUTH_TOKEN', 'cyan');
    log('Valor:', 'cyan');
    log(tokenString, 'green');

    log('\n═══════════════════════════════════════════════════════════', 'bright');
    log('📝 PASOS PARA CONFIGURAR EN VERCEL:', 'bright');
    log('═══════════════════════════════════════════════════════════\n', 'bright');

    log('1. Ve a: https://vercel.com/hello-ubushicoms-projects/miosotys-spa', 'blue');
    log('2. Click en "Settings" → "Environment Variables"', 'blue');
    log('3. Busca la variable "GOOGLE_OAUTH_TOKEN"', 'blue');
    log('4. Si existe, edítala. Si no existe, créala.', 'blue');
    log('5. Pega el token de arriba (el JSON completo)', 'blue');
    log('6. Selecciona "Production, Preview, and Development"', 'blue');
    log('7. Click en "Save"', 'blue');
    log('8. Ve a "Deployments" y redeploy el último deployment\n', 'blue');

    log('═══════════════════════════════════════════════════════════\n', 'bright');

    // Verificar que tenga refresh_token
    if (tokens.refresh_token) {
      log('✅ El token incluye refresh_token (se renovará automáticamente)', 'green');
    } else {
      log('⚠️  ADVERTENCIA: No se generó refresh_token', 'yellow');
      log('Esto puede pasar si ya autorizaste la app antes.', 'yellow');
      log('Solución: Revoca el acceso en https://myaccount.google.com/permissions', 'yellow');
      log('y vuelve a ejecutar este script.\n', 'yellow');
    }

    // Verificar que los scopes estén correctos
    if (tokens.scope) {
      log(`\n✅ Scopes autorizados: ${tokens.scope}`, 'green');
    }

    log('\n🎉 ¡Listo! Una vez configurado en Vercel, el calendario se sincronizará automáticamente.\n', 'green');

  } catch (error) {
    log('\n❌ Error al generar el token:', 'yellow');
    console.error(error);
    log('\nVerifica que:', 'yellow');
    log('1. El código esté correcto (cópialo completo)', 'yellow');
    log('2. Las credenciales en .env.local sean correctas', 'yellow');
    log('3. El GOOGLE_REDIRECT_URI coincida con el configurado en Google Cloud Console\n', 'yellow');
    process.exit(1);
  }
}

// Ejecutar
generateToken().catch(console.error);
