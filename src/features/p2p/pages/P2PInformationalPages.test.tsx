import type { ComponentType } from 'react';
import { useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { P2PFraudPreventionPage } from './P2PFraudPreventionPage';
import { P2PGuidePage } from './P2PGuidePage';

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{`${location.pathname}${location.search}`}</output>;
}

function renderPage(Page: ComponentType, path: string) {
  return renderWithProviders(
    <>
      <Page />
      <CurrentPath />
    </>,
    { routerProps: { initialEntries: [path] } },
  );
}

describe('P2P informational pages', () => {
  it('expands fraud guidance and updates the safety checklist', async () => {
    const user = userEvent.setup();
    renderPage(P2PFraudPreventionPage, '/p2p/fraud-prevention');

    expect(screen.getByText('Phòng chống gian lận', { exact: true })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Bằng chứng thanh toán giả/ }));
    expect(screen.getByText('CÁCH THỨC HOẠT ĐỘNG')).toBeInTheDocument();
    expect(
      screen.getByText('Chờ tiền "có" trong tài khoản, không chỉ nhìn SMS/screenshot'),
    ).toBeInTheDocument();

    const initialProgress = screen.getByText('6/10 biện pháp bảo vệ đã áp dụng');
    expect(initialProgress).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Anti-Phishing Code đã thiết lập/ }));
    expect(screen.getByText('7/10 biện pháp bảo vệ đã áp dụng')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Trong giao dịch/ }));
    expect(screen.getByText('Kiểm tra tên người chuyển')).toBeInTheDocument();
  });

  it('switches guide modes and displays safety and video content', async () => {
    const user = userEvent.setup();
    renderPage(P2PGuidePage, '/p2p/guide');

    expect(screen.getByText('Hướng dẫn P2P', { exact: true })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Hướng dẫn' }));
    expect(screen.getByText('Tìm quảng cáo')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bán Crypto' }));
    expect(screen.getByText('Đăng quảng cáo')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'An toàn' }));
    expect(screen.getByText('An toàn giao dịch')).toBeInTheDocument();
    expect(screen.getByText('Chỉ giao dịch trên nền tảng')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Video' }));
    expect(screen.getByText('Video hướng dẫn')).toBeInTheDocument();
    expect(screen.getByText('Bắt đầu giao dịch P2P')).toBeInTheDocument();
  });
});
