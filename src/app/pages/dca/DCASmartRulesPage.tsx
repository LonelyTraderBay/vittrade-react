/**
 * ══════════════════════════════════════════════════════════════
 *  DCASmartRulesPage — DCA Advanced Feature 4/4
 * ══════════════════════════════════════════════════════════════
 *  Smart entry/exit rules: Conditional triggers for DCA execution,
 *  Price-based, RSI-based, Moving average triggers, Rule templates
 *  Pattern B — Page with Tabs (Rules/Templates/History)
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
  Zap, Plus, Trash2, TrendingDown, Activity, Target,
  CheckCircle, Clock, AlertCircle, Info, Settings, Copy,
} from 'lucide-react';

const TABS = ['Luat cua toi', 'Mau', 'Lich su'] as const;
type Tab = typeof TABS[number];

interface SmartRule {
  id: string;
  name: string;
  type: 'entry' | 'exit' | 'adjust';
  condition: string;
  action: string;
  status: 'active' | 'paused' | 'triggered';
  triggeredCount: number;
  lastTriggered?: Date;
  createdAt: Date;
}

const MOCK_RULES: SmartRule[] = [
  {
    id: 'r1',
    name: 'Buy the Dip -10%',
    type: 'entry',
    condition: 'Price drops 10% from 7-day average',
    action: 'Double investment amount',
    status: 'active',
    triggeredCount: 3,
    lastTriggered: new Date(Date.now() - 7 * 86400000),
    createdAt: new Date(Date.now() - 60 * 86400000),
  },
  {
    id: 'r2',
    name: 'RSI Oversold',
    type: 'entry',
    condition: 'RSI < 30',
    action: 'Increase by 50%',
    status: 'active',
    triggeredCount: 2,
    lastTriggered: new Date(Date.now() - 14 * 86400000),
    createdAt: new Date(Date.now() - 90 * 86400000),
  },
  {
    id: 'r3',
    name: 'Take Profit 30%',
    type: 'exit',
    condition: 'Position up 30%',
    action: 'Sell 25% of holdings',
    status: 'active',
    triggeredCount: 0,
    createdAt: new Date(Date.now() - 30 * 86400000),
  },
  {
    id: 'r4',
    name: 'Pause High Volatility',
    type: 'adjust',
    condition: 'Volatility > 40%',
    action: 'Pause DCA for 2 weeks',
    status: 'paused',
    triggeredCount: 1,
    lastTriggered: new Date(Date.now() - 3 * 86400000),
    createdAt: new Date(Date.now() - 45 * 86400000),
  },
];

interface RuleTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  condition: string;
  action: string;
  popularity: number;
}

const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: 't1',
    name: 'Buy Major Dips',
    category: 'Entry',
    description: 'Double investment when price drops significantly',
    condition: 'Price < 7-day MA by 15%',
    action: '2x investment',
    popularity: 87,
  },
  {
    id: 't2',
    name: 'RSI Oversold Entry',
    category: 'Entry',
    description: 'Increase buying when RSI shows oversold',
    condition: 'RSI < 30',
    action: '1.5x investment',
    popularity: 72,
  },
  {
    id: 't3',
    name: 'Golden Cross',
    category: 'Entry',
    description: 'Increase on bullish MA crossover',
    condition: 'MA(50) crosses above MA(200)',
    action: '2x for next 4 weeks',
    popularity: 65,
  },
  {
    id: 't4',
    name: 'Profit Protection',
    category: 'Exit',
    description: 'Take partial profits at targets',
    condition: 'Position up 25%',
    action: 'Sell 20%',
    popularity: 58,
  },
  {
    id: 't5',
    name: 'Stop Loss',
    category: 'Exit',
    description: 'Cut losses on major decline',
    condition: 'Position down 30%',
    action: 'Pause DCA & reduce 50%',
    popularity: 45,
  },
  {
    id: 't6',
    name: 'High Volatility Pause',
    category: 'Adjust',
    description: 'Wait out extreme volatility',
    condition: '30-day volatility > 50%',
    action: 'Pause 2 weeks',
    popularity: 52,
  },
];

interface RuleHistory {
  id: string;
  ruleName: string;
  triggeredAt: Date;
  condition: string;
  action: string;
  result: 'executed' | 'failed' | 'pending';
}

const RULE_HISTORY: RuleHistory[] = [
  {
    id: 'h1',
    ruleName: 'Buy the Dip -10%',
    triggeredAt: new Date(Date.now() - 7 * 86400000),
    condition: 'Price dropped to $45,000',
    action: 'Doubled to $2,000',
    result: 'executed',
  },
  {
    id: 'h2',
    ruleName: 'RSI Oversold',
    triggeredAt: new Date(Date.now() - 14 * 86400000),
    condition: 'RSI = 28',
    action: 'Increased to $1,500',
    result: 'executed',
  },
  {
    id: 'h3',
    ruleName: 'Pause High Volatility',
    triggeredAt: new Date(Date.now() - 3 * 86400000),
    condition: 'Volatility = 45%',
    action: 'Paused DCA',
    result: 'executed',
  },
];

export function DCASmartRulesPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Luat cua toi');

  const activeRules = MOCK_RULES.filter((r) => r.status === 'active').length;
  const totalTriggers = MOCK_RULES.reduce((sum, r) => sum + r.triggeredCount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'paused':
        return '#F59E0B';
      case 'triggered':
        return '#3B82F6';
      default:
        return c.text3;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'entry':
        return TrendingDown;
      case 'exit':
        return Target;
      case 'adjust':
        return Settings;
      default:
        return Activity;
    }
  };

  return (
    <PageLayout>
      <Header title="Smart DCA Rules" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Luat cua toi' && (
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
                    background: 'rgba(139,92,246,0.08)',
                  }}
                >
                  <Zap size={24} color="#8B5CF6" />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Smart Rules</p>
                  <p style={{ color: c.text3, fontSize: 12 }}>Automated DCA optimization</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Active</p>
                  <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>{activeRules}</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Triggered</p>
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>{totalTriggers}</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Success</p>
                  <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>95%</p>
                </div>
              </div>
            </div>

            {/* Rules List */}
            <PageSection label="Cac luat hien co">
              {MOCK_RULES.length === 0 ? (
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <Zap size={48} color={c.text3} style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: c.text2, fontSize: 13, marginBottom: 4 }}>
                    Chua co luat nao
                  </p>
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    Tao luat tu mau hoac tu dinh nghia
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {MOCK_RULES.map((rule) => {
                    const TypeIcon = getTypeIcon(rule.type);
                    return (
                      <div
                        key={rule.id}
                        className="rounded-2xl p-4"
                        style={{ background: c.surface, border: `1px solid ${c.border}` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-2 flex-1">
                            <TypeIcon size={16} color={c.text3} style={{ marginTop: 2 }} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                                  {rule.name}
                                </p>
                                <span
                                  className="px-2 py-0.5 rounded-lg text-[9px] font-semibold"
                                  style={{
                                    background: `${getStatusColor(rule.status)}20`,
                                    color: getStatusColor(rule.status),
                                  }}
                                >
                                  {rule.status.toUpperCase()}
                                </span>
                              </div>
                              <span
                                className="px-2 py-0.5 rounded text-[9px]"
                                style={{ background: c.chipBg, color: c.chipText }}
                              >
                                {rule.type.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => alert(`Delete rule ${rule.name}`)}
                            className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                            style={{ background: 'rgba(239,68,68,0.08)' }}
                          >
                            <Trash2 size={14} color="#EF4444" />
                          </button>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div>
                            <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Condition</p>
                            <p style={{ color: c.text1, fontSize: 12 }}>{rule.condition}</p>
                          </div>
                          <div>
                            <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Action</p>
                            <p style={{ color: c.text1, fontSize: 12 }}>{rule.action}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Triggered</p>
                            <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                              {rule.triggeredCount} times
                            </p>
                          </div>
                          {rule.lastTriggered && (
                            <div>
                              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>Last Trigger</p>
                              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                                {rule.lastTriggered.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
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

            {/* Add Rule Button */}
            <button
              onClick={() => alert('Create custom rule')}
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
              Create Custom Rule
            </button>

            {/* Info */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Info size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Smart rules tu dong dieu chinh DCA dua tren dieu kien thi truong. Giup toi uu hoa gia mua trung binh.
              </p>
            </div>
          </>
        )}

        {tab === 'Mau' && (
          <>
            {/* Templates */}
            <PageSection label="Rule Templates">
              {['Entry', 'Exit', 'Adjust'].map((category) => (
                <div key={category}>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 8, marginTop: 16 }}>
                    {category} Rules
                  </p>
                  <div className="space-y-2">
                    {RULE_TEMPLATES.filter((t) => t.category === category).map((template) => (
                      <div
                        key={template.id}
                        className="rounded-2xl p-4"
                        style={{ background: c.surface, border: `1px solid ${c.border}` }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                              {template.name}
                            </p>
                            <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                              {template.description}
                            </p>
                          </div>
                        </div>

                        <div
                          className="rounded-xl p-2 mb-3"
                          style={{ background: c.bg }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p style={{ color: c.text3, fontSize: 10 }}>Condition</p>
                            <code style={{ color: c.text1, fontSize: 10, fontFamily: 'monospace' }}>
                              {template.condition}
                            </code>
                          </div>
                          <div className="flex items-center justify-between">
                            <p style={{ color: c.text3, fontSize: 10 }}>Action</p>
                            <code style={{ color: '#10B981', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 }}>
                              {template.action}
                            </code>
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
                            className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                            style={{
                              background: c.primary,
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            <Copy size={11} />
                            Use
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </PageSection>
          </>
        )}

        {tab === 'Lich su' && (
          <>
            {/* History List */}
            <PageSection label="Rule Trigger History">
              {RULE_HISTORY.length === 0 ? (
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <Clock size={48} color={c.text3} style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: c.text2, fontSize: 13 }}>Chua co lich su</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {RULE_HISTORY.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl p-4"
                      style={{ background: c.surface, border: `1px solid ${c.border}` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                              {entry.ruleName}
                            </p>
                            <span
                              className="px-2 py-0.5 rounded-lg text-[9px] font-semibold"
                              style={{
                                background:
                                  entry.result === 'executed'
                                    ? 'rgba(16,185,129,0.1)'
                                    : entry.result === 'failed'
                                    ? 'rgba(239,68,68,0.1)'
                                    : 'rgba(245,158,11,0.1)',
                                color:
                                  entry.result === 'executed'
                                    ? '#10B981'
                                    : entry.result === 'failed'
                                    ? '#EF4444'
                                    : '#F59E0B',
                              }}
                            >
                              {entry.result.toUpperCase()}
                            </span>
                          </div>
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
                      </div>

                      <div
                        className="rounded-xl p-2"
                        style={{ background: c.bg }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p style={{ color: c.text3, fontSize: 10 }}>Condition Met</p>
                          <p style={{ color: c.text1, fontSize: 11 }}>{entry.condition}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p style={{ color: c.text3, fontSize: 10 }}>Action Taken</p>
                          <p style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                            {entry.action}
                          </p>
                        </div>
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
                Performance Impact
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Avg Entry Price</p>
                  <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>-8.2%</p>
                  <p style={{ color: c.text3, fontSize: 9 }}>vs standard DCA</p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Saved</p>
                  <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>$987</p>
                  <p style={{ color: c.text3, fontSize: 9 }}>from optimizations</p>
                </div>
              </div>
            </div>

            {/* Success Banner */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <CheckCircle size={14} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Smart rules da giup giam gia mua trung binh 8.2% so voi DCA tieu chuan.
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}
