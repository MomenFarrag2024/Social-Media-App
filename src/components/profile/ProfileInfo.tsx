import type { User } from '../../types';
import { calculateAge, formatDate } from '../../utils/format';

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

interface ProfileInfoProps {
  user: User;
  /** `self`: the signed-in user's own data. `public`: another user's data, as returned for that user. */
  audience?: 'self' | 'public';
  /** Public only: false when the user's full profile could not be loaded (nothing private is shown then). */
  available?: boolean;
}

/** Account details. A row appears only when the API supplied a usable value for this user. */
export function ProfileInfo({ user, audience = 'self', available = true }: ProfileInfoProps) {
  if (!available) {
    return (
      <section className="rounded-card border border-line bg-surface shadow-card p-4" aria-labelledby="profile-details-heading">
        <h2 id="profile-details-heading" className="mb-1 text-base font-semibold">
          Profile details
        </h2>
        <p className="text-sm text-muted">
          Email, gender, date of birth, and join date aren&apos;t available because this user&apos;s full profile
          couldn&apos;t be loaded.
        </p>
      </section>
    );
  }

  const age = calculateAge(user.dateOfBirth);
  const rows: Array<{ label: string; value: string | undefined }> = [
    { label: 'Name', value: user.name },
    { label: 'Username', value: user.username ? `@${user.username}` : undefined },
    { label: 'Age', value: age !== undefined ? `${age} ${age === 1 ? 'year' : 'years'}` : undefined },
    { label: 'Gender', value: user.gender ? capitalize(user.gender) : undefined },
    { label: 'Email', value: user.email },
    { label: 'Date of birth', value: formatDate(user.dateOfBirth, { utc: true }) },
    // Only a real creation timestamp from the API; never the current date.
    { label: 'Joined', value: formatDate(user.createdAt) },
  ];
  const visible = rows.filter((row): row is { label: string; value: string } => Boolean(row.value));
  const missingPrivate = [user.email, user.gender, user.dateOfBirth, user.createdAt].some((value) => !value);

  return (
    <section className="rounded-card border border-line bg-surface shadow-card p-4" aria-labelledby="profile-details-heading">
      <h2 id="profile-details-heading" className="mb-2 text-base font-semibold">
        Profile details
      </h2>
      <dl className="divide-y divide-line">
        {visible.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
            <dt className="shrink-0 text-muted">{row.label}</dt>
            <dd className="min-w-0 break-words text-right font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
      {user.bio && (
        <div className="mt-2 border-t border-line pt-3">
          <p className="text-sm text-muted">Bio</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm">{user.bio}</p>
        </div>
      )}
      {audience === 'public' && missingPrivate && (
        <p className="mt-3 text-xs text-muted">
          Some details aren&apos;t shown because the API doesn&apos;t provide them for other users.
        </p>
      )}
    </section>
  );
}
