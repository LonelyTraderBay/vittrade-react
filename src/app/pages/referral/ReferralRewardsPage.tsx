import React, { useState, useMemo } from 'react';
import {
  Gift, TrendingUp, Award, Clock, CheckCircle, ArrowDownUp,
  Download, X, FileText, AlertTriangle, Send, Shield,
  Calendar, MessageCircle, Copy,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useActionToast } from '../../hooks/useActionToast';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { fmtUsd } from '../../data/formatNumber';
import { φ, φSpace, φIcon } from '../../utils/golden';
import {
  COMMISSION_RECORDS,
  REFERRAL_CHART_DATA,
  getReferralStats,
  getCurrentTier,
  EXPORT_DATE_RANGES,
  DISPUTE_TYPES,
  MOCK_DISPUTES,
  generateCommissionCSV,
  type ExportDateRange,
  type CommissionRecord,
} from '../../data/referralData';

/* ═══════════════════════════════════════════
   SPACING CONSTANTS — 8pt rhythm (Guidelines §2.3)
   ═══════════════════════════════════════════
   Section gap (PageContent):  16px  (gap="default")
   Card internal padding:      16px  (p-4)
   Sub-item gap:                8px  (gap-2)
   ═══════════════════════════════════════════ */

const S = {
  /** Card inner padding */
  cardPad: 16,
  /** Sub-item gap */
  itemGap: φSpace[3],      // 8px
} as const;

