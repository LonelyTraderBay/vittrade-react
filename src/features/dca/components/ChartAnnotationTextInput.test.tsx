import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  ChartAnnotationTextInput,
  type ChartAnnotationTextInputState,
} from './ChartAnnotationTextInput';

function Harness({ onConfirm = vi.fn() }: { onConfirm?: () => void }) {
  const [textInput, setTextInput] = useState<ChartAnnotationTextInputState | null>({
    active: true,
    x: 100,
    y: 50,
    value: 'Mốc mua',
  });

  return (
    <>
      <ChartAnnotationTextInput
        textInput={textInput}
        width={200}
        height={100}
        setTextInput={setTextInput}
        confirmTextInput={onConfirm}
      />
      <output>{textInput?.value ?? 'đã đóng'}</output>
    </>
  );
}

describe('ChartAnnotationTextInput', () => {
  it('positions the editor, updates its value, and confirms with Enter or button', () => {
    const onConfirm = vi.fn();
    const { container } = render(<Harness onConfirm={onConfirm} />);
    const editor = screen.getByPlaceholderText('Ghi chú...');

    expect(container.querySelector('.absolute')).toHaveStyle({ left: '25%', top: '25%' });
    expect(editor).toHaveValue('Mốc mua');
    fireEvent.change(editor, { target: { value: 'Điểm DCA' } });
    expect(editor).toHaveValue('Điểm DCA');
    fireEvent.keyDown(editor, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it('closes on Escape or cancel and renders nothing for an inactive editor', () => {
    const { rerender } = render(<Harness />);
    fireEvent.keyDown(screen.getByPlaceholderText('Ghi chú...'), { key: 'Escape' });
    expect(screen.getByText('đã đóng')).toBeInTheDocument();

    rerender(
      <ChartAnnotationTextInput
        textInput={{ active: false, x: 1, y: 2, value: '' }}
        width={100}
        height={100}
        setTextInput={vi.fn()}
        confirmTextInput={vi.fn()}
      />,
    );
    expect(screen.queryByPlaceholderText('Ghi chú...')).not.toBeInTheDocument();

    rerender(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(screen.getByText('đã đóng')).toBeInTheDocument();
  });
});
