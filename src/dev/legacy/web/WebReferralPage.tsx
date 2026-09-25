/**
 * ══════════════════════════════════════════════════════════
 *  ARCHIVED WEB REFERRAL PROTOTYPE — v7 "Enterprise Glassmorphism"
 * ══════════════════════════════════════════════════════════
 *
 *  Development-only mock. Production referral routes are owned by
 *  `src/features/referral` and this file is not referenced by the router.
 *
 *  Redesigned cards with subtle gradients, glass effects,
 *  compact layout, and refined typography hierarchy.
 *
 *  Token compliance: WEB_FONT, WEB_BUTTON, useThemeColors canonical only.
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  Share2,
  QrCode,
  Award,
  Clock,
  Check,
  ChevronRight,
  ChevronDown,
  Download,
  Mail,
  BarChart3,
  ArrowUpRight,
  Shield,
  Info,
  ExternalLink,
  Search,
  Sparkles,
  Zap,
  UserPlus,
  Wallet,
  CircleDollarSign,
  Trophy,
  Bell,
  AlertTriangle,
  Star,
  Timer,
  Link2,
  Send,
  XCircle,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON } from '@/shared/theme/webTokens';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { Header } from '@/shared/ui/layout/Header';

/* ═══════════════════════════════════════════════════════════
   TYPES & DATA
   ═══════════════════════════════════════════════════════════ */

interface TierInfo {
  name: string;
  nameVi: string;
  min: number;
  rate: number;
  kycBonus: number;
  color: string;
  icon: React.ElementType;
}
interface Friend {
  id: string;
  name: string;
  email: string;
  joined: string;
  kyc: number;
  vol: number;
  comm: number;
  status: string;
  lastActive: string;
}
interface CommEntry {
  id: string;
  date: string;
  friend: string;
  type: string;
  pair?: string;
  vol?: number;
  rate: number;
  amount: number;
  status: string;
}
interface Reward {
  id: string;
  type: string;
  desc: string;
  amount: number;
  date: string;
  status: string;
}

const TIER_IDX = 2;
const TIERS: TierInfo[] = [
  {
    name: 'Standard',
    nameVi: 'Cơ bản',
    min: 0,
    rate: 20,
    kycBonus: 5,
    color: '#94A3B8',
    icon: Users,
  },
  { name: 'Bronze', nameVi: 'Đồng', min: 5, rate: 22, kycBonus: 6, color: '#CD7F32', icon: Award },
  { name: 'Silver', nameVi: 'Bạc', min: 8, rate: 25, kycBonus: 8, color: '#A0AEC0', icon: Shield },
  { name: 'Gold', nameVi: 'Vàng', min: 25, rate: 30, kycBonus: 12, color: '#F59E0B', icon: Trophy },
  {
    name: 'Platinum',
    nameVi: 'Bạch Kim',
    min: 50,
    rate: 35,
    kycBonus: 15,
    color: '#8B5CF6',
    icon: Sparkles,
  },
  {
    name: 'Diamond',
    nameVi: 'Kim Cương',
    min: 100,
    rate: 40,
    kycBonus: 20,
    color: '#06B6D4',
    icon: Star,
  },
];

const CODE = 'VITTA-A2B3C';
const LINK = 'https://app.exchange.vn/ref/VITTA-A2B3C';

const S = {
  friends: 8,
  active: 5,
  kycPending: 2,
  totalComm: 128.9,
  monthComm: 42.3,
  pending: 10.0,
  vol: 69200,
  rate: 25,
  kycBonus: 8,
};

const CAMPAIGN = {
  title: 'Tháng 3 Bùng Nổ',
  badge: 'x2 Thưởng KYC',
  days: 29,
  people: 1247,
  prize: 'Top 10 người mời nhiều nhất nhận thêm 500 USDT',
};

const FRIENDS: Friend[] = [
  {
    id: 'f1',
    name: 'Nguyễn Văn A',
    email: 'n***a@email.com',
    joined: '2026-02-15',
    kyc: 2,
    vol: 18500,
    comm: 37,
    status: 'active',
    lastActive: '2 giờ trước',
  },
  {
    id: 'f2',
    name: 'Trần Thị B',
    email: 't***b@email.com',
    joined: '2026-01-20',
    kyc: 2,
    vol: 12800,
    comm: 25.6,
    status: 'active',
    lastActive: '30 phút trước',
  },
  {
    id: 'f3',
    name: 'Lê Văn C',
    email: 'l***c@email.com',
    joined: '2025-12-10',
    kyc: 3,
    vol: 25400,
    comm: 50.8,
    status: 'active',
    lastActive: '1 ngày trước',
  },
  {
    id: 'f4',
    name: 'Phạm Thị D',
    email: 'p***d@email.com',
    joined: '2025-11-05',
    kyc: 1,
    vol: 3200,
    comm: 6.4,
    status: 'inactive',
    lastActive: '15 ngày trước',
  },
  {
    id: 'f5',
    name: 'Hoàng Văn E',
    email: 'h***e@email.com',
    joined: '2026-03-01',
    kyc: 2,
    vol: 9300,
    comm: 9.1,
    status: 'active',
    lastActive: '5 giờ trước',
  },
  {
    id: 'f6',
    name: 'Vũ Thị F',
    email: 'v***f@email.com',
    joined: '2026-03-08',
    kyc: 0,
    vol: 0,
    comm: 0,
    status: 'pending_kyc',
    lastActive: '—',
  },
  {
    id: 'f7',
    name: 'Đặng Minh G',
    email: 'd***g@email.com',
    joined: '2026-03-10',
    kyc: 0,
    vol: 0,
    comm: 0,
    status: 'pending_kyc',
    lastActive: '—',
  },
  {
    id: 'f8',
    name: 'Bùi Thị H',
    email: 'b***h@email.com',
    joined: '2026-02-20',
    kyc: 1,
    vol: 0,
    comm: 0,
    status: 'inactive',
    lastActive: '20 ngày trước',
  },
];

