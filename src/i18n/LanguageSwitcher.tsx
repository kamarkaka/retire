import { supportedLanguages } from './core';
import { useI18n } from './context';

/** One button per registered language; the list grows with the registry. */
export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      className="toolbar toggle-group lang-switch"
      role="group"
      aria-label={t('language.label')}
      data-testid="language-switcher"
    >
      {supportedLanguages().map((l) => (
        <button
          key={l.code}
          type="button"
          className={lang === l.code ? 'selected' : 'secondary'}
          aria-pressed={lang === l.code}
          onClick={() => setLang(l.code)}
        >
          {l.nativeName}
        </button>
      ))}
    </div>
  );
}
