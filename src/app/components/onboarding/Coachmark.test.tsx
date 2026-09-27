import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/shared/theme/ThemeContext';
import { coachmarkService } from '../../services/CoachmarkService';
import { Coachmark } from './Coachmark';

function renderCoachmark(props: React.ComponentProps<typeof Coachmark>) {
  return render(
    <ThemeProvider>
      <Coachmark {...props} />
    </ThemeProvider>,
  );
}

beforeEach(() => coachmarkService.resetAll());

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  coachmarkService.resetAll();
});

describe('Coachmark', () => {
  it('stays hidden when coachmarks are globally disabled', () => {
    coachmarkService.setDisabled(true);
    const { container } = renderCoachmark({ screen: 'home' });

    expect(container).toBeEmptyDOMElement();
  });

  it('waits for the configured delay, advances by priority, and completes the sequence', async () => {
    const onComplete = vi.fn();
    renderCoachmark({ screen: 'home', onComplete });

    expect(screen.queryByText('Trang chủ của bạn')).not.toBeInTheDocument();
    await screen.findByText('Trang chủ của bạn');
    expect(screen.getByText('3 mẹo còn lại')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Trang chủ của bạn'));
    expect(screen.getByRole('button', { name: 'Tiếp theo' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }));
    await screen.findByText('Prediction Markets');
    expect(screen.getByText('Thị trường giá trị')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }));
    await screen.findByText('Open Arena');
    fireEvent.click(screen.getByRole('button', { name: 'Đã hiểu' }));

    await waitFor(() => expect(screen.queryByText('Open Arena')).not.toBeInTheDocument());
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('runs the contextual action and completes when it is the final tip', async () => {
    const onAction = vi.fn();
    const onComplete = vi.fn();
    renderCoachmark({ screen: 'profile', onAction, onComplete });

    await screen.findByRole('button', { name: 'Cài đặt bảo mật' }, { timeout: 3000 });
    fireEvent.click(screen.getByRole('button', { name: 'Cài đặt bảo mật' }));

    expect(onAction).toHaveBeenCalledWith('/profile/security');
    await waitFor(() => expect(screen.queryByText('Thiết lập bảo mật')).not.toBeInTheDocument());
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('dismisses every remaining tip when requested', async () => {
    const onComplete = vi.fn();
    renderCoachmark({ screen: 'home', onComplete });
    await screen.findByText('Trang chủ của bạn');

    fireEvent.click(screen.getByRole('button', { name: 'Bỏ qua tất cả' }));

    await waitFor(() => expect(screen.queryByText('Trang chủ của bạn')).not.toBeInTheDocument());
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
