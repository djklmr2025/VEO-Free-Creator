import React, { useState } from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-white transition-colors"
        title={t('common.language')}
        aria-label={t('common.language')}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-lg">{currentLanguage?.flag}</span>
        <span className="text-sm font-medium">{currentLanguage?.code.toUpperCase()}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-40 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-20" role="listbox" aria-label={t('common.language')}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-700 transition-colors ${
                  language === lang.code ? 'bg-gray-700 text-blue-400' : 'text-white'
                } ${lang.code === languages[0].code ? 'rounded-t-lg' : ''} ${
                  lang.code === languages[languages.length - 1].code ? 'rounded-b-lg' : ''
                }`}
                role="option"
                aria-selected={language === lang.code}
              >
                <span className="text-lg">{lang.flag}</span>
                <div>
                  <div className="font-medium">{lang.name}</div>
                  <div className="text-xs text-gray-400">{lang.code.toUpperCase()}</div>
                </div>
                {language === lang.code && (
                  <svg className="w-4 h-4 ml-auto text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};