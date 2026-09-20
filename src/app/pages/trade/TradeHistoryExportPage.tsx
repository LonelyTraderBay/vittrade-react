/**
 * ══════════════════════════════════════════════════════════════════
 *  TRADE HISTORY EXPORT PAGE — Sprint 3
 * ══════════════════════════════════════════════════════════════════
 *  Export trade history as CSV/PDF for tax and record keeping
 */

import React, { useState } from 'react';
import {
  Download, FileText, Calendar, Filter, ChevronDown,
  CheckCircle, FileSpreadsheet, Clock, Info,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { useActionToast } from '../../hooks/useActionToast';
import { fmtUsd, fmtCompact } from '../../data/formatNumber';

const FORMATS = [
  { id: 'csv', label: 'CSV', icon: FileSpreadsheet, desc: 'Excel, Google Sheets' },
  { id: 'pdf', label: 'PDF', icon: FileText, desc: 'Lưu trữ, in ấn' },
];

const PERIODS = [
  { id: '7d', label: '7 ngày' },
  { id: '30d', label: '30 ngày' },
  { id: '90d', label: '90 ngày' },
  { id: '1y', label: '1 năm' },
  { id: 'custom', label: 'Tùy chỉnh' },
];

const INCLUDES = [
  { id: 'spot', label: 'Spot Trading', checked: true },
  { id: 'futures', label: 'Futures', checked: true },
  { id: 'margin', label: 'Margin', checked: true },
  { id: 'convert', label: 'Convert', checked: true },
  { id: 'deposits', label: 'Nạp tiền', checked: false },
  { id: 'withdrawals', label: 'Rút tiền', checked: false },
  { id: 'fees', label: 'Chi tiết phí', checked: true },
  { id: 'pnl', label: 'P/L tổng hợp', checked: true },
];

export function TradeHistoryExportPage() {
  const c = useThemeColors();
  const actionToast = useActionToast();

  const [format, setFormat] = useState('csv');
  const [period, setPeriod] = useState('30d');
  const [includes, setIncludes] = useState(INCLUDES.map(i => ({ ...i })));
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const toggleInclude = (id: string) => {
    setIncludes(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsExporting(false);
    setExported(true);
    actionToast.success('Đã tạo file xuất dữ liệu');
  };

  // Mock stats
  const stats = {
    totalTrades: 847,
    totalVolume: 2458300,
    totalFees: 2340.56,
    netPnl: 12456.78,
  };

  return (
    <PageLayout variant="flush">
      <Header title="Xuất lịch sử giao dịch" back />
      <PageContent grow gap="relaxed">

        {/* Summary */}
        <div className="px-0">
          <TrCard rounded="md" className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Tổng lệnh</p>
                <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
                  {stats.totalTrades.toLocaleString()}
                </p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Tổng KL giao dịch</p>
                <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
                  {fmtCompact(stats.totalVolume, { prefix: '$' })}
                </p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Tổng phí</p>
                <p style={{ color: '#F59E0B', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                  {fmtUsd(stats.totalFees)}
                </p>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 10 }}>Lãi/Lỗ ròng</p>
                <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                  +{fmtUsd(stats.netPnl)}
                </p>
              </div>
            </div>
          </TrCard>
        </div>

        {/* Format selection */}
        <PageSection label="Định dạng file">
          <div className="flex gap-3">
            {FORMATS.map(fmt => {
              const Icon = fmt.icon;
              const active = format === fmt.id;
              return (
                <button key={fmt.id}
                  onClick={() => setFormat(fmt.id)}
                  className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl"
                  style={{
                    background: active ? c.chipActiveBg : c.surface2,
                    border: `1.5px solid ${active ? c.chipActiveBorder : c.borderSolid}`,
                  }}
                >
                  <Icon size={24} color={active ? c.chipActiveText : c.text2} />
                  <span style={{ color: active ? c.chipActiveText : c.text1, fontSize: 14, fontWeight: 700 }}>
                    {fmt.label}
                  </span>
                  <span style={{ color: c.text3, fontSize: 11 }}>{fmt.desc}</span>
                </button>
              );
            })}
          </div>
        </PageSection>

        {/* Period */}
        <PageSection label="Khoảng thời gian">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map(p => (
              <button key={p.id}
                onClick={() => setPeriod(p.id)}
                className="px-4 py-2 rounded-lg"
                style={{
                  background: period === p.id ? c.chipActiveBg : c.surface2,
                  color: period === p.id ? c.chipActiveText : c.text2,
                  border: `1px solid ${period === p.id ? c.chipActiveBorder : c.borderSolid}`,
                  fontSize: 13, fontWeight: period === p.id ? 700 : 500,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </PageSection>

        {/* Include checkboxes */}
        <PageSection label="Bao gồm dữ liệu">
          <TrCard rounded="md" className="p-3 flex flex-col gap-0">
            {includes.map(item => (
              <button key={item.id}
                onClick={() => toggleInclude(item.id)}
                className="flex items-center justify-between py-2.5 px-1"
                style={{ borderBottom: `1px solid ${c.divider}` }}
              >
                <span style={{ color: c.text1, fontSize: 13 }}>{item.label}</span>
                <div className="w-5 h-5 rounded flex items-center justify-center"
                  style={{
                    background: item.checked ? '#10B981' : 'transparent',
                    border: `2px solid ${item.checked ? '#10B981' : c.borderSolid}`,
                  }}>
                  {item.checked && <CheckCircle size={12} color="#fff" />}
                </div>
              </button>
            ))}
          </TrCard>
        </PageSection>

        {/* Tax note */}
        <div className="flex items-start gap-2 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
          <Info size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: '#3B82F6', fontSize: 11, lineHeight: 1.5 }}>
            File xuất phục vụ mục đích lưu trữ và khai thuế. Không phải tài liệu chính thức về thuế.
            Tham khảo ý kiến chuyên gia thuế cho trường hợp cụ thể.
          </p>
        </div>

      </PageContent>

      <StickyFooter>
        <div className="px-5 pb-2">
          {exported ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl"
                style={{ background: 'rgba(16,185,129,0.08)' }}>
                <CheckCircle size={16} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: 14, fontWeight: 600 }}>
                  File đã sẵn sàng tải xuống
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setExported(false)}
                  className="flex-1 h-12 rounded-xl"
                  style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, color: c.text2, fontSize: 14, fontWeight: 600 }}
                >
                  Tạo mới
                </button>
                <button
                  className="flex-[2] h-12 rounded-xl flex items-center justify-center gap-2 text-white font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    fontSize: 14,
                  }}
                >
                  <Download size={16} />
                  Tải {format.toUpperCase()}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-white font-bold"
              style={{
                background: isExporting ? c.surface2 : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                color: isExporting ? c.text3 : '#fff',
                fontSize: 14,
              }}
            >
              {isExporting ? (
                <>
                  <Clock size={16} className="animate-spin" />
                  Đang tạo file...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Xuất {format.toUpperCase()} ({period})
                </>
              )}
            </button>
          )}
        </div>
      </StickyFooter>
    </PageLayout>
  );
}
