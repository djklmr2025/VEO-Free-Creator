import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  es: {
    // Navigation
    'nav.fastChat': 'Chat Rápido',
    'nav.videoGenerator': 'Generador de Video',
    'nav.imageGenerator': 'Generador de Imagen',
    'nav.videoAgent': 'Video Agent',
    'nav.labMode': 'Modo Laboratorio',
    
    // Video Agent
    'agent.title': 'Video Agent VEO 3',
    'agent.subtitle': 'Agente Maestro para Creación de Videos',
    'agent.placeholder': 'Describe el video que quieres crear...',
    'agent.analyzing': 'Analizando proyecto...',
    'agent.generating': 'Generando video con VEO 3...',
    'agent.projectContext': 'Contexto del Proyecto',
    'agent.advancedMode': 'Modo Avanzado',
    // Hero & Progress
    'hero.title': 'Video Agent VEO 3',
    'hero.description': 'Tu asistente para crear videos con IA. Describe tu idea y te guiamos paso a paso hasta tener el video listo.',
    'hero.cta': 'Probar ahora',
    'progress.title': 'Nuestro Video Agent está trabajando en tu video.',
    'progress.understanding': 'Entendiendo tu visión',
    'progress.planning': 'Planificando',
    'progress.creating': 'Creando',
    'progress.items.reviewAssets': 'Analizando los recursos proporcionados',
    'progress.items.reviewReferences': 'Revisando materiales de referencia',
    'progress.items.gatherInfo': 'Recopilando información adicional',
    
    // Lab Mode
    'lab.title': 'Laboratorio Interno VEO',
    'lab.subtitle': 'Herramientas Avanzadas de Desarrollo',
    'lab.accessCode': 'Código de Acceso',
    'lab.unlock': 'Desbloquear Lab',
    'lab.projectAnalysis': 'Análisis Completo del Proyecto',
    'lab.systemPrompts': 'Prompts del Sistema',
    'lab.apiConfig': 'Configuración API',
    'lab.debugMode': 'Modo Debug',
    
    // Common
    'common.generate': 'Generar',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.language': 'Idioma',
    'common.settings': 'Configuración',
  },
  en: {
    // Navigation
    'nav.fastChat': 'Fast Chat',
    'nav.videoGenerator': 'Video Generator',
    'nav.imageGenerator': 'Image Generator',
    'nav.videoAgent': 'Video Agent',
    'nav.labMode': 'Lab Mode',
    
    // Video Agent
    'agent.title': 'Video Agent VEO 3',
    'agent.subtitle': 'Master Agent for Video Creation',
    'agent.placeholder': 'Describe the video you want to create...',
    'agent.analyzing': 'Analyzing project...',
    'agent.generating': 'Generating video with VEO 3...',
    'agent.projectContext': 'Project Context',
    'agent.advancedMode': 'Advanced Mode',
    // Hero & Progress
    'hero.title': 'Video Agent VEO 3',
    'hero.description': 'Your assistant to create videos with AI. Describe your idea and we will guide you step-by-step until the video is ready.',
    'hero.cta': 'Try it out',
    'progress.title': 'Our Video Agent is working on your video.',
    'progress.understanding': 'Understanding your vision',
    'progress.planning': 'Planning',
    'progress.creating': 'Creating',
    'progress.items.reviewAssets': 'Analyzing provided assets',
    'progress.items.reviewReferences': 'Reviewing reference materials',
    'progress.items.gatherInfo': 'Gathering additional information',
    
    // Lab Mode
    'lab.title': 'VEO Internal Lab',
    'lab.subtitle': 'Advanced Development Tools',
    'lab.accessCode': 'Access Code',
    'lab.unlock': 'Unlock Lab',
    'lab.projectAnalysis': 'Complete Project Analysis',
    'lab.systemPrompts': 'System Prompts',
    'lab.apiConfig': 'API Configuration',
    'lab.debugMode': 'Debug Mode',
    
    // Common
    'common.generate': 'Generate',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.language': 'Language',
    'common.settings': 'Settings',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('veo-language') as Language;
    if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('veo-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};