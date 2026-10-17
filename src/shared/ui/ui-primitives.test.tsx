import { fireEvent, render, screen } from '@testing-library/react';
import { Search } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/shared/theme/ThemeContext';
import { useTheme } from '@/shared/theme/useTheme';
import { BackButton, CloseButton, IconButton, IconOnlyButton } from './IconButton';
import { ErrorState } from './ErrorState';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { StatusPill } from './StatusPill';
import { ThemedToaster } from './ThemedToaster';

const { toasterMock } = vi.hoisted(() => ({
  toasterMock: vi.fn((_props: { theme: 'light' | 'dark' }) => null),
}));

vi.mock('sonner', () => ({ Toaster: toasterMock }));

const iconButtonVariants = [
  'default',
  'ghost',
  'primary',
  'success',
  'danger',
  'transparent',
] as const;
const iconButtonSizes = ['sm', 'md', 'lg'] as const;
const statusPillStatuses = [
  'success',
  'warning',
  'error',
  'info',
  'neutral',
  'purple',
  'orange',
] as const;

describe('IconButton family', () => {
  it.each(iconButtonVariants)('renders the %s variant', (variant) => {
    render(<IconButton icon={Search} label="Tìm kiếm" variant={variant} />);
    const button = screen.getByRole('button', { name: 'Tìm kiếm' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
  });

  it.each(iconButtonSizes)('applies the %s size', (size) => {
    render(<IconButton icon={Search} size={size} aria-label="Tìm kiếm" />);
    expect(screen.getByRole('button', { name: 'Tìm kiếm' })).toBeInTheDocument();
  });

  it('respects loading, disabled, missing-handler and active click states', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <IconButton icon={Search} label="Đang tải" onClick={onClick} loading />,
    );
    const button = screen.getByRole('button', { name: 'Đang tải' });
    expect(button).toBeDisabled();
    expect(button.querySelector('.animate-spin')).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();

    rerender(<IconButton icon={Search} label="Vô hiệu" onClick={onClick} disabled />);
    fireEvent.click(screen.getByRole('button', { name: 'Vô hiệu' }));
    expect(onClick).not.toHaveBeenCalled();

    rerender(<IconButton icon={Search} label="Không có callback" />);
    fireEvent.click(screen.getByRole('button', { name: 'Không có callback' }));
    expect(onClick).not.toHaveBeenCalled();

    rerender(
      <IconButton
        icon={Search}
        label="Tìm kiếm"
        aria-label="Tìm kiếm nâng cao"
        className="custom-class"
        style={{ marginTop: 2 }}
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm nâng cao' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Tìm kiếm nâng cao' })).toHaveClass('custom-class');
  });

  it('renders icon-only, back and close variants with their accessible names', () => {
    const onClick = vi.fn();
    const { rerender } = render(<IconOnlyButton icon={Search} aria-label="Tìm kiếm" />);
    expect(screen.getByRole('button', { name: 'Tìm kiếm' })).toBeInTheDocument();

    rerender(<BackButton onClick={onClick} />);
    expect(screen.getByRole('button', { name: 'Quay lại' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(<BackButton onClick={onClick} useChevron label="Về trang trước" size="lg" />);
    expect(screen.getByRole('button', { name: 'Về trang trước' })).toBeInTheDocument();

    rerender(<CloseButton onClick={onClick} />);
    expect(screen.getByRole('button', { name: 'Đóng' })).toBeInTheDocument();
    rerender(<CloseButton onClick={onClick} label="Đóng bảng" size="sm" />);
    expect(screen.getByRole('button', { name: 'Đóng bảng' })).toBeInTheDocument();
  });
});

describe('StatusPill', () => {
  it.each(statusPillStatuses)('renders the %s status preset', (status) => {
    render(<StatusPill status={status} label="Trạng thái" />);
    expect(screen.getByText('Trạng thái')).toBeInTheDocument();
  });

  it('renders custom colors, sizes, outlines, icons, pulses and count limits', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <StatusPill color="#8B5CF6" label="VIP" size="sm" outline count={0} onClick={onClick} />,
    );
    const clickablePill = screen.getByRole('button', { name: 'VIP' });
    expect(clickablePill).toBeInTheDocument();
    expect(clickablePill).toHaveAttribute('type', 'button');
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    fireEvent.click(clickablePill);
    expect(onClick).toHaveBeenCalledOnce();

    rerender(<StatusPill label="Live" size="md" pulse count={12} icon={Search} />);
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();

    rerender(<StatusPill label="Nhiều" size="lg" icon={Search} count={100} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('renders defaults and only shows actions whose handlers are provided', () => {
    const onAction = vi.fn();
    const onSecondary = vi.fn();
    const { rerender } = render(<ErrorState />);
    expect(screen.getByText('Có lỗi xảy ra')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(
      <ErrorState
        title="Không tải được"
        message="Thử lại sau"
        actionLabel="Tải lại"
        onAction={onAction}
        secondaryLabel="Đóng"
        onSecondary={onSecondary}
        icon={<span>!</span>}
      />,
    );
    const retry = screen.getByRole('button', { name: 'Tải lại' });
    const close = screen.getByRole('button', { name: 'Đóng' });
    expect(retry).toHaveAttribute('type', 'button');
    expect(close).toHaveAttribute('type', 'button');
    fireEvent.click(retry);
    fireEvent.click(close);
    expect(onAction).toHaveBeenCalledOnce();
    expect(onSecondary).toHaveBeenCalledOnce();
  });
});

describe('Dialog wrappers', () => {
  it('renders accessible dialog content and closes through its close action', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
            <DialogDescription>Review this action before continuing.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole('dialog', { name: 'Confirm action' })).toBeInTheDocument();
    expect(screen.getByText('Review this action before continuing.')).toBeInTheDocument();
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(cancel).toHaveAttribute('type', 'button');
    fireEvent.click(cancel);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('ThemedToaster', () => {
  it('uses the active application theme', () => {
    function ThemeControls() {
      const { theme, setTheme } = useTheme();
      return (
        <>
          <button onClick={() => setTheme('dark')}>{theme}</button>
          <ThemedToaster />
        </>
      );
    }

    render(
      <ThemeProvider>
        <ThemeControls />
      </ThemeProvider>,
    );
    expect(toasterMock.mock.calls.at(-1)?.[0].theme).toBe('light');

    fireEvent.click(screen.getByRole('button', { name: 'light' }));
    expect(toasterMock.mock.calls.at(-1)?.[0].theme).toBe('dark');
  });
});
