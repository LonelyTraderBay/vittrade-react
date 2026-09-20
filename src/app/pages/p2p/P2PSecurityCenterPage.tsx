/**
 * ══════════════════════════════════════════════════════════
 *  P2PSecurityCenterPage — /p2p/security
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: P2P Security Overview Dashboard
 *  Security status, recent events, quick actions
 *  Tone: Trust-building, clear, actionable
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, ShieldCheck, ShieldAlert, Lock, Smartphone,
  Key, Eye, AlertTriangle, CheckCircle, Clock, ChevronRight,
  MapPin, Monitor, Settings, Bell, XCircle, Info, Fingerprint,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useRefresh } from '../../hooks/useRefresh';

/* ═══════════════════════════════════════════════════════════
   Security Score Calculation
   ═══════════════════════════════════════════════════════════ */
interface SecurityMetric {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'enabled' | 'disabled' | 'warning';
  score: number;
  path: string;
}

const SECURITY_METRICS: SecurityMetric[] = [
  {
    id: '2fa',
    label: '2FA cho P2P',
    icon: Smartphone,
    status: 'enabled',
    score: 30,
    path: '/p2p/security/2fa',
  },
  {
    id: 'anti_phishing',
    label: 'Anti-Phishing Code',
    icon: ShieldCheck,
    status: 'enabled',
    score: 20,
    path: '/p2p/security/anti-phishing',
  },
  {
    id: 'trusted_devices',
    label: 'Trusted Devices',
    icon: Monitor,
    status: 'warning',
    score: 15,
    path: '/p2p/security/devices',
  },
  {
    id: 'whitelist',
    label: 'Whitelist Mode',
    icon: ShieldAlert,
    status: 'disabled',
    score: 0,
    path: '/p2p/security/whitelist',
  },
  {
    id: 'biometric',
    label: 'Biometric Lock',
    icon: Fingerprint,
    status: 'enabled',
    score: 25,
    path: '/settings/security/biometric',
  },
];

const MOCK_TOTAL_SCORE = SECURITY_METRICS.reduce((acc, m) => acc + m.score, 0);
const MAX_SCORE = 100;

/* ═══════════════════════════════════════════════════════════
   Recent Security Events
   ═══════════════════════════════════════════════════════════ */
interface SecurityEvent {
  id: string;
  type: 'login' | 'device' | 'transaction' | 'alert';
  label: string;
  description: string;
  time: string;
  severity: 'info' | 'warning' | 'critical';
  icon: React.ElementType;
}

const RECENT_EVENTS: SecurityEvent[] = [
  {
    id: '1',
    type: 'login',
    label: 'Đăng nhập thành công',
    description: 'iPhone 15 Pro • Hà Nội, VN',
    time: '2 phút trước',
    severity: 'info',
    icon: CheckCircle,
  },
  {
    id: '2',
    type: 'device',
    label: 'Thiết bị mới',
    description: 'MacBook Pro • TP.HCM, VN',
    time: '3 giờ trước',
    severity: 'warning',
    icon: Monitor,
  },
  {
    id: '3',
    type: 'alert',
    label: 'Đăng nhập thất bại',
    description: '3 lần nhập sai mật khẩu',
    time: '1 ngày trước',
    severity: 'critical',
    icon: XCircle,
  },
];

/* ═══════════════════════════════════════════════════════════
   Quick Actions
   ═══════════════════════════════════════════════════════════ */
interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  path: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'change_password',
    label: 'Đổi mật khẩu',
    icon: Key,
    color: '#3B82F6',
    path: '/settings/security/change-password',
  },
  {
    id: 'login_history',
    label: 'Lịch sử đăng nhập',
    icon: Clock,
    color: '#10B981',
    path: '/p2p/security/login-history',
  },
  {
    id: 'devices',
    label: 'Quản lý thiết bị',
    icon: Monitor,
    color: '#F59E0B',
    path: '/p2p/security/devices',
  },
  {
    id: 'activity',
    label: 'Hoạt động đáng ngờ',
    icon: AlertTriangle,
    color: '#EF4444',
    path: '/p2p/security/suspicious',
  },
];

/* ═══════════════════════════════════════════════════════════
   Security Score Component
   ═══════════════════════════════════════════════════════════ */
