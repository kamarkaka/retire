import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './i18n/context';
import '@fontsource-variable/inter';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
if (import.meta.env.DEV && window.location.pathname === '/verification') {
  void import('./verification/Harness').then(({ default: Harness }) =>
    root.render(<Harness />),
  );
} else {
  root.render(
    <StrictMode>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </StrictMode>,
  );
}
