import { getErrorMessage } from '../../api/errors';
import { useAuth } from '../../hooks/useAuth';
import { useLogoutConfirm } from '../../hooks/useLogoutConfirm';
import { ErrorState } from './States';
import { Button } from './Button';

/** Shown when a stored token exists but the profile could not be loaded for a reason other than 401. */
export function SessionError() {
  const { profileError, retryProfile } = useAuth();
  const { requestLogout, dialog } = useLogoutConfirm();
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 px-4">
      <ErrorState
        title="Couldn't restore your session"
        message={getErrorMessage(profileError, 'The server could not be reached.')}
        onRetry={retryProfile}
      />
      <Button variant="ghost" onClick={requestLogout}>
        Sign out
      </Button>
      {dialog}
    </div>
  );
}
