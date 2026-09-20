import React, { useState } from 'react';
import { Users, Plus, Shield, Key, BarChart3, ArrowDownUp, Eye, EyeOff, ChevronRight, Settings, AlertTriangle, CheckCircle, Pause, Snowflake } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { SUB_ACCOUNTS } from '../../data/mockData';
import { fmtUsd, fmtSignedUsd, fmtCompact } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  active: { color: '#10B981', label: 'Hoạt động', icon: CheckCircle },
  frozen: { color: '#F59E0B', label: 'Đóng băng', icon: Snowflake },
  pending: { color: '#3B82F6', label: 'Chờ duyệt', icon: Pause },
};

const TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  spot: { color: '#10B981', label: 'Spot' },
  margin: { color: '#F59E0B', label: 'Margin' },
  futures: { color: '#EF4444', label: 'Futures' },
  all: { color: '#3B82F6', label: 'Tất cả' },
};

const PERMISSION_LABELS: Record<string, string> = {
  spot_trade: 'Spot',
  margin_trade: 'Margin',
  futures_trade: 'Futures',
  transfer: 'Chuyển',
  withdraw: 'Rút',
  read: 'Xem',
};

export function SubAccountPage() {
  const c = useThemeColors();
  const [accounts] = useState(SUB_ACCOUNTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalPnl = accounts.reduce((s, a) => s + a.pnl30d, 0);
  const activeCount = accounts.filter(a => a.status === 'active').length;

  return (
    <PageLayout>
      <Header title="Tài khoản phụ" subtitle="Tài khoản · Profile" back />

      <PageContent gap="relaxed">
        {/* Summary card */}
        <div className="rounded-3xl p-5"
          style={{ background: c.portfolioBg, border: `1px solid ${c.portfolioBorder}`, boxShadow: c.portfolioShadow }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={18} color={c.primary} />
              <span style={{ color: c.text2, fontSize: 12 }}>Tổng tài sản tất cả tài khoản</span>
            </div>
            <button onClick={() => setIsBalanceHidden(!isBalanceHidden)}>
              {isBalanceHidden ? <EyeOff size={16} color={c.text3} /> : <Eye size={16} color={c.text3} />}
            </button>
          </div>
          <p style={{ color: c.text1, fontSize: 28, fontWeight: 700, fontFamily: 'monospace' }}>
            {isBalanceHidden ? '••••••' : fmtUsd(totalBalance)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span style={{ color: totalPnl >= 0 ? '#10B981' : '#EF4444', fontSize: 13, fontWeight: 600 }}>
              {isBalanceHidden ? '••••' : `PnL 30d: ${fmtSignedUsd(totalPnl)}`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="rounded-xl p-2.5" style={{ background: c.portfolioBtnGhost }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Tổng TK</p>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{accounts.length}</p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: c.portfolioBtnGhost }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Hoạt động</p>
              <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>{activeCount}</p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: c.portfolioBtnGhost }}>
              <p style={{ color: c.text3, fontSize: 10 }}>API Keys</p>
              <p style={{ color: '#F59E0B', fontSize: 16, fontWeight: 700 }}>{accounts.reduce((s, a) => s + a.apiKeyCount, 0)}</p>
            </div>
          </div>
        </div>

        {/* Create button */}
        <div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px dashed rgba(59,130,246,0.4)' }}>
            <Plus size={18} color={c.primary} />
            <span style={{ color: c.primary, fontSize: 14, fontWeight: 600 }}>Tạo tài khoản phụ mới</span>
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <TrCard className="p-4">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Tạo tài khoản phụ</p>
            <div className="flex flex-col gap-3">
              <div>
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Tên tài khoản</p>
                <input type="text" placeholder="VD: Grid Bot #2"
                  className="w-full px-4 py-3 rounded-xl bg-transparent outline-none"
                  style={{ color: c.text1, fontSize: 14, border: `1px solid ${c.borderSolid}` }} />
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Loại tài khoản</p>
                <div className="flex gap-2">
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <button key={key} className="flex-1 py-2 rounded-xl text-xs"
                      style={{ background: cfg.color + '15', color: cfg.color, fontWeight: 600, border: `1px solid ${cfg.color}33` }}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Quyền hạn</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                    <span key={key} className="px-3 py-1.5 rounded-xl text-xs"
                      style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, fontWeight: 600 }}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <button className="w-full py-3 rounded-xl mt-1"
                style={{ background: c.primary, color: '#FFF', fontSize: 14, fontWeight: 600 }}>
                Tạo tài khoản
              </button>
            </div>
          </TrCard>
        )}

        {/* Account list */}
        <div className="flex flex-col gap-3">
          <p style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>TÀI KHOẢN ({accounts.length})</p>
          {accounts.map(account => {
            const status = STATUS_CONFIG[account.status];
            const type = TYPE_CONFIG[account.type];
            const StatusIcon = status.icon;
            const isExpanded = expandedId === account.id;
            const isProfitable = account.pnl30d >= 0;

            return (
              <TrCard key={account.id} overflow
                style={{ opacity: account.status === 'suspended' ? 0.6 : 1 }}>
                <button onClick={() => setExpandedId(isExpanded ? null : account.id)}
                  className="w-full text-left p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: type.color + '15' }}>
                      <span style={{ color: type.color, fontSize: 11, fontWeight: 700 }}>{account.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{account.name}</span>
                        <span className="px-1.5 py-0.5 rounded-md" style={{ background: type.color + '15', color: type.color, fontSize: 9, fontWeight: 600 }}>
                          {type.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusIcon size={11} color={status.color} />
                        <span style={{ color: status.color, fontSize: 11 }}>{status.label}</span>
                        <span style={{ color: c.text3, fontSize: 10 }}>• {account.lastActive}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                        {isBalanceHidden ? '••••' : fmtUsd(account.balance)}
                      </p>
                      <p style={{ color: isProfitable ? '#10B981' : '#EF4444', fontSize: 11 }}>
                        {isBalanceHidden ? '••' : fmtSignedUsd(account.pnl30d)}
                      </p>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="pt-3 mb-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <p style={{ color: c.text3, fontSize: 9 }}>Volume 30d</p>
                          <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{fmtCompact(account.tradingVolume30d, { prefix: '$' })}</p>
                        </div>
                        <div>
                          <p style={{ color: c.text3, fontSize: 9 }}>API Keys</p>
                          <p style={{ color: '#F59E0B', fontSize: 12, fontWeight: 600 }}>{account.apiKeyCount}</p>
                        </div>
                        <div>
                          <p style={{ color: c.text3, fontSize: 9 }}>Tạo ngày</p>
                          <p style={{ color: c.text2, fontSize: 11 }}>{account.createdAt}</p>
                        </div>
                      </div>

                      {/* Permissions */}
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Quyền hạn:</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {account.permissions.map(perm => (
                          <span key={perm} className="px-2 py-0.5 rounded-lg"
                            style={{ background: c.surface2, color: c.text2, fontSize: 10 }}>
                            {PERMISSION_LABELS[perm] || perm}
                          </span>
                        ))}
                      </div>

                      {/* Email */}
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Email: <span style={{ color: c.text2 }}>{account.email}</span></p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl"
                        style={{ background: 'rgba(59,130,246,0.1)' }}>
                        <ArrowDownUp size={13} color={c.primary} />
                        <span style={{ color: c.primary, fontSize: 11, fontWeight: 600 }}>Chuyển tiền</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl"
                        style={{ background: 'rgba(245,158,11,0.1)' }}>
                        <Key size={13} color="#F59E0B" />
                        <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 600 }}>API Key</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl"
                        style={{ background: 'rgba(239,68,68,0.1)' }}>
                        <Settings size={13} color="#EF4444" />
                        <span style={{ color: '#EF4444', fontSize: 11, fontWeight: 600 }}>Cài đặt</span>
                      </button>
                    </div>
                  </div>
                )}
              </TrCard>
            );
          })}
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)' }}>
          <AlertTriangle size={14} color={c.primary} className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
            Mỗi tài khoản phụ có ví và API riêng biệt. Bạn có thể tạo tối đa 20 tài khoản phụ. Tài khoản phụ thừa hưởng mức VIP của tài khoản chính.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}