import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullScreenSpinner } from '../components/common/Spinner';
import { SessionError } from '../components/common/SessionError';
import { useAuth } from '../hooks/useAuth';

/** Waits for the session check before deciding, so refreshes never flash the login page or loop. */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullScreenSpinner label="Restoring your session…" />;
  if (status === 'error') return <SessionError />;
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <Outlet />;
}
