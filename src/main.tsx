import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

(window as unknown as { __AUTOTYPER_BOOTED__?: boolean }).__AUTOTYPER_BOOTED__ = true;

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