const COMMS: CommEntry[] = [
  {
    id: 'c1',
    date: '2026-03-13',
    friend: 'Lê Văn C',
    type: 'spot',
    pair: 'BTC/USDT',
    vol: 8200,
    rate: 25,
    amount: 8.2,
    status: 'paid',
  },
  {
    id: 'c2',
    date: '2026-03-12',
    friend: 'Nguyễn Văn A',
    type: 'spot',
    pair: 'ETH/USDT',
    vol: 5400,
    rate: 25,
    amount: 5.4,
    status: 'paid',
  },
  {
    id: 'c3',
    date: '2026-03-11',
    friend: 'Trần Thị B',
    type: 'p2p',
    pair: 'USDT/VND',
    vol: 3800,
    rate: 25,
    amount: 3.8,
    status: 'processing',
  },
  {
    id: 'c4',
    date: '2026-03-10',
    friend: 'Hoàng Văn E',
    type: 'spot',
    pair: 'SOL/USDT',
    vol: 2100,
    rate: 25,
    amount: 2.1,
    status: 'paid',
  },
  {
    id: 'c5',
    date: '2026-03-09',
    friend: 'Lê Văn C',
    type: 'spot',
    pair: 'BNB/USDT',
    vol: 4500,
    rate: 25,
    amount: 4.5,
    status: 'paid',
  },
  {
    id: 'c6',
    date: '2026-03-08',
    friend: 'Nguyễn Văn A',
    type: 'kyc_bonus',
    rate: 0,
    amount: 8.0,
    status: 'paid',
  },
  {
    id: 'c7',
    date: '2026-03-07',
    friend: 'Trần Thị B',
    type: 'spot',
    pair: 'ADA/USDT',
    vol: 1900,
    rate: 25,
    amount: 1.9,
    status: 'pending',
  },
];

const REWARDS: Reward[] = [
  {
    id: 'rw1',
    type: 'kyc_bonus',
    desc: 'KYC bonus — Hoàng Văn E hoàn tất xác minh',
    amount: 8,
    date: '2026-03-01',
    status: 'claimed',
  },
  {
    id: 'rw2',
    type: 'campaign',
    desc: 'Tháng 3 Bùng Nổ — x2 KYC bonus khả dụng',
    amount: 16,
    date: '2026-03-10',
    status: 'available',
  },
  {
    id: 'rw3',
    type: 'tier_bonus',
    desc: 'Thăng hạng Silver — one-time bonus',
    amount: 5,
    date: '2026-01-15',
    status: 'claimed',
  },
  {
    id: 'rw4',
    type: 'kyc_bonus',
    desc: 'KYC bonus — Trần Thị B hoàn tất xác minh',
    amount: 8,
    date: '2025-12-20',
    status: 'claimed',
  },
];

