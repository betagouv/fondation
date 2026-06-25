import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function StoryQueryClient(props: { children: ReactNode; seed?: (client: QueryClient) => void }) {
  const [client] = useState(() => {
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    props.seed?.(client);
    return client;
  });

  return <QueryClientProvider client={client}>{props.children}</QueryClientProvider>;
}
