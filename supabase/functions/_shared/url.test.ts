import { normalizeUrl, storeFromUrl } from './url.ts';

describe('url helpers', () => {
  it('normalizes', () => {
    expect(normalizeUrl(' worten.pt/p/123 ')).toBe('https://worten.pt/p/123');
    expect(normalizeUrl('https://www.fnac.pt/a')).toBe('https://www.fnac.pt/a');
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('file:///etc/passwd')).toBeNull();
    expect(normalizeUrl('')).toBeNull();
  });
  it('store name', () => {
    expect(storeFromUrl('https://www.worten.pt/p/1')).toBe('worten.pt');
  });
});
