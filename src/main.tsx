import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './presentation/App.tsx';
import { ApplicationServices } from './di/container';
import { ApplicationProvider } from './presentation/providers/ApplicationProvider';

const applicationServices = new ApplicationServices();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApplicationProvider services={applicationServices}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApplicationProvider>
  </StrictMode>,
);
