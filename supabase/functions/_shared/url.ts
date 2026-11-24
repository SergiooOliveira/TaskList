// Pure helpers shared by the edge function and the browser client.
export function normalizeUrl(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  // Prepend https:// only when there is no scheme (a bare host[:port] counts as no scheme).
  const withScheme = /^[a-z][a-z0-9+.-]*:(?!\d)/i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === 'http:' || u.protocol === 'https:' ? withScheme : null;
  } catch {
    return null;
  }
}

export function storeFromUrl(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '');
}
