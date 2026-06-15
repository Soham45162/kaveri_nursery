import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

// Global print event listeners to handle dark mode stripping and class mapping (fallback for Ctrl+P)
window.addEventListener('beforeprint', () => {
  // If preview modal is open, ensure the printing-bill class is active
  if (document.querySelector('.print-preview-modal') && !document.body.classList.contains('printing-bill')) {
    document.body.classList.add('printing-bill');
    window.autoAddedPrintClass = 'printing-bill';
  }
  
  window.wasDarkMode = document.documentElement.classList.contains('dark');
  if (window.wasDarkMode) {
    document.documentElement.classList.remove('dark');
  }
});

window.addEventListener('afterprint', () => {
  if (window.autoAddedPrintClass) {
    document.body.classList.remove(window.autoAddedPrintClass);
    window.autoAddedPrintClass = null;
  }
  if (window.wasDarkMode) {
    document.documentElement.classList.add('dark');
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