/* ─── helpers ─── */
const fmt = (v: number, compact = false) => {
  if (compact && v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (compact && v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
const statusBadge = (s: string) => {
  const m: Record<string, { l: string; bg: string; fg: string }> = {
    active: { l: 'Active', bg: '#10B98114', fg: '#10B981' },
    inactive: { l: 'Inactive', bg: '#94A3B814', fg: '#64748B' },
    pending_kyc: { l: 'Chờ KYC', bg: '#F59E0B14', fg: '#F59E0B' },
    paid: { l: 'Đã trả', bg: '#10B98114', fg: '#10B981' },
    pending: { l: 'Chờ xử lý', bg: '#F59E0B14', fg: '#F59E0B' },
    processing: { l: 'Đang xử lý', bg: '#3B82F614', fg: '#3B82F6' },
    claimed: { l: 'Đã nhận', bg: '#10B98114', fg: '#10B981' },
    available: { l: 'Khả dụng', bg: '#3B82F614', fg: '#3B82F6' },
    expired: { l: 'Hết hạn', bg: '#EF444414', fg: '#EF4444' },
  };
  return m[s] || { l: s, bg: '#94A3B814', fg: '#64748B' };
};
const typeLabel = (t: string) =>
  ({
    spot: 'Spot',
    p2p: 'P2P',
    futures: 'Futures',
    kyc_bonus: 'KYC Bonus',
    campaign: 'Chiến dịch',
    tier_bonus: 'Tier Bonus',
    top_referrer: 'Top Ref',
  })[t] || t;

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebReferralPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'friends' | 'comms' | 'rewards'>('friends');
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [q, setQ] = useState('');
  const [sf, setSf] = useState('all');
  const [tiersOpen, setTiersOpen] = useState(false);
  const [campaignVisible, setCampaignVisible] = useState(true);

  const tier = TIERS[TIER_IDX];
  const next = TIERS[TIER_IDX + 1] || null;
  const prog = next ? ((S.friends - tier.min) / (next.min - tier.min)) * 100 : 100;

  const friends = useMemo(() => {
    let l = FRIENDS;
    if (sf !== 'all') l = l.filter((f) => f.status === sf);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((f) => f.name.toLowerCase().includes(s));
    }
    return l;
  }, [sf, q]);

  const copyCode = () => {
    navigator.clipboard.writeText(CODE);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };
  const copyLink = () => {
    navigator.clipboard.writeText(LINK);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  /* ─── shared style tokens ─── */
  const R = 12;
  const bdr = `1px solid ${c.border}`;

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 14px',
    color: c.text3,
    fontSize: WEB_FONT.xs,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: `1px solid ${c.divider}`,
    background: c.bg,
    whiteSpace: 'nowrap',
  };
  const tdStyle: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: WEB_FONT.base,
    borderBottom: `1px solid ${c.divider}`,
    color: c.text2,
  };

  /* ═══════════════════════════════════════════════════════════ */

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Giới thiệu bạn bè"
        subtitle="Chương trình · Referral"
        back
        right={
          <button
            className="flex items-center gap-1.5 transition-colors"
            style={{
              height: WEB_BUTTON.sm,
              padding: '0 12px',
              borderRadius: 8,
              background: c.surface,
              border: bdr,
              color: c.text2,
              fontSize: WEB_FONT.xs,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={14} /> Xuất báo cáo
          </button>
        }
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          paddingTop: 16,
          paddingBottom: 48,
        }}
      >
        {/* ═══════════════════════════════════════════════════════
            S1: CAMPAIGN BANNER — vibrant gradient card
            ═══════════════════════════════════════════════════════ */}
        {campaignVisible && (
          <div
            style={{
              borderRadius: R,
              overflow: 'hidden',
              position: 'relative',
              background: 'linear-gradient(135deg, #1E293B 0%, #312E81 40%, #4C1D95 100%)',
              padding: '16px 20px',
            }}
          >
            {/* Decorative circles */}
            <div
              style={{
                position: 'absolute',
                right: -20,
                top: -20,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'rgba(168,85,247,0.12)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 80,
                bottom: -30,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(59,130,246,0.08)',
              }}
            />

            <div className="flex items-center justify-between relative" style={{ zIndex: 1 }}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(251,191,36,0.15)',
                    border: '1px solid rgba(251,191,36,0.25)',
                  }}
                >
                  <Zap size={18} color="#FBBF24" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 2 }}>
                    <span style={{ color: '#fff', fontSize: WEB_FONT.md, fontWeight: 700 }}>
                      {CAMPAIGN.title}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-md shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #F59E0B, #F97316)',
                        color: '#fff',
                        fontSize: WEB_FONT.xs,
                        fontWeight: 700,
                      }}
                    >
                      {CAMPAIGN.badge}
                    </span>
                  </div>
                  <div className="flex items-center gap-3" style={{ marginTop: 2 }}>
                    <span
                      className="flex items-center gap-1"
                      style={{ color: 'rgba(255,255,255,0.7)', fontSize: WEB_FONT.sm }}
                    >
                      <Timer size={12} /> Còn {CAMPAIGN.days} ngày
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                    <span
                      className="flex items-center gap-1"
                      style={{ color: 'rgba(255,255,255,0.7)', fontSize: WEB_FONT.sm }}
                    >
                      <Users size={12} /> {CAMPAIGN.people.toLocaleString()} tham gia
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                    <span
                      className="flex items-center gap-1"
                      style={{ color: '#FBBF24', fontSize: WEB_FONT.sm }}
                    >
                      <Trophy size={12} /> {CAMPAIGN.prize}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button
                  className="flex items-center gap-1.5"
                  style={{
                    height: WEB_BUTTON.sm,
                    padding: '0 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: WEB_FONT.xs,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Chi tiết <ChevronRight size={12} />
                </button>
                <button
                  onClick={() => setCampaignVisible(false)}
                  className="flex items-center justify-center"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: 'rgba(255,255,255,0.08)',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  <XCircle size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            S1.5: WARNING + KYC REMINDER — compact inline banners
            ═══════════════════════════════════════════════════════ */}
        <div className="flex items-stretch gap-3">
          {/* Warning banner */}
          <div
            className="flex items-center gap-2.5 flex-1 min-w-0"
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: '#FBBF2408',
              border: '1px solid #FBBF2418',
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: 24, height: 24, borderRadius: 6, background: '#FBBF2412' }}
            >
              <AlertTriangle size={12} color="#F59E0B" />
            </div>
            <span style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.4 }}>
              Nghiêm cấm tự giới thiệu, tạo tài khoản ảo, hoặc gian lận hoa hồng. Vi phạm sẽ bị khóa
              tài khoản và thu hồi thưởng.
            </span>
          </div>

          {/* KYC reminder */}
          {S.kycPending > 0 && (
            <div
              className="flex items-center gap-2.5 cursor-pointer shrink-0"
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: '#3B82F608',
                border: '1px solid #3B82F618',
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: 24, height: 24, borderRadius: 6, background: '#3B82F612' }}
              >
                <Bell size={12} color="#3B82F6" />
              </div>
              <div>
                <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                  {S.kycPending} bạn bè chưa hoàn tất KYC
                </span>
                <span style={{ color: c.text3, fontSize: WEB_FONT.xs, marginLeft: 6 }}>
                  Nhắc họ để nhận thưởng ${S.kycBonus}.00/người
                </span>
              </div>
              <ChevronRight size={14} color={c.text3} />
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            S2: MAIN CONTENT — 2-column hero layout
            LEFT: Tier card + Stats    RIGHT: Share & Code
            ═══════════════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
          {/* ─── LEFT COLUMN ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Tier Card */}
            <div
              style={{
                borderRadius: R,
                overflow: 'hidden',
                position: 'relative',
                background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 45%, #2563EB 100%)',
              }}
            >
              {/* Decorative elements */}
              <div
                style={{
                  position: 'absolute',
                  right: -30,
                  top: -30,
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  background: 'rgba(96,165,250,0.08)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '40%',
                  bottom: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'rgba(147,51,234,0.06)',
                }}
              />

              <div style={{ padding: '20px 24px', position: 'relative', zIndex: 1 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <tier.icon size={22} color="#fff" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: '#fff', fontSize: WEB_FONT.xl, fontWeight: 800 }}>
                          Hạng {tier.nameVi}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md"
                          style={{
                            background: 'rgba(255,255,255,0.12)',
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: WEB_FONT.xs,
                            fontWeight: 600,
                          }}
                        >
                          {tier.name}
                        </span>
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: WEB_FONT.sm }}>
                        Hoa hồng {tier.rate}% + ${tier.kycBonus}.00/KYC
                      </span>
                    </div>
                  </div>

                  {/* Progress to next tier */}
                  {next && (
                    <div style={{ textAlign: 'right' }}>
                      <div
                        className="flex items-center gap-2"
                        style={{ marginBottom: 4, justifyContent: 'flex-end' }}
                      >
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: WEB_FONT.xs }}>
                          Tiến tới
                        </span>
                        <span style={{ color: next.color, fontSize: WEB_FONT.sm, fontWeight: 700 }}>
                          {next.name}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2"
                        style={{ justifyContent: 'flex-end' }}
                      >
                        <div
                          style={{
                            width: 100,
                            height: 5,
                            borderRadius: 3,
                            background: 'rgba(255,255,255,0.1)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(prog, 100)}%`,
                              background: `linear-gradient(90deg, ${tier.color}, ${next.color})`,
                              transition: 'width 0.4s',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: WEB_FONT.xs,
                            fontWeight: 700,
                            fontFamily: 'monospace',
                          }}
                        >
                          {S.friends}/{next.min}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats row inside tier card */}
              <div
                className="grid grid-cols-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                {[
                  {
                    label: 'Bạn bè',
                    value: String(S.friends),
                    sub: `${S.active} hoạt động`,
                    color: '#A78BFA',
                  },
                  {
                    label: 'Hoa hồng',
                    value: fmt(S.totalComm),
                    sub: 'Tổng tích lũy',
                    color: '#34D399',
                  },
                  {
                    label: 'Khối lượng',
                    value: fmt(S.vol, true),
                    sub: 'Từ giới thiệu',
                    color: '#FBBF24',
                  },
                ].map((item, idx) => (
                  <div
                    key={item.label}
                    style={{
                      padding: '14px 20px',
                      borderRight: idx < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        color: 'rgba(255,255,255,0.45)',
                        fontSize: WEB_FONT.xs,
                        marginBottom: 4,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        color: item.color,
                        fontSize: WEB_FONT['2xl'],
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        lineHeight: 1,
                      }}
                    >
                      {item.value}
                    </div>
                    <div
                      style={{
                        color: 'rgba(255,255,255,0.35)',
                        fontSize: WEB_FONT.xs,
                        marginTop: 3,
                      }}
                    >
                      {item.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pending notice */}
              {S.pending > 0 && (
                <div
                  className="flex items-center gap-2"
                  style={{
                    padding: '8px 20px',
                    background: 'rgba(251,191,36,0.06)',
                    borderTop: '1px solid rgba(251,191,36,0.1)',
                  }}
                >
                  <Clock size={12} color="#FBBF24" />
                  <span style={{ color: '#FBBF24', fontSize: WEB_FONT.xs, fontWeight: 600 }}>
                    {fmt(S.pending)} đang chờ xử lý
                  </span>
                </div>
              )}
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-4 gap-3">
              {[
                {
                  icon: DollarSign,
                  label: 'Hoa hồng tháng',
                  value: fmt(S.monthComm),
                  delta: '+23%',
                  color: '#10B981',
                },
                {
                  icon: Users,
                  label: 'Bạn bè active',
                  value: `${S.active}/${S.friends}`,
                  delta: `${S.kycPending} chờ KYC`,
                  color: '#8B5CF6',
                },
                {
                  icon: TrendingUp,
                  label: 'Tỷ lệ hiện tại',
                  value: `${S.rate}%`,
                  delta: `+$${S.kycBonus}/KYC`,
                  color: '#3B82F6',
                },
                {
                  icon: Wallet,
                  label: 'KL giao dịch',
                  value: fmt(S.vol, true),
                  delta: 'Từ referral',
                  color: '#F59E0B',
                },
              ].map((kpi) => {
                const KI = kpi.icon;
                return (
                  <div
                    key={kpi.label}
                    style={{
                      borderRadius: 10,
                      padding: '14px 16px',
                      background: c.surface,
                      border: bdr,
                      transition: 'box-shadow 0.15s',
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.boxShadow = `0 2px 12px ${kpi.color}08`)
                    }
                    onMouseOut={(e) => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          background: `${kpi.color}10`,
                        }}
                      >
                        <KI size={13} color={kpi.color} />
                      </div>
                      <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{kpi.label}</span>
                    </div>
                    <div
                      style={{
                        color: c.text1,
                        fontSize: WEB_FONT.lg,
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        lineHeight: 1,
                      }}
                    >
                      {kpi.value}
                    </div>
                    <div className="flex items-center gap-1" style={{ marginTop: 4 }}>
                      {kpi.delta.startsWith('+') && <ArrowUpRight size={10} color="#10B981" />}
                      <span
                        style={{
                          color: kpi.delta.startsWith('+') ? '#10B981' : c.text3,
                          fontSize: WEB_FONT.xs,
                        }}
                      >
                        {kpi.delta}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Share & Code ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Referral Code Card */}
            <div
              style={{
                borderRadius: R,
                overflow: 'hidden',
                background: c.surface,
                border: bdr,
              }}
            >
              <div style={{ padding: '20px' }}>
                {/* Header */}
                <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
                  <div
                    className="flex items-center justify-center"
                    style={{ width: 32, height: 32, borderRadius: 8, background: '#3B82F610' }}
                  >
                    <Link2 size={16} color="#3B82F6" />
                  </div>
                  <div>
                    <div style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                      Mã giới thiệu
                    </div>
                    <div style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                      Chia sẻ để nhận thưởng
                    </div>
                  </div>
                </div>

                {/* Code display */}
                <div
                  className="flex items-center justify-between"
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    marginBottom: 10,
                    background: `linear-gradient(135deg, #3B82F608 0%, #8B5CF608 100%)`,
                    border: '1.5px dashed #3B82F630',
                  }}
                >
                  <span
                    style={{
                      color: c.text1,
                      fontSize: 20,
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      fontFamily: 'monospace',
                    }}
                  >
                    {CODE}
                  </span>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 shrink-0"
                    style={{
                      height: WEB_BUTTON.sm,
                      padding: '0 14px',
                      borderRadius: 8,
                      background: codeCopied
                        ? '#10B981'
                        : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                      color: '#fff',
                      fontSize: WEB_FONT.sm,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {codeCopied ? <Check size={13} /> : <Copy size={13} />}
                    {codeCopied ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                </div>

                {/* Link row */}
                <div
                  className="flex items-center gap-2"
                  style={{
                    padding: '4px 4px 4px 12px',
                    borderRadius: 8,
                    background: c.bg,
                    border: bdr,
                    marginBottom: 16,
                  }}
                >
                  <span
                    className="flex-1 truncate"
                    style={{ color: c.text3, fontSize: WEB_FONT.xs, fontFamily: 'monospace' }}
                  >
                    {LINK}
                  </span>
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-1.5 shrink-0"
                    style={{
                      height: WEB_BUTTON.xs,
                      padding: '0 10px',
                      borderRadius: 6,
                      background: linkCopied ? '#10B981' : c.surface,
                      border: linkCopied ? 'none' : bdr,
                      color: linkCopied ? '#fff' : c.text2,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {linkCopied ? <Check size={11} /> : <Copy size={11} />}
                    {linkCopied ? 'Copied' : 'Copy link'}
                  </button>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-2 gap-2" style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #10B98108, #10B98104)',
                      border: '1px solid #10B98118',
                    }}
                  >
                    <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                      <Gift size={13} color="#10B981" />
                      <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Bạn nhận</span>
                    </div>
                    <div style={{ color: '#10B981', fontSize: WEB_FONT.md, fontWeight: 700 }}>
                      ${S.kycBonus}.00 + {S.rate}%
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #3B82F608, #3B82F604)',
                      border: '1px solid #3B82F618',
                    }}
                  >
                    <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                      <UserPlus size={13} color="#3B82F6" />
                      <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Bạn bè nhận</span>
                    </div>
                    <div style={{ color: '#3B82F6', fontSize: WEB_FONT.md, fontWeight: 700 }}>
                      5 USDT + giảm phí
                    </div>
                  </div>
                </div>

                {/* Share CTA */}
                <button
                  onClick={copyLink}
                  className="flex items-center justify-center gap-2 w-full"
                  style={{
                    height: WEB_BUTTON.lg,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    color: '#fff',
                    fontSize: WEB_FONT.md,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.35)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.25)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Share2 size={16} /> Sao chép link giới thiệu
                </button>
              </div>

              {/* Share channels footer */}
              <div
                className="flex items-center justify-center gap-2"
                style={{
                  padding: '10px 20px',
                  background: c.bg,
                  borderTop: `1px solid ${c.divider}`,
                }}
              >
                <span style={{ color: c.text3, fontSize: WEB_FONT.xs, marginRight: 4 }}>
                  Chia sẻ qua:
                </span>
                {[
                  { i: QrCode, l: 'QR' },
                  { i: Send, l: 'Telegram' },
                  { i: Mail, l: 'Email' },
                  { i: ExternalLink, l: 'X' },
                  { i: Share2, l: 'Thêm' },
                ].map((ch) => (
                  <button
                    key={ch.l}
                    className="flex items-center gap-1 transition-colors"
                    style={{
                      height: 26,
                      padding: '0 8px',
                      borderRadius: 6,
                      background: c.surface,
                      border: bdr,
                      color: c.text3,
                      fontSize: WEB_FONT.xs,
                      cursor: 'pointer',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#3B82F650';
                      e.currentTarget.style.color = '#3B82F6';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = c.border;
                      e.currentTarget.style.color = c.text3;
                    }}
                  >
                    <ch.i size={11} />
                    {ch.l}
                  </button>
                ))}
              </div>
            </div>

            {/* How it works — compact vertical steps */}
            <div
              style={{
                borderRadius: R,
                overflow: 'hidden',
                background: c.surface,
                border: bdr,
                padding: '16px 18px',
              }}
            >
              <div
                style={{ color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 700, marginBottom: 12 }}
              >
                Cách hoạt động
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { s: 1, i: Share2, t: 'Chia sẻ link giới thiệu', color: '#3B82F6' },
                  { s: 2, i: UserPlus, t: 'Bạn bè đăng ký & xác minh KYC', color: '#8B5CF6' },
                  { s: 3, i: BarChart3, t: 'Bạn bè giao dịch trên sàn', color: '#F59E0B' },
                  { s: 4, i: CircleDollarSign, t: 'Nhận hoa hồng trọn đời', color: '#10B981' },
                ].map((step, idx) => {
                  const SI = step.i;
                  return (
                    <div key={step.s} className="flex items-center gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: `${step.color}10`,
                            border: `1px solid ${step.color}20`,
                          }}
                        >
                          <SI size={13} color={step.color} />
                        </div>
                        {idx < 3 && (
                          <div
                            style={{ width: 1, height: 6, background: c.border, marginTop: 2 }}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <span
                          style={{
                            color: step.color,
                            fontSize: WEB_FONT.xs,
                            fontWeight: 700,
                            minWidth: 14,
                          }}
                        >
                          {step.s}.
                        </span>
                        <span style={{ color: c.text1, fontSize: WEB_FONT.sm }}>{step.t}</span>
                      </div>
                      {idx < 3 && (
                        <ArrowRight size={10} color={c.text3} className="shrink-0 opacity-30" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            S3: TIER PROGRESSION BAR — compact
            ═══════════════════════════════════════════════════════ */}
        <div style={{ background: c.surface, border: bdr, borderRadius: R, padding: '14px 20px' }}>
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: tiersOpen ? 14 : 0 }}
          >
            <div className="flex items-center gap-0 flex-1" style={{ marginRight: 16 }}>
              {TIERS.map((t, i) => {
                const reached = i <= TIER_IDX;
                const curr = i === TIER_IDX;
                const TI = t.icon;
                return (
                  <div key={t.name} className="flex items-center" style={{ display: 'contents' }}>
                    {i > 0 && (
                      <div
                        className="flex-1"
                        style={{
                          height: 2,
                          background: reached
                            ? `linear-gradient(90deg, ${TIERS[i - 1].color}, ${t.color})`
                            : c.border,
                          margin: '0 -1px',
                          minWidth: 20,
                        }}
                      />
                    )}
                    <div
                      className="flex items-center justify-center shrink-0"
                      title={`${t.name} — ${t.rate}%`}
                      style={{
                        width: curr ? 36 : 28,
                        height: curr ? 36 : 28,
                        borderRadius: curr ? 10 : 8,
                        background: reached ? `${t.color}18` : c.bg,
                        border: `${curr ? 2 : 1.5}px solid ${reached ? t.color : c.border}`,
                        boxShadow: curr ? `0 0 0 3px ${t.color}12` : undefined,
                        transition: 'all 0.15s',
                      }}
                    >
                      <TI size={curr ? 16 : 12} color={reached ? t.color : c.text3} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              {next && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2" style={{ minWidth: 120 }}>
                    <div
                      style={{
                        width: 80,
                        height: 4,
                        borderRadius: 2,
                        background: c.border,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(prog, 100)}%`,
                          background: `linear-gradient(90deg,${tier.color},${next.color})`,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        color: c.text1,
                        fontSize: WEB_FONT.xs,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                      }}
                    >
                      {S.friends}/{next.min}
                    </span>
                  </div>
                  <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                    → {next.name} ({next.rate}%)
                  </span>
                </div>
              )}
              <button
                onClick={() => setTiersOpen(!tiersOpen)}
                className="flex items-center gap-1"
                style={{
                  color: '#3B82F6',
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {tiersOpen ? 'Ẩn' : 'Chi tiết'}
                <ChevronDown
                  size={12}
                  style={{
                    transition: 'transform 0.15s',
                    transform: tiersOpen ? 'rotate(180deg)' : 'rotate(0)',
                  }}
                />
              </button>
            </div>
          </div>

          {tiersOpen && (
            <div className="grid grid-cols-6 gap-2">
              {TIERS.map((t, i) => {
                const curr = i === TIER_IDX;
                return (
                  <div
                    key={t.name}
                    className="text-center"
                    style={{
                      padding: '12px 8px',
                      borderRadius: 10,
                      background: curr ? `${t.color}08` : c.bg,
                      border: `1px solid ${curr ? `${t.color}30` : c.border}`,
                      opacity: i > TIER_IDX + 1 ? 0.45 : 1,
                    }}
                  >
                    <div
                      style={{
                        color: curr ? t.color : c.text2,
                        fontSize: WEB_FONT.xs,
                        fontWeight: 700,
                        marginBottom: 2,
                      }}
                    >
                      {curr ? '● ' : ''}
                      {t.name}
                    </div>
                    <div style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 800 }}>
                      {t.rate}%
                    </div>
                    <div style={{ color: c.text3, fontSize: WEB_FONT.xs, marginTop: 2 }}>
                      +${t.kycBonus}/KYC
                    </div>
                    <div style={{ color: c.text3, fontSize: WEB_FONT.xs }}>≥{t.min} ref</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            S4: DATA TABLES — full width, tabbed
            ═══════════════════════════════════════════════════════ */}
        <div style={{ background: c.surface, border: bdr, borderRadius: R, overflow: 'hidden' }}>
          {/* Tab bar */}
          <div
            className="flex items-center justify-between"
            style={{ padding: '0 16px', borderBottom: `1px solid ${c.divider}` }}
          >
            <div className="flex items-center">
              {[
                { k: 'friends' as const, l: 'Bạn bè', n: S.friends, i: Users },
                { k: 'comms' as const, l: 'Hoa hồng', n: COMMS.length, i: DollarSign },
                { k: 'rewards' as const, l: 'Thưởng', n: REWARDS.length, i: Gift },
              ].map((t) => {
                const TI = t.i;
                return (
                  <button
                    key={t.k}
                    onClick={() => {
                      setTab(t.k);
                      setSf('all');
                      setQ('');
                    }}
                    className="relative flex items-center gap-1.5"
                    style={{
                      padding: '12px 16px',
                      color: tab === t.k ? c.text1 : c.text3,
                      fontSize: WEB_FONT.base,
                      fontWeight: tab === t.k ? 700 : 500,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <TI size={13} />
                    {t.l}
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{
                        fontSize: WEB_FONT.xs,
                        fontWeight: 600,
                        background: tab === t.k ? '#3B82F610' : c.bg,
                        color: tab === t.k ? '#3B82F6' : c.text3,
                      }}
                    >
                      {t.n}
                    </span>
                    {tab === t.k && (
                      <div
                        className="absolute bottom-0 left-3 right-3"
                        style={{ height: 2, background: '#3B82F6', borderRadius: '2px 2px 0 0' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {tab === 'friends' && (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5"
                  style={{
                    height: WEB_BUTTON.xs,
                    padding: '0 8px',
                    borderRadius: 6,
                    background: c.bg,
                    border: bdr,
                  }}
                >
                  <Search size={12} color={c.text3} />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Tìm bạn bè..."
                    style={{
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      color: c.text1,
                      fontSize: WEB_FONT.xs,
                      width: 100,
                    }}
                  />
                </div>
                <select
                  value={sf}
                  onChange={(e) => setSf(e.target.value)}
                  style={{
                    height: WEB_BUTTON.xs,
                    padding: '0 8px',
                    borderRadius: 6,
                    background: c.bg,
                    border: bdr,
                    color: c.text2,
                    fontSize: WEB_FONT.xs,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending_kyc">Chờ KYC</option>
                </select>
              </div>
            )}
          </div>

          {/* ─── Friends table ─── */}
          {tab === 'friends' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Người dùng</th>
                  <th style={thStyle}>Ngày tham gia</th>
                  <th style={thStyle}>KYC</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>KLGD</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Hoa hồng</th>
                  <th style={thStyle}>Hoạt động</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {friends.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: 32,
                        textAlign: 'center',
                        color: c.text3,
                        fontSize: WEB_FONT.sm,
                      }}
                    >
                      Không tìm thấy
                    </td>
                  </tr>
                ) : (
                  friends.map((f) => {
                    const st = statusBadge(f.status);
                    return (
                      <tr
                        key={f.id}
                        className="transition-colors"
                        style={{ cursor: 'pointer' }}
                        onMouseOver={(e) => (e.currentTarget.style.background = c.bg)}
                        onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={tdStyle}>
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex items-center justify-center shrink-0"
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                background:
                                  f.status === 'active'
                                    ? '#10B98110'
                                    : f.status === 'pending_kyc'
                                      ? '#F59E0B10'
                                      : c.bg,
                                border: `1px solid ${f.status === 'active' ? '#10B98120' : f.status === 'pending_kyc' ? '#F59E0B20' : c.border}`,
                              }}
                            >
                              <span style={{ fontSize: 12 }}>{f.name.charAt(0)}</span>
                            </div>
                            <div>
                              <div
                                style={{ color: c.text1, fontWeight: 600, fontSize: WEB_FONT.base }}
                              >
                                {f.name}
                              </div>
                              <div style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{f.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>{new Date(f.joined).toLocaleDateString('vi-VN')}</td>
                        <td style={tdStyle}>
                          <span
                            className="px-1.5 py-0.5 rounded"
                            style={{
                              fontSize: WEB_FONT.xs,
                              fontWeight: 600,
                              background:
                                f.kyc >= 2 ? '#10B98110' : f.kyc === 1 ? '#F59E0B10' : '#EF444410',
                              color: f.kyc >= 2 ? '#10B981' : f.kyc === 1 ? '#F59E0B' : '#EF4444',
                            }}
                          >
                            {f.kyc === 0 ? 'Chưa KYC' : `Lv${f.kyc}`}
                          </span>
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: 'right',
                            color: c.text1,
                            fontWeight: 600,
                            fontFamily: 'monospace',
                          }}
                        >
                          {f.vol > 0 ? fmt(f.vol) : '—'}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: 'right',
                            color: f.comm > 0 ? '#10B981' : c.text3,
                            fontWeight: 700,
                            fontFamily: 'monospace',
                          }}
                        >
                          {f.comm > 0 ? `+${fmt(f.comm)}` : '—'}
                        </td>
                        <td style={{ ...tdStyle, color: c.text3, fontSize: WEB_FONT.xs }}>
                          {f.lastActive}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span
                            className="px-2 py-0.5 rounded-md"
                            style={{
                              background: st.bg,
                              color: st.fg,
                              fontSize: WEB_FONT.xs,
                              fontWeight: 600,
                            }}
                          >
                            {st.l}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* ─── Commissions table ─── */}
          {tab === 'comms' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Ngày</th>
                  <th style={thStyle}>Từ</th>
                  <th style={thStyle}>Loại</th>
                  <th style={thStyle}>Cặp</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>KLGD</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Tỷ lệ</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Hoa hồng</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {COMMS.map((cm) => {
                  const st = statusBadge(cm.status);
                  return (
                    <tr
                      key={cm.id}
                      className="transition-colors"
                      onMouseOver={(e) => (e.currentTarget.style.background = c.bg)}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={tdStyle}>{new Date(cm.date).toLocaleDateString('vi-VN')}</td>
                      <td style={{ ...tdStyle, color: c.text1, fontWeight: 600 }}>{cm.friend}</td>
                      <td style={tdStyle}>
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{
                            fontSize: WEB_FONT.xs,
                            fontWeight: 500,
                            background: cm.type === 'kyc_bonus' ? '#8B5CF610' : c.bg,
                            color: cm.type === 'kyc_bonus' ? '#8B5CF6' : c.text2,
                          }}
                        >
                          {typeLabel(cm.type)}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: WEB_FONT.xs }}>
                        {cm.pair || '—'}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          color: c.text1,
                        }}
                      >
                        {cm.vol ? fmt(cm.vol) : '—'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {cm.rate > 0 ? `${cm.rate}%` : '—'}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: 'right',
                          color: '#10B981',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                        }}
                      >
                        +{fmt(cm.amount)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span
                          className="px-2 py-0.5 rounded-md"
                          style={{
                            background: st.bg,
                            color: st.fg,
                            fontSize: WEB_FONT.xs,
                            fontWeight: 600,
                          }}
                        >
                          {st.l}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* ─── Rewards table ─── */}
          {tab === 'rewards' && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Ngày</th>
                  <th style={thStyle}>Loại</th>
                  <th style={thStyle}>Mô tả</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Số tiền</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ ...thStyle, width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {REWARDS.map((rw) => {
                  const st = statusBadge(rw.status);
                  return (
                    <tr
                      key={rw.id}
                      className="transition-colors"
                      onMouseOver={(e) => (e.currentTarget.style.background = c.bg)}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={tdStyle}>{new Date(rw.date).toLocaleDateString('vi-VN')}</td>
                      <td style={tdStyle}>
                        <span
                          className="px-1.5 py-0.5 rounded"
                          style={{
                            fontSize: WEB_FONT.xs,
                            fontWeight: 600,
                            background:
                              rw.type === 'campaign'
                                ? '#F59E0B10'
                                : rw.type === 'tier_bonus'
                                  ? '#8B5CF610'
                                  : '#10B98110',
                            color:
                              rw.type === 'campaign'
                                ? '#F59E0B'
                                : rw.type === 'tier_bonus'
                                  ? '#8B5CF6'
                                  : '#10B981',
                          }}
                        >
                          {typeLabel(rw.type)}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: c.text1 }}>{rw.desc}</td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: 'right',
                          color: '#10B981',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                        }}
                      >
                        +{fmt(rw.amount)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span
                          className="px-2 py-0.5 rounded-md"
                          style={{
                            background: st.bg,
                            color: st.fg,
                            fontSize: WEB_FONT.xs,
                            fontWeight: 600,
                          }}
                        >
                          {st.l}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {rw.status === 'available' && (
                          <button
                            style={{
                              padding: '4px 12px',
                              borderRadius: 6,
                              background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                              color: '#fff',
                              fontSize: WEB_FONT.xs,
                              fontWeight: 600,
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            Nhận
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            S5: FOOTER — Disclaimer
            ═══════════════════════════════════════════════════════ */}
        <div
          className="flex items-start gap-2"
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: c.bg,
            border: `1px solid ${c.divider}`,
          }}
        >
          <Info size={13} color={c.text3} className="mt-0.5 shrink-0" />
          <span style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
            Hoa hồng tính trên phí giao dịch thực tế, không gồm khuyến mãi hay wash trading. Thưởng
            KYC chỉ áp dụng lần đầu cho mỗi bạn bè. Chương trình có thể thay đổi điều khoản mà không
            báo trước. Vui lòng xem{' '}
            <span style={{ color: '#3B82F6', cursor: 'pointer' }}>Điều khoản đầy đủ</span>.
          </span>
        </div>
      </div>
    </PageLayout>
  );
}
