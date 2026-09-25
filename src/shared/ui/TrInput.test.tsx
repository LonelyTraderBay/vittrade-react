import { useState, type ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { TrInput, TrTextarea } from './TrInput';

function ControlledInput({
  initialValue = '',
  ...props
}: ComponentProps<typeof TrInput> & { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  const onChange = props.onChange;

  return (
    <TrInput
      {...props}
      value={value}
      onChange={(nextValue) => {
        onChange?.(nextValue);
        setValue(nextValue);
      }}
    />
  );
}

describe('TrInput', () => {
  it('wires label, helper, adornments and focus/change/blur callbacks', () => {
    const onChange = vi.fn();
    const onChangeNative = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onKeyDown = vi.fn();
    const select = vi.spyOn(HTMLInputElement.prototype, 'select').mockImplementation(() => {});
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });

    renderWithProviders(
      <ControlledInput
        label="Số lượng"
        placeholder="0.00"
        helper="Tối thiểu 0.001"
        prefix="$"
        suffix="BTC"
        initialValue="12"
        onChange={onChange}
        onChangeNative={onChangeNative}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        selectOnFocus
        size="compact"
        variant="amount"
        maxLength={12}
        autoComplete="off"
        inputMode="decimal"
        data-testid="amount-input"
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Số lượng' });
    expect(input).toHaveAttribute('placeholder', '0.00');
    expect(input).toHaveAttribute('inputmode', 'decimal');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('maxlength', '12');
    expect(screen.getByText('$')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('Tối thiểu 0.001')).toBeInTheDocument();

    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledTimes(1);
    fireEvent.change(input, { target: { value: '25' } });
    expect(onChange).toHaveBeenCalledWith('25');
    expect(onChangeNative).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('formats numeric display values, strips formatting on change and clears the value', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ControlledInput
        label="Giá trị"
        initialValue="1234.50"
        numeric
        clearable
        onChange={onChange}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Giá trị' });
    expect(input).toHaveValue('1,234.50');
    expect(input).toHaveAttribute('inputmode', 'decimal');
    fireEvent.change(input, { target: { value: '9,876.5' } });
    expect(onChange).toHaveBeenLastCalledWith('9876.5');
    expect(input).toHaveValue('9,876.5');

    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(input).toHaveValue('');
  });

  it('shows and toggles password text while preserving disabled and error states', () => {
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(
      <ControlledInput
        label="Mật khẩu"
        type="password"
        initialValue="secret"
        error="Mật khẩu quá ngắn"
        helper="Bị ẩn khi có lỗi"
        onChange={onChange}
      />,
    );

    const password = screen.getByLabelText('Mật khẩu');
    expect(password).toHaveAttribute('type', 'password');
    expect(password).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Mật khẩu quá ngắn');
    expect(screen.queryByText('Bị ẩn khi có lỗi')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(password).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
    expect(password).toHaveAttribute('type', 'password');

    rerender(
      <ControlledInput
        label="Mật khẩu"
        type="password"
        value="secret"
        disabled
        clearable
        onChange={onChange}
      />,
    );
    expect(screen.getByLabelText('Mật khẩu')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Xóa' })).not.toBeInTheDocument();
  });

  it('supports textarea helper, error, counter and controlled events', () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const { rerender } = renderWithProviders(
      <TrTextarea
        label="Ghi chú"
        placeholder="Nhập nội dung"
        helper="Không chia sẻ mã bí mật"
        value="BTC"
        rows={4}
        maxLength={20}
        onChange={onChange}
        onBlur={onBlur}
      />,
    );

    const textarea = screen.getByRole('textbox', { name: 'Ghi chú' });
    expect(textarea).toHaveAttribute('rows', '4');
    expect(screen.getByText('3/20')).toBeInTheDocument();
    fireEvent.change(textarea, { target: { value: 'Bitcoin' } });
    expect(onChange).toHaveBeenCalledWith('Bitcoin');
    fireEvent.focus(textarea);
    fireEvent.blur(textarea);
    expect(onBlur).toHaveBeenCalledTimes(1);

    rerender(<TrTextarea label="Ghi chú" error="Bắt buộc" value="" disabled onChange={onChange} />);
    expect(screen.getByRole('textbox', { name: 'Ghi chú' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Bắt buộc');
    expect(screen.getByRole('textbox', { name: 'Ghi chú' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});
