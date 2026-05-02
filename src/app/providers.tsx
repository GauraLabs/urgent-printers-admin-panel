'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from 'next-themes';
import { Toaster } from 'sonner';

function SonnerToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-right"
      richColors
      expand={false}
      duration={4000}
      theme={(theme as 'light' | 'dark' | 'system') ?? 'system'}
      toastOptions={{
        style: {
          fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
          fontSize: '0.8125rem',
          borderRadius: '0.5rem',
        },
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
        mutations: { retry: 0 },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {children}
        <SonnerToaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
