import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {initProductionSecurity} from './lib/security.ts';

if (import.meta.env.PROD) {
  initProductionSecurity();
}

createRoot(document.getElementById('root')!).render(<App />);
