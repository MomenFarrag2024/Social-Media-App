import { PageTitle } from '../../components/common/PageTitle';
import { ChangePasswordForm } from '../../components/profile/ChangePasswordForm';
import { CoverPhotoSection } from '../../components/profile/CoverPhotoSection';
import { ProfilePhotoUploader } from '../../components/profile/ProfilePhotoUploader';
import { SettingsSection } from '../../components/settings/SettingsSection';
import { ThemeSelector } from '../../components/settings/ThemeSelector';
import { useAuth } from '../../hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();
  if (!user) return null; // guarded by ProtectedRoute

  return (
    <div className="space-y-4">
      <PageTitle title="Settings" />
      <h1 className="text-xl font-bold">Settings</h1>

      <SettingsSection id="theme" title="Theme" description="Choose how Social Media App looks on this device.">
        <ThemeSelector />
      </SettingsSection>

      <SettingsSection id="photo" title="Profile photo" description="Shown on your posts, comments and profile.">
        <ProfilePhotoUploader user={user} />
      </SettingsSection>

      <SettingsSection id="cover" title="Cover photo" description="The banner at the top of your profile.">
        <CoverPhotoSection user={user} />
      </SettingsSection>

      <SettingsSection id="password" title="Change password" description="You'll stay signed in on this device.">
        <ChangePasswordForm />
      </SettingsSection>
    </div>
  );
}
