
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useVeoApiKey } from '../hooks/useVeoApiKey';
import { useAuth } from '../hooks/useAuth';
import { generateVideo, pollVideoStatus, generateSpeech, generateVideoViaPuter } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { decode, decodeAudioData, getAudioContext, playAudio } from '../utils/audioUtils';
import Button from './Button';
import { Spinner, UploadIcon, XIcon, SpeakerIcon } from './Icons';
import { ApiKeyManager } from './ApiKeyManager';
import VeoInfo from './VeoInfo';
import VeoTester from './VeoTester';
import VeoForceCall from './VeoForceCall';

const loadingMessages = [
  "Brewing pixels into a masterpiece...",
  "Choreographing digital actors...",
  "Rendering virtual worlds...",
  "This can take a few minutes, hang tight!",
  "Assembling the final cut...",
  "Adding a touch of cinematic magic..."
];

type VideoGeneratorProps = {
  defaultPrompt?: string;
  autoGenerate?: boolean;
  onResult?: (result: { videoUrl: string; sourceUri: string; prompt: string }) => void;
};

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ defaultPrompt, autoGenerate, onResult }) => {
  const { isKeySelected, isChecking, selectKey, resetKey } = useVeoApiKey();
  const auth = useAuth();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [veoModel, setVeoModel] = useState<'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview'>('veo-3.1-fast-generate-preview');
  const [generationMethod, setGenerationMethod] = useState<'direct' | 'puter' | 'local'>('direct');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [isGreetingLoading, setIsGreetingLoading] = useState(false);
  const [hasAutoPlayedGreeting, setHasAutoPlayedGreeting] = useState(false);
  const hasAutoRunRef = useRef(false);
  
  // Obtener métodos disponibles basados en permisos
  const availableMethods = auth.getAvailableMethods();
  
  // Ayuda: estado derivado para saber si se puede generar
  const canGenerate = (prompt?.trim()?.length ?? 0) > 0 || !!imageFile;

  const playGreeting = useCallback(async () => {
    setIsGreetingLoading(true);
    try {
        const greetingText = "Bienvenido, ¿qué video deseas crear hoy?";
        const base64Audio = await generateSpeech(greetingText, 'Kore');
        const audioBytes = decode(base64Audio);
        const audioContext = getAudioContext();
        const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
        playAudio(audioBuffer);
    } catch (err) {
        console.error("Failed to play greeting:", err);
    } finally {
        setIsGreetingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isKeySelected && !hasAutoPlayedGreeting) {
        playGreeting();
        setHasAutoPlayedGreeting(true);
    }
  }, [isKeySelected, hasAutoPlayedGreeting, playGreeting]);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = window.setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          return loadingMessages[(currentIndex + 1) % loadingMessages.length];
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFile = useCallback(async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const base64 = await fileToBase64(file);
      setImageBase64(base64);
      setError(null);
    } else {
      setError('Pasted content is not a valid image file.');
    }
  }, []);

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleFile(file);
          event.preventDefault();
          break;
        }
      }
    }
  }, [handleFile]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImageBase64(null);
  };

  // --- Fallback local video (sin API): genera un pequeño video estilo Ken Burns a partir de la imagen subida ---
  const createKenBurnsVideoFromImage = async (
    imageDataUrl: string,
    durationSec: number,
    width: number,
    height: number
  ): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        const img = new Image();
        img.src = imageDataUrl;
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = (e) => rej(e);
        });

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context not available'));

        if (!('captureStream' in canvas) || typeof MediaRecorder === 'undefined') {
          return reject(new Error('Tu navegador no soporta la grabación de video (MediaRecorder).'));
        }

        const fps = 30;
        const stream = (canvas as any).captureStream(fps);
        const options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp9' };
        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(stream, options);
        } catch {
          // Fallback a simple webm
          recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        }

        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => e.data && chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };

        recorder.start();

        const start = performance.now();
        const end = start + durationSec * 1000;

        const animate = (now: number) => {
          const t = Math.min(1, (now - start) / (end - start));
          // Zoom suave y pan
          const zoom = 1.1 + 0.25 * t; // de 1.1 a ~1.35
          const panX = (img.width * 0.05) * t; // leve pan hacia la derecha
          const panY = (img.height * 0.05) * t; // leve pan hacia abajo

          // Limpiar lienzo
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, width, height);

          // Calcular ajuste para cubrir canvas manteniendo aspecto
          const imgAspect = img.width / img.height;
          const canvasAspect = width / height;
          let drawW: number, drawH: number;
          if (imgAspect > canvasAspect) {
            drawH = height * zoom;
            drawW = drawH * imgAspect;
          } else {
            drawW = width * zoom;
            drawH = drawW / imgAspect;
          }

          const x = (width - drawW) / 2 - panX;
          const y = (height - drawH) / 2 - panY;

          ctx.drawImage(img, x, y, drawW, drawH);

          if (now < end) {
            requestAnimationFrame(animate);
          } else {
            recorder.stop();
          }
        };

        requestAnimationFrame(animate);
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleGenerate = async (overridePrompt?: string) => {
    const finalPrompt = overridePrompt ?? prompt;
    if (!finalPrompt.trim() && !imageFile) {
      setError("Please enter a prompt or provide an image.");
      return;
    }

    // Verificar permisos antes de generar
    const canGenerate = auth.canGenerateVideo();
    if (!canGenerate.allowed) {
      setError(canGenerate.reason || "No tienes permisos para generar videos.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);

    try {
      // Modo local: genera un video sin usar APIs (requiere imagen)
      if (generationMethod === 'local') {
        if (!imageBase64 || !imageFile) {
          throw new Error('Para el modo local, sube una imagen para crear el video.');
        }
        const isPortrait = aspectRatio === '9:16';
        const width = isPortrait ? 720 : 1280;
        const height = isPortrait ? 1280 : 720;
        const dataUrl = `data:${imageFile.type};base64,${imageBase64}`;
        const blob = await createKenBurnsVideoFromImage(dataUrl, 6, width, height);
        const objectUrl = URL.createObjectURL(blob);
        setGeneratedVideoUrl(objectUrl);
        // Incrementar uso diario después de generación exitosa
        auth.incrementDailyUsage();
        onResult?.({ videoUrl: objectUrl, sourceUri: 'local-generated', prompt: finalPrompt });
        return;
      }

      if (generationMethod === 'puter') {
        // Use Puter.js method for video generation
        const result = await generateVideoViaPuter(finalPrompt, aspectRatio);
        setError(`Puter.js Response: ${result}`);
        return;
      }

      // Direct API method
      const imagePayload = imageBase64 && imageFile
          ? { imageBytes: imageBase64, mimeType: imageFile.type }
          : undefined;
      
      let operation = await generateVideo(finalPrompt, aspectRatio, imagePayload, veoModel);
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await pollVideoStatus(operation);
      }

      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const sourceUri = operation.response.generatedVideos[0].video.uri;
        // Descargar a través del proxy seguro
        const proxiedUrl = `/api/fetchVideo?uri=${encodeURIComponent(sourceUri)}`;
        const videoResponse = await fetch(proxiedUrl);
        if (!videoResponse.ok) {
          throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }
        const videoBlob = await videoResponse.blob();
        const objectUrl = URL.createObjectURL(videoBlob);
        setGeneratedVideoUrl(objectUrl);
        // Incrementar uso diario después de generación exitosa
        auth.incrementDailyUsage();
        // Comunicar resultado a la app (para el chat del agente)
        onResult?.({ videoUrl: objectUrl, sourceUri, prompt: finalPrompt });
      } else {
        throw new Error("Video generation failed or returned no video URI.");
      }
    } catch (err: any) {
        const raw = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
        const errorMessage = raw || "An unknown error occurred.";
        // Mensaje genérico
        let uiMessage = `Error: ${errorMessage}`;
        // Mensaje amigable para cuota/429
        const msgLower = errorMessage.toLowerCase();
        if (msgLower.includes('resource_exhausted') || msgLower.includes('quota') || msgLower.includes('429')) {
            uiMessage = `Error 429 / cuota agotada: Has excedido tu cuota actual para la API de Gemini. Configura facturación o revisa tus límites en AI Studio.\n\nPasos: 1) Abre https://ai.google.dev/usage para ver uso y límites. 2) Configura facturación (https://ai.google.dev/gemini-api/docs/billing). 3) Prueba el modelo 'Veo 3.1 Fast (720p)' y reduce la frecuencia de solicitud.\n\nDetalle técnico: ${errorMessage}`;
        }
        setError(uiMessage);
        if (errorMessage.includes("Requested entity was not found.")) {
            setError("API Key not found or invalid. Please select your API key again.");
            resetKey();
        }
    } finally {
      setIsLoading(false);
    }
  };

  // Sync prompt from external defaultPrompt
  useEffect(() => {
    if (defaultPrompt) {
      setPrompt(defaultPrompt);
    }
  }, [defaultPrompt]);

  // Auto-generate once when instructed and key is selected
  useEffect(() => {
    if (autoGenerate && defaultPrompt && isKeySelected && !hasAutoRunRef.current) {
      hasAutoRunRef.current = true;
      const run = async () => {
        await new Promise(r => setTimeout(r, 0));
        handleGenerate(defaultPrompt);
      };
      run();
    }
  }, [autoGenerate, defaultPrompt, isKeySelected]);

  if (isChecking) {
    return <div className="flex items-center justify-center h-48"><Spinner className="h-8 w-8"/></div>;
  }
  
  // Mostrar ApiKeyManager si no hay autenticación
  if (!auth.isAuthenticated && !isKeySelected) {
    return (
        <div>
            <ApiKeyManager 
                onApiKeyChange={(apiKey, source) => {
                    auth.updateApiKey(apiKey, source);
                    if (apiKey && source !== 'env') {
                        selectKey(); // Mantener compatibilidad con el sistema existente
                    }
                }}
                currentApiKey={auth.apiKey || undefined}
            />
            <div className="text-center p-8 bg-gray-800 rounded-lg mt-4">
                <h3 className="text-xl font-bold mb-4">¿Prefieres el método clásico?</h3>
                <p className="mb-4 text-gray-400">También puedes usar el selector de API key original.</p>
                <Button onClick={selectKey} variant="secondary">Selector Clásico</Button>
            </div>
        </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-1">
          <h2 className="text-3xl font-bold text-white">Veo Video Generation</h2>
          <button 
              onClick={playGreeting} 
              disabled={isGreetingLoading} 
              className="text-gray-400 hover:text-white disabled:text-gray-600 transition-colors"
              aria-label="Play greeting"
          >
              {isGreetingLoading ? <Spinner className="h-5 w-5 animate-spin" /> : <SpeakerIcon className="h-5 w-5"/>}
          </button>
      </div>
      <p className="text-gray-400 mb-6">Create high-quality videos from text or an image using Veo 3. Paste an image anywhere to get started.</p>
      
      <VeoInfo />
      
      <VeoTester onTestComplete={(method, result) => {
        console.log(`Test completed for ${method}:`, result);
      }} />
      
      <VeoForceCall />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 flex flex-col">
              <div>
                  <label htmlFor="prompt-textarea" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
                  <textarea
                      id="prompt-textarea"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., A neon hologram of a cat driving at top speed"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gemini-blue focus:outline-none transition"
                      rows={7}
                      disabled={isLoading}
                  />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                      <label className="font-medium text-sm text-gray-300">Aspect Ratio:</label>
                      <select
                          value={aspectRatio}
                          onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')}
                          className="bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-gemini-blue focus:outline-none"
                          disabled={isLoading}
                      >
                          <option value="16:9">16:9 (Landscape)</option>
                          <option value="9:16">9:16 (Portrait)</option>
                      </select>
                  </div>
                  <div className="flex items-center gap-2">
                      <label className="font-medium text-sm text-gray-300">Veo Model:</label>
                      <select
                          value={veoModel}
                          onChange={(e) => setVeoModel(e.target.value as 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview')}
                          className="bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-gemini-blue focus:outline-none"
                          disabled={isLoading}
                      >
                          <option value="veo-3.1-fast-generate-preview">Veo 3.1 Fast (720p)</option>
                          <option value="veo-3.1-generate-preview">Veo 3.1 Standard (1080p)</option>
                      </select>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                  <label className="font-medium text-sm text-gray-300">Generation Method:</label>
                  <div className="flex gap-4 flex-wrap">
                      {availableMethods.map((method) => (
                          <label key={method.id} className="flex items-center gap-2 text-sm text-gray-300">
                              <input
                                  type="radio"
                                  value={method.id}
                                  checked={generationMethod === method.id}
                                  onChange={(e) => setGenerationMethod(e.target.value as 'direct' | 'puter' | 'local')}
                                  className="text-gemini-blue focus:ring-gemini-blue"
                                  disabled={isLoading}
                              />
                              <span className="flex items-center gap-1">
                                  {method.name}
                                  {method.premium && (
                                      <span className="px-1 py-0.5 bg-yellow-600 text-yellow-100 text-xs rounded">
                                          {auth.isProPlus ? 'Pro+' : auth.isPremium ? 'Premium' : 'API'}
                                      </span>
                                  )}
                              </span>
                          </label>
                      ))}
                  </div>
              </div>
              
              {/* Mostrar información de uso diario */}
              <div className="bg-gray-700 rounded p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Uso diario:</span>
                      <span className="text-white">
                          {auth.permissions.maxVideosPerDay === -1 
                              ? `${auth.dailyUsage} (Ilimitado)` 
                              : `${auth.dailyUsage}/${auth.permissions.maxVideosPerDay}`
                          }
                      </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                          className={`h-2 rounded-full transition-all ${
                              auth.permissions.maxVideosPerDay === -1 
                                  ? 'bg-green-500 w-full' 
                                  : auth.dailyUsage >= auth.permissions.maxVideosPerDay 
                                      ? 'bg-red-500 w-full' 
                                      : 'bg-blue-500'
                          }`}
                          style={{
                              width: auth.permissions.maxVideosPerDay === -1 
                                  ? '100%' 
                                  : `${Math.min((auth.dailyUsage / auth.permissions.maxVideosPerDay) * 100, 100)}%`
                          }}
                      />
                  </div>
                  {!auth.permissions.hasUnlimitedQuota && auth.dailyUsage >= auth.permissions.maxVideosPerDay && (
                      <p className="text-red-400 text-xs mt-2">
                          Has alcanzado el límite diario. {!auth.isAuthenticated && 'Conecta tu cuenta para aumentar el límite.'}
                      </p>
                  )}
              </div>
          </div>
          <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Optional: Start with an image</label>
              {!imageBase64 ? (
                  <div className="flex justify-center items-center h-full px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                          <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                          <div className="flex text-sm text-gray-400">
                              <label htmlFor="image-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-gemini-blue hover:text-gemini-blue/80 focus-within:outline-none">
                                  <span>Upload a file</span>
                                  <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} disabled={isLoading} />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">or paste an image (Ctrl+V)</p>
                      </div>
                  </div>
              ) : (
                  <div className="relative">
                      <img src={`data:${imageFile?.type};base64,${imageBase64}`} alt="Uploaded preview" className="w-full h-auto object-contain max-h-64 rounded-lg shadow-md" />
                      <button
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors"
                          aria-label="Remove image"
                      >
                          <XIcon className="h-5 w-5" />
                      </button>
                  </div>
              )}
          </div>
      </div>

      <div className="mt-6 relative z-30">
          {/* onClick must NOT pass the MouseEvent to handleGenerate, wrap to avoid treating event as prompt */}
          <Button onClick={() => handleGenerate()} isLoading={isLoading} disabled={isLoading || !canGenerate}>
              {isLoading ? 'Generating...' : 'Generate Video'}
          </Button>
          {/* Debug mínimo para diagnosticar botón inactivo (se puede ocultar luego) */}
          <div className="mt-2 text-xs text-gray-400">Estado: loading={String(isLoading)} · promptChars={(prompt?.trim()?.length ?? 0)} · image={String(!!imageFile)}</div>
      </div>

      {error && <div className="mt-4 p-3 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}

      {isLoading && (
          <div className="mt-6 text-center p-8 bg-gray-900/50 rounded-lg">
              <Spinner className="h-12 w-12 mx-auto animate-spin text-gemini-blue"/>
              <p className="mt-4 font-medium text-lg">{loadingMessage}</p>
          </div>
      )}
      
      {generatedVideoUrl && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Generated Video:</h3>
          <video src={generatedVideoUrl} controls autoPlay loop className="w-full rounded-lg shadow-lg" />
          <div className="mt-3 text-sm text-gray-300 flex items-center gap-4">
            <a href={generatedVideoUrl} target="_blank" rel="noopener noreferrer" className="text-gemini-blue underline">Open in new tab</a>
            {/* Provide the original URI for debugging/traceability (may require auth) */}
            <button
              onClick={() => navigator.clipboard.writeText((generatedVideoUrl || '') as string)}
              className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
            >Copy player URL</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
