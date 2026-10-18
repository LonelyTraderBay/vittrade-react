import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InputField, InputWrapper } from './InputField';

describe('InputField', () => {
  it.each(['Enter', ' '])('activates custom picker content with the $key key', (key) => {
    const onClick = vi.fn();
    render(
      <InputWrapper label="Network" onClick={onClick}>
        <span>Ethereum</span>
      </InputWrapper>,
    );
    const picker = screen.getByText('Ethereum').parentElement!;
    act(() => picker.focus());
    fireEvent.keyDown(picker, { key });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not activate a picker for unrelated keys or an input inside it', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <InputWrapper label="Network" onClick={onClick}>
        <input aria-label="Search networks" />
      </InputWrapper>,
    );
    const picker = screen.getByRole('button', { name: 'Network' });
    fireEvent.keyDown(picker, { key: 'Escape' });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onClick).not.toHaveBeenCalled();
    rerender(
      <InputWrapper>
        <span>Read only</span>
      </InputWrapper>,
    );
    fireEvent.keyDown(screen.getByText('Read only').parentElement!, { key: 'Enter' });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('supports an unlabeled input and clears wrapper focus without a click handler', () => {
    const { rerender } = render(<InputField aria-label="Search" />);
    expect(screen.getByRole('textbox', { name: 'Search' })).not.toHaveAttribute('id');
    rerender(
      <InputWrapper error="Choose a network">
        <span>Network</span>
      </InputWrapper>,
    );
    const wrapper = screen.getByText('Network').parentElement!;
    expect(wrapper.getAttribute('style')).toContain(
      'border: 1.5px solid var(--input-border-error)',
    );
    expect(wrapper).not.toHaveAttribute('tabindex');
    fireEvent.focus(wrapper);
    expect(wrapper).toHaveStyle({ boxShadow: 'none' });
    expect(screen.getByText('Choose a network')).toBeInTheDocument();
    fireEvent.blur(wrapper);
    expect(wrapper).toHaveStyle({ boxShadow: 'none' });
  });

  it('connects its label and error message accessibly', () => {
    render(<InputField label="Email address" error="Enter a valid email" />);

    const input = screen.getByRole('textbox', { name: 'Email address' });
    expect(input).toHaveAttribute('id', 'input-email-address');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'input-email-address-error');
    expect(input.parentElement?.getAttribute('style')).toContain(
      'border: 1.5px solid var(--input-border-error)',
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email');
  });

  it('preserves comfortable defaults and applies the compact field contract', () => {
    const { rerender } = render(<InputField id="account-email" label="Email" />);
    const defaultInput = screen.getByLabelText('Email');
    const defaultControl = defaultInput.parentElement!;
    expect(defaultControl.style.height).toBe('var(--input-height)');
    expect(defaultControl.style.borderRadius).toBe('var(--input-radius)');
    expect(defaultControl.style.background).toBe('var(--tr-surface-2)');
    expect((defaultInput as HTMLInputElement).style.fontSize).toBe('15px');

    rerender(
      <InputField
        id="compact-email"
        label="Email"
        density="compact"
        surfaceTone="base"
        labelAction={<button type="button">Help</button>}
        required
        helper="Use your account email."
        error="Enter a valid email"
      />,
    );

    const compactInput = screen.getByRole('textbox', { name: 'Email' });
    const compactControl = compactInput.parentElement!;
    const label = screen.getByText('Email', { selector: 'label' });
    expect(compactControl.style.height).toBe('var(--input-height-compact)');
    expect(compactControl.style.borderRadius).toBe('var(--input-radius-compact)');
    expect(compactControl.style.paddingInline).toBe('var(--input-padding-inline-compact)');
    expect(compactControl.style.gap).toBe('var(--input-gap-compact)');
    expect(compactControl.style.background).toBe('var(--tr-surface)');
    expect((compactInput as HTMLInputElement).style.fontSize).toBe('14px');
    expect(label).toHaveStyle({ fontSize: '12px', fontWeight: '500' });
    expect(label.nextElementSibling).toBe(screen.getByRole('button', { name: 'Help' }));
    expect(compactInput).toBeRequired();
    expect(compactInput).toHaveAttribute('aria-invalid', 'true');
    expect(compactInput).toHaveAccessibleDescription('Use your account email. Enter a valid email');
  });

  it('supports composed labels with required semantics and a generated accessible id', () => {
    render(
      <InputField
        label={
          <>
            Wallet address{' '}
            <span aria-hidden="true" style={{ color: 'red' }}>
              *
            </span>
          </>
        }
        required
      />,
    );

    const input = screen.getByRole('textbox', {
      name: 'Wallet address',
    }) as HTMLInputElement;
    expect(input).toBeRequired();
    expect(input.id).toMatch(/^input-/);
    expect(input.labels).toHaveLength(1);
    expect(input.labels?.[0]).toHaveAttribute('for', input.id);
  });

  it('keeps supplied descriptions, helper text, and validation errors connected', () => {
    render(
      <InputField
        id="account-email"
        label="Email address"
        helper="Use the address for this account."
        error="Enter a valid email"
        aria-describedby="account-policy"
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Email address' });
    expect(input).toHaveAttribute(
      'aria-describedby',
      'account-policy account-email-helper account-email-error',
    );
    expect(document.getElementById('account-email-helper')).toHaveTextContent(
      'Use the address for this account.',
    );
    expect(document.getElementById('account-email-error')).toHaveAttribute('role', 'alert');
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
