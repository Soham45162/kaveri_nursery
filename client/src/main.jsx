import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

// Global print event listeners to handle dark mode stripping and class mapping
window.addEventListener('beforeprint', () => {
  const printType = window.currentPrintType;
  if (printType) {
    document.body.classList.add(printType);
  }
  window.wasDarkMode = document.documentElement.classList.contains('dark');
  if (window.wasDarkMode) {
    document.documentElement.classList.remove('dark');
  }
});

window.addEventListener('afterprint', () => {
  const printType = window.currentPrintType;
  if (printType) {
    document.body.classList.remove(printType);
  }
  if (window.wasDarkMode) {
    document.documentElement.classList.add('dark');
  }
  window.currentPrintType = null;
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
