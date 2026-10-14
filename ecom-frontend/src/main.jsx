import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from "react-router-dom";
import './index.css'
import router from './router.jsx';
import { bootstrapDemoData } from './services/demoDataBootstrap';

import { AppProvider } from './context/AppContext';
import { languageCode } from './i18n/index';
import { readLanguage } from './i18n/preferences';

document.documentElement.lang = languageCode(readLanguage(localStorage));

bootstrapDemoData();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  </StrictMode>,
)
