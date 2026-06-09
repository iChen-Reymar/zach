import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initDatabase } from './services/localDatabase'

// Remove legacy service worker that did not cache app bundles (caused offline reloads)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      if (registration.active?.scriptURL.includes('service-worker.js')) {
        registration.unregister()
      }
    })
  })
}

initDatabase()
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  })
  .catch((error) => {
    console.error('Failed to initialize local database:', error)
    document.getElementById('root').innerHTML =
      '<div style="padding:2rem;font-family:sans-serif;text-align:center">' +
      '<h2>Unable to start Inventory.co</h2>' +
      '<p>Local database could not be initialized. Please refresh or clear site data.</p>' +
      '</div>'
  })
