'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../locales/translations';

type TranslationKeys = typeof translations.EN;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('appLang') as Language;
      if (savedLang && ['EN', 'RU', 'KZ'].includes(savedLang)) {
        return savedLang;
      }
    }
    return 'RU';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('appLang') as Language;
      if (savedLang && ['EN', 'RU', 'KZ'].includes(savedLang) && savedLang !== language) {
        setLanguageState(savedLang);
      }
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('appLang', lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
