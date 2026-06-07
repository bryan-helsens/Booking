/**
 * JSON (de)serialization helpers.
 * SQLite (via Prisma) has no native Json type, so JSON blobs are stored as
 * strings. These helpers keep that detail at the persistence boundary — the
 * rest of the app and the API work with plain objects. On PostgreSQL the
 * columns become real `Json` and these helpers become no-ops.
 */
export function parseJson<T = any>(value: string | null | undefined, fallback: T): T {
  if (value == null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}
