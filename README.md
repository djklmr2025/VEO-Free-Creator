<div align="center">
<img width="1200" height="475" alt="GHBanner" src="([https://github-production-user-asset-6210df.s3.amazonaws.com/159876365/477138731-0aa67016-6eaf-458a-adb2-6e31a0763ed6.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20251103%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20251103T032345Z&X-Amz-Expires=300&X-Amz-Signature=cdcc25d3d54f43b3ab418cb7d0ceb20a2154d95f432463dc6da718dc287b3a2c&X-Amz-SignedHeaders=host])"/>
</div>

# Gemini Creative Suite - VEO Free Creator

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
