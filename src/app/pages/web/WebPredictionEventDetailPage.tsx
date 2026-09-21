import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Award,
  Activity,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Zap,
  Shield,
  AlertCircle,
  Eye,
  DollarSign,
  Info,
  Share2,
  Star,
  StarOff,
  BookOpen,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Flag,
  ExternalLink,
  Copy,
  CheckCircle,
  XCircle,
  Percent,
  Layers,
  Hash,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  RefreshCw,
  AlertTriangle,
  FileText,
  Lock,
  X,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import {
  WEB_FONT,
  WEB_BUTTON,
  WEB_SPACING,
  WEB_ICON,
  WEB_FULL_BLEED_HEIGHT,
} from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/**
 * WebPredictionEventDetailPage — Prediction Market event detail
 *
 * Route: /w/predictions/:eventId
 *
 * Priorities (§9.3):
 *   1. Event title + category
 *   2. Probability / outcomes
 *   3. Chart / orderbook / trade form
 *   4. Rules / resolution source
 *   5. Related sections
 *   6. Comments / top holders / activity
 *
 * Trade Safety (§9.4):
 *   - Selected outcome, buy/sell, market/limit
 *   - Shares, estimated cost/proceeds, fee
 *   - Liquidity/slippage note, confirm action
 *
 * Hardening (§9.5, §9.6):
 *   - Trade review sheet, risk explainer
 *   - No hype, no probability → certainty
 */

/* ═══ Types ═══ */
interface Outcome {
  id: string;
  label: string;
  probability: number;
  price: number;
  change24h: number;
  volume24h: number;
  totalVolume: number;
}

interface OrderbookEntry {
  price: number;
  shares: number;
  total: number;
}

interface Comment {
  id: string;
  user: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
  outcome?: string;
}

interface TopHolder {
  rank: number;
  user: string;
  outcome: string;
  shares: number;
  value: number;
}

interface ActivityEntry {
  id: string;
  user: string;
  action: 'buy' | 'sell';
  outcome: string;
  shares: number;
  price: number;
  time: string;
}

/* ═══ Mock data ═══ */
const EVENT = {
  id: 'btc-100k-2026',
  title: 'Bitcoin đạt $100,000 trước 31/12/2026?',
  category: 'Crypto',
  categoryIcon: '₿',
  description:
    'Thị trường này sẽ được giải quyết CÓ nếu giá BTC/USD chạm hoặc vượt $100,000 trên ít nhất 3 sàn giao dịch lớn (Binance, Coinbase, Kraken) trước 23:59 UTC ngày 31/12/2026.',
  endDate: '31/12/2026',
  daysLeft: 292,
  totalVolume: 1250000,
  totalPositions: 8420,
  totalComments: 342,
  createdAt: '01/01/2026',
  resolutionSource: 'CoinGecko, Binance, Coinbase, Kraken — trung bình giá giao ngay',
  resolutionRules: [
    'Giá BTC/USD đạt hoặc vượt $100,000 trên ≥3 sàn CEX lớn',
    'Cần duy trì ≥1 phút tại mức $100,000+',
    'Giá tham chiếu: CoinGecko aggregate',
    'Thời điểm kiểm tra cuối cùng: 23:59 UTC 31/12/2026',
  ],
  tags: ['Bitcoin', 'BTC', 'Crypto', '$100K', 'Milestone'],
};

const OUTCOMES: Outcome[] = [
  {
    id: 'yes',
    label: 'Có',
    probability: 68.5,
    price: 0.685,
    change24h: 2.3,
    volume24h: 45200,
    totalVolume: 856000,
  },
  {
    id: 'no',
    label: 'Không',
    probability: 31.5,
    price: 0.315,
    change24h: -2.3,
    volume24h: 21800,
    totalVolume: 394000,
  },
];

const ORDERBOOK_BIDS: OrderbookEntry[] = [
  { price: 0.68, shares: 1200, total: 816 },
  { price: 0.675, shares: 2400, total: 1620 },
  { price: 0.67, shares: 3100, total: 2077 },
  { price: 0.665, shares: 1800, total: 1197 },
  { price: 0.66, shares: 4500, total: 2970 },
  { price: 0.655, shares: 2200, total: 1441 },
  { price: 0.65, shares: 5100, total: 3315 },
];

const ORDERBOOK_ASKS: OrderbookEntry[] = [
  { price: 0.69, shares: 800, total: 552 },
  { price: 0.695, shares: 1500, total: 1043 },
  { price: 0.7, shares: 2800, total: 1960 },
  { price: 0.705, shares: 1100, total: 776 },
  { price: 0.71, shares: 3200, total: 2272 },
  { price: 0.715, shares: 1900, total: 1359 },
  { price: 0.72, shares: 4200, total: 3024 },
];

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    user: 'crypto_analyst',
    avatar: 'CA',
    content: 'Với ETF flows và halving effect, $100k rất khả thi trong Q3-Q4.',
    time: '2 giờ trước',
    likes: 45,
    outcome: 'Có',
  },
  {
    id: 'c2',
    user: 'bear_case',
    avatar: 'BC',
    content: 'Regulatory risk vẫn còn lớn. SEC có thể có hành động enforcement trong H2.',
    time: '5 giờ trước',
    likes: 23,
    outcome: 'Không',
  },
  {
    id: 'c3',
    user: 'neutral_viewer',
    avatar: 'NV',
    content: 'Historical pattern cho thấy 18 tháng sau halving thường đạt ATH mới.',
    time: '8 giờ trước',
    likes: 67,
  },
  {
    id: 'c4',
    user: 'quant_trader',
    avatar: 'QT',
    content: 'On-chain metrics (MVRV, SOPR) đang hỗ trợ bullish thesis.',
    time: '1 ngày trước',
    likes: 38,
    outcome: 'Có',
  },
];

