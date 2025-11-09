
import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { useLanguage } from './contexts/LanguageContext';
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

  const SECRET_SEQUENCE = ['Control', 'Shift', 'KeyL', 'KeyA', 'KeyB'];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.ctrlKey ? 'Control' : 
                  event.shiftKey ? 'Shift' : 
                  event.code;
      
      const newSequence = [...keySequence, key].slice(-SECRET_SEQUENCE.length);
      setKeySequence(newSequence);

      if (newSequence.length === SECRET_SEQUENCE.length &&
          newSequence.every((k, i) => k === SECRET_SEQUENCE[i])) {
        setShowInternalLab(true);
        setKeySequence([]);
      }
    };

    const handleKeyUp = () => {
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
  };

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

          <div className="bg-gray-800 rounded-lg shadow-xl overflow-visible">
            <TabNavigation 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
            />

            <div className="p-6 min-h-[600px]">
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

          {keySequence.length > 0 && (
            <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-xs text-gray-400">
              Secuencia: {keySequence.join(' + ')}
            </div>
          )}
        </div>

        <InternalLab 
          isVisible={showInternalLab}
          onClose={() => setShowInternalLab(false)}
        />
      </div>
    </LanguageProvider>
  );
}

const TabNavigation: React.FC<{ activeTab: string; setActiveTab: (tab: string) => void; }> = ({ activeTab, setActiveTab }) => {
  const { t } = useLanguage();
  const tabs = [
    { id: 'chat', label: t('nav.fastChat'), icon: '💬' },
    { id: 'agent', label: t('nav.videoAgent'), icon: '🤖', highlight: true },
    { id: 'video', label: t('nav.videoGenerator'), icon: '🎬' },
    { id: 'image', label: t('nav.imageGenerator'), icon: '🖼️' },
  ];

  return (
    <div className="flex border-b border-gray-700" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
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
        </button>
      ))}
    </div>
  );
};

const TabContent: React.FC<any> = ({ activeTab, videoPrefill, imagePrefill, onIntent, onVideoAgentGenerate, onVideoGenerated, externalVideoEvent }) => {
  if (activeTab === 'chat') return <FastChat onIntent={onIntent} />;
  if (activeTab === 'agent') return <VideoAgent onVideoGenerate={onVideoAgentGenerate} externalEvent={externalVideoEvent} />;
  if (activeTab === 'video') return (
    <VideoGenerator 
      defaultPrompt={videoPrefill?.prompt}
      autoGenerate={videoPrefill?.autoGenerate}
      onResult={onVideoGenerated}
    />
  );
  if (activeTab === 'image') return <ImageGenerator defaultPrompt={imagePrefill?.prompt} autoGenerate={imagePrefill?.autoGenerate} />;
  return <FastChat onIntent={onIntent} />;
};
