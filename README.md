[![GHBanner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)](https://aistudio.google.com/app/prompts/1SkkL3Jt-wAZ9w4P_eotsUxioAJ5IVxX8)
# Gemini Creative Suite - VEO Free Creator

[![Build](https://github.com/djklmr2025/VEO-Free-Creator/actions/workflows/build.yml/badge.svg)](https://github.com/djklmr2025/VEO-Free-Creator/actions/workflows/build.yml)
[![KV Health Check](https://github.com/djklmr2025/VEO-Free-Creator/actions/workflows/kv-health.yml/badge.svg)](https://github.com/djklmr2025/VEO-Free-Creator/actions/workflows/kv-health.yml)

Una suite completa de herramientas de IA creativa que incluye generación de video con Veo, análisis de video, generación y edición de imágenes, text-to-speech y chat rápido con Gemini.

## 🚀 Características

- **Veo Video Generation**: Crea videos de alta calidad desde texto o imágenes
- **Video Analysis**: Analiza contenido de videos con IA
- **Image Generation**: Genera imágenes con Imagen 4.0
- **Image Editing**: Edita imágenes con prompts de texto
- **Text to Speech**: Convierte texto a audio con voces naturales
- **Fast Chat**: Chat en tiempo real con Gemini via Puter.js <mcreference link="https://docs.puter.com/getting-started/" index="0">0</mcreference>

## 📋 Prerrequisitos

- Node.js (versión 16 o superior)
- Una clave de API de Google Gemini

## 🛠️ Instalación y Configuración Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar la API Key:**
   - Crea un archivo `.env.local` en la raíz del proyecto
   - Añade tu clave de Gemini:
     ```
     GEMINI_API_KEY=tu_clave_aqui
     ```

   Opcional (usar backend propio para generación de Veo):
   - Si tienes un backend desplegado que expone `POST /generate-veo`, define:
     ```
     VITE_VEO_BACKEND_URL=https://veo-backend.onrender.com
     ```
   - Si no lo defines, el cliente usará por defecto `https://veo-backend.onrender.com`.

3. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```
   
   La aplicación estará disponible en: http://localhost:3000/

4. **Construir para producción:**
   ```bash
   npm run build
   ```

5. **Vista previa de producción:**
   ```bash
   npm run preview
   ```

## 🌐 Despliegue en Vercel

1. **Conectar repositorio:**
   - Inicia sesión en [Vercel](https://vercel.com)
   - Importa tu repositorio de GitHub

2. **Configuración del proyecto:**
   - Framework Preset: **Vite**
   - Build Command: `vite build`
   - Output Directory: `dist`

3. **Variables de entorno:**
   - Añade: `GEMINI_API_KEY` con tu clave de API
   - Opcional: `VITE_VEO_BACKEND_URL` si usarás un backend propio
   - Opcional: `VITE_GOOGLE_OAUTH_CLIENT_ID` para activar login real con Google (OAuth)

## 🗄️ Storage / KV (Persistencia del estado Autopilot)

- Se usa REST KV; los valores (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) son inyectados por Vercel Storage al conectar la base con el proyecto desde la sección "Storage → Connect Project".
- Si por alguna razón no aparecen automáticamente, copia los valores desde la sección "REST API" de tu base en Vercel Storage y añádelos como variables de entorno del proyecto (production/preview/development).
- Tras agregar o cambiar variables, realiza un redeploy para que el runtime las lea.

Prueba rápida:
- POST `https://<tu-app>.vercel.app/api/autopilot` con body `{ "enabled": true }`, luego GET `https://<tu-app>.vercel.app/api/autopilot` y verifica que persiste.
- POST para apagar con corte limpio: `{ "enabled": false, "forceStop": true }`.

Health-check:
- Endpoint: `GET /api/kv-health` (se crea en este repo)
- Realiza un set/get de prueba en KV y devuelve un JSON con el resultado.

Health-check en CLI (para CI/local):
- Producción: `npm run kv:health:prod`
- Desarrollo local: `npm run kv:health:dev` (requiere `npm run dev` corriendo)
- Personalizado: `node scripts/kvHealthCheck.cjs --url https://<tu-app>.vercel.app/api/kv-health`

Flags disponibles:
- `--base`: chequear ambos endpoints (`/api/kv-health` y `/api/kvHealth`) sobre la base indicada
- `--url`: chequear un único endpoint específico
- `--threshold <ms>`: umbral de roundtripMs para marcar warning/error
- `--strict`: convierte umbral excedido en error (exit code 1)

Buenas prácticas de seguridad:
- Rotar `KV_REST_API_TOKEN` periódicamente y revocar el anterior después de validar.
- Limitar targets si no necesitas KV en development.
- Evitar exponer tokens en logs o respuestas; este proyecto no imprime secretos.

4. **Deploy:**
   - Haz clic en "Deploy"
   - Tu app estará disponible en una URL pública

## 🌐 Despliegue en Netlify

1. **Conectar repositorio:**
   - Inicia sesión en [Netlify](https://netlify.com)
   - Conecta tu repositorio de GitHub

2. **Configuración de build:**
   - Build command: `vite build`
   - Publish directory: `dist`

3. **Variables de entorno:**
   - Añade: `GEMINI_API_KEY` con tu clave de API

4. **Deploy y listo**

## 🔧 Funcionalidades

### Chat Rápido (Sin API Key requerida)
El chat funciona directamente con Puter.js y no requiere configuración adicional <mcreference link="https://docs.puter.com/getting-started/" index="0">0</mcreference>.

### Generación de Video, Imágenes y TTS
Estas funciones requieren una clave de API de Gemini configurada correctamente.

#### Backend de generación (opcional)
Puedes delegar la generación de video a un backend propio. El cliente enviará las peticiones a:
- `POST ${VITE_VEO_BACKEND_URL}/generate-veo`

Formato esperado del backend:
- Body JSON: `{ prompt, aspectRatio, model, image?: { bytes, mimeType } }`
- Respuesta:
  - JSON con `videoBase64` y/o `uri`/`sourceUri`/`videoUri`/`url`, o
  - Binario del video (por ejemplo `video/mp4` o `video/webm`).

Si el backend devuelve un `uri`, el cliente descargará el video a través del proxy seguro `/api/fetchVideo?uri=...` para evitar problemas de CORS.

## 🔒 Seguridad

- El archivo `.env.local` está incluido en `.gitignore` para proteger tu API key
- Para producción, usa variables de entorno del proveedor de hosting
- Monitorea el uso de tu API key y configura límites apropiados

## 📝 Notas Técnicas

- La aplicación usa Vite para desarrollo y build
- React 19 con TypeScript
- Integración con Puter.js para chat sin configuración <mcreference link="https://docs.puter.com/getting-started/" index="0">0</mcreference>
- SDK oficial de Google Gemini para todas las funciones de IA

## 🤖 Modo Autopilot Arkaios (TRAE)

Para que Arkaios opere de forma autónoma sin pedir confirmación en tareas de bajo riesgo (ejecutar servidores de desarrollo, construir, instalar dependencias y editar archivos dentro de rutas seguras), hemos añadido una política de autopilot en `.trae-policy.json`.

Qué hace:
- Permite auto-ejecución de comandos seguros (npm run dev/preview/build, npm install, git status/diff) sin diálogos de confirmación.
- Define rutas permitidas para edición automática (components/, services/, hooks/, utils/, index.html, README.md, vite.config.ts).
- Bloquea comandos y rutas peligrosas por defecto (ej. `rm -rf`, `del /s /q`, `C:\\Windows\\`).
- Incluye una parada de emergencia mediante el archivo `STOP_AUTOPILOT` en la raíz del proyecto.

Cómo activarlo/desactivarlo:
- Activado por defecto: `"autopilot": true` en `.trae-policy.json`.
- Para desactivar inmediatamente, crea un archivo vacío llamado `STOP_AUTOPILOT` en la raíz del proyecto. Arkaios/Trae lo detectará y evitará ejecuciones automáticas.
- Para ajustar el comportamiento, edita las listas `allowed_commands`, `blocked_commands`, `allowed_write_paths`, `blocked_write_paths` en `.trae-policy.json`.

Buenas prácticas y límites de seguridad:
- El autopilot solo cubre operaciones de bajo riesgo; cualquier comando potencialmente destructivo o de administración del sistema permanece bloqueado o requiere confirmación.
- Se mantienen logs de acciones (`"log_actions": true`) para auditoría.
- Si tienes dudas, desactiva con `STOP_AUTOPILOT` y vuelve a modo manual.

Ejemplo de `.trae-policy.json` (ya incluido):
```
{
  "autopilot": true,
  "allow_auto_run": true,
  "allowed_commands": [
    "npm run dev",
    "npm run preview",
    "npm run build",
    "npm install",
    "git status",
    "git diff --stat"
  ],
  "blocked_commands": [
    "rm -rf",
    "del /s /q",
    "format",
    "shutdown",
    "Stop-Computer",
    "Set-ExecutionPolicy Unrestricted"
  ],
  "write_files_auto": true,
  "allowed_write_paths": [
    "components/",
    "services/",
    "hooks/",
    "utils/",
    "index.html",
    "README.md",
    "vite.config.ts"
  ],
  "blocked_write_paths": [
    ".git/",
    "node_modules/",
    "C:\\Windows\\"
  ],
  "emergency_stop_file": "STOP_AUTOPILOT",
  "max_risk_level": "low",
  "log_actions": true
}
```
### Login con Google (opcional)
El componente ApiKeyManager ahora soporta dos modos:
- Demo (sin CLIENT_ID): simula el login.
- OAuth real: usa Google Identity Services si defines `VITE_GOOGLE_OAUTH_CLIENT_ID`.

Pasos para OAuth real:
- Crea un OAuth Client ID en Google Cloud Console (tipo Web).
- Autoriza el origen de tu app (http://localhost:3000 y tus dominios de producción).
- Define `VITE_GOOGLE_OAUTH_CLIENT_ID` en tu `.env.local`.
- Usa el botón “Conectar con Google” para iniciar sesión.

Tras login, el cliente decodifica el ID token para obtener email/nombre. Si eliges guardarlo en KV/Redis, tu API key se asociará a tu email.

Modelo de uso de clave propia:
- Tras login, el usuario puede pegar su propia Gemini/Veo API Key.
- El cliente enviará la clave en la cabecera `x-gemini-api-key` al endpoint `${VITE_VEO_BACKEND_URL}/generate-veo`.
- Tu backend puede usar esa clave para generar el video en nombre del usuario (asegúrate de no loguear la clave y de respetar políticas de seguridad).

### Guardado opcional de API Key en KV/Redis

Endpoint serverless incluido:
- `POST /api/userKey` body `{ userId, apiKey, ttlSeconds? }`
- `GET /api/userKey?userId=<email>`
- `DELETE /api/userKey?userId=<email>`

Auto-detección de backend: Vercel KV (REST) o Redis (`REDIS_URL`/`KV_REDIS_URL`/`VERCEL_REDIS_URL`). Este guardado es opcional; puedes mantener la clave únicamente en el cliente si lo prefieres.

### Backend Render: uso inmediato de x-gemini-api-key

Ejemplo Express:
```ts
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json({ limit: '10mb' }));

app.post('/generate-veo', async (req, res) => {
  const userKey = req.header('x-gemini-api-key');
  const serviceKey = process.env.GEMINI_API_KEY;
  const apiKey = userKey || serviceKey;
  if (!apiKey) return res.status(500).json({ error: 'Missing API key' });

  const { prompt, aspectRatio, model, image } = req.body || {};
  // TODO: sustituye por la llamada real a la API de Veo/Gemini Video
  const upstream = await fetch('https://generativeai.googleapis.com/veo:generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ prompt, aspectRatio, model, image })
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return res.status(upstream.status).json({ error: 'Upstream error', details: text });
  }
  const data = await upstream.json();
  return res.status(200).json(data);
});

app.get('/', (_req, res) => res.send('OK'));
app.listen(process.env.PORT || 10000);
```

Ejemplo Fastify:
```ts
import Fastify from 'fastify';
const app = Fastify({ logger: true });
app.post('/generate-veo', async (req, reply) => {
  const userKey = req.headers['x-gemini-api-key'] as string | undefined;
  const serviceKey = process.env.GEMINI_API_KEY;
  const apiKey = userKey || serviceKey;
  if (!apiKey) return reply.code(500).send({ error: 'Missing API key' });
  const { prompt, aspectRatio, model, image } = (req.body as any) || {};
  // TODO: sustituye por la llamada real a la API de Veo
  return { ok: true, prompt, aspectRatio, model, image };
});
app.get('/', async () => 'OK');
app.listen({ port: Number(process.env.PORT) || 10000, host: '0.0.0.0' });
```
### Validación de id_token de Google en el servidor

Endpoint incluido:
- `POST /api/verify-google-id` body `{ idToken }`
- Valida el token con `oauth2.googleapis.com/tokeninfo` y comprueba `iss`, `exp` y, si está configurado, la audiencia (`aud`).

Variables de entorno:
- `VITE_GOOGLE_OAUTH_CLIENT_ID` (cliente, necesario para login real en el frontend)
- `GOOGLE_OAUTH_CLIENT_ID` (servidor, opcional pero recomendado para forzar la coincidencia de `aud` en la validación)

Pasos:
1. Define `VITE_GOOGLE_OAUTH_CLIENT_ID` en Vercel (Production/Preview/Development) y redeploy.
2. Define `GOOGLE_OAUTH_CLIENT_ID` en Vercel (solo servidor) con el mismo Client ID para que el backend compruebe `aud`.
3. El flujo de login del frontend llamará al endpoint de validación y mostrará error si la validación falla.
