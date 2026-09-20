import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import {
  TrendingUp, Calendar, DollarSign, FileText,
  ChevronRight, Download, Filter, BarChart3,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { fmtVnd } from '../../data/formatNumber';
import { φ, φSpace } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   P2P Contribution History — Lịch sử đóng góp Quỹ Bảo Hiểm
   ═══════════════════════════════════════════════════════════ */

interface Contribution {
  id: string;
  date: string;
  orderId: string;
  orderAmount: number;
  contributionAmount: number;
  feeRate: number; // percentage
  coin: string;
}

interface MonthlyGroup {
  month: string; // "2026-03"
  monthLabel: string; // "Tháng 3/2026"
  totalAmount: number;
  count: number;
  contributions: Contribution[];
}

/* ─── Mock Data ─── */

const MOCK_CONTRIBUTIONS: Contribution[] = [
  { id: 'c001', date: '2026-03-03', orderId: 'P2P-78470', orderAmount: 7_200_000, contributionAmount: 7_200, feeRate: 0.1, coin: 'BTC' },
  { id: 'c002', date: '2026-03-02', orderId: 'P2P-78460', orderAmount: 18_500_000, contributionAmount: 18_500, feeRate: 0.1, coin: 'USDT' },
  { id: 'c003', date: '2026-03-01', orderId: 'P2P-78450', orderAmount: 42_000_000, contributionAmount: 42_000, feeRate: 0.1, coin: 'ETH' },
  { id: 'c004', date: '2026-02-25', orderId: 'P2P-78425', orderAmount: 25_000_000, contributionAmount: 25_000, feeRate: 0.1, coin: 'BTC' },
  { id: 'c005', date: '2026-02-23', orderId: 'P2P-78412', orderAmount: 8_000_000, contributionAmount: 8_000, feeRate: 0.1, coin: 'BTC' },
  { id: 'c006', date: '2026-02-22', orderId: 'P2P-78415', orderAmount: 50_000_000, contributionAmount: 50_000, feeRate: 0.1, coin: 'ETH' },
  { id: 'c007', date: '2026-02-20', orderId: 'P2P-78390', orderAmount: 3_000_000, contributionAmount: 3_000, feeRate: 0.1, coin: 'USDT' },
  { id: 'c008', date: '2026-02-18', orderId: 'P2P-78400', orderAmount: 15_000_000, contributionAmount: 15_000, feeRate: 0.1, coin: 'USDT' },
  { id: 'c009', date: '2026-02-15', orderId: 'P2P-78380', orderAmount: 12_500_000, contributionAmount: 12_500, feeRate: 0.1, coin: 'BTC' },
  { id: 'c010', date: '2026-02-10', orderId: 'P2P-78350', orderAmount: 22_000_000, contributionAmount: 22_000, feeRate: 0.1, coin: 'USDT' },
  { id: 'c011', date: '2026-02-05', orderId: 'P2P-78320', orderAmount: 35_000_000, contributionAmount: 35_000, feeRate: 0.1, coin: 'ETH' },
  { id: 'c012', date: '2026-01-28', orderId: 'P2P-78280', orderAmount: 18_000_000, contributionAmount: 18_000, feeRate: 0.1, coin: 'USDT' },
  { id: 'c013', date: '2026-01-25', orderId: 'P2P-78250', orderAmount: 9_500_000, contributionAmount: 9_500, feeRate: 0.1, coin: 'BTC' },
  { id: 'c014', date: '2026-01-20', orderId: 'P2P-78220', orderAmount: 28_000_000, contributionAmount: 28_000, feeRate: 0.1, coin: 'ETH' },
  { id: 'c015', date: '2026-01-15', orderId: 'P2P-78180', orderAmount: 16_000_000, contributionAmount: 16_000, feeRate: 0.1, coin: 'USDT' },
];

const groupByMonth = (contributions: Contribution[]): MonthlyGroup[] => {
  const grouped: Record<string, MonthlyGroup> = {};

  contributions.forEach(c => {
    const month = c.date.substring(0, 7); // "2026-03"
    if (!grouped[month]) {
      const [year, monthNum] = month.split('-');
      grouped[month] = {
        month,
        monthLabel: `Tháng ${parseInt(monthNum)}/${year}`,
        totalAmount: 0,
        count: 0,
        contributions: [],
      };
    }
    grouped[month].totalAmount += c.contributionAmount;
    grouped[month].count += 1;
    grouped[month].contributions.push(c);
  });

  // Sort by month desc
  return Object.values(grouped).sort((a, b) => b.month.localeCompare(a.month));
};

const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

/* ═══════════════════════════════════════════════════════════ */

export function P2PContributionHistoryPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [showExportModal, setShowExportModal] = useState(false);

  const monthlyGroups = groupByMonth(MOCK_CONTRIBUTIONS);
  const totalContributed = MOCK_CONTRIBUTIONS.reduce((sum, c) => sum + c.contributionAmount, 0);
  const totalTrades = MOCK_CONTRIBUTIONS.length;
  const avgPerTrade = Math.round(totalContributed / totalTrades);

  const handleExport = () => {
    hapticSelection();
    setShowExportModal(true);
    setTimeout(() => {
      toast.success('Đã xuất báo cáo', { description: 'File CSV đã lưu vào Tải xuống' });
      setShowExportModal(false);
    }, 800);
  };

  return (
    <PageLayout>
      <Header title="Lịch sử đóng góp" subtitle="Bảo hiểm · P2P" back />

      <PageContent gap="relaxed">
        {/* ── Summary Card ── */}
        <TrCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} color="#10B981" />
            <span style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>
              Tổng quan đóng góp
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Tổng đóng góp</p>
              <p style={{
                color: '#10B981',
                fontSize: 22,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.3,
                marginTop: 2,
              }}>
                {fmtVnd(totalContributed)} đ
              </p>
            </div>
            <div>
              <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>Số giao dịch</p>
              <p style={{
                color: '#3B82F6',
                fontSize: 22,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.3,
                marginTop: 2,
              }}>
                {totalTrades}
              </p>
            </div>
          </div>

          <div className="pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
            <div className="flex items-center justify-between">
              <span style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5 }}>
                Trung bình/giao dịch
              </span>
              <span style={{
                color: c.text1,
                fontSize: φ.base,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {fmtVnd(avgPerTrade)} đ
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5 }}>
                Tỷ lệ phí
              </span>
              <span style={{
                color: c.text1,
                fontSize: φ.base,
                fontWeight: 600,
              }}>
                0.1%
              </span>
            </div>
          </div>
        </TrCard>

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <CTAButton
            variant="ghost"
            onClick={handleExport}
            disabled={showExportModal}
            className="flex-1 flex items-center justify-center gap-2"
            bg={c.surface2}
            textColor={c.text1}
            style={{
              border: `1.5px solid ${c.divider}`,
            }}
          >
            <Download size={16} color={c.text1} />
            <span>Xuất CSV</span>
          </CTAButton>
        </div>

        {/* ── Monthly Groups ── */}
        {monthlyGroups.map(group => (
          <div key={group.month}>
            {/* Month Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} color={c.text2} />
                <span style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>
                  {group.monthLabel}
                </span>
              </div>
              <div className="text-right">
                <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
                  {group.count} giao dịch
                </p>
                <p style={{
                  color: '#10B981',
                  fontSize: φ.sm,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {fmtVnd(group.totalAmount)} đ
                </p>
              </div>
            </div>

            {/* Contributions List */}
            <div className="flex flex-col" style={{ gap: φSpace[2] }}>
              {group.contributions.map(contrib => (
                <ContributionCard key={contrib.id} c={c} contribution={contrib} />
              ))}
            </div>
          </div>
        ))}
      </PageContent>
    </PageLayout>
  );
}