function SecurityScoreCard({ score, maxScore }: { score: number; maxScore: number }) {
  const c = useThemeColors();
  const percentage = (score / maxScore) * 100;

  const getScoreColor = () => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = () => {
    if (percentage >= 80) return 'Xuất sắc';
    if (percentage >= 50) return 'Trung bình';
    return 'Cần cải thiện';
  };

  const scoreColor = getScoreColor();
  const scoreLabel = getScoreLabel();

  return (
    <TrCard rounded="lg" className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
            Security Score
          </h3>
          <p style={{ color: c.text3, fontSize: 11 }}>
            Điểm bảo mật P2P của bạn
          </p>
        </div>
        <div
          className="px-3 py-1.5 rounded-lg"
          style={{ background: hexToRgba(scoreColor, 12) }}
        >
          <span style={{ color: scoreColor, fontSize: 11, fontWeight: 700 }}>
            {scoreLabel}
          </span>
        </div>
      </div>

      {/* Score Circle */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={c.surface2}
              strokeWidth="8"
            />
            {/* Progress Circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span style={{ color: scoreColor, fontSize: 32, fontWeight: 700, lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ color: c.text3, fontSize: 11 }}>/ {maxScore}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div
        className="p-3 rounded-lg"
        style={{ background: hexToRgba(scoreColor, 8) }}
      >
        <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
          {percentage >= 80
            ? 'Tài khoản P2P của bạn được bảo vệ rất tốt. Tiếp tục duy trì!'
            : percentage >= 50
              ? 'Tăng cường bảo mật bằng cách bật thêm các tính năng bên dưới.'
              : 'Tài khoản của bạn cần được bảo vệ tốt hơn. Vui lòng bật các tính năng bảo mật.'}
        </p>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function P2PSecurityCenterPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const { isRefreshing, handleRefresh } = useRefresh({
    onRefresh: async () => {
      await new Promise(res => setTimeout(res, 1000));
      hapticSuccess();
    },
  });

  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return '#10B981';
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header
          title="Security Center"
          subtitle="Bảo mật · P2P"
          back
          action={{
            icon: Settings,
          }}
        />

        {/* Security Score */}
        <div className="px-5 py-4">
          <SecurityScoreCard score={MOCK_TOTAL_SCORE} maxScore={MAX_SCORE} />
        </div>

        {/* Security Features */}
        <div className="px-5 mb-6">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
            Tính năng bảo mật
          </h3>

          <TrCard rounded="lg" className="overflow-hidden">
            {SECURITY_METRICS.map((metric, idx) => {
              const StatusIcon = metric.icon;
              const isLast = idx === SECURITY_METRICS.length - 1;

              return (
                <button
                  key={metric.id}
                  onClick={() => {
                    hapticSelection();
                    navigate(`${prefix}${metric.path}`);
                  }}
                  className="w-full p-4 flex items-center gap-3 text-left"
                  style={{
                    borderBottom: isLast ? 'none' : `1px solid ${c.borderSolid}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background:
                        metric.status === 'enabled'
                          ? hexToRgba('#10B981', 12)
                          : metric.status === 'warning'
                            ? hexToRgba('#F59E0B', 12)
                            : c.surface2,
                    }}
                  >
                    <StatusIcon
                      size={18}
                      color={
                        metric.status === 'enabled'
                          ? '#10B981'
                          : metric.status === 'warning'
                            ? '#F59E0B'
                            : c.text3
                      }
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 2 }}>
                      {metric.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color:
                            metric.status === 'enabled'
                              ? '#10B981'
                              : metric.status === 'warning'
                                ? '#F59E0B'
                                : c.text3,
                        }}
                      >
                        {metric.status === 'enabled'
                          ? 'Đã bật'
                          : metric.status === 'warning'
                            ? 'Cần xem lại'
                            : 'Chưa bật'}
                      </span>
                      {metric.score > 0 && (
                        <>
                          <span style={{ color: c.text3, fontSize: 10 }}>•</span>
                          <span style={{ color: c.text3, fontSize: 10 }}>
                            +{metric.score} điểm
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={18} color={c.text3} />
                </button>
              );
            })}
          </TrCard>
        </div>

        {/* Quick Actions */}
        <div className="px-5 mb-6">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
            Thao tác nhanh
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(action => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    hapticSelection();
                    navigate(`${prefix}${action.path}`);
                  }}
                  className="p-4 rounded-xl text-left"
                  style={{ background: c.surface1, border: `1px solid ${c.borderSolid}` }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: hexToRgba(action.color, 12) }}
                  >
                    <ActionIcon size={18} color={action.color} />
                  </div>
                  <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600, lineHeight: 1.4 }}>
                    {action.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Security Events */}
        <div className="px-5">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
            Hoạt động gần đây
          </h3>

          <TrCard rounded="lg" className="overflow-hidden">
            {RECENT_EVENTS.map((event, idx) => {
              const EventIcon = event.icon;
              const isLast = idx === RECENT_EVENTS.length - 1;
              const severityColor = getSeverityColor(event.severity);

              return (
                <div
                  key={event.id}
                  className="p-4 flex items-start gap-3"
                  style={{
                    borderBottom: isLast ? 'none' : `1px solid ${c.borderSolid}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: hexToRgba(severityColor, 12) }}
                  >
                    <EventIcon size={18} color={severityColor} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 2 }}>
                      {event.label}
                    </p>
                    <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>
                      {event.description}
                    </p>
                    <p style={{ color: c.text3, fontSize: 10 }}>
                      <Clock size={9} className="inline mr-1" />
                      {event.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </TrCard>

          <button
            onClick={() => {
              hapticSelection();
              navigate(`${prefix}/p2p/security/login-history`);
            }}
            className="w-full mt-3 py-3 rounded-xl font-semibold text-sm"
            style={{ background: c.surface2, color: c.text2 }}
          >
            Xem tất cả hoạt động
            <ChevronRight size={14} className="inline ml-1" />
          </button>
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}