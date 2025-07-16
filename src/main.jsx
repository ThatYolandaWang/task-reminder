import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { HashRouter, Routes, Route } from "react-router-dom";

import './index.css'
import App from './App.jsx'
import Settings from './settings.jsx'

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/main" element={<App />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  // </StrictMode>,
)
