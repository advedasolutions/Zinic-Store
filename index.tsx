
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { notificationService } from './services/notificationService';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Initialize notification listeners and permissions
notificationService;

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
