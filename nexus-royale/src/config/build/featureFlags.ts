export function getFlag(name: string, defaultValue = false): boolean {
  if (typeof window === 'undefined') return defaultValue;
  const v = new URLSearchParams(window.location.search).get(name);
  if (v == null) return defaultValue;
  return v === '1' || v === 'true' || v === 'yes';
}

export function getString(name: string, defaultValue = ''): string {
  if (typeof window === 'undefined') return defaultValue;
  const v = new URLSearchParams(window.location.search).get(name);
  return v == null ? defaultValue : v;
}