/**
 * ══════════════════════════════════════════════════════════
 *  WEB PREDICTIONS PAGE (HOME)
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/predictions
 *
 *  Prediction Markets Home — Market-based module (NOT social game)
 *
 *  Required sections (per Guidelines §9.2):
 *  - Market overview stats
 *  - Breaking events
 *  - Category filters
 *  - My positions preview
 *  - Quick access to Portfolio/Rewards/Leaderboard/Activity
 *
 *  Hardening (per Guidelines §9.5, §9.6):
 *  - NO hype language ("kiếm lời nhanh")
 *  - NO probability → certainty conversion
 *  - Reward opportunities ≠ guaranteed profit
 *  - Risk disclosure always visible
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Award,
  Activity,
  Search,
  ChevronRight,
  BarChart3,
  Zap,
  Shield,
  AlertCircle,
  Eye,
  DollarSign,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

interface PredictionEvent {
  id: string;
  title: string;
  category: string;
  endDate: string;
  totalVolume: number;
  totalPositions: number;
  outcomes: {
    label: string;
    probability: number;
    price: number;
  }[];
  isBreaking?: boolean;
  myPosition?: {
    outcome: string;
    shares: number;
    avgPrice: number;
    currentValue: number;
  };
}

const BREAKING_EVENTS: PredictionEvent[] = [
  {
    id: 'btc-100k-2026',
    title: 'Bitcoin đạt $100,000 trước 31/12/2026?',
    category: 'Crypto',
    endDate: '2026-12-31',
    totalVolume: 1250000,
    totalPositions: 8420,
    outcomes: [
      { label: 'Có', probability: 68.5, price: 0.685 },
      { label: 'Không', probability: 31.5, price: 0.315 },
    ],
    isBreaking: true,
  },
  {
    id: 'eth-merge-success',
    title: 'Ethereum network uptime > 99.9% trong Q2 2026?',
    category: 'Crypto',
    endDate: '2026-06-30',
    totalVolume: 850000,
    totalPositions: 5230,
    outcomes: [
      { label: 'Có', probability: 82.3, price: 0.823 },
      { label: 'Không', probability: 17.7, price: 0.177 },
    ],
    isBreaking: true,
  },
  {
    id: 'us-election-2026',
    title: 'Đảng nào kiểm soát Hạ viện sau bầu cử giữa kỳ 2026?',
    category: 'Politics',
    endDate: '2026-11-03',
    totalVolume: 3200000,
    totalPositions: 12450,
    outcomes: [
      { label: 'Đảng Dân chủ', probability: 52.8, price: 0.528 },
      { label: 'Đảng Cộng hòa', probability: 47.2, price: 0.472 },
    ],
    isBreaking: true,
  },
];

const TRENDING_EVENTS: PredictionEvent[] = [
  {
    id: 'ai-agi-2027',
    title: 'OpenAI công bố AGI trước cuối năm 2027?',
    category: 'Tech',
    endDate: '2027-12-31',
    totalVolume: 580000,
    totalPositions: 3890,
    outcomes: [
      { label: 'Có', probability: 24.5, price: 0.245 },
      { label: 'Không', probability: 75.5, price: 0.755 },
    ],
  },
  {
    id: 'fed-rate-q3',
    title: 'Fed giảm lãi suất ít nhất 0.5% trong Q3 2026?',
    category: 'Macro',
    endDate: '2026-09-30',
    totalVolume: 1100000,
    totalPositions: 6780,
    outcomes: [
      { label: 'Có', probability: 41.2, price: 0.412 },
      { label: 'Không', probability: 58.8, price: 0.588 },
    ],
  },
  {
    id: 'tesla-delivery',
    title: 'Tesla giao hơn 2 triệu xe trong 2026?',
    category: 'Business',
    endDate: '2027-01-31',
    totalVolume: 720000,
    totalPositions: 4560,
    outcomes: [
      { label: 'Có', probability: 61.3, price: 0.613 },
      { label: 'Không', probability: 38.7, price: 0.387 },
    ],
  },
  {
    id: 'world-cup-2026',
    title: 'Đội vô địch World Cup 2026?',
    category: 'Sports',
    endDate: '2026-07-19',
    totalVolume: 2100000,
    totalPositions: 15200,
    outcomes: [
      { label: 'Brazil', probability: 18.5, price: 0.185 },
      { label: 'Argentina', probability: 16.2, price: 0.162 },
      { label: 'France', probability: 14.8, price: 0.148 },
      { label: 'Khác', probability: 50.5, price: 0.505 },
    ],
  },
];

const MY_POSITIONS: PredictionEvent[] = [
  {
    id: 'btc-100k-2026',
    title: 'Bitcoin đạt $100,000 trước 31/12/2026?',
    category: 'Crypto',
    endDate: '2026-12-31',
    totalVolume: 1250000,
    totalPositions: 8420,
    outcomes: [
      { label: 'Có', probability: 68.5, price: 0.685 },
      { label: 'Không', probability: 31.5, price: 0.315 },
    ],
    myPosition: {
      outcome: 'Có',
      shares: 500,
      avgPrice: 0.62,
      currentValue: 342.5,
    },
  },
  {
    id: 'fed-rate-q3',
    title: 'Fed giảm lãi suất ít nhất 0.5% trong Q3 2026?',
    category: 'Macro',
    endDate: '2026-09-30',
    totalVolume: 1100000,
    totalPositions: 6780,
    outcomes: [
      { label: 'Có', probability: 41.2, price: 0.412 },
      { label: 'Không', probability: 58.8, price: 0.588 },
    ],
    myPosition: {
      outcome: 'Không',
      shares: 300,
      avgPrice: 0.55,
      currentValue: 176.4,
    },
  },
];

type CategoryFilter = 'all' | 'crypto' | 'politics' | 'macro' | 'tech' | 'sports' | 'business';

/* ═══════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════ */

