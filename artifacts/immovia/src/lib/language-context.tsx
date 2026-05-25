// @refresh reset
import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, Language } from './translations';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('immovia-language') as Language;
    if (saved && ['sq', 'en', 'de', 'fr'].includes(saved)) {
      setLanguageState(saved);
    }
    setIsMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('immovia-language', lang);
  };

  const t = translations[language];

  // Prevent hydration mismatch by not rendering until mounted if needed, 
  // but here we just render with default 'en' until mounted.
  if (!isMounted) return null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
