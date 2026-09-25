import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '@/test/test-utils-navigation';
import { ProviderLeaderboardPage } from '../ProviderLeaderboardPage';

const providers = vi.hoisted(() => [
  {
    id: 'ct001',
    name: 'AlphaHunter_VN',
    avatar: 'A',
    winRate: 78.5,
    totalPnl: 125430,
    totalPnlPct: 342.5,
    aum: 2450000,
    copiers: 1243,
    maxCopiers: 2000,
    sharpeRatio: 2.31,
    maxDrawdown: -12.4,
    totalTrades: 4521,
    avgHoldingTime: '4.2h',
    weeklyPnl: [2.1],
    tags: ['Top ROI'],
    isFollowing: false,
    riskLevel: 'medium' as const,
    verified: true,
  },
  {
    id: 'ct002',
    name: 'SteadyGains_Pro',
    avatar: 'S',
    winRate: 82.3,
    totalPnl: 89200,
    totalPnlPct: 187.2,
    aum: 5120000,
    copiers: 3421,
    maxCopiers: 5000,
    sharpeRatio: 3.12,
    maxDrawdown: -8.1,
    totalTrades: 2890,
    avgHoldingTime: '12h',
    weeklyPnl: [0.8],
    tags: ['Stable'],
    isFollowing: true,
    riskLevel: 'low' as const,
    verified: true,
  },
  {
    id: 'ct003',
    name: 'RiskMaster_88',
    avatar: 'R',
    winRate: 65.2,
    totalPnl: 234100,
    totalPnlPct: 567.8,
    aum: 890000,
    copiers: 567,
    maxCopiers: 1000,
    sharpeRatio: 1.85,
    maxDrawdown: -28.3,
    totalTrades: 8934,
    avgHoldingTime: '1.5h',
    weeklyPnl: [5.2],
    tags: ['High ROI'],
    isFollowing: false,
    riskLevel: 'high' as const,
    verified: false,
  },
  {
    id: 'ct004',
    name: 'CryptoSensei',
    avatar: 'C',
    winRate: 71.8,
    totalPnl: 67890,
    totalPnlPct: 156.3,
    aum: 1890000,
    copiers: 892,
    maxCopiers: 1500,
    sharpeRatio: 2.67,
    maxDrawdown: -15.2,
    totalTrades: 3456,
    avgHoldingTime: '8h',
    weeklyPnl: [1.5],
    tags: ['Balanced'],
    isFollowing: false,
    riskLevel: 'medium' as const,
    verified: true,
  },
  {
    id: 'ct005',
    name: 'WhaleWatcher',
    avatar: 'W',
    winRate: 74.1,
    totalPnl: 312500,
    totalPnlPct: 423.1,
    aum: 8900000,
    copiers: 4890,
    maxCopiers: 5000,
    sharpeRatio: 2.89,
    maxDrawdown: -10.5,
    totalTrades: 1234,
    avgHoldingTime: '3d',
    weeklyPnl: [0.3],
    tags: ['Top AUM'],
    isFollowing: false,
    riskLevel: 'low' as const,
    verified: true,
  },
]);

vi.mock('@/features/trading', () => ({
  useCopyProvidersQuery: (query: { sort?: string; risk?: string; verified?: boolean } = {}) => {
    const items = providers
      .filter((provider) => !query.risk || provider.riskLevel === query.risk)
      .filter((provider) => !query.verified || provider.verified)
      .sort((a, b) => {
        if (query.sort === 'sharpe') return b.sharpeRatio - a.sharpeRatio;
        if (query.sort === 'followers') return b.copiers - a.copiers;
        return b.totalPnlPct - a.totalPnlPct;
      });
    return { isPending: false, isError: false, data: { items }, refetch: vi.fn() };
  },
}));

describe('ProviderLeaderboardPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders contract-backed leaderboard controls and providers', () => {
    renderWithRouter(<ProviderLeaderboardPage />);
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText(/Xếp hạng chỉ phản ánh hiệu suất lịch sử/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'ROI' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Thấp$/ })).toBeInTheDocument();
    expect(screen.getByText('5 provider phù hợp')).toBeInTheDocument();
  });

  it('sorts and filters providers through the API query boundary', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderLeaderboardPage />);
    await user.click(screen.getByRole('tab', { name: 'Sharpe' }));
    expect((document.body.textContent ?? '').indexOf('SteadyGains_Pro')).toBeLessThan(
      (document.body.textContent ?? '').indexOf('RiskMaster_88'),
    );
    await user.click(screen.getByRole('button', { name: /^Thấp$/ }));
    await waitFor(() => expect(screen.getByText('2 provider phù hợp')).toBeInTheDocument());
    expect(screen.queryByText('RiskMaster_88')).not.toBeInTheDocument();
  });

  it('supports verified-only filtering and provider navigation', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderLeaderboardPage />);
    await user.click(screen.getByRole('button', { name: /Chỉ hiện provider đã xác minh/i }));
    expect(screen.getByText('4 provider phù hợp')).toBeInTheDocument();
    expect(screen.queryByText('RiskMaster_88')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /WhaleWatcher/ }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/trade/copy-provider/ct005'));
  });
});