function formatVolume(volume: number): string {
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `$${(volume / 1e3).toFixed(0)}K`;
  return `$${volume.toFixed(0)}`;
}

function getDaysUntil(dateStr: string): number {
  const now = new Date('2026-03-13'); // Current date from guidelines
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: any;
  color: string;
}) {
  const c = useThemeColors();

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: WEB_FONT.sm, color: c.text3, fontWeight: 600 }}>{label}</span>
        <Icon size={WEB_ICON.lg} color={color} />
      </div>
      <div style={{ fontSize: WEB_FONT['2xl'], fontWeight: 700, color: c.text1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: WEB_FONT.sm, color: c.text3 }}>{subtext}</div>
    </div>
  );
}

function EventCard({
  event,
  onClick,
  compact,
}: {
  event: PredictionEvent;
  onClick: () => void;
  compact?: boolean;
}) {
  const c = useThemeColors();
  const daysLeft = getDaysUntil(event.endDate);
  const topOutcome = event.outcomes[0];
  const hasPosition = !!event.myPosition;

  return (
    <div
      className="rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.01]"
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
      }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="px-2 py-1 rounded"
              style={{
                background: c.primary + '20',
                border: `1px solid ${c.primary}`,
              }}
            >
              <span style={{ fontSize: WEB_FONT.xs, fontWeight: 700, color: c.primary }}>
                {event.category.toUpperCase()}
              </span>
            </div>
            {event.isBreaking && (
              <div
                className="px-2 py-1 rounded flex items-center gap-1"
                style={{
                  background: '#EF4444' + '20',
                  border: `1px solid #EF4444`,
                }}
              >
                <Zap size={10} color="#EF4444" fill="#EF4444" />
                <span style={{ fontSize: WEB_FONT.xs, fontWeight: 700, color: '#EF4444' }}>
                  BREAKING
                </span>
              </div>
            )}
            {hasPosition && (
              <div
                className="px-2 py-1 rounded flex items-center gap-1"
                style={{
                  background: '#10B981' + '20',
                  border: `1px solid #10B981`,
                }}
              >
                <Eye size={10} color="#10B981" />
                <span style={{ fontSize: WEB_FONT.xs, fontWeight: 700, color: '#10B981' }}>
                  VỊ THẾ
                </span>
              </div>
            )}
          </div>
          <h3
            style={{
              fontSize: compact ? WEB_FONT.md : WEB_FONT.lg,
              fontWeight: 700,
              color: c.text1,
              marginBottom: 8,
              lineHeight: 1.3,
            }}
          >
            {event.title}
          </h3>
        </div>
      </div>

      {/* Outcomes */}
      {!compact && (
        <div className="mb-4">
          {event.outcomes.slice(0, 2).map((outcome) => (
            <div key={outcome.label} className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: WEB_FONT.sm, fontWeight: 600, color: c.text2 }}>
                  {outcome.label}
                </span>
                <span
                  style={{
                    fontSize: WEB_FONT.md,
                    fontWeight: 700,
                    color: c.text1,
                  }}
                >
                  {outcome.probability.toFixed(1)}%
                </span>
              </div>
              <div
                className="rounded-full overflow-hidden"
                style={{
                  height: 6,
                  background: c.divider,
                }}
              >
                <div
                  style={{
                    width: `${outcome.probability}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${c.primary}, ${c.primary}CC)`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Position */}
      {hasPosition && event.myPosition && (
        <div
          className="rounded-xl p-3 mb-4"
          style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontSize: WEB_FONT.xs, color: c.text3, marginBottom: 2 }}>
                Vị thế của bạn
              </div>
              <div style={{ fontSize: WEB_FONT.sm, fontWeight: 700, color: c.text1 }}>
                {event.myPosition.shares} shares · {event.myPosition.outcome}
              </div>
            </div>
            <div className="text-right">
              <div style={{ fontSize: WEB_FONT.xs, color: c.text3, marginBottom: 2 }}>
                Giá trị hiện tại
              </div>
              <div
                style={{
                  fontSize: WEB_FONT.md,
                  fontWeight: 700,
                  color:
                    event.myPosition.currentValue >
                    event.myPosition.shares * event.myPosition.avgPrice
                      ? '#10B981'
                      : '#EF4444',
                }}
              >
                ${event.myPosition.currentValue.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock size={WEB_ICON.sm} color={c.text3} />
            <span style={{ fontSize: WEB_FONT.sm, color: c.text3 }}>
              {daysLeft > 0 ? `${daysLeft} ngày` : 'Đã kết thúc'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign size={WEB_ICON.sm} color={c.text3} />
            <span style={{ fontSize: WEB_FONT.sm, color: c.text3 }}>
              {formatVolume(event.totalVolume)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={WEB_ICON.sm} color={c.text3} />
            <span style={{ fontSize: WEB_FONT.sm, color: c.text3 }}>
              {event.totalPositions.toLocaleString()}
            </span>
          </div>
        </div>
        {compact && topOutcome && (
          <span
            style={{
              fontSize: WEB_FONT.md,
              fontWeight: 700,
              color: c.primary,
            }}
          >
            {topOutcome.probability.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebPredictionsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleEventClick = (eventId: string) => {
    navigate(`/w/predictions/event/${eventId}`);
  };

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Prediction Markets"
        subtitle="Thị trường dự đoán sự kiện — Dựa trên xác suất và thanh khoản"
        back
        right={
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/w/predictions/portfolio')}
              className="flex items-center gap-2 rounded-xl transition-all hover:opacity-80"
              style={{
                height: WEB_BUTTON.md,
                padding: '0 20px',
                background: c.surface,
                border: `1px solid ${c.border}`,
                color: c.text1,
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
              }}
            >
              <BarChart3 size={WEB_ICON.sm} />
              <span>Portfolio</span>
            </button>
            <button
              onClick={() => navigate('/w/predictions/rewards')}
              className="flex items-center gap-2 rounded-xl transition-all hover:opacity-80"
              style={{
                height: WEB_BUTTON.md,
                padding: '0 20px',
                background: c.surface,
                border: `1px solid ${c.border}`,
                color: c.text1,
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
              }}
            >
              <Award size={WEB_ICON.sm} />
              <span>Rewards</span>
            </button>
          </div>
        }
      />
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: `${WEB_SPACING.cardRelaxed}px` }}>
        {/* ─── Risk Disclosure Banner ─── */}
        <div
          className="rounded-2xl p-4 mb-6 flex items-start gap-3"
          style={{
            background: '#F59E0B' + '15',
            border: `1px solid #F59E0B`,
          }}
        >
          <Shield size={WEB_ICON.md} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div
              style={{ fontSize: WEB_FONT.sm, fontWeight: 700, color: c.text1, marginBottom: 4 }}
            >
              Lưu ý rủi ro
            </div>
            <p style={{ fontSize: WEB_FONT.sm, color: c.text2, lineHeight: 1.5 }}>
              Prediction Markets là thị trường dự đoán có tính chất đầu cơ. Xác suất hiển thị không
              phải là chắc chắn. Bạn có thể mất toàn bộ vốn đầu tư. Chỉ tham gia với số tiền bạn có
              thể chấp nhận mất.
            </p>
          </div>
        </div>

        {/* ─── Global Stats ─── */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Tổng khối lượng 24h"
            value="$8.2M"
            subtext="+12.3% vs hôm qua"
            icon={Activity}
            color={c.primary}
          />
          <StatCard
            label="Sự kiện đang mở"
            value="247"
            subtext="15 sự kiện mới hôm nay"
            icon={TrendingUp}
            color="#10B981"
          />
          <StatCard
            label="Người tham gia"
            value="42.5K"
            subtext="Người dùng đang hoạt động"
            icon={Users}
            color="#3B82F6"
          />
          <StatCard
            label="Vị thế của bạn"
            value={MY_POSITIONS.length.toString()}
            subtext={`Giá trị: $${MY_POSITIONS.reduce((sum, p) => sum + (p.myPosition?.currentValue || 0), 0).toFixed(2)}`}
            icon={Eye}
            color="#F59E0B"
          />
        </div>

        {/* ─── Search & Filters ─── */}
        <div className="flex items-center gap-4 mb-6">
          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 flex-1"
            style={{
              height: WEB_BUTTON.md,
              maxWidth: 400,
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            <Search size={WEB_ICON.sm} color={c.text3} />
            <input
              type="text"
              placeholder="Tìm sự kiện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none"
              style={{
                color: c.text1,
                fontSize: WEB_FONT.sm,
              }}
            />
          </div>

          {/* Category Filter */}
          <div
            className="flex items-center rounded-xl p-1"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'crypto', label: 'Crypto' },
              { key: 'politics', label: 'Politics' },
              { key: 'macro', label: 'Macro' },
              { key: 'tech', label: 'Tech' },
              { key: 'sports', label: 'Sports' },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key as CategoryFilter)}
                className="rounded-lg transition-all"
                style={{
                  padding: '8px 16px',
                  background: categoryFilter === cat.key ? c.primary : 'transparent',
                  color: categoryFilter === cat.key ? '#fff' : c.text2,
                  fontSize: WEB_FONT.sm,
                  fontWeight: 600,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Main Content: 2-Column Layout ─── */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column: Breaking + Trending */}
          <div className="col-span-2">
            {/* Breaking Events */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1 }}>
                  🔥 Sự kiện nổi bật
                </h2>
                <button
                  onClick={() => navigate('/w/predictions/breaking')}
                  style={{
                    fontSize: WEB_FONT.sm,
                    fontWeight: 600,
                    color: c.primary,
                  }}
                >
                  Xem tất cả →
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {BREAKING_EVENTS.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => handleEventClick(event.id)}
                  />
                ))}
              </div>
            </div>

            {/* Trending Events */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1 }}>
                  📈 Xu hướng
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {TRENDING_EVENTS.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => handleEventClick(event.id)}
                    compact
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: My Positions + Quick Links */}
          <div className="col-span-1">
            {/* My Positions */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontSize: WEB_FONT.lg, fontWeight: 700, color: c.text1 }}>
                  Vị thế của bạn
                </h2>
                <button
                  onClick={() => navigate('/w/predictions/portfolio')}
                  style={{
                    fontSize: WEB_FONT.sm,
                    fontWeight: 600,
                    color: c.primary,
                  }}
                >
                  Xem tất cả →
                </button>
              </div>
              {MY_POSITIONS.length === 0 ? (
                <div
                  className="rounded-2xl p-6 text-center"
                  style={{
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <Eye size={32} color={c.text3} style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: WEB_FONT.sm, color: c.text3 }}>Bạn chưa có vị thế nào</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {MY_POSITIONS.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => handleEventClick(event.id)}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
              }}
            >
              <h3
                style={{ fontSize: WEB_FONT.md, fontWeight: 700, color: c.text1, marginBottom: 16 }}
              >
                Khám phá
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Leaderboard', icon: Award, path: '/w/predictions/leaderboard' },
                  { label: 'Global Activity', icon: Activity, path: '/w/predictions/activity' },
                  { label: 'Rewards', icon: DollarSign, path: '/w/predictions/rewards' },
                  { label: 'Hướng dẫn', icon: AlertCircle, path: '/w/predictions/guide' },
                ].map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-opacity-50"
                      style={{
                        background: c.bg,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={WEB_ICON.md} color={c.text2} />
                        <span style={{ fontSize: WEB_FONT.sm, fontWeight: 600, color: c.text1 }}>
                          {link.label}
                        </span>
                      </div>
                      <ChevronRight size={WEB_ICON.sm} color={c.text3} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
