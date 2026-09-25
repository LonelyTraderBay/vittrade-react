import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InputField, InputWrapper } from './InputField';

describe('InputField', () => {
  it('connects its label and error message accessibly', () => {
    render(<InputField label="Email address" error="Enter a valid email" />);

    const input = screen.getByRole('textbox', { name: 'Email address' });
    expect(input).toHaveAttribute('id', 'input-email-address');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'input-email-address-error');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email');
  });

  it('updates focus styling and forwards native focus callbacks', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(<InputField id="account-name" label="Account" onFocus={onFocus} onBlur={onBlur} />);

    const input = screen.getByLabelText('Account');
    const container = input.parentElement;
    expect(container).toHaveStyle({ boxShadow: 'none' });

    fireEvent.focus(input);
    expect(container?.getAttribute('style')).toContain('border: 1.5px solid var(--tr-primary)');
    expect(container?.getAttribute('style')).toContain(
      'box-shadow: 0 0 0 2px rgba(229, 138, 0, 0.25)',
    );
    expect(onFocus).toHaveBeenCalledOnce();

    fireEvent.blur(input);
    expect(container).toHaveStyle({ boxShadow: 'none' });
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it('renders prefix, suffix, and custom wrapper content', () => {
    const onClick = vi.fn();
    render(
      <>
        <InputField label="Amount" prefix="$" suffix="USDT" containerClassName="amount-field" />
        <InputWrapper label="Network" onClick={onClick}>
          <span>Ethereum</span>
        </InputWrapper>
      </>,
    );

    const amountInput = screen.getByLabelText('Amount');
    expect(amountInput.parentElement).toHaveTextContent('$');
    expect(amountInput.parentElement).toHaveTextContent('USDT');
    const network = screen.getByText('Ethereum');
    expect(network).toBeInTheDocument();
    fireEvent.focus(network.parentElement!);
    expect(network.parentElement).toHaveStyle({ boxShadow: '0 0 0 2px rgba(229, 138, 0, 0.25)' });
    fireEvent.click(network);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
