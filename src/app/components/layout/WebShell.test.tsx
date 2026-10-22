import { lazy } from 'react';
import { act, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { UIContext } from '../../contexts/ui-context';
import { WebShell } from './WebShell';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { StickyFooter } from '@/shared/ui/layout/PageLayout';
import { PreviewChromeContext } from '@/shared/ui/layout/preview-chrome-context';

const initialWidth = window.innerWidth;

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: initialWidth });
});

describe('WebShell loading and connectivity', () => {
  it('reserves a preview host on the separate Web auth branch without replacing its form', () => {
    const hosts: (HTMLElement | null)[] = [];
    const register = (host: HTMLElement | null) => hosts.push(host);
    renderWithProviders(
      <PreviewChromeContext.Provider value={register}>
        <Routes>
          <Route path="/w" element={<WebShell />}>
            <Route
              path="auth/login"
              element={<input aria-label="Web auth draft" defaultValue="draft" />}
            />
          </Route>
        </Routes>
      </PreviewChromeContext.Provider>,
      { routerProps: { initialEntries: ['/w/auth/login'] } },
    );
    const host = document.querySelector('[data-preview-chrome-host]');
    expect(hosts).toContain(host);
    expect(host?.nextElementSibling).toContainElement(screen.getByLabelText('Web auth draft'));
    expect(host?.nextElementSibling).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto');
    expect(screen.getByLabelText('Web auth draft')).toHaveValue('draft');
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
  });

  it.each([
    { width: 1280, outerPadding: '0px 32px' },
    { width: 390, outerPadding: '0px 16px' },
  ])(
    'owns the page gutter at $width px and aligns header, content, and footer',
    ({ width, outerPadding }) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });

      renderWithProviders(
        <Routes>
          <Route path="/w" element={<WebShell />}>
            <Route
              path="home"
              element={
                <>
                  <Header title="Gutter contract" />
                  <PageContent className="web-gutter-probe">
                    <p>Web page content</p>
                  </PageContent>
                  <StickyFooter>
                    <button type="button">Web action</button>
                  </StickyFooter>
                </>
              }
            />
          </Route>
        </Routes>,
        { routerProps: { initialEntries: ['/w/home'] } },
      );

      const pageContent = screen.getByText('Web page content').parentElement;
      const shellContent = pageContent?.parentElement;
      const header = screen.getByRole('heading', { name: 'Gutter contract' }).parentElement
        ?.parentElement;
      const footer = screen.getByRole('button', { name: 'Web action' }).parentElement;

      expect(shellContent?.style.padding).toBe(outerPadding);
      expect(shellContent?.style.getPropertyValue('--tr-page-inline-gutter')).toBe('0px');
      expect(pageContent?.style.paddingInline).toBe('var(--tr-page-inline-gutter, 20px)');
      expect(header?.style.paddingInline).toBe('var(--tr-page-inline-gutter, 20px)');
      expect(footer?.style.paddingInline).toBe('var(--tr-page-inline-gutter, 20px)');
    },
  );

  it('keeps shell navigation and offline feedback visible while a child route loads', async () => {
    let finish!: (module: { default: () => React.JSX.Element }) => void;
    const Page = lazy(
      () =>
        new Promise<{ default: () => React.JSX.Element }>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithProviders(
      <UIContext.Provider
        value={{
          isBalanceHidden: false,
          isOffline: true,
          pendingRewards: 0,
          notifications: 0,
          toggleBalanceHidden: () => {},
          setIsOffline: () => {},
          setPendingRewards: () => {},
        }}
      >
        <Routes>
          <Route path="/w" element={<WebShell />}>
            <Route path="home" element={<Page />} />
          </Route>
        </Routes>
      </UIContext.Provider>,
      { routerProps: { initialEntries: ['/w/home'] } },
    );
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    expect(
      screen.getByText('Mất kết nối mạng — Đang hiển thị dữ liệu lưu trữ'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ví' })).toBeInTheDocument();
    await act(async () => finish({ default: () => <p>Loaded page</p> }));
    expect(await screen.findByText('Loaded page')).toBeInTheDocument();
    expect(screen.queryByText('Đang tải...')).not.toBeInTheDocument();
    expect(
      screen.getByText('Mất kết nối mạng — Đang hiển thị dữ liệu lưu trữ'),
    ).toBeInTheDocument();
  });

  it('uses a phone navigation layout when a Web-only route remains open at a narrow width', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });

    renderWithProviders(
      <Routes>
        <Route path="/w" element={<WebShell />}>
          <Route path="address-book" element={<p>Address book</p>} />
        </Route>
      </Routes>,
      { routerProps: { initialEntries: ['/w/address-book'] } },
    );

    expect(screen.getByText('Address book')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.queryByText('TÀI SẢN')).not.toBeInTheDocument();
  });

  it('reserves space below full-bleed Web content for narrow-screen navigation', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });

    renderWithProviders(
      <Routes>
        <Route path="/w" element={<WebShell />}>
          <Route
            path="trade/analytics"
            element={
              <PageContent className="web-full-bleed-probe">
                <p>Full-bleed analytics</p>
              </PageContent>
            }
          />
        </Route>
      </Routes>,
      { routerProps: { initialEntries: ['/w/trade/analytics'] } },
    );

    const pageContent = screen.getByText('Full-bleed analytics').parentElement;

    expect(pageContent?.parentElement).toHaveClass('pb-24');
    expect(pageContent?.parentElement?.style.getPropertyValue('--tr-page-inline-gutter')).toBe('');
    expect(pageContent?.style.paddingInline).toBe('var(--tr-page-inline-gutter, 20px)');
  });
});