type FilterTab = 'all' | 'kyc_bonus' | 'trade_commission';
type SortType = 'date' | 'amount';

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */
export function ReferralRewardsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const actionToast = useActionToast();
  const [tab, setTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const { refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });

  // Export state
  const [showExport, setShowExport] = useState(false);
  const [exportRange, setExportRange] = useState<ExportDateRange>('all');
  const [exportFormat, setExportFormat] = useState<'csv' | 'copy'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  // Dispute state
  const [showDispute, setShowDispute] = useState(false);
  const [disputeRecord, setDisputeRecord] = useState<CommissionRecord | null>(null);
  const [disputeType, setDisputeType] = useState<string>('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dispute history state
  const [showDisputeHistory, setShowDisputeHistory] = useState(false);

  const stats = getReferralStats();
  const { current: currentTier } = getCurrentTier(stats.totalFriends);

  const filteredRecords = useMemo(() =>
    COMMISSION_RECORDS
      .filter(r => tab === 'all' || r.type === tab)
      .sort((a, b) => {
        if (sortBy === 'amount') return b.amount - a.amount;
        return 0;
      }),
    [tab, sortBy]
  );

  const totalKycBonus = COMMISSION_RECORDS
    .filter(r => r.type === 'kyc_bonus' && r.status === 'completed')
    .reduce((s, r) => s + r.amount, 0);
  const totalTradeComm = COMMISSION_RECORDS
    .filter(r => r.type === 'trade_commission' && r.status === 'completed')
    .reduce((s, r) => s + r.amount, 0);

  const completedCount = filteredRecords.filter(r => r.status === 'completed').length;
  const pendingCount = filteredRecords.filter(r => r.status === 'pending').length;

  /* ─── Export Handler ─── */
  const handleExport = () => {
    setIsExporting(true);
    const records = COMMISSION_RECORDS.filter(r => {
      if (exportRange === 'all') return true;
      // Simplified mock filter — in real app, parse dates
      if (exportRange === 'this_month') return r.date.includes('/03/2026');
      if (exportRange === 'last_month') return r.date.includes('/02/2026');
      return true; // last_3_months
    });

    setTimeout(() => {
      const csv = generateCommissionCSV(records);
      if (exportFormat === 'copy') {
        navigator.clipboard?.writeText(csv).catch(() => {});
        actionToast.success({ title: 'Đã sao chép!', description: `${records.length} bản ghi đã sao chép vào clipboard` });
      } else {
        // Trigger download
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VitTrade_HoaHong_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        actionToast.success({ title: 'Xuất file thành công!', description: `${records.length} bản ghi đã tải về dạng CSV` });
      }
      setIsExporting(false);
      setShowExport(false);
    }, 800);
  };

  /* ─── Dispute Handler ─── */
  const handleSubmitDispute = () => {
    if (!disputeType || !disputeDesc.trim()) {
      actionToast.error({ title: 'Thiếu thông tin', description: 'Vui lòng chọn loại vấn đề và mô tả chi tiết' });
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      actionToast.success({
        title: 'Đã gửi báo lỗi!',
        description: 'Mã ticket: #DISP-' + (MOCK_DISPUTES.length + 1).toString().padStart(3, '0') + '. Chúng tôi sẽ xử lý trong 24–48h.',
      });
      setIsSubmitting(false);
      setShowDispute(false);
      setDisputeType('');
      setDisputeDesc('');
      setDisputeRecord(null);
    }, 1000);
  };

  const openDispute = (record: CommissionRecord) => {
    setDisputeRecord(record);
    setDisputeType('');
    setDisputeDesc('');
    setShowDispute(true);
  };

  return (
    <PageLayout>
      <Header title="Phần thưởng" subtitle="Phần thưởng · Referral" back onBack={() => navigate(prefix + '/referral')} />

      <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="pb-8">
        <PageContent gap="default">
        {/* ─── Total Reward Card ─── */}
        <TrCard variant="hero" rounded="lg" className="p-5">
          <div className="flex items-center justify-between mb-1">
            <span style={{ color: c.portfolioTextMuted, fontSize: φ.sm }}>Tổng phần thưởng</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: c.portfolioBtnGhost, border: `1px solid ${c.portfolioBtnGhostBorder}` }}>
              <span style={{ fontSize: φ.sm }}>{currentTier.icon}</span>
              <span style={{ color: c.portfolioTextDim, fontSize: φ.xs, fontWeight: 600 }}>{currentTier.name}</span>
              <span style={{ color: c.portfolioTextMuted, fontSize: φ.xs, opacity: 0.7 }}>({currentTier.nameEn})</span>
            </div>
          </div>
          <p style={{ color: c.portfolioTextDim, fontSize: φ.xl, fontWeight: 700, fontFamily: 'monospace', letterSpacing: -1, lineHeight: 1.15 }}>
            {fmtUsd(stats.totalCommission)}
          </p>
          <p style={{ color: c.portfolioTextMuted, fontSize: φ.sm, marginTop: 4 }}>
            USDT • Đã cộng vào ví
          </p>

          {stats.pendingCommission > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <Clock size={12} color="#F59E0B" />
              <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>
                +{fmtUsd(stats.pendingCommission)} đang chờ xử lý
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-2xl p-3" style={{ background: c.portfolioBtnGhost, border: `1px solid ${c.portfolioBtnGhostBorder}` }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Gift size={φIcon.sm} color="#10B981" />
                <span style={{ color: c.portfolioTextMuted, fontSize: φ.xs }}>Thưởng KYC</span>
              </div>
              <p style={{ color: '#10B981', fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
                {fmtUsd(totalKycBonus)}
              </p>
            </div>
            <div className="rounded-2xl p-3" style={{ background: c.portfolioBtnGhost, border: `1px solid ${c.portfolioBtnGhostBorder}` }}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={φIcon.sm} color="#3B82F6" />
                <span style={{ color: c.portfolioTextMuted, fontSize: φ.xs }}>Hoa hồng GD</span>
              </div>
              <p style={{ color: '#3B82F6', fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
                {fmtUsd(totalTradeComm)}
              </p>
            </div>
          </div>

          {/* ─── Action Buttons: Export + Dispute History ─── */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowExport(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl"
              style={{
                minHeight: 44,
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.2)',
                color: '#3B82F6', fontSize: φ.sm, fontWeight: 600,
              }}
            >
              <Download size={15} />
              Xuất báo cáo
            </button>
            <button
              onClick={() => setShowDisputeHistory(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl"
              style={{
                minHeight: 44,
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.15)',
                color: '#F59E0B', fontSize: φ.sm, fontWeight: 600,
              }}
            >
              <Shield size={15} />
              Lịch sử báo lỗi
            </button>
          </div>
        </TrCard>

        {/* ─── Chart ─── */}
        <div>
          <SectionHeader title="Hoa hồng theo tháng" accent accentColor="#10B981"
            right={<span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 600 }}>+{fmtUsd(stats.thisMonthCommission)} tháng này</span>} />
          <TrCard className="p-4">
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={REFERRAL_CHART_DATA}>
                <defs key="gradient-defs">
                  <linearGradient id="refCommGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis key="rr-x" dataKey="month" tick={{ fill: c.text3, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis key="rr-y" hide />
                <Tooltip
                  key="rr-tip"
                  contentStyle={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [fmtUsd(v), 'Hoa hồng']}
                />
                <Area key="rr-area" type="monotone" dataKey="commission" stroke="#10B981" strokeWidth={2} fill="url(#refCommGrad)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </TrCard>
        </div>

        {/* ─── Filter Tabs ─── */}
        <TabBar
          variant="segment"
          tabs={[
            { id: 'all', label: 'Tất cả' },
            { id: 'kyc_bonus', label: 'Thưởng KYC' },
            { id: 'trade_commission', label: 'Hoa hồng GD' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* ─── Sort ─── */}
        <div className="flex items-center gap-2">
          <ArrowDownUp size={φIcon.sm} color={c.text3} />
          <span style={{ color: c.text3, fontSize: φ.xs }}>Sắp xếp:</span>
          {([
            { id: 'date' as SortType, label: 'Mới nhất' },
            { id: 'amount' as SortType, label: 'Số tiền' },
          ]).map(s => (
            <button key={s.id} onClick={() => setSortBy(s.id)}
              className="px-2.5 rounded-lg flex items-center justify-center"
              style={{
                minHeight: 28,
                background: sortBy === s.id ? c.chipActiveBg : 'transparent',
                color: sortBy === s.id ? c.chipActiveText : c.text3,
                fontSize: φ.xs,
                fontWeight: sortBy === s.id ? 600 : 400,
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* ─── Records List ─── */}
        <div>
          <TrCard overflow>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
              <div className="flex items-center justify-between">
                <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>Lịch sử thưởng</p>
                <div className="flex items-center gap-2">
                  {pendingCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>
                      <Clock size={φ.xs} />
                      {pendingCount} đang chờ
                    </span>
                  )}
                  <span style={{ color: c.text3, fontSize: φ.xs }}>{completedCount} hoàn tất</span>
                </div>
              </div>
            </div>
            {filteredRecords.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Gift size={28} color={c.text3} className="mx-auto mb-2" style={{ opacity: 0.4 }} />
                <p style={{ color: c.text3, fontSize: φ.sm }}>Chưa có giao dịch nào</p>
              </div>
            ) : (
              filteredRecords.map((record, i) => {
                const isPending = record.status === 'pending';
                return (
                  <div key={record.id} className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom: i < filteredRecords.length - 1 ? `1px solid ${c.divider}` : 'none',
                      opacity: isPending ? 0.7 : 1,
                    }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: record.type === 'kyc_bonus'
                          ? 'rgba(139,92,246,0.12)'
                          : 'rgba(16,185,129,0.12)',
                      }}>
                      {record.type === 'kyc_bonus'
                        ? <Award size={18} color="#8B5CF6" />
                        : <TrendingUp size={18} color="#10B981" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">{record.friendName}</p>
                        {isPending && (
                          <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: 9, fontWeight: 600 }}>
                            <Clock size={8} />
                            Đang chờ
                          </span>
                        )}
                      </div>
                      <p style={{ color: c.text3, fontSize: φ.xs }} className="truncate">{record.action}  {record.date}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p style={{
                          color: isPending ? '#F59E0B' : (record.type === 'kyc_bonus' ? '#8B5CF6' : '#10B981'),
                          fontSize: φ.body,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                        }}>
                          {isPending ? '~' : '+'}{fmtUsd(record.amount)}
                        </p>
                        <p style={{ color: c.text3, fontSize: φ.xs }}>{record.currency}</p>
                      </div>
                      {/* Dispute button */}
                      {record.status === 'completed' && (
                        <button
                          onClick={() => openDispute(record)}
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'rgba(245,158,11,0.06)',
                            border: '1px solid rgba(245,158,11,0.1)',
                          }}
                          title="Báo lỗi"
                        >
                          <AlertTriangle size={φIcon.sm} color="#F59E0B" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </TrCard>
        </div>

        {/* ─── Dispute Info Banner ─── */}
        <div>
          <TrCard className="p-4" accentBorder="rgba(59,130,246,0.12)">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(59,130,246,0.1)' }}>
                <MessageCircle size={φ.base} color="#3B82F6" />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 2 }}>
                  Hoa hồng không chính xác?
                </p>
                <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
                  Bấm vào biểu tượng <AlertTriangle size={φ.xs} color="#F59E0B" style={{ display: 'inline', verticalAlign: 'middle' }} /> bên cạnh mỗi giao dịch để báo lỗi.
                  Đội ngũ hỗ trợ sẽ xử lý trong 24–48 giờ làm việc.
                </p>
              </div>
            </div>
          </TrCard>
        </div>
        </PageContent>
      </PullToRefresh>

      {/* ═══════════════════════════════════════════
          BOTTOM SHEET: Export CSV
          ═══════════════════════════════════════════ */}
      <BottomSheetV2 open={showExport} onClose={() => setShowExport(false)} title="Xuất báo cáo hoa hồng">
        {/* Summary */}
        <div className="rounded-2xl p-3.5 mb-4 flex items-center gap-3"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
          <FileText size={18} color="#10B981" />
          <div>
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
              {COMMISSION_RECORDS.length} bản ghi · {fmtUsd(stats.totalCommission)} tổng
            </p>
            <p style={{ color: c.text3, fontSize: φ.xs }}>Dùng cho kê khai thuế / kế toán cá nhân</p>
          </div>
        </div>

        {/* Date Range */}
        <p style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, marginBottom: 8 }}>Khoảng thời gian</p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {EXPORT_DATE_RANGES.map(r => (
            <button
              key={r.id}
              onClick={() => setExportRange(r.id)}
              className="flex items-center justify-center gap-1.5 rounded-xl"
              style={{
                minHeight: 44,
                background: exportRange === r.id ? c.chipActiveBg : c.surface2,
                border: '1px solid ' + (exportRange === r.id ? c.chipActiveBorder : c.border),
                color: exportRange === r.id ? c.chipActiveText : c.text2,
                fontSize: φ.sm, fontWeight: exportRange === r.id ? 600 : 400,
              }}
            >
              <Calendar size={φIcon.sm} />
              {r.label}
            </button>
          ))}
        </div>

        {/* Format */}
        <p style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, marginBottom: 8 }}>Định dạng</p>
        <div className="flex gap-2 mb-5">
          {([
            { id: 'csv' as const, label: 'Tải CSV', icon: Download, desc: 'File .csv tải về máy' },
            { id: 'copy' as const, label: 'Sao chép', icon: Copy, desc: 'Copy dữ liệu vào clipboard' },
          ]).map(f => (
            <button
              key={f.id}
              onClick={() => setExportFormat(f.id)}
              className="flex-1 rounded-xl p-3 text-left"
              style={{
                background: exportFormat === f.id ? c.chipActiveBg : c.surface2,
                border: '1.5px solid ' + (exportFormat === f.id ? c.chipActiveBorder : c.border),
              }}
            >
              <f.icon size={φ.base} color={exportFormat === f.id ? c.chipActiveText : c.text3} />
              <p style={{ color: exportFormat === f.id ? c.chipActiveText : c.text1, fontSize: φ.sm, fontWeight: 600, marginTop: 6 }}>
                {f.label}
              </p>
              <p style={{ color: c.text3, fontSize: φ.xs, marginTop: 2 }}>{f.desc}</p>
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="rounded-xl p-3 mb-5" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: φ.xs, fontWeight: 600, marginBottom: 4 }}>XEM TRƯỚC (3 DÒNG ĐẦU)</p>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: c.text2, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {generateCommissionCSV(COMMISSION_RECORDS.slice(0, 3))}
          </div>
        </div>

        {/* Export CTA */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 rounded-2xl"
          style={{
            minHeight: 52,
            background: isExporting ? 'rgba(59,130,246,0.15)' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
            color: isExporting ? '#3B82F6' : '#fff',
            fontSize: φ.base, fontWeight: 700,
            boxShadow: isExporting ? 'none' : '0 4px 16px rgba(59,130,246,0.3)',
          }}
        >
          {isExporting ? (
            <motion.div
              className="w-5 h-5 border-2 rounded-full"
              style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <div className="contents">
              <Download size={18} />
              <span>{exportFormat === 'csv' ? 'Tải xuống CSV' : 'Sao chép dữ liệu'}</span>
            </div>
          )}
        </button>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 mt-4 px-1">
          <Shield size={φIcon.sm} color={c.text3} className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
            Dữ liệu xuất ra chỉ mang tính chất tham khảo. VitTrade không cung cấp tư vấn thuế.
            Vui lòng liên hệ cơ quan thuế hoặc kế toán viên cho các nghĩa vụ cụ thể.
          </p>
        </div>
      </BottomSheetV2>

      {/* ═══════════════════════════════════════════
          BOTTOM SHEET: Dispute / Báo lỗi
          ═══════════════════════════════════════════ */}
      <BottomSheetV2 open={showDispute} onClose={() => { setShowDispute(false); setDisputeRecord(null); }} title="Báo lỗi hoa hồng">
        {/* Selected record info */}
        {disputeRecord && (
          <div className="rounded-2xl p-3.5 mb-4 flex items-center gap-3"
            style={{ background: c.surface2, border: '1px solid ' + c.border }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: disputeRecord.type === 'kyc_bonus' ? 'rgba(139,92,246,0.12)' : 'rgba(16,185,129,0.12)' }}>
              {disputeRecord.type === 'kyc_bonus' ? <Award size={φ.base} color="#8B5CF6" /> : <TrendingUp size={φ.base} color="#10B981" />}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">{disputeRecord.friendName}</p>
              <p style={{ color: c.text3, fontSize: φ.xs }}>{disputeRecord.action} • {disputeRecord.date}</p>
            </div>
            <p style={{
              color: disputeRecord.type === 'kyc_bonus' ? '#8B5CF6' : '#10B981',
              fontSize: φ.body, fontWeight: 700, fontFamily: 'monospace',
            }}>
              +{fmtUsd(disputeRecord.amount)}
            </p>
          </div>
        )}

        {/* Issue type selector */}
        <p style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, marginBottom: 8 }}>Loại vấn đề</p>
        <div className="flex flex-col gap-2 mb-5">
          {DISPUTE_TYPES.map(dt => (
            <button
              key={dt.id}
              onClick={() => setDisputeType(dt.id)}
              className="rounded-xl p-3.5 text-left flex items-start gap-3"
              style={{
                background: disputeType === dt.id ? c.chipActiveBg : c.surface2,
                border: '1.5px solid ' + (disputeType === dt.id ? c.chipActiveBorder : c.border),
              }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  border: '2px solid ' + (disputeType === dt.id ? c.chipActiveText : c.text3),
                  background: disputeType === dt.id ? c.chipActiveText : 'transparent',
                }}>
                {disputeType === dt.id && <CheckCircle size={12} color={c.chipActiveBg} />}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: disputeType === dt.id ? c.chipActiveText : c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                  {dt.label}
                </p>
                <p style={{ color: c.text3, fontSize: φ.xs, marginTop: 1 }}>{dt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Description */}
        <p style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, marginBottom: 8 }}>Mô tả chi tiết</p>
        <textarea
          value={disputeDesc}
          onChange={e => setDisputeDesc(e.target.value)}
          placeholder="VD: Bạn bè đã giao dịch 500 USDT Spot BTC/USDT ngày 25/02 nhưng tôi chưa nhận hoa hồng..."
          className="w-full rounded-xl p-3.5 mb-1 outline-none resize-none"
          style={{
            background: c.surface2,
            border: '1px solid ' + c.border,
            color: c.text1,
            fontSize: φ.sm,
            lineHeight: 1.6,
            minHeight: 100,
          }}
          rows={4}
        />
        <p style={{ color: c.text3, fontSize: φ.xs, marginBottom: 16 }}>
          {disputeDesc.length}/500 ký tự • Mô tả càng chi tiết, xử lý càng nhanh
        </p>

        {/* Submit */}
        <button
          onClick={handleSubmitDispute}
          disabled={isSubmitting || !disputeType || !disputeDesc.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-2xl"
          style={{
            minHeight: 52,
            background: (!disputeType || !disputeDesc.trim())
              ? c.surface2
              : isSubmitting
                ? 'rgba(245,158,11,0.15)'
                : 'linear-gradient(135deg, #F59E0B, #D97706)',
            color: (!disputeType || !disputeDesc.trim()) ? c.text3 : isSubmitting ? '#F59E0B' : '#000',
            fontSize: φ.base, fontWeight: 700,
            boxShadow: (!disputeType || !disputeDesc.trim() || isSubmitting) ? 'none' : '0 4px 16px rgba(245,158,11,0.3)',
          }}
        >
          {isSubmitting ? (
            <motion.div
              className="w-5 h-5 border-2 rounded-full"
              style={{ borderColor: '#F59E0B', borderTopColor: 'transparent' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <div className="contents">
              <Send size={φ.base} />
              <span>Gửi báo lỗi</span>
            </div>
          )}
        </button>

        {/* Process info */}
        <div className="flex flex-col gap-2 mt-4 px-1">
          {[
            { step: '1', text: 'Chúng tôi tiếp nhận và tạo ticket xử lý' },
            { step: '2', text: 'Đội kỹ thuật xác minh giao dịch (12–24h)' },
            { step: '3', text: 'Phản hồi kết quả qua thông báo + email' },
          ].map(s => (
            <div key={s.step} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: c.surface2 }}>
                <span style={{ color: c.text3, fontSize: 9, fontWeight: 700 }}>{s.step}</span>
              </div>
              <p style={{ color: c.text3, fontSize: φ.xs }}>{s.text}</p>
            </div>
          ))}
        </div>
      </BottomSheetV2>

      {/* ═══════════════════════════════════════════
          BOTTOM SHEET: Dispute History
          ═══════════════════════════════════════════ */}
      <BottomSheetV2 open={showDisputeHistory} onClose={() => setShowDisputeHistory(false)} title="Lịch sử báo lỗi">
        {MOCK_DISPUTES.length === 0 ? (
          <div className="py-8 text-center">
            <Shield size={32} color={c.text3} className="mx-auto mb-3" style={{ opacity: 0.4 }} />
            <p style={{ color: c.text2, fontSize: φ.body, fontWeight: 600 }}>Chưa có báo lỗi nào</p>
            <p style={{ color: c.text3, fontSize: φ.sm, marginTop: 4 }}>Tất cả hoa hồng đang hoạt động bình thường</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {MOCK_DISPUTES.map(dispute => {
              const statusMap: Record<string, { label: string; color: string; bg: string }> = {
                submitted: { label: 'Đã gửi', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
                reviewing: { label: 'Đang xử lý', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
                resolved: { label: 'Đã giải quyết', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                rejected: { label: 'Từ chối', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
              };
              const st = statusMap[dispute.status];
              const typeLabel = DISPUTE_TYPES.find(dt => dt.id === dispute.type)?.label ?? dispute.type;

              return (
                <div key={dispute.id} className="rounded-2xl p-4"
                  style={{ background: c.surface2, border: '1px solid ' + c.border }}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ color: c.text3, fontSize: φ.xs, fontFamily: 'monospace' }}>#{dispute.id.toUpperCase()}</span>
                      <span className="px-2 py-0.5 rounded-full"
                        style={{ background: st.bg, color: st.color, fontSize: φ.xs, fontWeight: 600 }}>
                        {st.label}
                      </span>
                    </div>
                    <span style={{ color: c.text3, fontSize: φ.xs }}>{dispute.createdDate}</span>
                  </div>

                  {/* Type + description */}
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 2 }}>{typeLabel}</p>
                  <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5, marginBottom: 8 }}>{dispute.description}</p>

                  {/* Resolution */}
                  {dispute.resolution && (
                    <div className="rounded-xl p-3" style={{ background: st.bg }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle size={12} color={st.color} />
                        <span style={{ color: st.color, fontSize: φ.xs, fontWeight: 600 }}>
                          Phản hồi ({dispute.resolvedDate})
                        </span>
                      </div>
                      <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5 }}>{dispute.resolution}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </BottomSheetV2>
    </PageLayout>
  );
}