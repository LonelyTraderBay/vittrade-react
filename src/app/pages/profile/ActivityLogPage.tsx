import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, MapPin, Monitor, Filter } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { ACTIVITY_LOGS, ActivityLog } from '../../data/mockData';
import { TrCard } from '../../components/ui/TrCard';

const TYPE_CONFIG = {
  login: { label: 'Đăng nhập', icon: CheckCircle, color: '#10B981' },
  logout: { label: 'Đăng xuất', icon: CheckCircle, color: '#8B95B3' },
  password_change: { label: 'Đổi mật khẩu', icon: Shield, color: '#3B82F6' },
  '2fa_enable': { label: 'Bật 2FA', icon: Shield, color: '#10B981' },
  '2fa_disable': { label: 'Tắt 2FA', icon: AlertTriangle, color: '#EF4444' },
  kyc_submit: { label: 'Nộp KYC', icon: CheckCircle, color: '#3B82F6' },
  api_create: { label: 'Tạo API Key', icon: CheckCircle, color: '#8B5CF6' },
  api_delete: { label: 'Xóa API Key', icon: XCircle, color: '#EF4444' },
};

const STATUS_CONFIG = {
  success: { label: 'Thành công', color: '#10B981' },
  failed: { label: 'Thất bại', color: '#EF4444' },
  suspicious: { label: 'Đáng ngờ', color: '#F59E0B' },
};

export function ActivityLogPage() {
  const c = useThemeColors();
  const [logs, setLogs] = useState(ACTIVITY_LOGS);
  const [filterType, setFilterType] = useState<'all' | 'login' | 'security'>('all');

  const filteredLogs = filterType === 'all' 
    ? logs 
    : filterType === 'login'
    ? logs.filter(l => l.type === 'login' || l.type === 'logout')
    : logs.filter(l => !['login', 'logout'].includes(l.type));

  const suspiciousCount = logs.filter(l => l.status === 'suspicious').length;

  const renderLog = (log: ActivityLog) => {
    const typeConfig = TYPE_CONFIG[log.type];
    const statusConfig = STATUS_CONFIG[log.status];
    const Icon = typeConfig.icon;

    return (
      <TrCard key={log.id} className="px-4 py-3 mb-3"
        accentBorder={log.status === 'suspicious' ? 'rgba(245,158,11,0.2)' : undefined}
        style={{ background: log.status === 'suspicious' ? 'rgba(245,158,11,0.05)' : undefined }}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: typeConfig.color + '22' }}>
            <Icon size={18} color={typeConfig.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                {typeConfig.label}
              </p>
              <span className="px-2 py-0.5 rounded text-xs font-semibold"
                style={{ background: statusConfig.color + '22', color: statusConfig.color }}>
                {statusConfig.label}
              </span>
            </div>
            <p style={{ color: c.text2, fontSize: 12 }}>
              {log.description}
            </p>
          </div>
          {log.status === 'suspicious' && (
            <AlertTriangle size={16} color="#F59E0B" />
          )}
        </div>

        {/* Details */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin size={12} color={c.text3} />
                <p style={{ color: c.text3, fontSize: 10, textTransform: 'uppercase' }}>Vị trí</p>
              </div>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                {log.location}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Monitor size={12} color={c.text3} />
                <p style={{ color: c.text3, fontSize: 10, textTransform: 'uppercase' }}>Thiết bị</p>
              </div>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                {log.device}
              </p>
            </div>
            <div className="col-span-2">
              <p style={{ color: c.text3, fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>IP Address</p>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                {log.ipAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${c.divider}` }}>
          <p style={{ color: c.text3, fontSize: 11 }}>
            {log.timestamp}
          </p>
        </div>
      </TrCard>
    );
  };

  return (
    <PageLayout>
      <Header title="Nhật ký hoạt động" subtitle="Hoạt động · Profile" back />

      <PageContent gap="default">
        {/* Stats & Filter */}
        <div className="py-3" style={{ background: c.surface, borderBottom: `1px solid ${c.divider}`, boxShadow: c.cardShadow, margin: '0 -20px', padding: '12px 20px' }}>
          {suspiciousCount > 0 && (
            <div className="rounded-xl p-3 mb-3"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} color="#F59E0B" />
                <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 600 }}>
                  Phát hiện {suspiciousCount} hoạt động đáng ngờ
                </p>
              </div>
              <p style={{ color: '#D97706', fontSize: 11, marginTop: 4 }}>
                Vui lòng kiểm tra và đổi mật khẩu nếu không phải bạn
              </p>
            </div>
          )}

          {/* Filter */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'login', label: 'Đăng nhập' },
              { id: 'security', label: 'Bảo mật' },
            ].map(f => (
              <button key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: filterType === f.id ? c.chipActiveBg : c.chipBg,
                  color: filterType === f.id ? c.chipActiveText : c.chipText,
                  border: `1px solid ${filterType === f.id ? c.chipActiveBorder : c.chipBorder}`,
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logs List */}
        <div className="py-4">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Shield size={48} color={c.borderSolid} />
              <p style={{ color: c.text3, fontSize: 14 }}>
                Không có hoạt động nào
              </p>
            </div>
          ) : (
            filteredLogs.map(renderLog)
          )}
        </div>

        {/* Info Footer */}
        <div className="py-3" style={{ background: c.surface, borderTop: `1px solid ${c.divider}`, margin: '0 -20px', padding: '12px 20px' }}>
          <div className="flex items-start gap-2">
            <Shield size={14} color="#3B82F6" className="mt-0.5" />
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.4 }}>
              Nhật ký hoạt động giúp bạn theo dõi tất cả thao tác trên tài khoản. 
              Nếu phát hiện hoạt động đáng ngờ, vui lòng đổi mật khẩu ngay lập tức.
            </p>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}