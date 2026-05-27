---
name: LanguageProvider HMR crash patterns
description: Two patterns that crash immovia on Vite HMR — null guard and undefined context default.
---

## Rule
`artifacts/immovia/src/lib/language-context.tsx` must:
1. Never gate `children` behind an `isMounted` flag
2. Never use `createContext<T | undefined>(undefined)` — give the context a real default value

## Why
Both patterns cause the same crash during Vite HMR (`// @refresh reset` resets the module):

**Pattern 1 — isMounted null guard:**
```tsx
if (!isMounted) return null;  // ← LanguageProvider returns null → no Provider wraps tree
```

**Pattern 2 — undefined context default + throwing hook:**
```tsx
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) throw new Error('...');  // ← throws during HMR re-render
}
```
Both cause `"useLanguage must be used within a LanguageProvider"` to crash the whole app during HMR, because Vite invalidates the module and briefly re-renders consumers before the Provider remounts.

## How to apply
Use a real default context value so `useLanguage()` never throws:

```tsx
const defaultContext: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  useEffect(() => {
    const saved = localStorage.getItem('immovia-language') as Language;
    if (saved && ['sq', 'en', 'de', 'fr'].includes(saved)) setLanguageState(saved);
  }, []);
  const setLanguage = (lang: Language) => { setLanguageState(lang); localStorage.setItem('immovia-language', lang); };
  return <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);  // never throws — always has defaultContext as fallback
}
```

**Why:** `createContext` with a real default means consumers get `'en'` during the HMR flash instead of throwing. The `// @refresh reset` comment must remain at line 1.
