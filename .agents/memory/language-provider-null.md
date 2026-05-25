---
name: LanguageProvider isMounted null guard
description: Why LanguageProvider must never return null — causes HMR and runtime crashes in immovia.
---

## Rule
`LanguageProvider` in `artifacts/immovia/src/lib/language-context.tsx` must **never** gate `children` rendering behind an `isMounted` flag.

## Why
The old pattern was:
```tsx
const [isMounted, setIsMounted] = useState(false);
useEffect(() => { ...; setIsMounted(true); }, []);
if (!isMounted) return null;   // ← the bug
```
During Vite HMR, `// @refresh reset` resets the module and `isMounted` reverts to `false`. The Provider returns `null`, so no `LanguageContext.Provider` wraps the tree. Any component that calls `useLanguage()` immediately throws `"useLanguage must be used within a LanguageProvider"`, crashing the entire app.

## How to apply
Always render children immediately. Use `useState<Language>('en')` as the safe default; the `useEffect` will sync from localStorage on mount without blocking the first render:

```tsx
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('immovia-language') as Language;
    if (saved && ['sq', 'en', 'de', 'fr'].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  // ...
  return <LanguageContext.Provider value={...}>{children}</LanguageContext.Provider>;
}
```

The `// @refresh reset` comment must remain at line 1 of the file, but it alone is not sufficient — the null guard must also be absent.
