import type { ComponentProps } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PAdCreateRequest } from '../model/p2p-types';
import { P2PCreateAdConfirmation, P2PCreateAdForm } from './P2PCreateAdSections';

type FormProps = ComponentProps<typeof P2PCreateAdForm>;

const colors = {
  primary: '#0000ff',
  sell: '#ff0000',
  surface: '#ffffff',
  surface2: '#eeeeee',
  text1: '#111111',
  text2: '#222222',
  text3: '#333333',
};

function makeFormProps(overrides: Partial<FormProps> = {}): FormProps {
  return {
    colors,
    adType: 'buy',
    asset: 'USDT',
    currency: 'VND',
    priceType: 'fixed',
    price: '25000',
    priceMargin: '',
    available: '1000',
    minLimit: '100000',
    maxLimit: '10000000',
    paymentMethods: ['Vietcombank'],
    paymentWindow: '15',
    tradingHours: '24/7',
    minKycLevel: '1',
    minCompletedTrades: '10',
    minRegisteredDays: '30',
    remarks: 'Nội dung điều kiện',
    autoReply: 'Tin nhắn tự động',
    validationMessage: null,
    errorMessage: null,
    canWriteAds: true,
    canSubmit: true,
    submitPending: false,
    onSubmit: vi.fn(),
    onOpenConfirmation: vi.fn(),
    onAdTypeChange: vi.fn(),
    onAssetChange: vi.fn(),
    onCurrencyChange: vi.fn(),
    onPriceTypeChange: vi.fn(),
    onPriceChange: vi.fn(),
    onPriceMarginChange: vi.fn(),
    onAvailableChange: vi.fn(),
    onMinLimitChange: vi.fn(),
    onMaxLimitChange: vi.fn(),
    onPaymentToggle: vi.fn(),
    onPaymentWindowChange: vi.fn(),
    onTradingHoursChange: vi.fn(),
    onMinKycLevelChange: vi.fn(),
    onMinCompletedTradesChange: vi.fn(),
    onMinRegisteredDaysChange: vi.fn(),
    onRemarksChange: vi.fn(),
    onAutoReplyChange: vi.fn(),
    ...overrides,
  };
}

const request: P2PAdCreateRequest = {
  type: 'sell',
  asset: 'BTC',
  currency: 'VND',
  priceType: 'fixed',
  price: 12_345.678,
  available: 2,
  minLimit: 100_000,
  maxLimit: 10_000_000,
  paymentMethods: ['Vietcombank'],
};

