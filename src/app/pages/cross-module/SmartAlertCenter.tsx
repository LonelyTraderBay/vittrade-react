/**
 * ══════════════════════════════════════════════════════════════
 *  SmartAlertCenter — Cross-Module Feature 3/4
 * ══════════════════════════════════════════════════════════════
 *  Smart alert center: Conditional alerts across all modules,
 *  Price alerts, P2P status, Prediction events, Arena deadlines,
 *  DCA execution, Wallet transactions, Custom conditions
 *  Pattern B — Page with Tabs (Active/History/Settings)
 *  Compliance: Clear alert notifications
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import {
  Bell, Plus, Trash2, CheckCircle, Clock, TrendingUp,
  Target, ShoppingCart, Zap, Wallet, Activity, Info,
  Edit, AlertCircle,
} from 'lucide-react';

const TABS = ['Hoat dong', 'Lich su', 'Cai dat'] as const;
type Tab = typeof TABS[number];

interface Alert {
  id: string;
  module: 'trading' | 'p2p' | 'predictions' | 'arena' | 'dca' | 'wallet';
  moduleName: string;
  type: string;
  condition: string;
  action: string;
  status: 'active' | 'paused' | 'triggered';
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
  icon: any;
  color: string;
}

const ACTIVE_ALERTS: Alert[] = [
  {
    id: 'a1',
    module: 'trading',
    moduleName: 'Trading',
    type: 'Price Alert',
    condition: 'BTC > $70,000',
    action: 'Push notification + Email',
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 86400000),
    triggerCount: 0,
    icon: TrendingUp,
    color: '#10B981',
  },
  {
    id: 'a2',
    module: 'p2p',
    moduleName: 'P2P',
    type: 'Order Status',
    condition: 'Order expires in 5 min',
    action: 'Push notification',
    status: 'active',
    createdAt: new Date(Date.now() - 15 * 86400000),
    lastTriggered: new Date(Date.now() - 3 * 86400000),
    triggerCount: 4,
    icon: ShoppingCart,
    color: '#F59E0B',
  },
  {
    id: 'a3',
    module: 'predictions',
    moduleName: 'Predictions',
    type: 'Event Resolution',
    condition: 'Any prediction resolves',
    action: 'Push notification',
    status: 'active',
    createdAt: new Date(Date.now() - 20 * 86400000),
    lastTriggered: new Date(Date.now() - 1 * 86400000),
    triggerCount: 7,
    icon: Target,
    color: '#8B5CF6',
  },
  {
    id: 'a4',
    module: 'arena',
    moduleName: 'Arena',
    type: 'Challenge Deadline',
    condition: 'My challenges end in 24h',
    action: 'Push notification',
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 86400000),
    lastTriggered: new Date(Date.now() - 2 * 86400000),
    triggerCount: 3,
    icon: Zap,
    color: '#F97316',
  },
  {
    id: 'a5',
    module: 'dca',
    moduleName: 'DCA',
    type: 'Execution Alert',
    condition: 'DCA plan executed',
    action: 'Push notification + Email',
    status: 'active',
    createdAt: new Date(Date.now() - 45 * 86400000),
    lastTriggered: new Date(Date.now() - 7 * 86400000),
    triggerCount: 12,
    icon: Activity,
    color: '#6366F1',
  },
  {
    id: 'a6',
    module: 'wallet',
    moduleName: 'Wallet',
    type: 'Large Transaction',
    condition: 'Transaction > $10,000',
    action: 'Push notification + SMS',
    status: 'active',
    createdAt: new Date(Date.now() - 60 * 86400000),
    lastTriggered: new Date(Date.now() - 5 * 86400000),
    triggerCount: 8,
    icon: Wallet,
    color: '#3B82F6',
  },
  {
    id: 'a7',
    module: 'trading',
    moduleName: 'Trading',
    type: 'Portfolio Alert',
    condition: 'Portfolio down 5%',
    action: 'Push notification',
    status: 'paused',
    createdAt: new Date(Date.now() - 90 * 86400000),
    triggerCount: 2,
    icon: TrendingUp,
    color: '#10B981',
  },
];

const TRIGGERED_HISTORY = [
  {
    id: 'h1',
    alertName: 'BTC > $70,000',
    module: 'Trading',
    triggeredAt: new Date(Date.now() - 12 * 3600000),
    action: 'Push notification sent',
  },
  {
    id: 'h2',
    alertName: 'Order expires in 5 min',
    module: 'P2P',
    triggeredAt: new Date(Date.now() - 3 * 86400000),
    action: 'Push notification sent',
  },
  {
    id: 'h3',
    alertName: 'Prediction resolves',
    module: 'Predictions',
    triggeredAt: new Date(Date.now() - 1 * 86400000),
    action: 'Push notification sent',
  },
];

const ALERT_TEMPLATES = [
  {
    id: 't1',
    category: 'Trading',
    name: 'Price Breakout',
    description: 'Alert when price breaks resistance/support',
    popularity: 92,
  },
  {
    id: 't2',
    category: 'Trading',
    name: 'Volume Spike',
    description: 'Alert on abnormal trading volume',
    popularity: 78,
  },
  {
    id: 't3',
    category: 'P2P',
    name: 'Order Matching',
    description: 'Alert when your ad gets matched',
    popularity: 85,
  },
  {
    id: 't4',
    category: 'Predictions',
    name: 'Event Updates',
    description: 'Alert on event probability changes',
    popularity: 72,
  },
  {
    id: 't5',
    category: 'Arena',
    name: 'Challenge Invites',
    description: 'Alert when invited to challenges',
    popularity: 68,
  },
  {
    id: 't6',
    category: 'DCA',
    name: 'Execution Confirmation',
    description: 'Alert after each DCA purchase',
    popularity: 88,
  },
  {
    id: 't7',
    category: 'Wallet',
    name: 'Deposit Confirmed',
    description: 'Alert when deposit is confirmed',
    popularity: 95,
  },
];

export function SmartAlertCenter() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Hoat dong');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  const activeAlerts = ACTIVE_ALERTS.filter((a) => a.status === 'active').length;
  const totalTriggers = ACTIVE_ALERTS.reduce((sum, a) => sum + a.triggerCount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'paused':
        return '#6B7280';
      case 'triggered':
        return '#3B82F6';
      default:
        return c.text3;
    }
  };

  return (
    <PageLayout>
      <Header title="Smart Alerts" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Hoat dong' && (
          <>
            {/* Stats */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'rgba(59,130,246,0.08)',
                  }}
                >
                  <Bell size={24} color="#3B82F6" />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Smart Alerts</p>
                  <p style={{ color: c.text3, fontSize: 12 }}>{ACTIVE_ALERTS.length} total alerts</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Active</p>
                  <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>{activeAlerts}</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Triggered</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>{totalTriggers}</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Modules</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>6</p>
                </div>
              </div>
            </div>

            {/* Active Alerts */}
            <PageSection label="Canh bao hoat dong">
              {ACTIVE_ALERTS.length === 0 ? (
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <Bell size={48} color={c.text3} style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: c.text2, fontSize: 13, marginBottom: 4 }}>
                    Chua co canh bao nao
                  </p>
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    Tao canh bao tu mau hoac tu dinh nghia
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ACTIVE_ALERTS.map((alert) => {
                    const Icon = alert.icon;
                    return (
                      <div
                        key={alert.id}
                        className="rounded-2xl p-4"
                        style={{ background: c.surface, border: `1px solid ${c.border}` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-2 flex-1">
                            <div
                              className="flex items-center justify-center"
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: `${alert.color}20`,
                                flexShrink: 0,
                              }}
                            >
                              <Icon size={16} color={alert.color} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                                  {alert.type}
                                </p>
                                <span
                                  className="px-2 py-0.5 rounded-lg text-[9px] font-semibold uppercase"
                                  style={{
                                    background: `${getStatusColor(alert.status)}20`,
                                    color: getStatusColor(alert.status),
                                  }}
                                >
                                  {alert.status}
                                </span>
                              </div>
                              <span
                                className="px-2 py-0.5 rounded text-[9px]"
                                style={{ background: c.chipBg, color: c.chipText }}
                              >
                                {alert.moduleName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => alert(`Edit ${alert.type}`)}
                              className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                            >
                              <Edit size={14} color={c.text3} />
                            </button>
                            <button
                              onClick={() => alert(`Delete ${alert.type}`)}
                              className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                              style={{ background: 'rgba(239,68,68,0.08)' }}
                            >
                              <Trash2 size={14} color="#EF4444" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div>
                            <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Condition</p>
                            <p style={{ color: c.text1, fontSize: 12 }}>{alert.condition}</p>
                          </div>
                          <div>
                            <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Action</p>
                            <p style={{ color: c.text1, fontSize: 12 }}>{alert.action}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Triggered</p>
                            <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                              {alert.triggerCount} times
                            </p>
                          </div>
                          {alert.lastTriggered && (
                            <div>
                              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Last Trigger</p>
                              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                                {alert.lastTriggered.toLocaleDateString('vi-VN', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </PageSection>

            {/* Create Alert Button */}
            <button
              onClick={() => alert('Create custom alert')}
              className="w-full rounded-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                height: 48,
                background: c.primary,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <Plus size={18} />
              Create Alert
            </button>

            {/* Info */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Info size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Smart alerts work across all modules. Set conditions and get notified via push, email, or SMS.
              </p>
            </div>
          </>
        )}

        {tab === 'Lich su' && (
          <>
            {/* Triggered History */}
            <PageSection label="Alert History">
              {TRIGGERED_HISTORY.length === 0 ? (
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <Clock size={48} color={c.text3} style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: c.text2, fontSize: 13 }}>No triggered alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {TRIGGERED_HISTORY.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl p-3"
                      style={{ background: c.surface, border: `1px solid ${c.border}` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                            {entry.alertName}
                          </p>
                          <span
                            className="px-2 py-0.5 rounded text-[9px]"
                            style={{ background: c.chipBg, color: c.chipText }}
                          >
                            {entry.module}
                          </span>
                        </div>
                        <CheckCircle size={16} color="#10B981" />
                      </div>
                      <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>{entry.action}</p>
                      <div className="flex items-center gap-1.5">
                        <Clock size={10} color={c.text3} />
                        <p style={{ color: c.text3, fontSize: 10 }}>
                          {entry.triggeredAt.toLocaleString('vi-VN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PageSection>

            {/* Stats */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Alert Statistics (30 days)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Triggered</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>{totalTriggers}</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Avg per Day</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
                    {(totalTriggers / 30).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'Cai dat' && (
          <>
            {/* Notification Channels */}
            <PageSection label="Notification Channels">
              <div className="space-y-3">
                {[
                  { label: 'Push Notifications', enabled: pushEnabled, setter: setPushEnabled },
                  { label: 'Email Alerts', enabled: emailEnabled, setter: setEmailEnabled },
                  { label: 'SMS Alerts', enabled: smsEnabled, setter: setSmsEnabled },
                ].map((channel) => (
                  <div
                    key={channel.label}
                    className="rounded-2xl p-4"
                    style={{ background: c.surface, border: `1px solid ${c.border}` }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                          {channel.label}
                        </p>
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          {channel.enabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                      <button
                        onClick={() => channel.setter(!channel.enabled)}
                        className="relative"
                        style={{
                          width: 48,
                          height: 28,
                          borderRadius: 14,
                          background: channel.enabled ? c.primary : '#6B7280',
                        }}
                      >
                        <div
                          className="absolute top-1 transition-all"
                          style={{
                            left: channel.enabled ? 22 : 2,
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            background: '#fff',
                          }}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Alert Templates */}
            <PageSection label="Alert Templates">
              {['Trading', 'P2P', 'Predictions', 'Arena', 'DCA', 'Wallet'].map((category) => (
                <div key={category}>
                  <p
                    style={{
                      color: c.text1,
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 8,
                      marginTop: 16,
                    }}
                  >
                    {category}
                  </p>
                  <div className="space-y-2">
                    {ALERT_TEMPLATES.filter((t) => t.category === category).map((template) => (
                      <div
                        key={template.id}
                        className="rounded-xl p-3"
                        style={{ background: c.surface, border: `1px solid ${c.border}` }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                              {template.name}
                            </p>
                            <p style={{ color: c.text3, fontSize: 11 }}>{template.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Activity size={11} color={c.text3} />
                            <p style={{ color: c.text3, fontSize: 10 }}>
                              {template.popularity}% users
                            </p>
                          </div>
                          <button
                            onClick={() => alert(`Use template: ${template.name}`)}
                            className="px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                            style={{
                              background: c.primary,
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            Use
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </PageSection>

            {/* Warning */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <AlertCircle size={14} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                SMS alerts may incur additional charges. Check with your mobile provider.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}
