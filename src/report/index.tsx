/**
 * Mount the report application into the report root element.
 */
import { createRoot } from 'react-dom/client';
import { App } from './app.js';

document.addEventListener('DOMContentLoaded', () => {
  createRoot(document.getElementById('root')!).render(<App />);
});
