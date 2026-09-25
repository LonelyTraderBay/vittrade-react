import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Banner, OfflineBanner } from './OfflineBanner';

describe('OfflineBanner', () => {
  it('shows the default offline notice and optional stale-data hint', () => {
    render(<OfflineBanner showStaleHint />);

    expect(screen.getByText('Mất kết nối. Đang hiển thị dữ liệu gần nhất.')).toBeInTheDocument();
    expect(screen.getByText('Cập nhật lần cuối: 2 phút trước')).toBeInTheDocument();
  });

  it('uses the reconnecting state and hides the stale-data hint', () => {
    render(<OfflineBanner variant="error" isReconnecting showStaleHint message="Offline" />);

    expect(screen.getByText('Đang kết nối lại...')).toBeInTheDocument();
    expect(screen.getByText('Tự động thử lại sau vài giây')).toBeInTheDocument();
    expect(screen.queryByText('Cập nhật lần cuối: 2 phút trước')).not.toBeInTheDocument();
  });
});

describe('Banner', () => {
  it('renders detail and an optional icon with the chosen variant', () => {
    render(
      <Banner
        variant="info"
        message="Connection restored"
        detail="Live data is current"
        icon={<span>✓</span>}
      />,
    );

    expect(screen.getByText('Connection restored')).toBeInTheDocument();
    expect(screen.getByText('Live data is current')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('omits optional icon and detail when they are absent', () => {
    render(<Banner variant="warn" message="Check the network" />);

    expect(screen.getByText('Check the network')).toBeInTheDocument();
    expect(screen.queryByText('Live data is current')).not.toBeInTheDocument();
  });
});