const TOP_HOLDERS: TopHolder[] = [
  { rank: 1, user: 'whale_alpha', outcome: 'Có', shares: 12500, value: 8562 },
  { rank: 2, user: 'smart_money', outcome: 'Có', shares: 8200, value: 5617 },
  { rank: 3, user: 'bear_master', outcome: 'Không', shares: 7800, value: 2457 },
  { rank: 4, user: 'degen_king', outcome: 'Có', shares: 5400, value: 3699 },
  { rank: 5, user: 'risk_mgr', outcome: 'Không', shares: 4100, value: 1292 },
];

const RECENT_ACTIVITY: ActivityEntry[] = [
  {
    id: 'a1',
    user: 'trader_88',
    action: 'buy',
    outcome: 'Có',
    shares: 200,
    price: 0.685,
    time: '5 phút trước',
  },
  {
    id: 'a2',
    user: 'alpha_bet',
    action: 'sell',
    outcome: 'Không',
    shares: 150,
    price: 0.315,
    time: '12 phút trước',
  },
  {
    id: 'a3',
    user: 'long_btc',
    action: 'buy',
    outcome: 'Có',
    shares: 500,
    price: 0.682,
    time: '25 phút trước',
  },
  {
    id: 'a4',
    user: 'short_sell',
    action: 'buy',
    outcome: 'Không',
    shares: 300,
    price: 0.318,
    time: '45 phút trước',
  },
  {
    id: 'a5',
    user: 'moon_boy',
    action: 'buy',
    outcome: 'Có',
    shares: 1000,
    price: 0.68,
    time: '1 giờ trước',
  },
];

const RELATED_EVENTS = [
  {
    id: 'eth-merge',
    title: 'Ethereum network uptime > 99.9% trong Q2 2026?',
    prob: 82.3,
    cat: 'Crypto',
    vol: 850000,
  },
  {
    id: 'fed-rate',
    title: 'Fed giảm lãi suất ít nhất 0.5% trong Q3 2026?',
    prob: 41.2,
    cat: 'Macro',
    vol: 1100000,
  },
  {
    id: 'sol-ath',
    title: 'Solana đạt ATH mới ($300+) trước Q4 2026?',
    prob: 35.8,
    cat: 'Crypto',
    vol: 420000,
  },
];

/* ═══ Chart placeholder data (price history) ═══ */
const PRICE_HISTORY = [
  { date: '01/01', yes: 0.45 },
  { date: '15/01', yes: 0.48 },
  { date: '01/02', yes: 0.52 },
  { date: '15/02', yes: 0.55 },
  { date: '01/03', yes: 0.62 },
  { date: '07/03', yes: 0.66 },
  { date: '14/03', yes: 0.685 },
];

