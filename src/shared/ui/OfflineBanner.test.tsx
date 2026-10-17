import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { Banner, OfflineBanner } from './OfflineBanner';

describe('OfflineBanner', () => {
  it('renders offline variants, stale hints and reconnecting feedback', () => {
    renderWithProviders(
      <>
        <OfflineBanner variant="warn" message="Connection paused" showStaleHint />
        <OfflineBanner variant="error" message="Connection failed" />
        <OfflineBanner variant="info" message="Read-only mode" />
        <OfflineBanner variant="warn" isReconnecting showStaleHint />
      </>,
    );

    expect(screen.getByText('Connection paused')).toBeInTheDocument();
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByText('Read-only mode')).toBeInTheDocument();
    expect(screen.getByText('Cập nhật lần cuối: 2 phút trước')).toBeInTheDocument();
    expect(screen.getByText('Đang kết nối lại...')).toBeInTheDocument();
    expect(screen.getByText('Tự động thử lại sau vài giây')).toBeInTheDocument();
    expect(screen.getAllByText('Cập nhật lần cuối: 2 phút trước')).toHaveLength(1);
  });
});

describe('Banner', () => {
  it('supports all semantic colors with optional icon, detail and class', () => {
    renderWithProviders(
      <>
        <Banner variant="warn" message="Warning" />
        <Banner variant="error" message="Error" detail="Retry later" className="custom-banner" />
        <Banner variant="info" message="Information" icon={<span aria-hidden="true">i</span>} />
      </>,
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Retry later')).toBeInTheDocument();
    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('Error').closest('.custom-banner')).toBeInTheDocument();
  });
});
