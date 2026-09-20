import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TRANSACTIONS } from '../../data/mockData';
import { fmtAmount, fmtFee } from '../../data/formatNumber';
import { Copy, CheckCircle, Clock, XCircle, ExternalLink, MessageSquare, Check, AlertCircle } from 'lucide-react';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';

const TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  deposit: { label: 'Nạp tiền', color: '#10B981', icon: '↓' },
  withdraw: { label: 'Rút tiền', color: '#EF4444', icon: '↑' },
  trade_buy: { label: 'Mua giao dịch', color: '#10B981', icon: '🔄' },
  trade_sell: { label: 'Bán giao dịch', color: '#EF4444', icon: '🔄' },
  p2p_buy: { label: 'P2P Mua', color: '#10B981', icon: '🤝' },
  p2p_sell: { label: 'P2P Bán', color: '#EF4444', icon: '🤝' },
};
const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  completed: { label: 'Hoàn thành', color: '#10B981', icon: CheckCircle },
  pending: { label: 'Đang xử lý', color: '#F59E0B', icon: Clock },
  failed: { label: 'Thất bại', color: '#EF4444', icon: XCircle },
};

function CopyButton({ text }: { text: string }) {
  const c = useThemeColors();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={handleCopy} className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.hoverBg }}>
      {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} color={c.text2} />}
    </button>
  );
}

export function TransactionDetailPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { txId } = useParams();
  const prefix = useRoutePrefix();
  const tx = TRANSACTIONS.find(t => t.id === txId);

  if (!tx) {
    return (
      <PageLayout>
        <Header title="Chi tiết giao dịch" subtitle="Lịch sử · Wallet" back />
        <div className="flex flex-col items-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.surface2 }}>
            <AlertCircle size={32} color="#EF4444" />
          </div>
          <p style={{ color: c.text2, fontSize: 15, fontWeight: 600 }}>Không tìm thấy giao dịch</p>
          <button onClick={() => navigate(`${prefix}/wallet/history`)} className="px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#3B82F6', color: '#fff' }}>Quay lại lịch sử</button>
        </div>
      </PageLayout>
    );
  }

  const typeInfo = TYPE_LABELS[tx.type];
  const statusInfo = STATUS_MAP[tx.status];
  const StatusIcon = statusInfo.icon;
  const isDebit = tx.type === 'withdraw' || tx.type === 'trade_sell' || tx.type === 'p2p_sell';

  const steps = [
    { label: 'Tạo yêu cầu', time: tx.createdAt, done: true },
    { label: 'Đang xử lý', time: tx.status !== 'failed' ? tx.createdAt : undefined, done: tx.status !== 'failed' },
    { label: tx.status === 'completed' ? 'Hoàn tất' : tx.status === 'failed' ? 'Thất bại' : 'Đang chờ...', time: tx.status === 'completed' ? tx.createdAt : undefined, done: tx.status === 'completed', failed: tx.status === 'failed' },
  ];

  const details: { label: string; value: string; copyable?: boolean }[] = [];
  if (tx.txHash) details.push({ label: 'Mã giao dịch (TxID)', value: tx.txHash, copyable: true });
  if (tx.network) details.push({ label: 'Mạng', value: tx.network });
  if (tx.address) details.push({ label: isDebit ? 'Địa chỉ nhận' : 'Địa chỉ gửi', value: tx.address, copyable: true });
  if (tx.fee !== undefined && tx.fee > 0) details.push({ label: 'Phí giao dịch', value: fmtFee(tx.fee) });
  details.push({ label: 'Thời gian', value: tx.createdAt });

  return (
    <PageLayout>
      <Header title="Chi tiết giao dịch" subtitle="Lịch sử · Wallet" back />

      <PageContent gap="default">
      <TrCard className="p-5 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: typeInfo.color + '18' }}>{typeInfo.icon}</div>
        <p style={{ color: c.text2, fontSize: 13 }}>{typeInfo.label}</p>
        <p style={{ color: typeInfo.color, fontSize: 28, fontWeight: 700, fontFamily: 'monospace' }}>{isDebit ? '-' : '+'}{fmtAmount(tx.amount)} {tx.asset}</p>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: statusInfo.color + '18', border: `1px solid ${statusInfo.color}33` }}>
          <StatusIcon size={14} color={statusInfo.color} /><span style={{ color: statusInfo.color, fontSize: 13, fontWeight: 600 }}>{statusInfo.label}</span>
        </div>
      </TrCard>

      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Tiến trình</p>
        <div className="flex flex-col gap-0">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            const dotColor = (step as any).failed ? '#EF4444' : step.done ? '#10B981' : c.borderSolid;
            return (
              <div key={step.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ background: dotColor }} />
                  {!isLast && <div className="w-0.5 flex-1 my-1" style={{ background: step.done ? '#10B981' : c.borderSolid, minHeight: 24 }} />}
                </div>
                <div className={isLast ? '' : 'pb-4'}>
                  <p style={{ color: step.done || (step as any).failed ? c.text1 : c.text3, fontSize: 14, fontWeight: 600 }}>{step.label}</p>
                  {step.time && <p style={{ color: c.text3, fontSize: 12, marginTop: 2 }}>{step.time}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </TrCard>

      <TrCard overflow>
        <p className="px-5 pt-4 pb-2" style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Thông tin chi tiết</p>
        {details.map((row, i) => (
          <div key={row.label} className="flex items-start justify-between px-4 py-3" style={{ borderTop: `1px solid ${c.divider}` }}>
            <span className="shrink-0" style={{ color: c.text2, fontSize: 13 }}>{row.label}</span>
            <div className="flex items-center gap-2 ml-3 min-w-0">
              <span className="text-right" style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all', minWidth: 0 }}>{row.value}</span>
              {row.copyable && <CopyButton text={row.value} />}
            </div>
          </div>
        ))}
      </TrCard>

      <div className="flex flex-col gap-3">
        {tx.txHash && (
          <button className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, color: '#3B82F6' }}>
            <ExternalLink size={16} /> Xem trên Explorer
          </button>
        )}
        <button onClick={() => navigate(`${prefix}/support`)} className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
          <MessageSquare size={16} /> Liên hệ hỗ trợ
        </button>
      </div>
      </PageContent>
    </PageLayout>
  );
}