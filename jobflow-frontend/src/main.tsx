import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './config/queryClient';
import App from './App';
import './index.css';

// Cleanup old dictionaryCache keys on first load
const cleanupOldCache = () => {
  const oldKeys = Object.keys(localStorage).filter(key => key.startsWith('hh_'));
  if (oldKeys.length > 0) {
    console.info(`[Cleanup] Removing ${oldKeys.length} old cache keys`);
    oldKeys.forEach(key => localStorage.removeItem(key));
  }
};

// Run cleanup once
cleanupOldCache();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
