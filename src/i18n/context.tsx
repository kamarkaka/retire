import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  intlLocaleFor,
  loadLanguage,
  saveLanguage,
  translate,
  type Vars,
} from './core';
import type { MessageKey } from './en';

interface I18n {
  lang: string;
  intlLocale: string;
  setLang: (code: string) => void;
  t: (key: MessageKey, vars?: Vars) => string;
}

const LanguageContext = createContext<I18n | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(loadLanguage);
  useEffect(() => {
    saveLanguage(lang);
    document.documentElement.lang = lang;
    document.title = translate(lang, 'meta.title');
  }, [lang]);
  const setLang = useCallback((code: string) => setLangState(code), []);
  const value = useMemo<I18n>(
    () => ({
      lang,
      intlLocale: intlLocaleFor(lang),
      setLang,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, setLang],
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n(): I18n {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useI18n requires a LanguageProvider');
  return ctx;
}