/* ───────────────────────────────────────────────────────────
   Contribution Card
   ─────────────────────────────────────────────────────────── */

interface ContributionCardProps {
  c: ReturnType<typeof useThemeColors>;
  contribution: Contribution;
}

function ContributionCard({ c, contribution }: ContributionCardProps) {
  return (
    <TrCard className="p-4">
      <div className="flex items-center justify-between">
        {/* Left: Date + Order */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span style={{
              color: c.text1,
              fontSize: φ.body,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {contribution.orderId}
            </span>
            <span style={{
              color: c.text3,
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 6,
              background: c.surface2,
            }}>
              {contribution.coin}
            </span>
          </div>
          <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>
            {formatDate(contribution.date)}
          </p>
          <p style={{
            color: c.text2,
            fontSize: 11,
            lineHeight: 1.5,
            marginTop: 2,
          }}>
            GD: {fmtVnd(contribution.orderAmount)} đ
          </p>
        </div>

        {/* Right: Contribution */}
        <div className="text-right">
          <p style={{
            color: '#10B981',
            fontSize: φ.base,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.3,
          }}>
            +{fmtVnd(contribution.contributionAmount)} đ
          </p>
          <p style={{
            color: c.text3,
            fontSize: 11,
            marginTop: 2,
            lineHeight: 1.5,
          }}>
            {contribution.feeRate}% phí
          </p>
        </div>
      </div>
    </TrCard>
  );
}