import { describe, expect, it, vi } from 'vitest';
import { Activity } from 'lucide-react';
import { renderWithProviders, screen } from '@/test/test-utils';
import type { MarketMoverSummary, MarketSectorSummary } from '../model/market-types';
import { FearGreedGauge, MoverRow, SectorRow, StatCard } from './MarketOverviewSections';

const mover: MarketMoverSummary = {
  id: 'btc-usdt',
  symbol: 'BTC/USDT',
  name: 'Bitcoin',
  price: 100_000,
  change1h: 0.4,
  change24h: 2.5,
  change7d: 4.2,
  volume24h: 1_000_000,
  volumeChange24h: 3,
  marketCap: 2_000_000_000,
  category: 'Layer 1',
  color: '#F59E0B',
  sparkline: [99_000, 100_000],
};

const sector: MarketSectorSummary = {
  id: 'defi',
  name: 'DeFi',
  nameVi: 'Tài chính phi tập trung',
  color: '#8B5CF6',
  icon: '◆',
  totalMarketCap: 10_000_000,
  change24h: -1.2,
  change7d: 2,
  change30d: 6,
  volume24h: 500_000,
  topCoins: ['AAVE'],
  coinCount: 12,
  dominance: 4,
};

describe('Market overview presentation sections', () => {
  it('renders the fear-greed gauge and market stat card', () => {
    renderWithProviders(
      <>
        <FearGreedGauge value={65} label="Greed" />
        <StatCard label="DeFi TVL" value="$10M" change={2.5} icon={Activity} color="#8B5CF6" />
      </>,
    );

    expect(screen.getByRole('img', { name: 'Greed: 65' })).toBeInTheDocument();
    expect(screen.getByText('DeFi TVL')).toBeInTheDocument();
    expect(screen.getByText('$10M')).toBeInTheDocument();
  });

  it.each([
    [25, '#EF4444'],
    [45, '#F59E0B'],
    [46, '#10B981'],
  ])('uses the correct fear-greed band at value %i', (value, color) => {
    renderWithProviders(<FearGreedGauge value={value} label="Fear" />);

    const gauge = screen.getByRole('img', { name: `Fear: ${value}` });
    expect(gauge.querySelectorAll('path')[1]).toHaveAttribute('stroke', color);
  });

  it('renders market stat changes as positive, negative, or absent', () => {
    renderWithProviders(
      <>
        <StatCard
          label="Positive change"
          value="$10M"
          change={2.5}
          icon={Activity}
          color="#8B5CF6"
        />
        <StatCard
          label="Negative change"
          value="$9M"
          change={-1.25}
          icon={Activity}
          color="#8B5CF6"
        />
        <StatCard label="No change data" value="$8M" icon={Activity} color="#8B5CF6" />
      </>,
    );

    const positiveChange = screen
      .getByText('Positive change')
      .closest('.rounded-2xl')
      ?.querySelector('p:last-of-type');
    const negativeChange = screen
      .getByText('Negative change')
      .closest('.rounded-2xl')
      ?.querySelector('p:last-of-type');
    expect(positiveChange).toHaveStyle({ color: '#10B981' });
    expect(positiveChange).toHaveTextContent('+2.50%');
    expect(negativeChange).toHaveStyle({ color: '#EF4444' });
    expect(negativeChange).toHaveTextContent('-1.25%');
    expect(screen.getByText('No change data').parentElement).not.toHaveTextContent('%');
  });

  it('renders mover and sector rows with their navigation callbacks', async () => {
    const onMover = vi.fn();
    const onSector = vi.fn();
    renderWithProviders(
      <>
        <MoverRow mover={mover} onClick={onMover} />
        <SectorRow sector={sector} onClick={onSector} />
      </>,
    );

    expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
    expect(screen.getByText('Tài chính phi tập trung')).toBeInTheDocument();
    screen.getByRole('button', { name: /BTC\/USDT/ }).click();
    screen.getByRole('button', { name: /Tài chính phi tập trung/ }).click();
    expect(onMover).toHaveBeenCalledOnce();
    expect(onSector).toHaveBeenCalledOnce();
  });

  it('renders a declining mover without a positive sign', () => {
    renderWithProviders(<MoverRow mover={{ ...mover, change24h: -1.25 }} onClick={() => {}} />);

    const change = screen.getByRole('button', { name: /BTC\/USDT/ }).querySelectorAll('span');
    const changeBadge = Array.from(change).find((element) => element.textContent === '-1.25%');

    expect(changeBadge).toHaveStyle({
      color: '#EF4444',
      background: 'rgba(239,68,68,0.12)',
    });
  });

  it('renders a rising sector with its positive sign and color', () => {
    renderWithProviders(<SectorRow sector={{ ...sector, change24h: 0 }} onClick={() => {}} />);

    const row = screen.getByRole('button', { name: /Tài chính phi tập trung/ });
    const percentage = Array.from(row.querySelectorAll('span')).find(
      (element) => element.textContent === '+0.00%',
    );

    expect(percentage).toHaveStyle({ color: '#10B981' });
    expect(percentage).toHaveTextContent('+0.00%');
  });
});
