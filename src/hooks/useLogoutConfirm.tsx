import { useState, type ReactNode } from 'react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

/**
 * Logout behind a confirmation. `requestLogout` only opens the dialog; the session is cleared (and the
 * existing route guards send the user to /login) solely when "Log Out" is pressed. Render `dialog` anywhere
 * in the component that owns the logout button.
 */
export function useLogoutConfirm(): { requestLogout: () => void; dialog: ReactNode } {
  const { signOut } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const dialog = open ? (
    <ConfirmDialog
      title="Confirm Logout"
      description="Are you sure you want to log out?"
      confirmLabel="Log Out"
      variant="primary"
      onClose={() => setOpen(false)}
      onConfirm={() => {
        setOpen(false);
        signOut(); // clears the token and cached data; ProtectedRoute then redirects to /login
        toast.push('You have been logged out', 'success');
      }}
    />
  ) : null;

  return { requestLogout: () => setOpen(true), dialog };
}
