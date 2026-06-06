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
}

export const DEFAULT_SETTINGS: TenantSettings = {
  bookingRules: { maxDaysAhead: 60, leadTimeMinutes: 120, slotIntervalMin: 0, cancellationHours: 24 },
  regional: { currency: 'EUR', locale: 'nl-NL', timezone: 'Europe/Amsterdam' },
  formFields: [],
};

/** Parse stored settings and deep-merge onto defaults so missing keys are safe. */
export function resolveSettings(raw: string | null | undefined): TenantSettings {
  const s = parseJson<Partial<TenantSettings>>(raw, {});
  return {
    bookingRules: { ...DEFAULT_SETTINGS.bookingRules, ...(s.bookingRules || {}) },
    regional: { ...DEFAULT_SETTINGS.regional, ...(s.regional || {}) },
    formFields: Array.isArray(s.formFields) ? s.formFields : DEFAULT_SETTINGS.formFields,
  };
}
