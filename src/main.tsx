// L'API simulée doit être installée avant tout import du frontend d'origine.
import './demo/install';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import '@fontsource-variable/inter';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontSize: '14px', maxWidth: '420px' } }} />
    </BrowserRouter>
  </React.StrictMode>
);
