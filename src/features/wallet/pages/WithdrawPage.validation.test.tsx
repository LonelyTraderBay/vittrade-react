import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { WithdrawPage } from './WithdrawPage';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

const server = setupServer();
const assets = {
  items: [
    {
      id: 'usdt',
      symbol: 'USDT',
      name: 'Tether',
      balance: 100,
      available: 75,
      frozen: 25,
      inOrder: 25,
      usdValue: 100,
      change24h: 0,
      logoColor: '#26A17B',
    },
  ],
  summary: { totalUsd: 100, totalBtc: 0.001, availableUsd: 75, inOrderUsd: 25, frozenUsd: 0 },
};
const networks = [
  { id: 'ethereum', name: 'Ethereum', fee: 0.5, minWithdraw: 5, maxWithdraw: 50 },
  {
    id: 'tag-network',
    name: 'Tag Network',
    fee: 0.25,
    minWithdraw: 5,
    maxWithdraw: 50,
    requiresMemo: true,
  },
];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function installReadHandlers() {
  server.use(
    http.get('*/wallet/assets', () => HttpResponse.json(assets)),
    http.get('*/wallet/withdrawal/networks', () => HttpResponse.json({ networks })),
  );
}

function continueButton() {
  const button = screen
    .getAllByRole('button')
    .find((candidate) => candidate.textContent?.includes('→'));
  if (!button) throw new Error('Withdrawal continue button was not rendered');
  return button;
}

function renderPage() {
  renderWithProviders(<WithdrawPage />, {
    routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
  });
}

describe('WithdrawPage validation accessibility', () => {
  it('associates errors with fields and clears only the corrected field', async () => {
    installReadHandlers();
    renderPage();
    await screen.findByRole('combobox');
    await userEvent.click(continueButton());

    const address = screen.getByLabelText('Địa chỉ ví nhận');
    const amount = screen.getByLabelText('Số lượng rút');
    expect(address).toBeRequired();
    expect(amount).toBeRequired();
    expect(address).toHaveFocus();
    expect(address).toHaveAttribute('aria-invalid', 'true');
    expect(address).toHaveAttribute('aria-describedby', 'withdraw-address-error');
    expect(screen.getByText('Địa chỉ ví không hợp lệ.')).toHaveAttribute(
      'id',
      'withdraw-address-error',
    );
    expect(amount).toHaveAttribute('aria-describedby', 'withdraw-amount-error');

    await userEvent.type(address, 'wallet-address-long-enough-for-validation-123456');
    expect(screen.queryByText('Địa chỉ ví không hợp lệ.')).not.toBeInTheDocument();
    expect(address).toHaveAttribute('aria-invalid', 'false');
    expect(address).not.toHaveAttribute('aria-describedby');
    expect(screen.getByText('Nhập số tiền cần rút.')).toBeVisible();
    expect(address).toHaveFocus();
    await userEvent.click(continueButton());
    expect(amount).toHaveFocus();
  });

  it('clears dependent network and minimum-amount errors on network change or correction', async () => {
    installReadHandlers();
    renderPage();
    const network = await screen.findByRole('combobox');
    await userEvent.type(
      screen.getByLabelText('Địa chỉ ví nhận'),
      'wallet-address-long-enough-for-validation-123456',
    );
    await userEvent.type(screen.getByLabelText('Số lượng rút'), '4');
    await userEvent.selectOptions(network, 'tag-network');
    await userEvent.click(continueButton());

    expect(await screen.findByText('Memo là bắt buộc cho mạng này.')).toBeVisible();
    expect(screen.getByLabelText('Memo')).toBeRequired();
    expect(screen.getByLabelText('Memo')).toHaveFocus();
    expect(screen.getByLabelText('Memo')).toHaveAttribute(
      'aria-describedby',
      'withdraw-memo-error',
    );
    expect(screen.getByText('Memo là bắt buộc cho mạng này.')).toHaveAttribute(
      'id',
      'withdraw-memo-error',
    );
    expect(screen.getByLabelText('Số lượng rút')).toHaveAttribute(
      'aria-describedby',
      'withdraw-amount-error',
    );
    expect(screen.getByText('Tối thiểu 5 USDT.')).toHaveAttribute('id', 'withdraw-amount-error');
    await userEvent.selectOptions(network, 'ethereum');
    expect(screen.queryByText('Tối thiểu 5 USDT.')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Memo')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Số lượng rút')).not.toHaveAttribute('aria-describedby');

    await userEvent.selectOptions(network, 'tag-network');
    await userEvent.click(continueButton());
    await userEvent.type(screen.getByLabelText('Memo'), 'tag-123');
    expect(screen.getByLabelText('Memo')).toHaveFocus();
    expect(screen.queryByText('Memo là bắt buộc cho mạng này.')).not.toBeInTheDocument();
    expect(screen.getByText('Tối thiểu 5 USDT.')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Tất cả' }));
    expect(screen.getByLabelText('Số lượng rút')).toHaveValue(50);
    expect(screen.queryByText('Tối thiểu 5 USDT.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Số lượng rút')).not.toHaveAttribute('aria-describedby');
  });
});
