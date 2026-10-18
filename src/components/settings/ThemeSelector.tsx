import type { IconType } from 'react-icons';
import { FiMonitor, FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../../hooks/useTheme';
import type { ThemePreference } from '../../context/ThemeContext';

const OPTIONS: ReadonlyArray<{ value: ThemePreference; label: string; icon: IconType; hint: string }> = [
  { value: 'light', label: 'Light', icon: FiSun, hint: 'Always use the light theme' },
  { value: 'dark', label: 'Dark', icon: FiMoon, hint: 'Always use the dark theme' },
  { value: 'system', label: 'System', icon: FiMonitor, hint: 'Match your device setting' },
];

/** Light / Dark / System. The choice is saved on this device and applies to the whole app. */
export function ThemeSelector() {
  const { preference, resolved, setPreference } = useTheme();

  return (
    <div>
      <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
        {OPTIONS.map(({ value, label, icon: Icon, hint }) => {
          const selected = preference === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPreference(value)}
              className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition ${
                selected ? 'border-brand-from bg-brand-soft ring-2 ring-brand-from/30' : 'border-line hover:bg-soft'
              }`}
            >
              <Icon className={`h-5 w-5 ${selected ? 'text-brand-from' : 'text-muted'}`} aria-hidden />
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-xs text-muted">{hint}</span>
            </button>
          );
        })}
      </div>
      <p role="status" className="mt-3 text-xs text-muted">
        {preference === 'system' ? `Following your device: currently ${resolved}.` : `Using the ${resolved} theme.`}
      </p>
    </div>
  );
}
