import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { geminiService } from '../services/geminiService';
import Button from './Button';
import { Spinner } from './Icons';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    projectContext?: boolean;
    videoGenerated?: boolean;
    analysisComplete?: boolean;
  };
}

interface VideoAgentProps {
  onVideoGenerate?: (prompt: string, config?: any) => void;
  projectContext?: string;
  externalEvent?: { url: string; sourceUri: string; prompt: string } | null;
}

export const VideoAgent: React.FC<VideoAgentProps> = ({ 
  onVideoGenerate,
  projectContext,
  externalEvent
}) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [systemContext, setSystemContext] = useState('');
  // Hero & Guided Flow
  const [showHero, setShowHero] = useState(true);
  const [isGuidedFlow, setIsGuidedFlow] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState<'understanding' | 'planning' | 'creating' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mensaje de bienvenida del agente
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `¡Hola! Soy tu Video Agent VEO 3. Puedo ayudarte a crear videos increíbles analizando todo tu proyecto. 

🎬 **Capacidades:**
- Análisis completo del proyecto
- Generación inteligente de prompts
- Integración con VEO 3
- Sugerencias contextuales
- Optimización automática

¿Qué tipo de video quieres crear hoy?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);

    // Analizar contexto del proyecto al iniciar
    analyzeProjectContext();
    setShowHero(true);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Registrar resultados externos (por ejemplo, video generado desde el generador)
  useEffect(() => {
    if (externalEvent?.url) {
      const msg: Message = {
        id: `external-video-${Date.now()}`,
        role: 'assistant',
        content: `🎬 Video generado correctamente\n\nPrompt: ${externalEvent.prompt}\n\nPuedes ver el resultado aquí:\n[Abrir video](${externalEvent.url})\n\nFuente (URI de Veo):\n${externalEvent.sourceUri}`,
        timestamp: new Date(),
        metadata: { videoGenerated: true }
      };
      setMessages(prev => [...prev, msg]);
    }
  }, [externalEvent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const analyzeProjectContext = async () => {
    setIsAnalyzing(true);
    try {
      // Simular análisis del proyecto (en una implementación real, esto analizaría los archivos)
      const contextAnalysis = `
**Análisis del Proyecto VEO-Free-Creator:**

📁 **Estructura detectada:**
- React + TypeScript + Vite
- Componentes de generación de video e imagen
- Servicios de IA (Gemini)
- Sistema de chat inteligente
- Hooks personalizados para APIs

🎯 **Capacidades actuales:**
- Generación de videos con VEO
- Creación de imágenes con IA
- Chat conversacional
- Análisis de video
- Text-to-Speech

💡 **Sugerencias para videos:**
- Demos de funcionalidades
- Tutoriales de uso
- Presentaciones del proyecto
- Videos explicativos técnicos
- Contenido promocional
      `;

      setSystemContext(contextAnalysis);
      
      const analysisMessage: Message = {
        id: `analysis-${Date.now()}`,
        role: 'assistant',
        content: `${t('agent.analyzing')} ✅\n\n${contextAnalysis}\n\n¿Te gustaría que genere un video basado en alguna de estas capacidades?`,
        timestamp: new Date(),
        metadata: { projectContext: true, analysisComplete: true }
      };

      setMessages(prev => [...prev, analysisMessage]);
    } catch (error) {
      console.error('Error analyzing project:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startGuidedFlow = async () => {
    // Inicia la tarjeta de progreso y avanza por etapas
    setShowHero(false);
    setIsGuidedFlow(true);
    setProgressStage('understanding');
    setProgress(5);

    const steps: { stage: 'understanding' | 'planning' | 'creating'; target: number; duration: number }[] = [
      { stage: 'understanding', target: 30, duration: 1800 },
      { stage: 'planning', target: 70, duration: 2000 },
      { stage: 'creating', target: 100, duration: 2400 },
    ];

    // Pequeña animación incremental de progreso en cada etapa
    const runStep = (index: number) => {
      if (index >= steps.length) {
        setIsGuidedFlow(false);
        // Lanzar generación de video con un prompt base
        const defaultPrompt = 'Presentación del proyecto VEO-Free-Creator mostrando capacidades y flujo guiado del Video Agent.';
        onVideoGenerate?.(defaultPrompt, {
          model: 'veo-3',
          quality: 'high',
          duration: '5s',
          aspectRatio: '16:9',
        });
        // Añadir mensaje al chat
        setMessages(prev => [...prev, {
          id: `flow-complete-${Date.now()}`,
          role: 'assistant',
          content: `${t('agent.generating')}\n\n${t('progress.title')}`,
          timestamp: new Date(),
          metadata: { videoGenerated: true }
        }]);
        return;
      }

      const { stage, target, duration } = steps[index];
      setProgressStage(stage);
      const start = progress;
      const diff = target - start;
      const intervalMs = 120;
      const stepsCount = Math.max(1, Math.floor(duration / intervalMs));
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const next = Math.min(target, Math.round(start + (diff * currentStep) / stepsCount));
        setProgress(next);
        if (currentStep >= stepsCount) {
          clearInterval(interval);
          setTimeout(() => runStep(index + 1), 300);
        }
      }, intervalMs);
    };

    runStep(0);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Construir prompt con contexto del proyecto
      const systemPrompt = `Eres un Video Agent experto especializado en VEO 3. Tu trabajo es ayudar a crear videos increíbles analizando el contexto del proyecto.

