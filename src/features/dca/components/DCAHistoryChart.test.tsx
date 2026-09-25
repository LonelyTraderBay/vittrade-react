import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import html2canvas from 'html2canvas';
import type { DCAPortfolioHistoryPoint } from '../model/dca-types';
import { renderWithProviders } from '@/test/test-utils';
import { DCAHistoryChart } from './DCAHistoryChart';

vi.mock('html2canvas', () => ({ default: vi.fn() }));

const history: DCAPortfolioHistoryPoint[] = [
  {
    date: new Date('2026-09-01T00:00:00.000Z'),
    portfolioValue: 1_100_000,
    totalInvested: 1_000_000,
    hasPurchase: true,
  },
  {
    date: new Date('2026-09-05T00:00:00.000Z'),
    portfolioValue: 1_250_000,
    totalInvested: 1_100_000,
    hasPurchase: false,
  },
];

afterEach(() => vi.restoreAllMocks());

describe('DCAHistoryChart', () => {
  it('renders the supplied period and exposes interactive zoom and annotation controls', () => {
    renderWithProviders(<DCAHistoryChart data={history} interactive subtitle="Bốn ngày qua" />);

    expect(screen.getByRole('heading', { name: 'Lịch Sử Danh Mục' })).toBeInTheDocument();
    expect(screen.getByText('Bốn ngày qua')).toBeInTheDocument();
    expect(screen.getByText(/Chụm để zoom/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Phóng to' }));
    expect(screen.getByRole('button', { name: 'Đặt lại zoom' })).toBeInTheDocument();
    expect(screen.getByText(/%$/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thu nhỏ' }));
    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại zoom' }));
    expect(screen.queryByRole('button', { name: 'Đặt lại zoom' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Bật ghi chú' }));
    expect(screen.getByText(/Chế độ ghi chú/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Phóng to' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tắt ghi chú' }));
    expect(screen.getByRole('button', { name: 'Phóng to' })).toBeInTheDocument();
  });

  it('derives a standard period label and supports pinch zoom and double-tap reset', () => {
    const { container } = renderWithProviders(<DCAHistoryChart data={history} interactive />);
    const chartContainer = container.querySelector('.touch-none')!;
    vi.spyOn(chartContainer, 'getBoundingClientRect').mockReturnValue({
      bottom: 300,
      height: 300,
      left: 0,
      right: 400,
      top: 0,
      width: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    expect(screen.getByText('7 ngày qua')).toBeInTheDocument();
    fireEvent.touchStart(chartContainer, {
      touches: [
        { clientX: 100, clientY: 50 },
        { clientX: 200, clientY: 50 },
      ],
    });
    fireEvent.touchMove(chartContainer, {
      touches: [
        { clientX: 50, clientY: 50 },
        { clientX: 250, clientY: 50 },
      ],
    });
    fireEvent.touchEnd(chartContainer, { touches: [] });
    expect(screen.getByRole('button', { name: 'Đặt lại zoom' })).toBeInTheDocument();

    const now = vi.spyOn(Date, 'now');
    now.mockReturnValueOnce(1_000).mockReturnValueOnce(1_100);
    fireEvent.touchStart(chartContainer, { touches: [{ clientX: 160, clientY: 50 }] });
    fireEvent.touchStart(chartContainer, { touches: [{ clientX: 160, clientY: 50 }] });
    expect(screen.queryByRole('button', { name: 'Đặt lại zoom' })).not.toBeInTheDocument();
  });

  it('exports a chart image through the download fallback', async () => {
    const exportCanvas = document.createElement('canvas');
    vi.mocked(html2canvas).mockResolvedValue(exportCanvas);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,test',
    );
    const clickLink = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderWithProviders(<DCAHistoryChart data={history} />);
    fireEvent.click(screen.getByRole('button', { name: 'Chia sẻ biểu đồ' }));

    await waitFor(() => expect(clickLink).toHaveBeenCalledTimes(1));
    expect(html2canvas).toHaveBeenCalledTimes(1);
  });
});
