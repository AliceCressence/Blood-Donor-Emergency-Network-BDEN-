// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider }         from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { Toaster }              from 'react-hot-toast'
import ErrorBoundary            from './components/shared/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                borderRadius: '12px',
                border: '1px solid #E8E7E1',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              },
              success: {
                iconTheme: { primary: '#0D9488', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#E51111', secondary: '#fff' },
              },
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)