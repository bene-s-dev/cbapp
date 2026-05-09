import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // <--- MUSS HIER STEHEN
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