describe('P2PCreateAdForm', () => {
  it('forwards form, type, price, asset, payment, and partner-field changes', () => {
    const props = makeFormProps();
    const { container, rerender } = renderWithProviders(<P2PCreateAdForm {...props} />);
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    fireEvent(container.querySelector('form')!, submitEvent);
    expect(submitEvent.defaultPrevented).toBe(true);
    expect(props.onSubmit).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Tôi muốn MUA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tôi muốn BÁN' }));
    fireEvent.click(screen.getByRole('button', { name: 'Giá cố định' }));
    fireEvent.click(screen.getByRole('button', { name: 'Giá thả nổi' }));
    expect(props.onAdTypeChange).toHaveBeenCalledWith('buy');
    expect(props.onAdTypeChange).toHaveBeenCalledWith('sell');
    expect(props.onPriceTypeChange).toHaveBeenCalledWith('fixed');
    expect(props.onPriceTypeChange).toHaveBeenCalledWith('floating');
    rerender(<P2PCreateAdForm {...props} priceType="floating" />);
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Biên độ giá (%)' }), {
      target: { value: '2.5' },
    });
    expect(props.onPriceMarginChange).toHaveBeenCalledWith('2.5');

    fireEvent.change(screen.getByLabelText('Tài sản'), { target: { value: 'BTC' } });
    fireEvent.change(screen.getByLabelText('Tiền tệ'), { target: { value: 'USD' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Giá (VND/USDT)' }), {
      target: { value: '26000' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Tổng USDT' }), {
      target: { value: '2000' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Tối thiểu (VND)' }), {
      target: { value: '200000' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Tối đa (VND)' }), {
      target: { value: '20000000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Momo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Vietcombank' }));
    fireEvent.change(screen.getByLabelText('Thời gian thanh toán'), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByLabelText('Giờ giao dịch'), {
      target: { value: '08:00 - 17:00' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'KYC tối thiểu' }), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Số đơn tối thiểu' }), {
      target: { value: '20' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Số ngày tối thiểu' }), {
      target: { value: '60' },
    });
    fireEvent.change(screen.getByLabelText('Điều kiện giao dịch'), {
      target: { value: 'Chỉ giao dịch ban ngày' },
    });
    fireEvent.change(screen.getByLabelText('Tin nhắn tự động'), {
      target: { value: 'Vui lòng thanh toán đúng nội dung' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Xem xác nhận đăng quảng cáo' }));

    expect(props.onAssetChange).toHaveBeenCalledWith('BTC');
    expect(props.onCurrencyChange).toHaveBeenCalledWith('USD');
    expect(props.onPriceChange).toHaveBeenCalledWith('26000');
    expect(props.onAvailableChange).toHaveBeenCalledWith('2000');
    expect(props.onMinLimitChange).toHaveBeenCalledWith('200000');
    expect(props.onMaxLimitChange).toHaveBeenCalledWith('20000000');
    expect(props.onPaymentToggle).toHaveBeenNthCalledWith(1, 'Momo');
    expect(props.onPaymentToggle).toHaveBeenNthCalledWith(2, 'Vietcombank');
    expect(props.onPaymentWindowChange).toHaveBeenCalledWith('30');
    expect(props.onTradingHoursChange).toHaveBeenCalledWith('08:00 - 17:00');
    expect(props.onMinKycLevelChange).toHaveBeenCalledWith('2');
    expect(props.onMinCompletedTradesChange).toHaveBeenCalledWith('20');
    expect(props.onMinRegisteredDaysChange).toHaveBeenCalledWith('60');
    expect(props.onRemarksChange).toHaveBeenCalledWith('Chỉ giao dịch ban ngày');
    expect(props.onAutoReplyChange).toHaveBeenCalledWith('Vui lòng thanh toán đúng nội dung');
    expect(props.onOpenConfirmation).toHaveBeenCalledOnce();
  });

  it('renders optional validation and API errors and applies every submit permission gate', () => {
    const props = makeFormProps({
      validationMessage: 'Kiểm tra dữ liệu',
      errorMessage: 'Lỗi từ máy chủ',
      canSubmit: false,
    });
    const { rerender } = renderWithProviders(<P2PCreateAdForm {...props} />);
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Kiểm tra dữ liệu');
    const submit = screen.getByRole('button', { name: 'Xem xác nhận đăng quảng cáo' });
    expect(submit).toBeDisabled();
    expect(submit.style.background).toBe('rgb(238, 238, 238)');

    rerender(<P2PCreateAdForm {...props} canSubmit canWriteAds />);
    expect(submit).toBeEnabled();
    expect(submit.style.background).toBe('rgb(0, 0, 255)');

    rerender(<P2PCreateAdForm {...props} canSubmit canWriteAds={false} />);
    expect(submit).toBeDisabled();
    rerender(<P2PCreateAdForm {...props} canSubmit canWriteAds submitPending />);
    expect(submit).toBeDisabled();
  });

  it('omits optional alerts and floating-price input when those options are absent', () => {
    renderWithProviders(
      <P2PCreateAdForm {...makeFormProps({ validationMessage: null, errorMessage: null })} />,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton', { name: 'Biên độ giá (%)' })).not.toBeInTheDocument();
  });
});

describe('P2PCreateAdConfirmation', () => {
  it('formats the offer, closes, confirms, and disables actions without permission or while pending', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const props = {
      request,
      colors,
      open: true,
      canWriteAds: true,
      pending: false,
      onClose,
      onConfirm,
    };
    const { rerender } = renderWithProviders(<P2PCreateAdConfirmation {...props} />);
    expect(screen.getByRole('dialog')).toHaveTextContent('BÁN 2 BTC với giá 12.345,68 VND.');
    fireEvent.click(screen.getByRole('button', { name: 'Huỷ' }));
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận đăng' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();

    rerender(
      <P2PCreateAdConfirmation
        {...props}
        request={{ ...request, type: 'buy', price: 1_000_000 }}
        canWriteAds={false}
      />,
    );
    expect(screen.getByRole('dialog')).toHaveTextContent('MUA 2 BTC với giá 1.000.000 VND.');
    expect(screen.getByRole('button', { name: 'Xác nhận đăng' })).toBeDisabled();

    rerender(<P2PCreateAdConfirmation {...props} pending />);
    expect(screen.getByRole('button', { name: 'Đang đăng…' })).toBeDisabled();
  });

  it('renders nothing while closed', () => {
    const { container } = renderWithProviders(
      <P2PCreateAdConfirmation
        request={request}
        colors={colors}
        open={false}
        canWriteAds
        pending={false}
        onClose={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
