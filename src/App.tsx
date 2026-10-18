import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { ApiError } from './api/errors';
import { NetworkGate } from './components/layout/NetworkGate';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AppRouter } from './routes/AppRouter';

// Query only learns about connectivity from window online/offline events, so seed the starting state.
if (typeof navigator !== 'undefined' && !navigator.onLine) onlineManager.setOnline(false);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      // Client errors (4xx) will not succeed on retry; network/5xx errors get two retries.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status !== undefined && error.status < 500) && failureCount < 2,
    },
    // `always`: a mutation attempted while offline fails immediately (and is reported) instead of being
    // queued and silently replayed later, so the UI never implies an offline action succeeded.
    mutations: { retry: false, networkMode: 'always' },
  },
});

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ToastProvider>
              <AuthProvider>
                <NetworkGate>
                  <AppRouter />
                </NetworkGate>
              </AuthProvider>
            </ToastProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
