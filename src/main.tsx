import { StrictMode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { orderQueryClient } from './infrastructure/query/order-query-cache';
import { BrowserRouter } from 'react-router';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './presentation/App.tsx';
import { ApplicationServices } from './di/container';
import { ApplicationProvider } from './presentation/providers/ApplicationProvider';

const applicationServices = new ApplicationServices();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={orderQueryClient}>
    <ApplicationProvider services={applicationServices}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApplicationProvider>
    </QueryClientProvider>
  </StrictMode>,
);
