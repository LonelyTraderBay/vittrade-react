import React, { useState, useCallback, useMemo } from 'react';
import {
  Download, FileText, FileSpreadsheet, Calendar, Clock, CheckCircle,
  AlertTriangle, Info, X, ChevronRight, Filter, Shield,
  ArrowDownToLine, ArrowUpFromLine, TrendingUp, Zap, PiggyBank,
  Mail, Eye, RefreshCw, Settings, Copy, ExternalLink,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA } from '../../constants/colors';
import { fmtUsd } from '../../data/formatNumber';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

type ExportFormat = 'csv' | 'pdf' | 'xlsx';
type ExportScope = 'all' | 'subscribe' | 'redeem' | 'interest' | 'compound';
type ExportPeriod = '7d' | '30d' | '90d' | '6m' | '1y' | 'all' | 'custom';
type ExportStatus = 'ready' | 'generating' | 'completed' | 'failed';
type ReportType = 'transaction' | 'tax' | 'portfolio' | 'performance';

interface ExportConfig {
  format: ExportFormat;
  scope: ExportScope;
  period: ExportPeriod;
  customStart?: string;
  customEnd?: string;
  includeInterest: boolean;
  includeFees: boolean;
  includeAPYHistory: boolean;
  includeProductDetails: boolean;
  emailCopy: boolean;
  reportType: ReportType;
}

interface ExportHistory {
  id: string;
  fileName: string;
  format: ExportFormat;
  reportType: ReportType;
  period: string;
  rows: number;
  fileSize: string;
  status: ExportStatus;
  createdAt: string;
  expiresAt: string;
  downloadUrl: string;
}

/* ═══════════════════════════════════════════════════════════
   Mock Data
   ═══════════════════════════════════════════════════════════ */

const EXPORT_HISTORY: ExportHistory[] = [
  {
    id: 'exp1', fileName: 'savings_transactions_2026Q1.csv', format: 'csv', reportType: 'transaction',
    period: '01/01/2026 - 09/03/2026', rows: 47, fileSize: '12.3 KB', status: 'completed',
    createdAt: '09/03/2026 14:30', expiresAt: '16/03/2026 14:30', downloadUrl: '#',
  },
  {
    id: 'exp2', fileName: 'savings_tax_report_2025.pdf', format: 'pdf', reportType: 'tax',
    period: '01/01/2025 - 31/12/2025', rows: 156, fileSize: '245 KB', status: 'completed',
    createdAt: '05/01/2026 10:00', expiresAt: '05/04/2026 10:00', downloadUrl: '#',
  },
  {
    id: 'exp3', fileName: 'savings_portfolio_snapshot.xlsx', format: 'xlsx', reportType: 'portfolio',
    period: 'Thời điểm: 09/03/2026', rows: 8, fileSize: '18.7 KB', status: 'completed',
    createdAt: '09/03/2026 09:15', expiresAt: '16/03/2026 09:15', downloadUrl: '#',
  },
  {
    id: 'exp4', fileName: 'savings_performance_30d.csv', format: 'csv', reportType: 'performance',
    period: '07/02/2026 - 09/03/2026', rows: 30, fileSize: '8.1 KB', status: 'completed',
    createdAt: '08/03/2026 16:00', expiresAt: '15/03/2026 16:00', downloadUrl: '#',
  },
];

