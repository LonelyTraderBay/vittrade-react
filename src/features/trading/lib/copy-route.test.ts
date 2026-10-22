import { describe, expect, it } from 'vitest';
import { copyActivePath, copyHubPath, copyProviderFlowPath, copyProviderPath } from './copy-route';

describe('copy trading route family', () => {
  it.each([
    [
      '/w/trade/copy/provider/provider-1',
      '/w',
      '/w/trade/copy',
      '/w/trade/copy/provider/provider-1',
      '/w/trade/copy/active',
    ],
    [
      '/t/trade/copy-trading',
      '/t',
      '/t/trade/copy-trading',
      '/t/trade/copy-provider/provider-1',
      '/t/trade/copy-trading/active',
    ],
    [
      '/trade/copy-provider/provider-1',
      '',
      '/trade/copy-trading',
      '/trade/copy-provider/provider-1',
      '/trade/copy-trading/active',
    ],
  ])('preserves the existing family from %s', (pathname, prefix, hub, provider, active) => {
    expect(copyHubPath(pathname, prefix)).toBe(hub);
    expect(copyProviderPath(pathname, prefix, 'provider-1')).toBe(provider);
    expect(copyActivePath(pathname, prefix)).toBe(active);
    expect(copyProviderFlowPath(pathname, prefix, 'provider-1', 'configuration')).toBe(
      `${provider}/configuration`,
    );
  });

  it.each(['/w/trade/copy', '/trade/copy-trading'])(
    'keeps a provider identifier in one URL segment for %s',
    (pathname) => {
      const prefix = pathname.startsWith('/w/') ? '/w' : '';
      const id = 'provider/a?b#c%';
      const route = copyProviderFlowPath(pathname, prefix, id, 'confirmation');
      const url = new URL(route, 'https://frontend.test');
      expect(url.search).toBe('');
      expect(url.hash).toBe('');
      expect(url.pathname.split('/').at(-1)).toBe('confirmation');
      expect(decodeURIComponent(url.pathname.split('/').at(-2)!)).toBe(id);
    },
  );
});
