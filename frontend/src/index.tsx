import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster 
        position="bottom-center"
        reverseOrder={false}
        containerStyle={{
          bottom: 120,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "'Poppins', sans-serif",
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '20px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
            border: '1.5px solid rgba(0,0,0,0.04)',
            padding: '12px 20px',
            maxWidth: '340px',
          },
          success: {
            duration: 3500,
            style: {
              background: '#ecfdf5',
              color: '#065f46',
              border: '1.5px solid #a7f3d0',
            },
          },
          error: {
            duration: 6500,
            style: {
              background: '#fef2f2',
              color: '#991b1b',
              border: '1.5px solid #fecaca',
            },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
