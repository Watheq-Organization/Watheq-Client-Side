import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { InventoryPosProvider } from './context/InventoryPosContext'

// Global fix: Prevent scroll wheel from changing <input type="number"> values
document.addEventListener('wheel', (e) => {
  const target = e.target as HTMLElement;
  if (
    document.activeElement === target &&
    target.tagName === 'INPUT' &&
    (target as HTMLInputElement).type === 'number'
  ) {
    target.blur();
  }
}, { passive: false });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <InventoryPosProvider>
            <App />
          </InventoryPosProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