const FORMAT_CONFIG: Record<ExportFormat, { label: string; icon: React.ComponentType<any>; color: string; bg: string; desc: string }> = {
  csv: { label: 'CSV', icon: FileSpreadsheet, color: '#10B981', bg: 'rgba(16,185,129,0.1)', desc: 'Tương thích Excel, Google Sheets' },
  pdf: { label: 'PDF', icon: FileText, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', desc: 'Báo cáo định dạng, in ấn' },
  xlsx: { label: 'Excel', icon: FileSpreadsheet, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', desc: 'Microsoft Excel với định dạng' },
};

const SCOPE_OPTIONS: { id: ExportScope; label: string; icon: React.ComponentType<any>; color: string }[] = [
  { id: 'all', label: 'Tất cả', icon: Filter, color: '#8B5CF6' },
  { id: 'subscribe', label: 'Gửi tiết kiệm', icon: ArrowDownToLine, color: '#10B981' },
  { id: 'redeem', label: 'Rút tiết kiệm', icon: ArrowUpFromLine, color: '#3B82F6' },
  { id: 'interest', label: 'Nhận lãi', icon: TrendingUp, color: '#F59E0B' },
  { id: 'compound', label: 'Lãi kép', icon: Zap, color: '#06B6D4' },
];

const PERIOD_OPTIONS: { id: ExportPeriod; label: string }[] = [
  { id: '7d', label: '7 ngày' },
  { id: '30d', label: '30 ngày' },
  { id: '90d', label: '90 ngày' },
  { id: '6m', label: '6 tháng' },
  { id: '1y', label: '1 năm' },
  { id: 'all', label: 'Tất cả' },
];

const REPORT_TYPES: { id: ReportType; title: string; desc: string; icon: React.ComponentType<any>; color: string; bg: string; estimatedRows: number; fields: string[] }[] = [
  {
    id: 'transaction', title: 'Lịch sử giao dịch', desc: 'Xuất tất cả giao dịch tiết kiệm: gửi, rút, nhận lãi, lãi kép',
    icon: ArrowDownToLine, color: '#10B981', bg: 'rgba(16,185,129,0.08)',
    estimatedRows: 47, fields: ['Ngày', 'Loại', 'Sản phẩm', 'Số lượng', 'USD', 'APY', 'Trạng thái', 'Mã GD'],
  },
  {
    id: 'tax', title: 'Báo cáo thuế', desc: 'Tóm tắt thu nhập lãi tiết kiệm theo năm, phù hợp nộp thuế cá nhân',
    icon: Shield, color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',
    estimatedRows: 12, fields: ['Tháng', 'Tổng lãi', 'USD', 'Sản phẩm', 'Loại', 'Ghi chú'],
  },
  {
    id: 'portfolio', title: 'Ảnh chụp danh mục', desc: 'Trạng thái hiện tại của tất cả vị thế tiết kiệm đang hoạt động',
    icon: PiggyBank, color: '#3B82F6', bg: 'rgba(59,130,246,0.08)',
    estimatedRows: 8, fields: ['Sản phẩm', 'Tài sản', 'Số lượng', 'USD', 'APY', 'Loại', 'Ngày bắt đầu', 'Đáo hạn'],
  },
  {
    id: 'performance', title: 'Hiệu suất đầu tư', desc: 'Phân tích hiệu suất: lãi hằng ngày, APY trung bình, tăng trưởng',
    icon: TrendingUp, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',
    estimatedRows: 30, fields: ['Ngày', 'Tổng gửi', 'Tổng lãi', 'APY TB', 'Giá trị', 'Tăng trưởng'],
  },
];

/* ═══════════════════════════════════════════════════════════
   Toggle Component
   ═══════════════════════════════════════════════════════════ */

function Toggle({ on, onChange, size = 'sm' }: { on: boolean; onChange: (v: boolean) => void; size?: 'sm' | 'md' }) {
  const c = useThemeColors();
  const w = size === 'sm' ? 36 : 44;
  const h = size === 'sm' ? 20 : 24;
  const dot = size === 'sm' ? 16 : 20;
  return (
    <button onClick={() => onChange(!on)}
      style={{
        width: w, height: h, borderRadius: h,
        background: on ? '#10B981' : c.surface2,
        border: `1.5px solid ${on ? '#10B981' : c.borderSolid}`,
        position: 'relative', transition: 'all 0.2s',
      }}>
      <div style={{
        width: dot, height: dot, borderRadius: dot,
        background: on ? '#fff' : c.text3,
        position: 'absolute',
        top: (h - dot) / 2 - 1.5,
        left: on ? w - dot - 2 - 1.5 : 2,
        transition: 'all 0.2s',
      }} />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */

export function SavingsExportPage() {
  const c = useThemeColors();
  const { hapticSelection, hapticLight, hapticSuccess } = useHaptic();

  /* State */
  const [tab, setTab] = useState<'create' | 'history'>('create');
  const [history, setHistory] = useState(EXPORT_HISTORY);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState<ExportHistory | null>(null);
  const [exportStatus, setExportStatus] = useState<ExportStatus>('ready');

  /* Export config */
  const [config, setConfig] = useState<ExportConfig>({
    format: 'csv',
    scope: 'all',
    period: '30d',
    includeInterest: true,
    includeFees: true,
    includeAPYHistory: false,
    includeProductDetails: true,
    emailCopy: false,
    reportType: 'transaction',
  });

  /* Selected report type info */
  const selectedReport = REPORT_TYPES.find(r => r.id === config.reportType)!;

  /* Estimated file size */
  const estimatedSize = useMemo(() => {
    const baseRows = selectedReport.estimatedRows;
    const periodMultiplier = { '7d': 0.25, '30d': 1, '90d': 3, '6m': 6, '1y': 12, all: 24, custom: 1 };
    const rows = Math.round(baseRows * (periodMultiplier[config.period] || 1));
    const sizeKB = config.format === 'pdf' ? rows * 3 : rows * 0.3;
    return { rows, size: sizeKB < 1000 ? `${sizeKB.toFixed(1)} KB` : `${(sizeKB / 1000).toFixed(1)} MB` };
  }, [selectedReport, config.format, config.period]);

  /* Period label */
  const periodLabel = PERIOD_OPTIONS.find(p => p.id === config.period)?.label ?? config.period;

  /* Handlers */
  const handleExport = useCallback(() => {
    hapticSelection();
    setExportStatus('generating');
    setShowPreview(false);

    // Simulate export generation
    setTimeout(() => {
      const newExport: ExportHistory = {
        id: `exp${Date.now()}`,
        fileName: `savings_${config.reportType}_${config.period}.${config.format}`,
        format: config.format,
        reportType: config.reportType,
        period: periodLabel,
        rows: estimatedSize.rows,
        fileSize: estimatedSize.size,
        status: 'completed',
        createdAt: '09/03/2026 ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        expiresAt: '16/03/2026',
        downloadUrl: '#',
      };
      setHistory(prev => [newExport, ...prev]);
      setExportStatus('completed');
      hapticSuccess();
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        setExportStatus('ready');
      }, 3000);
    }, 2000);
  }, [config, periodLabel, estimatedSize, hapticSelection, hapticSuccess]);

  const handleCopyLink = useCallback((exportItem: ExportHistory) => {
    hapticLight();
    // Simulate copy
    navigator.clipboard?.writeText?.(`https://app.example.com/exports/${exportItem.id}`).catch(() => {});
  }, [hapticLight]);

  const TABS = [
    { id: 'create' as const, label: 'Tạo báo cáo' },
    { id: 'history' as const, label: `Lịch sử (${history.length})` },
  ];

  return (
    <PageLayout>
      {/* ─── Preview & Confirm Sheet ─── */}
      <BottomSheetV2 open={showPreview} onClose={() => setShowPreview(false)} title="Xác nhận xuất báo cáo">
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: selectedReport.bg }}>
              <selectedReport.icon size={ICON_SIZE.lg} color={selectedReport.color} />
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{selectedReport.title}</p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{FORMAT_CONFIG[config.format].label} · {periodLabel}</p>
            </div>
          </div>

          {/* Details */}
          <div className="rounded-2xl p-3" style={{ background: c.surface2 }}>
            <BottomSheetRow label="Định dạng" value={FORMAT_CONFIG[config.format].label} />
            <BottomSheetRow label="Phạm vi" value={SCOPE_OPTIONS.find(s => s.id === config.scope)?.label ?? 'Tất cả'} />
            <BottomSheetRow label="Thời gian" value={periodLabel} />
            <BottomSheetRow label="Dự kiến số dòng" value={`~${estimatedSize.rows} dòng`} />
            <BottomSheetRow label="Kích thước" value={`~${estimatedSize.size}`} />
            <BottomSheetRow label="Bao gồm lãi" value={config.includeInterest ? 'Có' : 'Không'} valueColor={config.includeInterest ? '#10B981' : c.text3} />
            <BottomSheetRow label="Bao gồm phí" value={config.includeFees ? 'Có' : 'Không'} valueColor={config.includeFees ? '#10B981' : c.text3} />
            <BottomSheetRow label="Chi tiết sản phẩm" value={config.includeProductDetails ? 'Có' : 'Không'} valueColor={config.includeProductDetails ? '#10B981' : c.text3} />
            {config.emailCopy && <BottomSheetRow label="Gửi email" value="Có" valueColor="#3B82F6" />}
          </div>

          {/* Fields preview */}
          <div>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 6 }}>Các cột dữ liệu</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedReport.fields.map(field => (
                <span key={field} className="px-2 py-1 rounded-lg"
                  style={{ background: c.chipBg, color: c.chipText, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium, border: `1px solid ${c.chipBorder}` }}>
                  {field}
                </span>
              ))}
              {config.includeAPYHistory && (
                <span className="px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium, border: '1px solid rgba(245,158,11,0.2)' }}>
                  Lịch sử APY
                </span>
              )}
            </div>
          </div>

          {/* Privacy note */}
          <div className="flex items-start gap-2 p-2.5 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
            <Shield size={ICON_SIZE.sm} color="#3B82F6" className="mt-0.5 shrink-0" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.micro, lineHeight: 1.5 }}>
              File xuất sẽ được lưu trữ an toàn và tự động xóa sau 7 ngày. 
              Không chia sẻ link tải xuống với người khác.
            </p>
          </div>

          <CTAButton onClick={handleExport}>
            Xuất báo cáo
          </CTAButton>
        </div>
      </BottomSheetV2>

      {/* ─── Export Detail Sheet ─── */}
      <BottomSheetV2 open={!!showDetailSheet} onClose={() => setShowDetailSheet(null)} title="Chi tiết báo cáo">
        {showDetailSheet && (() => {
          const item = showDetailSheet;
          const fmt = FORMAT_CONFIG[item.format];
          const rpt = REPORT_TYPES.find(r => r.id === item.reportType)!;
          return (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: fmt.bg }}>
                  <fmt.icon size={ICON_SIZE.lg} color={fmt.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, wordBreak: 'break-all' }}>{item.fileName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                      {item.status === 'completed' ? 'Hoàn tất' : 'Đang xử lý'}
                    </span>
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{fmt.label}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-3" style={{ background: c.surface2 }}>
                <BottomSheetRow label="Loại báo cáo" value={rpt.title} />
                <BottomSheetRow label="Thời gian" value={item.period} />
                <BottomSheetRow label="Số dòng" value={`${item.rows} dòng`} />
                <BottomSheetRow label="Kích thước" value={item.fileSize} />
                <BottomSheetRow label="Tạo lúc" value={item.createdAt} />
                <BottomSheetRow label="Hết hạn" value={item.expiresAt} valueColor="#F59E0B" />
              </div>

              <div className="flex gap-2">
                <CTAButton variant="secondary" onClick={() => handleCopyLink(item)} className="flex-1">
                  <Copy size={ICON_SIZE.sm} className="mr-1.5 inline" />
                  Sao link
                </CTAButton>
                <CTAButton onClick={() => { hapticSuccess(); setShowDetailSheet(null); }} className="flex-1">
                  <Download size={ICON_SIZE.sm} className="mr-1.5 inline" />
                  Tải xuống
                </CTAButton>
              </div>
            </div>
          );
        })()}
      </BottomSheetV2>

      {/* ─── Success Toast ─── */}
      {showSuccessToast && (
        <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: c.surface, border: '1px solid #10B981', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 440, margin: '0 auto' }}>
          <CheckCircle size={ICON_SIZE.md} color="#10B981" />
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Xuất báo cáo thành công!</p>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>File đã sẵn sàng tải xuống.</p>
          </div>
          <button onClick={() => setShowSuccessToast(false)}><X size={ICON_SIZE.sm} color={c.text3} /></button>
        </div>
      )}

      {/* ─── Generating overlay ─── */}
      {exportStatus === 'generating' && (
        <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: c.surface, border: `1px solid ${c.borderSolid}`, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 440, margin: '0 auto' }}>
          <RefreshCw size={ICON_SIZE.base} color="#3B82F6" className="animate-spin" />
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Đang tạo báo cáo...</p>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Vui lòng chờ trong giây lát.</p>
          </div>
        </div>
      )}

      {/* ─── Header ─── */}
      <Header title="Xuất báo cáo" back />

      {/* ─── Hero ─── */}
      <TrCard variant="hero" rounded="lg" className="mx-5 mt-4 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Download size={ICON_SIZE.base} color={c.primary} />
          <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Export & Báo cáo</span>
        </div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Tổng báo cáo đã tạo</p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.xl, fontWeight: FONT_WEIGHT.bold }}>{history.length}</p>
          </div>
          <div className="text-right">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Loại báo cáo</p>
            <p style={{ color: '#3B82F6', fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>4 loại</p>
          </div>
        </div>
        <div className="flex gap-3">
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Định dạng</p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>CSV · PDF · Excel</p>
          </TrCardStat>
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Lưu trữ</p>
            <div className="flex items-center gap-1">
              <Shield size={ICON_SIZE.sm} color="#10B981" />
              <p style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>7 ngày</p>
            </div>
          </TrCardStat>
        </div>
      </TrCard>

      {/* ─── TabBar ─── */}
      <div className="px-5 mt-4">
        <TabBar variant="segment" tabs={TABS} active={tab} onChange={(t) => setTab(t as typeof tab)} />
      </div>

      {/* ═══ Create Tab ═══ */}
      {tab === 'create' && (
        <PageContent padding="compact" gap="default">
          {/* Step 1: Report Type */}
          <PageSection label="Loại báo cáo">
            <div className="flex flex-col gap-2">
              {REPORT_TYPES.map(rpt => (
                <button
                  key={rpt.id}
                  onClick={() => { setConfig(prev => ({ ...prev, reportType: rpt.id })); hapticLight(); }}
                  className="flex items-start gap-3 p-3.5 rounded-xl text-left"
                  style={{
                    background: config.reportType === rpt.id ? rpt.bg : c.surface2,
                    border: `1.5px solid ${config.reportType === rpt.id ? rpt.color + '40' : 'transparent'}`,
                  }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: config.reportType === rpt.id ? rpt.color + '22' : c.borderSolid + '66' }}>
                    <rpt.icon size={ICON_SIZE.sm} color={config.reportType === rpt.id ? rpt.color : c.text3} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{rpt.title}</p>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.4, marginTop: 2 }}>{rpt.desc}</p>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 4 }}>~{rpt.estimatedRows} dòng · {rpt.fields.length} cột</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1"
                    style={{ borderColor: config.reportType === rpt.id ? rpt.color : c.borderSolid }}>
                    {config.reportType === rpt.id && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: rpt.color }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </PageSection>

          {/* Step 2: Format */}
          <PageSection label="Định dạng file">
            <div className="flex gap-2">
              {(Object.keys(FORMAT_CONFIG) as ExportFormat[]).map(fmt => {
                const info = FORMAT_CONFIG[fmt];
                return (
                  <button key={fmt}
                    onClick={() => { setConfig(prev => ({ ...prev, format: fmt })); hapticLight(); }}
                    className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl"
                    style={{
                      background: config.format === fmt ? info.bg : c.surface2,
                      border: `1.5px solid ${config.format === fmt ? info.color + '40' : 'transparent'}`,
                    }}>
                    <info.icon size={ICON_SIZE.md} color={config.format === fmt ? info.color : c.text3} />
                    <span style={{ color: config.format === fmt ? info.color : c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{info.label}</span>
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, textAlign: 'center' }}>{info.desc}</span>
                  </button>
                );
              })}
            </div>
          </PageSection>

          {/* Step 3: Period */}
          <PageSection label="Khoảng thời gian">
            <div className="flex flex-wrap gap-2">
              {PERIOD_OPTIONS.map(p => (
                <button key={p.id}
                  onClick={() => { setConfig(prev => ({ ...prev, period: p.id })); hapticLight(); }}
                  className="px-3.5 py-2 rounded-xl text-xs"
                  style={{
                    background: config.period === p.id ? 'rgba(59,130,246,0.12)' : c.chipBg,
                    color: config.period === p.id ? '#3B82F6' : c.chipText,
                    border: `1px solid ${config.period === p.id ? '#3B82F640' : c.chipBorder}`,
                    fontWeight: 600,
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
          </PageSection>

          {/* Step 4: Scope (for transaction report) */}
          {config.reportType === 'transaction' && (
            <PageSection label="Loại giao dịch">
              <div className="flex flex-wrap gap-2">
                {SCOPE_OPTIONS.map(s => (
                  <button key={s.id}
                    onClick={() => { setConfig(prev => ({ ...prev, scope: s.id })); hapticLight(); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
                    style={{
                      background: config.scope === s.id ? s.color + '18' : c.chipBg,
                      color: config.scope === s.id ? s.color : c.chipText,
                      border: `1px solid ${config.scope === s.id ? s.color + '40' : c.chipBorder}`,
                      fontWeight: 600,
                    }}>
                    <s.icon size={12} />
                    {s.label}
                  </button>
                ))}
              </div>
            </PageSection>
          )}

          {/* Step 5: Options */}
          <PageSection label="Tùy chọn thêm">
            <div className="flex flex-col gap-2">
              {[
                { key: 'includeInterest' as const, label: 'Bao gồm lãi tích lũy', desc: 'Thêm cột lãi hằng ngày/tháng', icon: TrendingUp, color: '#10B981' },
                { key: 'includeFees' as const, label: 'Bao gồm phí', desc: 'Thêm cột phí giao dịch (nếu có)', icon: Info, color: '#F59E0B' },
                { key: 'includeAPYHistory' as const, label: 'Lịch sử APY', desc: 'Thêm dữ liệu APY theo ngày', icon: TrendingUp, color: '#8B5CF6' },
                { key: 'includeProductDetails' as const, label: 'Chi tiết sản phẩm', desc: 'Thêm loại, thời hạn, rủi ro', icon: PiggyBank, color: '#3B82F6' },
                { key: 'emailCopy' as const, label: 'Gửi bản sao qua email', desc: 'Gửi file tới email đã đăng ký', icon: Mail, color: '#06B6D4' },
              ].map(opt => (
                <div key={opt.key} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <opt.icon size={ICON_SIZE.sm} color={opt.color} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{opt.label}</p>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{opt.desc}</p>
                  </div>
                  <Toggle on={config[opt.key]} onChange={(v) => { setConfig(prev => ({ ...prev, [opt.key]: v })); hapticLight(); }} />
                </div>
              ))}
            </div>
          </PageSection>

          {/* Preview summary */}
          <div className="rounded-2xl p-3" style={{ background: c.surface2 }}>
            <div className="flex items-center gap-2 mb-2">
              <Eye size={ICON_SIZE.sm} color={c.text2} />
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Tóm tắt</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl" style={{ background: c.surface }}>
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Số dòng</p>
                <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>~{estimatedSize.rows}</p>
              </div>
              <div className="p-2 rounded-xl" style={{ background: c.surface }}>
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Kích thước</p>
                <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{estimatedSize.size}</p>
              </div>
              <div className="p-2 rounded-xl" style={{ background: c.surface }}>
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Định dạng</p>
                <p style={{ color: FORMAT_CONFIG[config.format].color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{FORMAT_CONFIG[config.format].label}</p>
              </div>
            </div>
          </div>

          {/* Privacy notice */}
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <AlertTriangle size={ICON_SIZE.sm} color="#F59E0B" className="mt-0.5 shrink-0" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
              Báo cáo có thể chứa thông tin tài chính nhạy cảm. Không chia sẻ file với người khác.
              File tự động xóa sau 7 ngày.
            </p>
          </div>

          {/* CTA */}
          <CTAButton onClick={() => { setShowPreview(true); hapticSelection(); }}
            disabled={exportStatus === 'generating'}>
            {exportStatus === 'generating' ? 'Đang tạo...' : `Xem trước & Xuất ${FORMAT_CONFIG[config.format].label}`}
          </CTAButton>
        </PageContent>
      )}

      {/* ═══ History Tab ═══ */}
      {tab === 'history' && (
        <PageContent padding="compact" gap="default">
          {history.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.surface2 }}>
                <Download size={ICON_SIZE.xl} color={c.text3} />
              </div>
              <p style={{ color: c.text2, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>Chưa có báo cáo nào</p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, textAlign: 'center', maxWidth: 260 }}>
                Tạo báo cáo đầu tiên để xuất dữ liệu tiết kiệm.
              </p>
              <button onClick={() => { setTab('create'); hapticSelection(); }}
                className="mt-2 px-6 py-3 rounded-2xl text-white"
                style={{ background: c.primary, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                Tạo báo cáo
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map(item => {
                const fmt = FORMAT_CONFIG[item.format];
                const rpt = REPORT_TYPES.find(r => r.id === item.reportType)!;
                return (
                  <TrCard key={item.id} hover className="p-4"
                    onClick={() => { setShowDetailSheet(item); hapticSelection(); }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: fmt.bg }}>
                        <fmt.icon size={ICON_SIZE.base} color={fmt.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded"
                            style={{ background: rpt.bg, color: rpt.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                            {rpt.title}
                          </span>
                          <span className="px-1.5 py-0.5 rounded"
                            style={{ background: fmt.bg, color: fmt.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                            {fmt.label}
                          </span>
                        </div>
                        <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, wordBreak: 'break-all', marginTop: 4 }}>
                          {item.fileName}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{item.rows} dòng</span>
                          <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{item.fileSize}</span>
                          <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{item.createdAt}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="px-1.5 py-0.5 rounded"
                          style={{
                            background: item.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                            color: item.status === 'completed' ? '#10B981' : '#F59E0B',
                            fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold,
                          }}>
                          {item.status === 'completed' ? 'San sang' : 'Dang xu ly'}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); hapticSuccess(); }}
                          className="p-1.5 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)' }}>
                          <Download size={ICON_SIZE.sm} color="#3B82F6" />
                        </button>
                      </div>
                    </div>

                    {/* Expiry warning */}
                    <div className="flex items-center gap-1.5 mt-3 pt-3"
                      style={{ borderTop: `1px solid ${c.divider}` }}>
                      <Clock size={ICON_SIZE.sm} color={c.text3} />
                      <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Het han: {item.expiresAt}</span>
                    </div>
                  </TrCard>
                );
              })}
            </div>
          )}

          {/* Storage info */}
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
            <Info size={ICON_SIZE.sm} color="#3B82F6" className="mt-0.5 shrink-0" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
              Báo cáo được lưu trữ an toàn trên server và tự động xóa sau 7 ngày.
              Tải xuống trước khi hết hạn để lưu trữ lâu dài.
            </p>
          </div>
        </PageContent>
      )}
    </PageLayout>
  );
}