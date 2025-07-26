import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { HashRouter, Routes, Route } from "react-router-dom";

import './index.css'
import NotionProvider from './context/NotionProvider'
// import TagProvider from './context/TagProvider'
import TaskList from './tasklist'
import Settings from './settings'
import { Toaster } from "@/components/ui/sonner"

createRoot(document.getElementById('root')).render(
  // <StrictMode>

  <NotionProvider>
    {/* <TagProvider> */}
      <HashRouter>
        <Routes>
          <Route path="/main" element={<TaskList />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </HashRouter>
      <Toaster />
    {/* </TagProvider> */}
  </NotionProvider>
  // </StrictMode>,
)
