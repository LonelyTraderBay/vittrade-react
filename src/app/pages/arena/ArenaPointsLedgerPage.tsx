/**
 * ══════════════════════════════════════════════════════════
 *  ArenaPointsLedgerPage — /arena/points/ledger
 * ══════════════════════════════════════════════════════════
 *  07B: Full audit trail of all Arena Points changes.
 *  Filter chips, search, each row shows reason/amount/balance/status.
 *  Tappable rows → entry detail.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, ChevronRight, Info, TrendingUp, TrendingDown,
  ArrowRightLeft, Shield, RotateCcw, Settings2,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ArenaPageFooter } from '../../components/arena/ArenaPageFooter';
import { LoadMoreButton } from '../../components/arena/ArenaNiceToHave';
import { TOAST } from '../../data/toastMessages';
import { φ } from '../../utils/golden';
import {
  ARENA_LEDGER_ENTRIES, LEDGER_TYPE_CONFIG, fmtPoints, MY_ARENA_STATS,
  type LedgerEntry, type LedgerEntryType,
} from '../../data/arenaData';

type FilterType = 'all' | LedgerEntryType;

const FILTER_CHIPS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'earned', label: 'Nhận' },
  { id: 'spent', label: 'Chi' },
  { id: 'entry', label: 'Tham gia' },
  { id: 'settlement', label: 'Kết toán' },
  { id: 'refund', label: 'Hoàn điểm' },
  { id: 'adjustment', label: 'Điều chỉnh' },
];

const TYPE_ICONS: Record<LedgerEntryType, typeof TrendingUp> = {
  earned: TrendingUp,
  spent: TrendingDown,
  entry: ArrowRightLeft,
  settlement: Shield,
  refund: RotateCcw,
  adjustment: Settings2,
};

export function ArenaPointsLedgerPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let entries = ARENA_LEDGER_ENTRIES;
    if (filter !== 'all') entries = entries.filter(e => e.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      entries = entries.filter(e =>
        (e.note?.toLowerCase().includes(q)) ||
        (e.linkedChallengeName?.toLowerCase().includes(q)) ||
        (e.linkedModeName?.toLowerCase().includes(q)) ||
        e.reasonCode.toLowerCase().includes(q)
      );
    }
    return entries;
  }, [filter, search]);

  return (
    <PageLayout>
      <Header title="Lịch sử Arena Points" subtitle="Sổ điểm · Open Arena" back />

      <PageContent gap="default">

          {/* ─── Balance summary ─── */}
          <TrCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: c.text3, fontSize: φ.xs }}>Số dư hiện tại</p>
                <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, fontFamily: 'monospace' }}>
                  {fmtPoints(MY_ARENA_STATS.currentBalance)} pts
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 600 }}>+{fmtPoints(MY_ARENA_STATS.pointsEarned)}</p>
                  <p style={{ color: c.text3, fontSize: 9 }}>Đã nhận</p>
                </div>
                <div className="text-right">
                  <p style={{ color: '#EF4444', fontSize: φ.xs, fontWeight: 600 }}>-{fmtPoints(MY_ARENA_STATS.pointsSpent)}</p>
                  <p style={{ color: c.text3, fontSize: 9 }}>Đã dùng</p>
                </div>
              </div>
            </div>
          </TrCard>

          {/* ─── Search ─── */}
          <div className="relative">
            <Search size={16} color={c.text3} className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên challenge, lý do..."
              className="w-full pl-10 pr-4 py-3 rounded-xl"
              style={{
                background: c.searchBg, border: `1.5px solid ${c.searchBorder}`,
                color: c.text1, fontSize: φ.sm, outline: 'none', minHeight: 44,
              }}
            />
          </div>

          {/* ─── Filter chips ─── */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {FILTER_CHIPS.map(chip => {
              const active = filter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => { setFilter(chip.id); hapticSelection(); }}
                  className="shrink-0 px-3 py-2 rounded-xl active:opacity-70"
                  style={{
                    background: active ? c.chipActiveBg : c.chipBg,
                    border: `1.5px solid ${active ? c.chipActiveBorder : c.chipBorder}`,
                    color: active ? c.chipActiveText : c.chipText,
                    fontSize: φ.xs, fontWeight: 600, minHeight: 36,
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* ─── Entry count ─── */}
          <p style={{ color: c.text3, fontSize: φ.xs }}>
            {filtered.length} bản ghi
          </p>

          {/* ─── Ledger list ─── */}
          {filtered.length === 0 ? (
            <TrCard className="p-6 text-center">
              <p style={{ color: c.text3, fontSize: φ.sm }}>Không tìm thấy bản ghi nào</p>
            </TrCard>
          ) : (
            <TrCard overflow>
              {filtered.map((entry, i) => {
                const typeCfg = LEDGER_TYPE_CONFIG[entry.type];
                const Icon = TYPE_ICONS[entry.type];
                return (
                  <button
                    key={entry.id}
                    onClick={() => { navigate(`${prefix}/arena/ledger/entry/${entry.id}`); hapticSelection(); }}
                    className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:opacity-70"
                    style={{
                      borderBottom: i < filtered.length - 1 ? `1px solid ${c.divider}` : 'none',
                      minHeight: 64,
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: typeCfg.bg }}>
                      <Icon size={16} color={typeCfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">
                          {entry.note || entry.linkedChallengeName || entry.reasonCode}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded" style={{ background: typeCfg.bg, color: typeCfg.color, fontSize: 9, fontWeight: 600 }}>
                          {typeCfg.label}
                        </span>
                        <span style={{ color: c.text3, fontSize: 10 }}>{entry.time}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 ml-2">
                      <span style={{
                        color: entry.amount > 0 ? '#10B981' : entry.amount < 0 ? '#EF4444' : c.text3,
                        fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace',
                      }}>
                        {entry.amount > 0 ? '+' : ''}{entry.amount === 0 ? '0' : fmtPoints(Math.abs(entry.amount))}
                      </span>
                      <span style={{ color: c.text3, fontSize: 9 }}>
                        → {fmtPoints(entry.balanceAfter)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </TrCard>
          )}

          {/* ─── Audit notice ─── */}
          <TrCard className="p-3 flex items-start gap-2">
            <Shield size={13} color="#8B5CF6" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
              Mọi thay đổi Arena Points đều được ghi lại với mã tham chiếu duy nhất. Arena Points không phải tài sản tài chính và không có giá trị tiền tệ.
            </p>
          </TrCard>

          <ArenaPageFooter hideDisclaimer />

      </PageContent>
    </PageLayout>
  );
}