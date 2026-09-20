import React, { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Shield, CheckCircle, Upload, Camera, ChevronRight, AlertTriangle } from 'lucide-react';
import { TrCard } from '../../components/ui/TrCard';

const KYC_LEVELS = [
  { level: 0, title: 'Cơ bản', limits: 'Nạp: Không giới hạn\nRút: $2,000/ngày', features: ['Nạp tiền', 'Giao dịch Spot'], color: '#8B95B3' },
  { level: 1, title: 'KYC Cấp 1', limits: 'Nạp: Không giới hạn\nRút: $20,000/ngày', features: ['Tất cả tính năng cơ bản', 'P2P Trading', 'Rút tiền cao hơn'], color: '#3B82F6' },
  { level: 2, title: 'KYC Cấp 2', limits: 'Nạp: Không giới hạn\nRút: $100,000/ngày', features: ['Tất cả cấp 1', 'OTC Trading', 'API Access'], color: '#10B981' },
];

export function KYCPage() {
  const c = useThemeColors();
  const [currentLevel] = useState(2);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  return (
    <PageLayout>
      <Header title="Xác minh danh tính" subtitle="KYC · Profile" back />

      <PageContent>
      <div className="my-4 rounded-2xl p-4"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.05) 100%)', border: '1px solid rgba(16,185,129,0.3)' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
            <Shield size={24} color="#10B981" />
          </div>
          <div>
            <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>KYC Cấp 2 — Đã xác minh</p>
            <p style={{ color: '#10B981', fontSize: 13 }}>Tài khoản của bạn đã được xác minh đầy đủ ✓</p>
          </div>
        </div>
      </div>

      {KYC_LEVELS.map(lv => {
        const isDone = currentLevel >= lv.level;
        const isExpanded = expandedLevel === lv.level;
        return (
          <TrCard key={lv.level} overflow className="mb-3"
            accentBorder={isDone ? lv.color + '44' : undefined}>
            <button onClick={() => setExpandedLevel(isExpanded ? null : lv.level)} className="flex items-center gap-4 px-4 py-4 w-full">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: isDone ? lv.color + '22' : c.surface2, border: `2px solid ${isDone ? lv.color : c.borderSolid}` }}>
                {isDone ? <CheckCircle size={20} color={lv.color} /> : <span style={{ color: c.text3, fontSize: 14, fontWeight: 700 }}>{lv.level}</span>}
              </div>
              <div className="flex-1 text-left">
                <p style={{ color: isDone ? c.text1 : c.text2, fontSize: 15, fontWeight: 700 }}>{lv.title}</p>
                <p style={{ color: c.text3, fontSize: 12 }}>{isDone ? '✓ Đã hoàn thành' : 'Chưa xác minh'}</p>
              </div>
              <ChevronRight size={16} color={c.text3} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
            </button>
            {isExpanded && (
              <div className="px-4 pb-4 flex flex-col gap-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                <div className="mt-3">
                  <p style={{ color: c.text2, fontSize: 12, marginBottom: 6 }}>Giới hạn giao dịch:</p>
                  {lv.limits.split('\n').map((line, i) => <p key={line} style={{ color: c.text1, fontSize: 13 }}>• {line}</p>)}
                </div>
                <div>
                  <p style={{ color: c.text2, fontSize: 12, marginBottom: 6 }}>Tính năng mở khóa:</p>
                  {lv.features.map((f, i) => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle size={12} color={isDone ? '#10B981' : c.text3} />
                      <p style={{ color: isDone ? c.text1 : c.text3, fontSize: 13 }}>{f}</p>
                    </div>
                  ))}
                </div>
                {!isDone && lv.level === currentLevel + 1 && (
                  <button className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white text-sm"
                    style={{ background: `linear-gradient(135deg, ${lv.color} 0%, ${lv.color}cc 100%)` }}>
                    <Upload size={16} /> Bắt đầu xác minh KYC Cấp {lv.level}
                  </button>
                )}
              </div>
            )}
          </TrCard>
        );
      })}

      <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Bảo mật thông tin cá nhân</p>
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>Thông tin KYC được mã hóa AES-256. Chúng tôi không chia sẻ với bên thứ ba.</p>
          </div>
        </div>
      </div>
      </PageContent>
    </PageLayout>
  );
}