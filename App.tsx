
import React, { useState } from 'react';
import VideoGenerator from './components/VideoGenerator';
import VideoAnalyzer from './components/VideoAnalyzer';
import ImageEditor from './components/ImageEditor';
import ImageGenerator from './components/ImageGenerator';
import FastChat from './components/FastChat';
import TextToSpeech from './components/TextToSpeech';
import { VideoIcon, FilmIcon, ImageIcon, SparklesIcon, MessageIcon, SoundWaveIcon } from './components/Icons';
import AutopilotToggle from './components/AutopilotToggle';

type Tab = 'video-gen' | 'video-analyze' | 'image-gen' | 'image-edit' | 'tts' | 'chat';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('video-gen');

  const tabs = [
    { id: 'video-gen', name: 'Veo Video Generation', icon: <VideoIcon /> },
    { id: 'video-analyze', name: 'Video Analysis', icon: <FilmIcon /> },
    { id: 'image-gen', name: 'Image Generation', icon: <ImageIcon /> },
    { id: 'image-edit', name: 'Image Editing', icon: <SparklesIcon /> },
    { id: 'tts', name: 'Text to Speech', icon: <SoundWaveIcon /> },
    { id: 'chat', name: 'Fast Chat', icon: <MessageIcon /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'video-gen':
        return <VideoGenerator />;
      case 'video-analyze':
        return <VideoAnalyzer />;
      case 'image-gen':
        return <ImageGenerator />;
      case 'image-edit':
        return <ImageEditor />;
      case 'tts':
        return <TextToSpeech />;
      case 'chat':
        return <FastChat />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Gemini <span className="text-gemini-blue">Creative Suite</span>
            </h1>
            <AutopilotToggle />
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4 xl:w-1/5">
            <nav className="flex flex-row lg:flex-col gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left ${
                    activeTab === tab.id
                      ? 'bg-gemini-blue text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              ))}
            </nav>
          </aside>

          <div className="lg:w-3/4 xl:w-4/5 bg-gray-800/50 rounded-xl border border-gray-700 shadow-2xl p-4 sm:p-6 lg:p-8">
            {renderContent()}
          </div>
        </div>
      </main>

       <footer className="text-center p-4 text-xs text-gray-500">
          Powered by Google Gemini. For demo purposes only.
      </footer>
    </div>
  );
};

export default App;
