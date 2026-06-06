import { parseJson } from './json';

/** Tenant-wide settings shape with sensible defaults. */
export interface TenantSettings {
  bookingRules: {
    maxDaysAhead: number; // how far in advance bookings are allowed
    leadTimeMinutes: number; // minimum notice before a slot
    slotIntervalMin: number; // 0 = auto (service duration + buffers)
    cancellationHours: number; // free-cancellation window (informational)
  };
  regional: {
    currency: string; // ISO code: EUR | USD | GBP ...
    locale: string; // e.g. nl-NL
    timezone: string; // e.g. Europe/Amsterdam
  };
  formFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox';
    required: boolean;
    options?: string[];
  }>;
  // Holiday / blackout periods when the business is closed (inclusive ranges).
  closures: Array<{ from: string; to: string; label?: string }>;
}

export const DEFAULT_SETTINGS: TenantSettings = {
  bookingRules: { maxDaysAhead: 60, leadTimeMinutes: 120, slotIntervalMin: 0, cancellationHours: 24 },
  regional: { currency: 'EUR', locale: 'nl-NL', timezone: 'Europe/Amsterdam' },
  formFields: [],
  closures: [],
};

/** True if the given YYYY-MM-DD date falls within any closure range. */
export function isClosedOn(date: string, closures: TenantSettings['closures']): boolean {
  return (closures || []).some((c) => c.from && c.to && date >= c.from && date <= c.to);
}

/** Parse stored settings and deep-merge onto defaults so missing keys are safe. */
export function resolveSettings(raw: string | null | undefined): TenantSettings {
  const s = parseJson<Partial<TenantSettings>>(raw, {});
  return {
    bookingRules: { ...DEFAULT_SETTINGS.bookingRules, ...(s.bookingRules || {}) },
    regional: { ...DEFAULT_SETTINGS.regional, ...(s.regional || {}) },
    formFields: Array.isArray(s.formFields) ? s.formFields : DEFAULT_SETTINGS.formFields,
    closures: Array.isArray(s.closures) ? s.closures : DEFAULT_SETTINGS.closures,
  };
}
