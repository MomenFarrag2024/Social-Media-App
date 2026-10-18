import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullScreenSpinner } from '../components/common/Spinner';
import { SessionError } from '../components/common/SessionError';
import { useAuth } from '../hooks/useAuth';
import { isRecord } from '../utils/normalize';

export function PublicRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullScreenSpinner />;
  if (status === 'error') return <SessionError />;
  if (status === 'authenticated') {
    const state: unknown = location.state;
    const from = isRecord(state) && typeof state.from === 'string' && state.from.startsWith('/') ? state.from : '/';
    return <Navigate to={from} replace />;
  }
  return <Outlet />;
}
