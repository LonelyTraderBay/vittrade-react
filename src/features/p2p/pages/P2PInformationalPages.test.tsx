import type { ComponentType } from 'react';
import { useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';
import { P2PFraudPreventionPage } from './P2PFraudPreventionPage';
import { P2PGuidePage } from './P2PGuidePage';

afterEach(() => vi.restoreAllMocks());

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
    await user.click(screen.getByRole('button', { name: /Bằng chứng thanh toán giả/ }));
    expect(screen.queryByText('CÁCH THỨC HOẠT ĐỘNG')).not.toBeInTheDocument();

    const initialProgress = screen.getByText('6/10 biện pháp bảo vệ đã áp dụng');
    expect(initialProgress).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Anti-Phishing Code đã thiết lập/ }));
    expect(screen.getByText('7/10 biện pháp bảo vệ đã áp dụng')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Trong giao dịch/ }));
    expect(screen.getByText('Kiểm tra tên người chuyển')).toBeInTheDocument();
  });

  it('covers low, medium, high and complete safety checklist scores across all categories', async () => {
    const user = userEvent.setup();
    renderPage(P2PFraudPreventionPage, '/p2p/fraud-prevention');

    // Limit accessible-name queries to the real checklist card, not unrelated scam guidance.
    const card = screen.getByText('Checklist an toàn').closest('[data-slot="tr-card"]');
    expect(card).not.toBeNull();
    const checklist = within(card as HTMLElement);

    expect(screen.getByText('6/10 biện pháp bảo vệ đã áp dụng')).toBeInTheDocument();
    await user.click(checklist.getByRole('button', { name: /2FA đã bật/ }));
    expect(screen.getByText('5/10 biện pháp bảo vệ đã áp dụng')).toBeInTheDocument();
    await user.click(checklist.getByRole('button', { name: /Kiểm tra rating đối tác/ }));
    expect(screen.getByText('4/10 biện pháp bảo vệ đã áp dụng')).toBeInTheDocument();

    await user.click(checklist.getByRole('button', { name: /2FA đã bật/ }));
    await user.click(checklist.getByRole('button', { name: /Kiểm tra rating đối tác/ }));
    await user.click(checklist.getByRole('button', { name: /Anti-Phishing Code đã thiết lập/ }));
    await user.click(checklist.getByRole('button', { name: /Trong giao dịch/ }));
    expect(screen.getByText('2/4')).toBeInTheDocument();
    await user.click(checklist.getByRole('button', { name: /Kiểm tra tên người chuyển/ }));
    expect(screen.getByText('8/10 biện pháp bảo vệ đã áp dụng')).toBeInTheDocument();
    expect(
      screen.queryByText('Hoàn thành checklist bên dưới để tăng chỉ số an toàn'),
    ).toBeInTheDocument();

    await user.click(checklist.getByRole('button', { name: /Lưu bằng chứng giao dịch/ }));
    await user.click(checklist.getByRole('button', { name: /Sau giao dịch/ }));
    expect(screen.getByText('1/2')).toBeInTheDocument();
    await user.click(checklist.getByRole('button', { name: /Biết cách gửi claim bảo hiểm/ }));
    expect(screen.getByText('10/10 biện pháp bảo vệ đã áp dụng')).toBeInTheDocument();
    expect(
      screen.queryByText('Hoàn thành checklist bên dưới để tăng chỉ số an toàn'),
    ).not.toBeInTheDocument();

    await user.click(checklist.getByRole('button', { name: /Trước giao dịch/ }));
    expect(screen.getByText('Kiểm tra rating đối tác')).toBeInTheDocument();
  });

  it('navigates to emergency destinations and reports a suspicious merchant', async () => {
    const user = userEvent.setup();
    const toastInfo = vi.spyOn(toast, 'info');
    renderPage(P2PFraudPreventionPage, '/p2p/fraud-prevention');

    await user.click(screen.getByRole('button', { name: /Gửi yêu cầu bồi thường bảo hiểm/ }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/p2p/insurance-fund');

    await user.click(screen.getByRole('button', { name: /Liên hệ hỗ trợ khẩn cấp/ }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/support');

    await user.click(screen.getByRole('button', { name: /Report merchant gian lận/ }));
    expect(toastInfo).toHaveBeenCalledWith('Đang mở form report');
  });

  it('switches guide modes and displays safety and video content', async () => {
    const user = userEvent.setup();
    renderPage(P2PGuidePage, '/p2p/guide');

    expect(screen.getByText('Hướng dẫn P2P', { exact: true })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Hướng dẫn' }));
    expect(screen.getByText('Tìm quảng cáo')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bán Crypto' }));
    expect(screen.getByText('Đăng quảng cáo')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mua Crypto' }));
    expect(screen.getByText('Tìm quảng cáo')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mua crypto ngay' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/p2p');

    await user.click(screen.getByRole('tab', { name: 'An toàn' }));
    expect(screen.getByText('An toàn giao dịch')).toBeInTheDocument();
    expect(screen.getByText('Chỉ giao dịch trên nền tảng')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Liên hệ hỗ trợ khẩn cấp' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/support/help');

    await user.click(screen.getByRole('tab', { name: 'Video' }));
    expect(screen.getByText('Video hướng dẫn')).toBeInTheDocument();
    expect(screen.getByText('Bắt đầu giao dịch P2P')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Bắt đầu giao dịch P2P/ }));
  });

  it('opens and closes FAQ answers on their matching question', async () => {
    const user = userEvent.setup();
    renderPage(P2PGuidePage, '/p2p/guide');

    const firstAnswer = screen.getByText(/VitTrade cung cấp hệ thống Escrow để bảo vệ cả hai bên/);
    const firstAccordion = firstAnswer.parentElement?.parentElement?.parentElement;
    expect(firstAccordion).toHaveStyle({ gridTemplateRows: '1fr', opacity: '1' });
    await user.click(screen.getByRole('button', { name: 'P2P Trading là gì?' }));
    expect(firstAccordion).toHaveStyle({ gridTemplateRows: '0fr', opacity: '0' });

    await user.click(screen.getByRole('button', { name: 'Phí giao dịch P2P là bao nhiêu?' }));
    const secondAnswer = screen.getByText(/Người đặt đơn \(Taker\) chịu phí 0.1%/);
    expect(secondAnswer.parentElement?.parentElement?.parentElement).toHaveStyle({
      gridTemplateRows: '1fr',
      opacity: '1',
    });
  });
});
