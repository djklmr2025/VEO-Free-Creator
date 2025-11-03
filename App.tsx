
import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import FastChat from './components/FastChat';
import VideoGenerator from './components/VideoGenerator';
import ImageGenerator from './components/ImageGenerator';
import { VideoAgent } from './components/VideoAgent';
import { InternalLab } from './components/InternalLab';
import { LanguageSelector } from './components/LanguageSelector';
import AutopilotToggle from './components/AutopilotToggle';

interface VideoPrefill {
  prompt: string;
  autoGenerate: boolean;
}

interface ImagePrefill {
  prompt: string;
  autoGenerate: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [videoPrefill, setVideoPrefill] = useState<VideoPrefill | null>(null);
  const [imagePrefill, setImagePrefill] = useState<ImagePrefill | null>(null);
  const [showInternalLab, setShowInternalLab] = useState(false);
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [latestVideoEvent, setLatestVideoEvent] = useState<{ url: string; sourceUri: string; prompt: string } | null>(null);

  // Secuencia secreta para abrir el laboratorio: Ctrl+Shift+L+A+B
  const SECRET_SEQUENCE = ['Control', 'Shift', 'KeyL', 'KeyA', 'KeyB'];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.ctrlKey ? 'Control' : 
                  event.shiftKey ? 'Shift' : 
                  event.code;
      
      const newSequence = [...keySequence, key].slice(-SECRET_SEQUENCE.length);
      setKeySequence(newSequence);

      // Verificar si la secuencia coincide
      if (newSequence.length === SECRET_SEQUENCE.length &&
          newSequence.every((k, i) => k === SECRET_SEQUENCE[i])) {
        setShowInternalLab(true);
        setKeySequence([]);
      }
    };

    const handleKeyUp = () => {
      // Limpiar secuencia después de un tiempo
      setTimeout(() => setKeySequence([]), 2000);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keySequence]);

  const handleIntent = (intent: 'video' | 'image', prompt: string, autoGenerate: boolean = false) => {
    if (intent === 'video') {
      setVideoPrefill({ prompt, autoGenerate });
      setActiveTab('video');
    } else if (intent === 'image') {
      setImagePrefill({ prompt, autoGenerate });
      setActiveTab('image');
    }
  };

  const handleVideoAgentGenerate = (prompt: string, config?: any) => {
    setVideoPrefill({ prompt, autoGenerate: true });
    setActiveTab('video');
  };

  const handleVideoGenerated = (result: { videoUrl: string; sourceUri: string; prompt: string }) => {
    setLatestVideoEvent({ url: result.videoUrl, sourceUri: result.sourceUri, prompt: result.prompt });
    // Opcional: regresar al agente automáticamente
    // setActiveTab('agent');
  };

  // Clear prefill data when switching tabs manually
  useEffect(() => {
    if (activeTab !== 'video') {
      setVideoPrefill(null);
    }
    if (activeTab !== 'image') {
      setImagePrefill(null);
    }
  }, [activeTab]);

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                VEO Free Creator
              </h1>
              <p className="text-gray-400 mt-2">Create amazing videos and images with AI</p>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <AutopilotToggle />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <TabNavigation 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
            />

            <div className="h-[600px]">
              <TabContent 
                activeTab={activeTab}
                videoPrefill={videoPrefill}
                imagePrefill={imagePrefill}
                onIntent={handleIntent}
                onVideoAgentGenerate={handleVideoAgentGenerate}
                onVideoGenerated={handleVideoGenerated}
                externalVideoEvent={latestVideoEvent}
              />
            </div>
          </div>

          {/* Indicador de secuencia secreta (solo para debug) */}
          {keySequence.length > 0 && (
            <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-xs text-gray-400">
              Secuencia: {keySequence.join(' + ')}
            </div>
          )}
        </div>

        {/* Laboratorio Interno */}
        <InternalLab 
          isVisible={showInternalLab}
          onClose={() => setShowInternalLab(false)}
        />
      </div>
    </LanguageProvider>
  );
}

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'chat', label: 'Fast Chat', icon: '💬' },
    { id: 'agent', label: 'Video Agent', icon: '🤖', highlight: true },
    { id: 'video', label: 'Video Generator', icon: '🎬' },
    { id: 'image', label: 'Image Generator', icon: '🖼️' },
  ];

  return (
    <div className="flex border-b border-gray-700">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${
            activeTab === tab.id
              ? tab.highlight 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
          {tab.highlight && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
              NEW
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

interface TabContentProps {
  activeTab: string;
  videoPrefill: VideoPrefill | null;
  imagePrefill: ImagePrefill | null;
  onIntent: (intent: 'video' | 'image', prompt: string, autoGenerate?: boolean) => void;
  onVideoAgentGenerate: (prompt: string, config?: any) => void;
  onVideoGenerated: (result: { videoUrl: string; sourceUri: string; prompt: string }) => void;
  externalVideoEvent: { url: string; sourceUri: string; prompt: string } | null;
}

const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  videoPrefill,
  imagePrefill,
  onIntent,
  onVideoAgentGenerate,
  onVideoGenerated,
  externalVideoEvent
}) => {
  switch (activeTab) {
    case 'chat':
      return <FastChat onIntent={onIntent} />;
    case 'agent':
      return <VideoAgent onVideoGenerate={onVideoAgentGenerate} externalEvent={externalVideoEvent} />;
    case 'video':
      return (
        <VideoGenerator 
          defaultPrompt={videoPrefill?.prompt}
          autoGenerate={videoPrefill?.autoGenerate}
          onResult={onVideoGenerated}
        />
      );
    case 'image':
      return (
        <ImageGenerator 
          defaultPrompt={imagePrefill?.prompt}
          autoGenerate={imagePrefill?.autoGenerate}
        />
      );
    default:
      return <FastChat onIntent={onIntent} />;
  }
};