CONTEXTO DEL PROYECTO:
${systemContext}

INSTRUCCIONES:
1. Analiza la solicitud del usuario
2. Sugiere prompts optimizados para VEO 3
3. Proporciona configuraciones técnicas específicas
4. Ofrece alternativas creativas
5. Si detectas intención de generar video, proporciona un prompt listo para usar

Responde de manera conversacional pero técnicamente precisa.`;

      const response = await geminiService.generateContent(
        `${systemPrompt}\n\nUsuario: ${input}`
      );

      // Detectar si el usuario quiere generar un video
      const videoIntent = detectVideoIntent(input, response);
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        metadata: { videoGenerated: videoIntent.shouldGenerate }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Si se detecta intención de video, generar automáticamente
      if (videoIntent.shouldGenerate && onVideoGenerate) {
        setTimeout(() => {
          onVideoGenerate(videoIntent.prompt, videoIntent.config);
        }, 1000);
      }

    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const detectVideoIntent = (userInput: string, aiResponse: string) => {
    const videoKeywords = [
      'generar video', 'crear video', 'hacer video', 'video de',
      'generate video', 'create video', 'make video', 'video about'
    ];

    const hasVideoIntent = videoKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword) || 
      aiResponse.toLowerCase().includes(keyword)
    );

    if (hasVideoIntent) {
      // Extraer prompt optimizado de la respuesta de la IA
      const promptMatch = aiResponse.match(/PROMPT:\s*(.+?)(?:\n|$)/i);
      const prompt = promptMatch ? promptMatch[1] : userInput;

      return {
        shouldGenerate: true,
        prompt: prompt,
        config: {
          model: 'veo-3',
          quality: 'high',
          duration: '5s',
          aspectRatio: '16:9'
        }
      };
    }

    return { shouldGenerate: false, prompt: '', config: {} };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-blue-400">{t('agent.title')}</h2>
            <p className="text-sm text-gray-400">{t('agent.subtitle')}</p>
          </div>
          {isAnalyzing && (
            <div className="flex items-center text-yellow-400">
              <Spinner className="w-4 h-4 mr-2" />
              <span className="text-sm">{t('agent.analyzing')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hero Card */}
      {showHero && !isGuidedFlow && (
        <div className="p-4">
          <div className="bg-gradient-to-r from-purple-800 to-blue-800 border border-purple-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{t('hero.title')}</h3>
                <p className="text-gray-200 mt-2 max-w-2xl">{t('hero.description')}</p>
              </div>
              <Button onClick={startGuidedFlow} className="px-5 py-3 bg-blue-600 hover:bg-blue-700">
                {t('hero.cta')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Guided Flow Progress */}
      {isGuidedFlow && (
        <div className="p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-2">{progress}%</div>
                <h4 className="text-lg font-semibold">{t('progress.title')}</h4>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {/* Understanding */}
                  <div className={`p-4 rounded-lg border ${progressStage === 'understanding' ? 'border-yellow-400 bg-yellow-900/20' : 'border-gray-700 bg-gray-900'}`}>
                    <div className="font-medium mb-2">{t('progress.understanding')}</div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• {t('progress.items.reviewAssets')}</li>
                      <li>• {t('progress.items.reviewReferences')}</li>
                      <li>• {t('progress.items.gatherInfo')}</li>
                    </ul>
                  </div>
                  {/* Planning */}
                  <div className={`p-4 rounded-lg border ${progressStage === 'planning' ? 'border-purple-400 bg-purple-900/20' : 'border-gray-700 bg-gray-900'}`}>
                    <div className="font-medium mb-2">{t('progress.planning')}</div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Storyboard & prompts</li>
                      <li>• Modelo y calidad</li>
                      <li>• Aspect ratio y duración</li>
                    </ul>
                  </div>
                  {/* Creating */}
                  <div className={`p-4 rounded-lg border ${progressStage === 'creating' ? 'border-green-400 bg-green-900/20' : 'border-gray-700 bg-gray-900'}`}>
                    <div className="font-medium mb-2">{t('progress.creating')}</div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Render inicial</li>
                      <li>• Ajustes finos</li>
                      <li>• Export listo</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Simple circle with percentage */}
              <div className="w-20 h-20 flex items-center justify-center rounded-full border-4" style={{
                borderColor: progressStage === 'understanding' ? '#F59E0B' : progressStage === 'planning' ? '#A855F7' : '#22C55E'
              }}>
                <span className="text-xl font-bold">{progress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.metadata?.projectContext
                  ? 'bg-purple-900 border border-purple-600'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              {message.metadata?.videoGenerated && (
                <div className="mt-2 text-xs text-green-400">
                  🎬 Video generado automáticamente
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 p-3 rounded-lg flex items-center">
              <Spinner className="w-4 h-4 mr-2" />
              <span className="text-sm">Analizando y generando respuesta...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('agent.placeholder')}
            className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? <Spinner className="w-4 h-4" /> : '🚀'}
          </Button>
        </div>
      </div>
    </div>
  );
};