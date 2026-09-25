import { act, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { SearchBar } from './SearchBar';

function ControlledSearchBar(props: React.ComponentProps<typeof SearchBar>) {
  const [value, setValue] = useState(props.value);

  return (
    <SearchBar
      {...props}
      value={value}
      onChange={(nextValue) => {
        props.onChange(nextValue);
        setValue(nextValue);
      }}
    />
  );
}

describe('SearchBar', () => {
  it('updates a controlled value, clears it, and focuses the input after clearing', () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    renderWithProviders(
      <ControlledSearchBar value="bitcoin" onChange={onChange} onClear={onClear} />,
    );

    const input = screen.getByRole('textbox', { name: 'Tìm kiếm...' });
    expect(input).toHaveValue('bitcoin');
    fireEvent.change(input, { target: { value: 'ethereum' } });
    expect(onChange).toHaveBeenCalledWith('ethereum');
    expect(input).toHaveValue('ethereum');

    fireEvent.click(screen.getByRole('button', { name: 'Xóa tìm kiếm' }));
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(onClear).toHaveBeenCalledOnce();
    expect(input).toHaveValue('');
    expect(document.activeElement).toBe(input);
  });

  it('debounces changes and keeps only the latest pending value', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    renderWithProviders(
      <ControlledSearchBar
        value=""
        onChange={onChange}
        debounce={150}
        placeholder="Search assets"
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Search assets' });

    fireEvent.change(input, { target: { value: 'eth' } });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.change(input, { target: { value: 'ethereum' } });
    act(() => vi.advanceTimersByTime(149));
    expect(onChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('ethereum');
  });

  it('submits the local query on Enter and exposes the filter state', () => {
    const onSubmit = vi.fn();
    const onFilterToggle = vi.fn();
    renderWithProviders(
      <ControlledSearchBar
        value="btc"
        onChange={vi.fn()}
        onSubmit={onSubmit}
        onFilterToggle={onFilterToggle}
        filterActive
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Tìm kiếm...' });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('btc');

    const filter = screen.getByRole('button', { name: 'Tắt bộ lọc' });
    expect(filter).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(filter);
    expect(onFilterToggle).toHaveBeenCalledOnce();
  });

  it('renders header navigation and custom right actions while honoring compact and disabled states', () => {
    const onBack = vi.fn();
    const onFilterToggle = vi.fn();
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
    const { rerender } = renderWithProviders(
      <SearchBar
        value="query"
        onChange={vi.fn()}
        variant="header"
        onBack={onBack}
        autoFocus
        onFilterToggle={onFilterToggle}
        right={<span>Actions</span>}
        className="custom-search"
      />,
    );

    const headerInput = screen.getByRole('textbox', { name: 'Tìm kiếm...' });
    expect(document.activeElement).toBe(headerInput);
    expect(screen.getByRole('button', { name: 'Quay lại' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bật bộ lọc' })).not.toBeInTheDocument();
    expect(requestFrame).toHaveBeenCalledOnce();

    rerender(
      <SearchBar
        value="query"
        onChange={vi.fn()}
        variant="compact"
        onFilterToggle={onFilterToggle}
        filterActive={false}
        disabled
        style={{ opacity: 0.8 }}
      />,
    );
    expect(screen.getByRole('textbox', { name: 'Tìm kiếm...' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Xóa tìm kiếm' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bật bộ lọc' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('renders the default placeholder and header without a back action', () => {
    const { rerender } = renderWithProviders(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: 'Tìm kiếm...' })).toBeInTheDocument();

    rerender(<SearchBar value="" onChange={vi.fn()} variant="header" />);
    expect(screen.queryByRole('button', { name: 'Quay lại' })).not.toBeInTheDocument();
  });
});
