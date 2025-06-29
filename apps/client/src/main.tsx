import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AppRouter } from './router/AppRouter.tsx';
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
startReactDsfr({ defaultColorScheme: 'light' });

const queryClient = new QueryClient();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  </StrictMode>
);