/* ═══ Component ═══ */
export function WebPredictionEventDetailPage() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const c = useThemeColors();

  /* ─── State ─── */
  const [selectedOutcome, setSelectedOutcome] = useState<string>('yes');
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [sharesInput, setSharesInput] = useState('100');
  const [limitPrice, setLimitPrice] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [showRiskExplainer, setShowRiskExplainer] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'orderbook'>('chart');
  const [bottomTab, setBottomTab] = useState<'comments' | 'holders' | 'activity'>('comments');
  const [bookmarked, setBookmarked] = useState(false);
  const [expandRules, setExpandRules] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* ─── Computed ─── */
  const outcome = OUTCOMES.find((o) => o.id === selectedOutcome) || OUTCOMES[0];
  const shares = parseInt(sharesInput) || 0;
  const price = orderType === 'limit' ? parseFloat(limitPrice) || outcome.price : outcome.price;
  const estCost = shares * price;
  const fee = estCost * 0.001; // 0.1% fee
  const total = estCost + fee;
  const potentialPayout = shares * 1; // shares pay out $1 if correct
  const potentialProfit = potentialPayout - total;

  const maxBid = ORDERBOOK_BIDS[0]?.price || 0;
  const minAsk = ORDERBOOK_ASKS[0]?.price || 0;
  const spread = minAsk - maxBid;
  const maxDepth = Math.max(
    ...ORDERBOOK_BIDS.map((b) => b.shares),
    ...ORDERBOOK_ASKS.map((a) => a.shares),
  );

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    borderRadius: 14,
    background: c.surface,
    border: `1px solid ${c.borderSolid}`,
    ...extra,
  });

  const handleSubmitOrder = async () => {
    setSubmitted(true);
    await new Promise((r) => setTimeout(r, 1500));
    setShowReview(false);
    setSubmitted(false);
  };

  return (
    <PageLayout>
      {/* ─── Header ─── */}
      <div
        className="flex items-center justify-between"
        style={{
          height: 56,
          padding: '0 24px',
          borderBottom: `1px solid ${c.borderSolid}`,
          background: c.surface,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/w/predictions')}
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: c.bg,
              border: `1px solid ${c.borderSolid}`,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} color={c.text1} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 16 }}>{EVENT.categoryIcon}</span>
              <span
                style={{
                  padding: '1px 8px',
                  borderRadius: 6,
                  background: 'rgba(59,130,246,0.06)',
                  border: '1px solid rgba(59,130,246,0.12)',
                  color: '#3B82F6',
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                }}
              >
                {EVENT.category}
              </span>
              <h1
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  maxWidth: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {EVENT.title}
              </h1>
            </div>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
              Predictions &gt; {EVENT.category} &gt; {EVENT.title.slice(0, 40)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBookmarked(!bookmarked)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: c.bg,
              border: `1px solid ${c.borderSolid}`,
              cursor: 'pointer',
            }}
          >
            {bookmarked ? (
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
            ) : (
              <StarOff size={14} color={c.text3} />
            )}
          </button>
          <button
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: c.bg,
              border: `1px solid ${c.borderSolid}`,
              cursor: 'pointer',
            }}
          >
            <Share2 size={14} color={c.text3} />
          </button>
          <button
            onClick={() => setShowRiskExplainer(true)}
            className="flex items-center gap-1"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(245,158,11,0.04)',
              border: '1px solid rgba(245,158,11,0.12)',
              color: '#D97706',
              fontSize: WEB_FONT.xs,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <AlertCircle size={12} /> Rủi ro
          </button>
        </div>
      </div>

      {/* ─── Main (3-column layout) ─── */}
      <div className="flex" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* ═══ LEFT: Chart + Orderbook + Comments (flex-1) ═══ */}
        <div className="flex-1 min-w-0 overflow-y-auto" style={{ padding: '20px 24px' }}>
          <div className="flex flex-col" style={{ gap: 16 }}>
            {/* Event header / probabilities */}
            <div style={{ ...card(), padding: WEB_SPACING.cardDefault }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 mr-4">
                  <h2
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT['2xl'],
                      fontWeight: 700,
                      lineHeight: 1.3,
                      marginBottom: 8,
                    }}
                  >
                    {EVENT.title}
                  </h2>
                  <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                    {EVENT.description}
                  </p>
                </div>
                <div
                  className="flex items-center gap-1.5 shrink-0"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    background: 'rgba(59,130,246,0.04)',
                    border: '1px solid rgba(59,130,246,0.1)',
                  }}
                >
                  <Clock size={12} color="#3B82F6" />
                  <span style={{ color: '#3B82F6', fontSize: WEB_FONT.xs, fontWeight: 600 }}>
                    {EVENT.daysLeft} ngày còn lại
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex" style={{ gap: 16, marginBottom: 16 }}>
                {[
                  {
                    label: 'Khối lượng',
                    value: `$${(EVENT.totalVolume / 1000).toFixed(0)}K`,
                    icon: BarChart3,
                    color: '#3B82F6',
                  },
                  {
                    label: 'Vị thế',
                    value: EVENT.totalPositions.toLocaleString(),
                    icon: Users,
                    color: '#10B981',
                  },
                  {
                    label: 'Bình luận',
                    value: String(EVENT.totalComments),
                    icon: MessageSquare,
                    color: '#8B5CF6',
                  },
                  { label: 'Tạo lúc', value: EVENT.createdAt, icon: Clock, color: c.text3 },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <s.icon size={13} color={s.color} />
                    <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                      {s.value}
                    </span>
                    <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Outcome buttons */}
              <div className="flex" style={{ gap: 10 }}>
                {OUTCOMES.map((o) => {
                  const isYes = o.id === 'yes';
                  const accentColor = isYes ? '#10B981' : '#EF4444';
                  const isSelected = selectedOutcome === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setSelectedOutcome(o.id)}
                      className="flex-1 flex items-center justify-between cursor-pointer transition-all"
                      style={{
                        padding: '14px 16px',
                        borderRadius: 12,
                        background: isSelected ? `${accentColor}06` : c.bg,
                        border: `2px solid ${isSelected ? accentColor : c.borderSolid}`,
                      }}
                    >
                      <div>
                        <p style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                          {o.label}
                        </p>
                        <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                          Vol 24h: ${o.volume24h.toLocaleString()}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p
                          style={{
                            color: accentColor,
                            fontSize: 28,
                            fontWeight: 800,
                            lineHeight: 1,
                          }}
                        >
                          {o.probability}%
                        </p>
                        <div className="flex items-center justify-end gap-1">
                          {o.change24h > 0 ? (
                            <ArrowUpRight size={11} color="#10B981" />
                          ) : (
                            <ArrowDownRight size={11} color="#EF4444" />
                          )}
                          <span
                            style={{
                              color: o.change24h > 0 ? '#10B981' : '#EF4444',
                              fontSize: WEB_FONT.xs,
                              fontWeight: 600,
                            }}
                          >
                            {o.change24h > 0 ? '+' : ''}
                            {o.change24h}%
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chart / Orderbook tabs */}
            <div style={card()}>
              <div className="flex" style={{ borderBottom: `1px solid ${c.borderSolid}` }}>
                {[
                  { key: 'chart', label: 'Biểu đồ', icon: BarChart3 },
                  { key: 'orderbook', label: 'Sổ lệnh', icon: Layers },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key as 'chart' | 'orderbook')}
                    className="flex items-center gap-1.5"
                    style={{
                      padding: '12px 20px',
                      cursor: 'pointer',
                      background: 'none',
                      borderBottom: `2px solid ${activeTab === t.key ? '#3B82F6' : 'transparent'}`,
                      color: activeTab === t.key ? '#3B82F6' : c.text3,
                      fontSize: WEB_FONT.sm,
                      fontWeight: 600,
                      border: 'none',
                      borderBottomWidth: 2,
                      borderBottomStyle: 'solid',
                      borderBottomColor: activeTab === t.key ? '#3B82F6' : 'transparent',
                    }}
                  >
                    <t.icon size={13} />
                    {t.label}
                  </button>
                ))}
              </div>

              {activeTab === 'chart' && (
                <div style={{ padding: WEB_SPACING.cardDefault }}>
                  {/* SVG price chart */}
                  <div style={{ height: 220, position: 'relative' }}>
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 700 200"
                      preserveAspectRatio="none"
                    >
                      {/* Grid lines */}
                      {[0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((v) => {
                        const y = 200 - ((v - 0.2) / 0.7) * 200;
                        return (
                          <g key={v}>
                            <line
                              x1="0"
                              y1={y}
                              x2="700"
                              y2={y}
                              stroke={c.borderSolid}
                              strokeWidth="0.5"
                            />
                            <text x="4" y={y - 4} fill={c.text3} fontSize="10">
                              {(v * 100).toFixed(0)}¢
                            </text>
                          </g>
                        );
                      })}
                      {/* Area fill */}
                      <defs>
                        <linearGradient id="yesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.01" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`M0,${200 - ((PRICE_HISTORY[0].yes - 0.2) / 0.7) * 200} ${PRICE_HISTORY.map((p, i) => `L${(i / (PRICE_HISTORY.length - 1)) * 700},${200 - ((p.yes - 0.2) / 0.7) * 200}`).join(' ')} L700,200 L0,200 Z`}
                        fill="url(#yesGrad)"
                      />
                      {/* Line */}
                      <polyline
                        points={PRICE_HISTORY.map(
                          (p, i) =>
                            `${(i / (PRICE_HISTORY.length - 1)) * 700},${200 - ((p.yes - 0.2) / 0.7) * 200}`,
                        ).join(' ')}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Current price dot */}
                      <circle
                        cx="700"
                        cy={200 - ((PRICE_HISTORY[PRICE_HISTORY.length - 1].yes - 0.2) / 0.7) * 200}
                        r="5"
                        fill="#10B981"
                        stroke="#fff"
                        strokeWidth="2"
                      />
                    </svg>
                    {/* Labels */}
                    <div className="flex justify-between" style={{ marginTop: 4 }}>
                      {PRICE_HISTORY.map((p) => (
                        <span key={p.date} style={{ color: c.text3, fontSize: 9 }}>
                          {p.date}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p
                    style={{
                      color: c.text3,
                      fontSize: WEB_FONT.xs,
                      textAlign: 'center',
                      marginTop: 8,
                    }}
                  >
                    Xác suất "Có" — Lịch sử giá từ khi tạo thị trường
                  </p>
                </div>
              )}

              {activeTab === 'orderbook' && (
                <div style={{ padding: WEB_SPACING.cardDefault }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                      Sổ lệnh — {outcome.label}
                    </p>
                    <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                      Spread: {(spread * 100).toFixed(1)}¢
                    </span>
                  </div>
                  <div className="flex" style={{ gap: 2 }}>
                    {/* Bids */}
                    <div className="flex-1">
                      <div
                        className="flex items-center justify-between mb-2"
                        style={{ padding: '0 4px' }}
                      >
                        <span style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>GIÁ</span>
                        <span style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>SL</span>
                      </div>
                      {ORDERBOOK_BIDS.map((b) => (
                        <div
                          key={b.price}
                          className="flex items-center justify-between"
                          style={{ position: 'relative', padding: '3px 4px', marginBottom: 1 }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: 0,
                              bottom: 0,
                              width: `${(b.shares / maxDepth) * 100}%`,
                              background: 'rgba(16,185,129,0.06)',
                              borderRadius: 2,
                            }}
                          />
                          <span
                            style={{
                              color: '#10B981',
                              fontSize: WEB_FONT.xs,
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              position: 'relative',
                            }}
                          >
                            {(b.price * 100).toFixed(1)}¢
                          </span>
                          <span
                            style={{
                              color: c.text2,
                              fontSize: WEB_FONT.xs,
                              fontFamily: 'monospace',
                              position: 'relative',
                            }}
                          >
                            {b.shares.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Asks */}
                    <div className="flex-1">
                      <div
                        className="flex items-center justify-between mb-2"
                        style={{ padding: '0 4px' }}
                      >
                        <span style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>GIÁ</span>
                        <span style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>SL</span>
                      </div>
                      {ORDERBOOK_ASKS.map((a) => (
                        <div
                          key={a.price}
                          className="flex items-center justify-between"
                          style={{ position: 'relative', padding: '3px 4px', marginBottom: 1 }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: `${(a.shares / maxDepth) * 100}%`,
                              background: 'rgba(239,68,68,0.06)',
                              borderRadius: 2,
                            }}
                          />
                          <span
                            style={{
                              color: '#EF4444',
                              fontSize: WEB_FONT.xs,
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              position: 'relative',
                            }}
                          >
                            {(a.price * 100).toFixed(1)}¢
                          </span>
                          <span
                            style={{
                              color: c.text2,
                              fontSize: WEB_FONT.xs,
                              fontFamily: 'monospace',
                              position: 'relative',
                            }}
                          >
                            {a.shares.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rules / Resolution */}
            <div style={card()}>
              <button
                onClick={() => setExpandRules(!expandRules)}
                className="flex items-center justify-between"
                style={{
                  width: '100%',
                  padding: WEB_SPACING.cardDefault,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={16} color={c.text2} />
                  <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                    Luật & Nguồn giải quyết
                  </span>
                </div>
                {expandRules ? (
                  <ChevronUp size={14} color={c.text3} />
                ) : (
                  <ChevronDown size={14} color={c.text3} />
                )}
              </button>
              {expandRules && (
                <div
                  style={{
                    padding: `0 ${WEB_SPACING.cardDefault}px ${WEB_SPACING.cardDefault}px`,
                    borderTop: `1px solid ${c.borderSolid}`,
                  }}
                >
                  <div style={{ paddingTop: 14 }}>
                    <p
                      style={{
                        color: c.text2,
                        fontSize: WEB_FONT.xs,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      Nguồn giải quyết
                    </p>
                    <p style={{ color: c.text1, fontSize: WEB_FONT.sm, marginBottom: 14 }}>
                      {EVENT.resolutionSource}
                    </p>
                    <p
                      style={{
                        color: c.text2,
                        fontSize: WEB_FONT.xs,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      Điều kiện giải quyết
                    </p>
                    <div className="flex flex-col" style={{ gap: 4 }}>
                      {EVENT.resolutionRules.map((rule, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle
                            size={12}
                            color="#10B981"
                            className="shrink-0"
                            style={{ marginTop: 2 }}
                          />
                          <p style={{ color: c.text1, fontSize: WEB_FONT.sm }}>{rule}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Comments / Holders / Activity tabs */}
            <div style={card()}>
              <div className="flex" style={{ borderBottom: `1px solid ${c.borderSolid}` }}>
                {[
                  {
                    key: 'comments',
                    label: `Bình luận (${EVENT.totalComments})`,
                    icon: MessageSquare,
                  },
                  { key: 'holders', label: 'Top Holders', icon: Users },
                  { key: 'activity', label: 'Hoạt động', icon: Activity },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setBottomTab(t.key as typeof bottomTab)}
                    className="flex items-center gap-1.5"
                    style={{
                      padding: '12px 18px',
                      background: 'none',
                      cursor: 'pointer',
                      color: bottomTab === t.key ? '#3B82F6' : c.text3,
                      fontSize: WEB_FONT.sm,
                      fontWeight: 600,
                      border: 'none',
                      borderBottom: `2px solid ${bottomTab === t.key ? '#3B82F6' : 'transparent'}`,
                    }}
                  >
                    <t.icon size={13} />
                    {t.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: WEB_SPACING.cardDefault }}>
                {bottomTab === 'comments' && (
                  <div className="flex flex-col" style={{ gap: 12 }}>
                    {MOCK_COMMENTS.map((cmt) => (
                      <div key={cmt.id} className="flex items-start" style={{ gap: 10 }}>
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'rgba(59,130,246,0.06)',
                            border: `1px solid rgba(59,130,246,0.1)`,
                          }}
                        >
                          <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 700 }}>
                            {cmt.avatar}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
                            <span
                              style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}
                            >
                              {cmt.user}
                            </span>
                            {cmt.outcome && (
                              <span
                                style={{
                                  padding: '0px 6px',
                                  borderRadius: 4,
                                  background:
                                    cmt.outcome === 'Có'
                                      ? 'rgba(16,185,129,0.06)'
                                      : 'rgba(239,68,68,0.06)',
                                  color: cmt.outcome === 'Có' ? '#10B981' : '#EF4444',
                                  fontSize: 9,
                                  fontWeight: 700,
                                }}
                              >
                                {cmt.outcome}
                              </span>
                            )}
                            <span style={{ color: c.text3, fontSize: 10 }}>{cmt.time}</span>
                          </div>
                          <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                            {cmt.content}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <button
                              className="flex items-center gap-1"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: c.text3,
                                fontSize: WEB_FONT.xs,
                              }}
                            >
                              <ThumbsUp size={11} /> {cmt.likes}
                            </button>
                            <button
                              className="flex items-center gap-1"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: c.text3,
                                fontSize: WEB_FONT.xs,
                              }}
                            >
                              <MessageSquare size={11} /> Trả lời
                            </button>
                            <button
                              className="flex items-center gap-1"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: c.text3,
                                fontSize: WEB_FONT.xs,
                              }}
                            >
                              <Flag size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {bottomTab === 'holders' && (
                  <div className="flex flex-col" style={{ gap: 0 }}>
                    <div
                      className="flex items-center"
                      style={{ padding: '6px 0', marginBottom: 4 }}
                    >
                      <span style={{ width: 32, color: c.text3, fontSize: 10, fontWeight: 600 }}>
                        #
                      </span>
                      <span style={{ flex: 1, color: c.text3, fontSize: 10, fontWeight: 600 }}>
                        Người dùng
                      </span>
                      <span
                        style={{
                          width: 70,
                          color: c.text3,
                          fontSize: 10,
                          fontWeight: 600,
                          textAlign: 'center',
                        }}
                      >
                        Vị thế
                      </span>
                      <span
                        style={{
                          width: 80,
                          color: c.text3,
                          fontSize: 10,
                          fontWeight: 600,
                          textAlign: 'right',
                        }}
                      >
                        Shares
                      </span>
                      <span
                        style={{
                          width: 80,
                          color: c.text3,
                          fontSize: 10,
                          fontWeight: 600,
                          textAlign: 'right',
                        }}
                      >
                        Giá trị
                      </span>
                    </div>
                    {TOP_HOLDERS.map((h) => (
                      <div
                        key={h.rank}
                        className="flex items-center"
                        style={{ padding: '8px 0', borderTop: `1px solid ${c.borderSolid}` }}
                      >
                        <span
                          style={{
                            width: 32,
                            color: h.rank <= 3 ? '#F59E0B' : c.text3,
                            fontSize: WEB_FONT.sm,
                            fontWeight: 700,
                          }}
                        >
                          #{h.rank}
                        </span>
                        <span
                          style={{
                            flex: 1,
                            color: c.text1,
                            fontSize: WEB_FONT.sm,
                            fontWeight: 500,
                          }}
                        >
                          {h.user}
                        </span>
                        <span
                          style={{
                            width: 70,
                            textAlign: 'center',
                            padding: '1px 6px',
                            borderRadius: 4,
                            background:
                              h.outcome === 'Có' ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                            color: h.outcome === 'Có' ? '#10B981' : '#EF4444',
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          {h.outcome}
                        </span>
                        <span
                          style={{
                            width: 80,
                            color: c.text1,
                            fontSize: WEB_FONT.sm,
                            fontWeight: 600,
                            textAlign: 'right',
                            fontFamily: 'monospace',
                          }}
                        >
                          {h.shares.toLocaleString()}
                        </span>
                        <span
                          style={{
                            width: 80,
                            color: c.text2,
                            fontSize: WEB_FONT.sm,
                            textAlign: 'right',
                            fontFamily: 'monospace',
                          }}
                        >
                          ${h.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {bottomTab === 'activity' && (
                  <div className="flex flex-col" style={{ gap: 0 }}>
                    {RECENT_ACTIVITY.map((act, i) => (
                      <div
                        key={act.id}
                        className="flex items-center"
                        style={{
                          padding: '8px 0',
                          borderTop: i > 0 ? `1px solid ${c.borderSolid}` : 'none',
                          gap: 10,
                        }}
                      >
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background:
                              act.action === 'buy'
                                ? 'rgba(16,185,129,0.06)'
                                : 'rgba(239,68,68,0.06)',
                          }}
                        >
                          {act.action === 'buy' ? (
                            <TrendingUp size={13} color="#10B981" />
                          ) : (
                            <TrendingDown size={13} color="#EF4444" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                            {act.user}
                          </span>
                          <span style={{ color: c.text3, fontSize: WEB_FONT.xs, marginLeft: 6 }}>
                            {act.action === 'buy' ? 'mua' : 'bán'} {act.shares} shares "
                            {act.outcome}" @ {(act.price * 100).toFixed(1)}¢
                          </span>
                        </div>
                        <span style={{ color: c.text3, fontSize: 10, whiteSpace: 'nowrap' }}>
                          {act.time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Related events */}
            <div style={card()}>
              <div style={{ padding: WEB_SPACING.cardDefault }}>
                <h3
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.md,
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  Thị trường liên quan
                </h3>
                <div className="flex flex-col" style={{ gap: 8 }}>
                  {RELATED_EVENTS.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center cursor-pointer"
                      onClick={() => navigate(`/w/predictions/event/${ev.id}`)}
                      style={{ padding: '10px 12px', borderRadius: 10, background: c.bg, gap: 12 }}
                    >
                      <div className="flex-1 min-w-0">
                        <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                          {ev.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{ev.cat}</span>
                          <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                            Vol: ${(ev.vol / 1000).toFixed(0)}K
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: '#10B981', fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                          {ev.prob}%
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>Có</p>
                      </div>
                      <ChevronRight size={14} color={c.text3} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Arena bridge card */}
            <div style={{ ...card(), borderColor: 'rgba(139,92,246,0.15)' }}>
              <div style={{ padding: WEB_SPACING.cardDefault }}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} color="#8B5CF6" />
                  <span style={{ color: '#8B5CF6', fontSize: WEB_FONT.xs, fontWeight: 700 }}>
                    OPEN ARENA
                  </span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      padding: '1px 8px',
                      borderRadius: 6,
                      background: 'rgba(139,92,246,0.06)',
                      color: '#8B5CF6',
                      fontSize: 9,
                      fontWeight: 600,
                    }}
                  >
                    Arena Points only
                  </span>
                </div>
                <p
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.sm,
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  Open Arena có room/challenge liên quan đến chủ đề Bitcoin $100K
                </p>
                <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.4 }}>
                  Tham gia thử thách dự đoán xã hội — Arena Points only, không liên quan wallet hay
                  vị thế Prediction Markets.
                </p>
                <button
                  onClick={() => navigate('/w/arena')}
                  className="flex items-center gap-1 mt-2"
                  style={{
                    color: '#8B5CF6',
                    fontSize: WEB_FONT.xs,
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Xem Arena rooms <ChevronRight size={11} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: Trade form (340px) ═══ */}
        <div
          className="shrink-0 overflow-y-auto"
          style={{
            width: 340,
            padding: '20px',
            borderLeft: `1px solid ${c.borderSolid}`,
            background: c.bg,
          }}
        >
          <div className="flex flex-col" style={{ gap: 14 }}>
            <h3 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>Giao dịch</h3>

            {/* Buy/Sell toggle */}
            <div
              className="flex"
              style={{
                borderRadius: 10,
                background: c.surface,
                border: `1px solid ${c.borderSolid}`,
                padding: 3,
              }}
            >
              {(['buy', 'sell'] as const).map((side) => (
                <button
                  key={side}
                  onClick={() => setTradeSide(side)}
                  className="flex-1 flex items-center justify-center"
                  style={{
                    height: WEB_BUTTON.sm,
                    borderRadius: 8,
                    background:
                      tradeSide === side ? (side === 'buy' ? '#10B981' : '#EF4444') : 'transparent',
                    color: tradeSide === side ? '#fff' : c.text3,
                    fontSize: WEB_FONT.sm,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {side === 'buy' ? 'Mua' : 'Bán'}
                </button>
              ))}
            </div>

            {/* Selected outcome */}
            <div>
              <label
                style={{
                  color: c.text2,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Kết quả
              </label>
              <div className="flex" style={{ gap: 6 }}>
                {OUTCOMES.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOutcome(o.id)}
                    className="flex-1 flex items-center justify-center gap-1"
                    style={{
                      height: WEB_BUTTON.md,
                      borderRadius: 8,
                      background:
                        selectedOutcome === o.id
                          ? o.id === 'yes'
                            ? 'rgba(16,185,129,0.06)'
                            : 'rgba(239,68,68,0.06)'
                          : c.surface,
                      border: `1.5px solid ${selectedOutcome === o.id ? (o.id === 'yes' ? '#10B981' : '#EF4444') : c.borderSolid}`,
                      color:
                        selectedOutcome === o.id
                          ? o.id === 'yes'
                            ? '#10B981'
                            : '#EF4444'
                          : c.text3,
                      fontSize: WEB_FONT.sm,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {o.label} — {o.probability}%
                  </button>
                ))}
              </div>
            </div>

            {/* Market/Limit toggle */}
            <div>
              <label
                style={{
                  color: c.text2,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Loại lệnh
              </label>
              <div className="flex" style={{ gap: 6 }}>
                {(['market', 'limit'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className="flex-1"
                    style={{
                      height: WEB_BUTTON.sm,
                      borderRadius: 8,
                      background: orderType === t ? 'rgba(59,130,246,0.06)' : c.surface,
                      border: `1.5px solid ${orderType === t ? '#3B82F6' : c.borderSolid}`,
                      color: orderType === t ? '#3B82F6' : c.text3,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t === 'market' ? 'Market' : 'Limit'}
                  </button>
                ))}
              </div>
            </div>

            {/* Limit price */}
            {orderType === 'limit' && (
              <div>
                <label
                  style={{
                    color: c.text2,
                    fontSize: WEB_FONT.xs,
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Giá (¢)
                </label>
                <input
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder={`${(outcome.price * 100).toFixed(1)}¢`}
                  className="outline-none"
                  style={{
                    width: '100%',
                    height: WEB_BUTTON.md,
                    borderRadius: 8,
                    border: `1px solid ${c.borderSolid}`,
                    background: c.surface,
                    padding: '0 12px',
                    color: c.text1,
                    fontSize: WEB_FONT.sm,
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            )}

            {/* Shares */}
            <div>
              <label
                style={{
                  color: c.text2,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Số lượng shares
              </label>
              <div className="flex items-center" style={{ gap: 6 }}>
                <button
                  onClick={() => setSharesInput(String(Math.max(0, shares - 50)))}
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: WEB_BUTTON.md,
                    height: WEB_BUTTON.md,
                    borderRadius: 8,
                    background: c.surface,
                    border: `1px solid ${c.borderSolid}`,
                    cursor: 'pointer',
                  }}
                >
                  <Minus size={14} color={c.text3} />
                </button>
                <input
                  value={sharesInput}
                  onChange={(e) => setSharesInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 outline-none text-center"
                  style={{
                    height: WEB_BUTTON.md,
                    borderRadius: 8,
                    border: `1px solid ${c.borderSolid}`,
                    background: c.surface,
                    color: c.text1,
                    fontSize: WEB_FONT.md,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                />
                <button
                  onClick={() => setSharesInput(String(shares + 50))}
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: WEB_BUTTON.md,
                    height: WEB_BUTTON.md,
                    borderRadius: 8,
                    background: c.surface,
                    border: `1px solid ${c.borderSolid}`,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} color={c.text3} />
                </button>
              </div>
              <div className="flex justify-center gap-2 mt-2">
                {[50, 100, 250, 500, 1000].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSharesInput(String(n))}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: shares === n ? 'rgba(59,130,246,0.06)' : 'transparent',
                      border: `1px solid ${shares === n ? 'rgba(59,130,246,0.2)' : c.borderSolid}`,
                      color: shares === n ? '#3B82F6' : c.text3,
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div
              style={{
                padding: '12px',
                borderRadius: 10,
                background: c.surface,
                border: `1px solid ${c.borderSolid}`,
              }}
            >
              <div className="flex flex-col" style={{ gap: 6 }}>
                {[
                  { l: 'Giá mỗi share', v: `${(price * 100).toFixed(1)}¢` },
                  { l: 'Ước tính chi phí', v: `$${estCost.toFixed(2)}`, bold: true },
                  { l: 'Phí (0.1%)', v: `$${fee.toFixed(2)}` },
                  { l: 'Tổng', v: `$${total.toFixed(2)}`, bold: true },
                  {
                    l: 'Trả thưởng nếu đúng',
                    v: `$${potentialPayout.toFixed(2)}`,
                    color: '#10B981',
                  },
                  {
                    l: 'Lợi nhuận tiềm năng',
                    v: `$${potentialProfit.toFixed(2)} (${((potentialProfit / total) * 100).toFixed(1)}%)`,
                    color: potentialProfit > 0 ? '#10B981' : '#EF4444',
                  },
                ].map((r) => (
                  <div key={r.l} className="flex items-center justify-between">
                    <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{r.l}</span>
                    <span
                      style={{
                        color: r.color || (r.bold ? c.text1 : c.text2),
                        fontSize: r.bold ? WEB_FONT.sm : WEB_FONT.xs,
                        fontWeight: r.bold ? 700 : 500,
                        fontFamily: 'monospace',
                      }}
                    >
                      {r.v}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Slippage note */}
            <div
              className="flex items-start gap-2"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: 'rgba(245,158,11,0.03)',
                border: '1px solid rgba(245,158,11,0.08)',
              }}
            >
              <Info size={11} color="#F59E0B" className="shrink-0" style={{ marginTop: 2 }} />
              <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                Market orders có thể bị trượt giá. Spread hiện tại: {(spread * 100).toFixed(1)}¢.
                Thanh khoản tốt.
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={() => setShowReview(true)}
              disabled={shares <= 0}
              className="flex items-center justify-center gap-2"
              style={{
                height: WEB_BUTTON.lg,
                borderRadius: 10,
                background:
                  shares > 0 ? (tradeSide === 'buy' ? '#10B981' : '#EF4444') : c.borderSolid,
                border: 'none',
                color: '#fff',
                fontSize: WEB_FONT.md,
                fontWeight: 700,
                cursor: shares > 0 ? 'pointer' : 'not-allowed',
                opacity: shares > 0 ? 1 : 0.5,
              }}
            >
              {tradeSide === 'buy' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {tradeSide === 'buy' ? 'Mua' : 'Bán'} {outcome.label} — {shares} shares
            </button>

            {/* Disclaimer */}
            <p
              style={{
                color: c.text3,
                fontSize: 10,
                textAlign: 'center',
                lineHeight: 1.4,
                padding: '0 8px',
              }}
            >
              Giao dịch prediction markets có rủi ro. Xác suất không đảm bảo kết quả. Bạn có thể mất
              toàn bộ vốn đầu tư.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Trade Review modal ═══ */}
      {showReview && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        >
          <div
            style={{
              width: 460,
              borderRadius: 16,
              background: c.surface,
              padding: 28,
              border: `1px solid ${c.borderSolid}`,
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background:
                    tradeSide === 'buy' ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                }}
              >
                {tradeSide === 'buy' ? (
                  <TrendingUp size={22} color="#10B981" />
                ) : (
                  <TrendingDown size={22} color="#EF4444" />
                )}
              </div>
              <div>
                <h3 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                  Xem lại lệnh
                </h3>
                <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                  Kiểm tra kỹ trước khi xác nhận
                </p>
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: 10, background: c.bg, marginBottom: 16 }}>
              <div className="flex flex-col" style={{ gap: 8 }}>
                {[
                  { l: 'Thị trường', v: EVENT.title.slice(0, 45) + '...' },
                  {
                    l: 'Kết quả',
                    v: outcome.label,
                    color: outcome.id === 'yes' ? '#10B981' : '#EF4444',
                  },
                  {
                    l: 'Hướng',
                    v: tradeSide === 'buy' ? 'Mua (Long)' : 'Bán (Short)',
                    color: tradeSide === 'buy' ? '#10B981' : '#EF4444',
                  },
                  {
                    l: 'Loại lệnh',
                    v: orderType === 'market' ? 'Market' : `Limit @ ${(price * 100).toFixed(1)}¢`,
                  },
                  { l: 'Shares', v: shares.toLocaleString(), bold: true },
                  { l: 'Giá mỗi share', v: `${(price * 100).toFixed(1)}¢` },
                  { l: 'Ước tính chi phí', v: `$${estCost.toFixed(2)}`, bold: true },
                  { l: 'Phí', v: `$${fee.toFixed(2)}` },
                  { l: 'Tổng', v: `$${total.toFixed(2)}`, bold: true },
                  { l: 'Trả thưởng tối đa', v: `$${potentialPayout.toFixed(2)}`, color: '#10B981' },
                ].map((r) => (
                  <div key={r.l} className="flex items-center justify-between">
                    <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{r.l}</span>
                    <span
                      style={{
                        color: r.color || (r.bold ? c.text1 : c.text2),
                        fontSize: r.bold ? WEB_FONT.md : WEB_FONT.sm,
                        fontWeight: r.bold ? 700 : 500,
                      }}
                    >
                      {r.v}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="flex items-start gap-2 mb-4"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: 'rgba(245,158,11,0.03)',
                border: '1px solid rgba(245,158,11,0.08)',
              }}
            >
              <AlertTriangle
                size={12}
                color="#F59E0B"
                className="shrink-0"
                style={{ marginTop: 2 }}
              />
              <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.4 }}>
                Xác suất hiện tại ({outcome.probability}%) không đảm bảo kết quả. Bạn có thể mất
                toàn bộ chi phí nếu kết quả khác dự đoán.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReview(false)}
                className="flex-1"
                style={{
                  height: WEB_BUTTON.lg,
                  borderRadius: 10,
                  background: c.bg,
                  border: `1px solid ${c.borderSolid}`,
                  color: c.text2,
                  fontSize: WEB_FONT.md,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Quay lại
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={submitted}
                className="flex-1 flex items-center justify-center gap-2"
                style={{
                  height: WEB_BUTTON.lg,
                  borderRadius: 10,
                  background: tradeSide === 'buy' ? '#10B981' : '#EF4444',
                  border: 'none',
                  color: '#fff',
                  fontSize: WEB_FONT.md,
                  fontWeight: 700,
                  cursor: submitted ? 'not-allowed' : 'pointer',
                  opacity: submitted ? 0.7 : 1,
                }}
              >
                {submitted ? (
                  <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <CheckCircle size={14} />
                )}
                Xác nhận lệnh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Risk Explainer modal ═══ */}
      {showRiskExplainer && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        >
          <div
            style={{
              width: 480,
              borderRadius: 16,
              background: c.surface,
              padding: 28,
              border: `1px solid ${c.borderSolid}`,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(245,158,11,0.06)',
                  }}
                >
                  <AlertTriangle size={22} color="#F59E0B" />
                </div>
                <h3 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                  Thông tin rủi ro
                </h3>
              </div>
              <button
                onClick={() => setShowRiskExplainer(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} color={c.text3} />
              </button>
            </div>

            <div className="flex flex-col" style={{ gap: 14 }}>
              {[
                {
                  t: 'Mất vốn',
                  d: 'Bạn có thể mất toàn bộ chi phí mua shares nếu kết quả khác dự đoán.',
                },
                {
                  t: 'Xác suất ≠ chắc chắn',
                  d: 'Xác suất 68.5% không có nghĩa sự kiện chắc chắn xảy ra. Đây chỉ là ước tính thị trường.',
                },
                {
                  t: 'Thanh khoản',
                  d: 'Có thể khó bán shares nếu thanh khoản thấp. Spread có thể ảnh hưởng giá thực tế.',
                },
                {
                  t: 'Thời gian',
                  d: 'Thị trường chỉ được giải quyết khi sự kiện xảy ra hoặc hết thời hạn. Vốn bị khóa trong thời gian này.',
                },
                {
                  t: 'Nguồn giải quyết',
                  d: 'Kết quả phụ thuộc vào nguồn giải quyết đã công bố. Tranh chấp có thể phát sinh.',
                },
              ].map((r) => (
                <div key={r.t}>
                  <p
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.sm,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    {r.t}
                  </p>
                  <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>{r.d}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowRiskExplainer(false)}
              className="mt-6"
              style={{
                width: '100%',
                height: WEB_BUTTON.md,
                borderRadius: 10,
                background: '#3B82F6',
                border: 'none',
                color: '#fff',
                fontSize: WEB_FONT.md,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Tôi đã hiểu
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
