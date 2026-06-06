import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { HabitProvider } from './context/HabitContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <HabitProvider>
        <App />
      </HabitProvider>
    </BrowserRouter>
  </StrictMode>,
)
