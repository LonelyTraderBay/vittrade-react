import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle, Plus } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { toast } from 'sonner';

interface Order {
  id: string;
  type: 'take-profit' | 'stop-loss' | 'trailing-stop';
  asset: string;
  trigger: number;
  amount: number;
  status: 'active' | 'triggered' | 'cancelled';
  created: string;
}

const ACTIVE_ORDERS: Order[] = [
  { id: 'o1', type: 'take-profit', asset: 'stETH', trigger: 1.15, amount: 50, status: 'active', created: '2026-03-01' },
  { id: 'o2', type: 'stop-loss', asset: 'rETH', trigger: 0.95, amount: 25, status: 'active', created: '2026-02-28' },
  { id: 'o3', type: 'trailing-stop', asset: 'stMATIC', trigger: 0.90, amount: 100, status: 'active', created: '2026-02-25' },
];

const ORDER_HISTORY: Order[] = [
  { id: 'h1', type: 'take-profit', asset: 'stETH', trigger: 1.12, amount: 30, status: 'triggered', created: '2026-02-20' },
  { id: 'h2', type: 'stop-loss', asset: 'rETH', trigger: 0.98, amount: 15, status: 'cancelled', created: '2026-02-15' },
];

export function StakingAdvancedOrdersPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [orderType, setOrderType] = useState<'take-profit' | 'stop-loss' | 'trailing-stop'>('take-profit');

  const getOrderIcon = (type: Order['type']) => {
    if (type === 'take-profit') return <TrendingUp size={16} color="#10B981" />;
    if (type === 'stop-loss') return <TrendingDown size={16} color="#EF4444" />;
    return <Target size={16} color="#F59E0B" />;
  };

  const getOrderLabel = (type: Order['type']) => {
    if (type === 'take-profit') return 'Take Profit';
    if (type === 'stop-loss') return 'Stop Loss';
    return 'Trailing Stop';
  };

  const handleCreate = () => {
    toast.success('Order created successfully!');
    setShowCreateSheet(false);
  };

  return (
    <PageLayout>
      <Header title="Advanced Orders" back />

      <BottomSheetV2 open={showCreateSheet} onClose={() => setShowCreateSheet(false)} title="Create Order">
        <div className="flex flex-col gap-4">
          {/* Order Type Selection */}
          <div>
            <label style={{ color: c.text2, fontSize: 12, marginBottom: 8, display: 'block' }}>Order Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['take-profit', 'stop-loss', 'trailing-stop'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className="p-3 rounded-xl text-xs font-semibold text-center"
                  style={{
                    background: orderType === type ? c.primary : c.surface2,
                    color: orderType === type ? '#FFF' : c.text2,
                  }}>
                  {getOrderLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Asset */}
          <div>
            <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>Liquid Staking Token</label>
            <select className="w-full p-3 rounded-xl text-sm" style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }}>
              <option>stETH (Lido)</option>
              <option>rETH (Rocket Pool)</option>
              <option>stMATIC (Lido Polygon)</option>
              <option>cbETH (Coinbase)</option>
            </select>
          </div>

          {/* Trigger Price */}
          <div>
            <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>
              {orderType === 'take-profit' ? 'Trigger Price (Take Profit At)' : orderType === 'stop-loss' ? 'Stop Price (Exit If Below)' : 'Trailing Distance (%)'}
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder={orderType === 'trailing-stop' ? '5' : '1.10'}
                className="w-full p-3 rounded-xl text-sm pr-12"
                style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: c.text3 }}>
                {orderType === 'trailing-stop' ? '%' : 'ETH'}
              </span>
            </div>
            <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
              Current: 1.05 ETH
            </p>
          </div>

          {/* Amount */}
          <div>
            <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>Amount</label>
            <div className="relative">
              <input
                type="number"
                placeholder="0.00"
                className="w-full p-3 rounded-xl text-sm pr-16"
                style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }}
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs font-semibold"
                style={{ background: c.primary, color: '#FFF' }}>
                Max
              </button>
            </div>
            <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
              Available: 150 stETH
            </p>
          </div>

          {/* Warning */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex gap-2">
              <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                {orderType === 'take-profit' && 'Order will execute automatically when price reaches trigger. Subject to market slippage.'}
                {orderType === 'stop-loss' && 'Stop-loss protects against downside but may lock in losses during flash crashes.'}
                {orderType === 'trailing-stop' && 'Trailing stop follows price up but sells if it drops by set percentage.'}
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleCreate}
            className="w-full py-3 rounded-[14px] text-sm font-semibold"
            style={{ background: c.primary, color: '#FFF' }}>
            Create {getOrderLabel(orderType)}
          </button>
        </div>
      </BottomSheetV2>

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <Target size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Automate Your Liquid Staking Strategy
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Set take-profit and stop-loss orders for liquid staking tokens (stETH, rETH). Automatically exit positions at target prices.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <TrCard className="p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <p style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>3</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Active Orders</p>
            </div>
            <div className="text-center p-2 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>8</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Triggered</p>
            </div>
            <div className="text-center p-2 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>+$12.4K</p>
              <p style={{ color: c.text3, fontSize: 10 }}>Saved P&L</p>
            </div>
          </div>
        </TrCard>

        {/* Create Button */}
        <button
          onClick={() => setShowCreateSheet(true)}
          className="w-full py-3 rounded-[14px] text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: c.primary, color: '#FFF' }}>
          <Plus size={18} />
          Create Order
        </button>

        {/* Tabs */}
        <TabBar
          tabs={[
            { id: 'active', label: 'Active' },
            { id: 'history', label: 'History' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {/* Orders List */}
        <PageSection label={tab === 'active' ? 'Active Orders' : 'Order History'}>
          <div className="flex flex-col gap-2">
            {(tab === 'active' ? ACTIVE_ORDERS : ORDER_HISTORY).map(order => (
              <TrCard key={order.id} className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getOrderIcon(order.type)}
                    <div>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                        {getOrderLabel(order.type)}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        {order.asset} • Trigger: {order.trigger} ETH
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                      {order.amount} {order.asset}
                    </p>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold`}
                      style={{
                        background: order.status === 'active' ? 'rgba(16,185,129,0.12)' : order.status === 'triggered' ? 'rgba(59,130,246,0.12)' : 'rgba(107,114,128,0.12)',
                        color: order.status === 'active' ? '#10B981' : order.status === 'triggered' ? '#3B82F6' : '#6B7280',
                      }}>
                      {order.status === 'active' ? 'Active' : order.status === 'triggered' ? 'Triggered' : 'Cancelled'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: c.borderSolid }}>
                  <p style={{ color: c.text3, fontSize: 10 }}>
                    Created: {new Date(order.created).toLocaleDateString('en-GB')}
                  </p>
                  {order.status === 'active' && (
                    <button className="text-xs font-semibold" style={{ color: '#EF4444' }}>
                      Cancel
                    </button>
                  )}
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* How It Works */}
        <PageSection label="How It Works">
          <TrCard className="p-4">
            <div className="space-y-3">
              {[
                { title: 'Take Profit', desc: 'Automatically sell when price reaches target. Lock in gains without monitoring 24/7.' },
                { title: 'Stop Loss', desc: 'Exit position if price drops below threshold. Limit downside risk during market volatility.' },
                { title: 'Trailing Stop', desc: 'Dynamic stop that follows price up. Captures upside while protecting profits.' },
              ].map((item, idx) => (
                <div key={idx} className="pb-3 border-b last:border-b-0" style={{ borderColor: c.borderSolid }}>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                    {item.title}
                  </p>
                  <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        {/* Risk Warning */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
          <div className="flex gap-3">
            <AlertTriangle size={18} color="#EF4444" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Risk Disclosure
              </p>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
                Advanced orders execute at market prices and may experience slippage. Stop-loss orders do not guarantee execution price during extreme volatility. Only use with liquid staking tokens you understand.
              </p>
            </div>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
