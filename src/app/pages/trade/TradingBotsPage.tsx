import React, { useState } from 'react';
import {
  X, AlertTriangle, CheckCircle, Bot, Pause, Play,
  Settings, Trash2, Plus, BarChart2,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { fmtSignedUsd, fmtPct } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
interface BotStrategy {
  id: string;
  name: string;
  description: string;
  longDesc: string;
  icon: string;
  color: string;
  risk: 'low' | 'medium' | 'high';
  avgReturn: string;
  suitableFor: string;
  params: Array<{ key: string; label: string; type: 'number' | 'select' | 'range'; options?: string[]; defaultValue: string; unit?: string }>;
}

const STRATEGIES: BotStrategy[] = [
  {
    id: 'dca',
    name: 'DCA Bot',
    description: 'Dollar Cost Averaging — Mua định kỳ, giảm rủi ro biến động',
    longDesc: 'DCA Bot tự động mua một lượng cố định theo chu kỳ thời gian, bất kể giá tăng hay giảm. Chiến lược này giảm tác động của biến động giá ngắn hạn.',
    icon: '📅',
    color: '#3B82F6',
    risk: 'low',
    avgReturn: '+8–15% / năm',
    suitableFor: 'Nhà đầu tư dài hạn, người mới',
    params: [
      { key: 'pair', label: 'Cặp giao dịch', type: 'select', options: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'], defaultValue: 'BTC/USDT' },
      { key: 'amount', label: 'Mỗi lần mua', type: 'number', defaultValue: '50', unit: 'USDT' },
      { key: 'interval', label: 'Chu kỳ', type: 'select', options: ['Mỗi giờ', 'Mỗi ngày', 'Mỗi tuần', 'Mỗi tháng'], defaultValue: 'Mỗi ngày' },
      { key: 'totalBudget', label: 'Ngân sách tổng', type: 'number', defaultValue: '1000', unit: 'USDT' },
    ],
  },
  {
    id: 'grid',
    name: 'Grid Bot',
    description: 'Lưới giá — Mua thấp bán cao tự động trong khoảng giá',
    longDesc: 'Grid Bot đặt nhiều lệnh mua và bán trong khoảng giá xác định, tự động kiếm lời khi thị trường đi ngang hoặc biến động nhẹ.',
    icon: '⚡',
    color: '#F59E0B',
    risk: 'medium',
    avgReturn: '+15–40% / năm',
    suitableFor: 'Thị trường sideway, trader kinh nghiệm',
    params: [
      { key: 'pair', label: 'Cặp giao dịch', type: 'select', options: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'], defaultValue: 'ETH/USDT' },
      { key: 'upperPrice', label: 'Giá trần', type: 'number', defaultValue: '4000', unit: 'USDT' },
      { key: 'lowerPrice', label: 'Giá sàn', type: 'number', defaultValue: '3000', unit: 'USDT' },
      { key: 'gridCount', label: 'Số lưới', type: 'number', defaultValue: '20', unit: 'lưới' },
      { key: 'investment', label: 'Đầu tư', type: 'number', defaultValue: '500', unit: 'USDT' },
    ],
  },
  {
    id: 'martingale',
    name: 'Martingale Bot',
    description: 'Tăng gấp đôi khi thua — Phục hồi nhanh sau drawdown',
    longDesc: 'Martingale tăng gấp đôi kích thước lệnh sau mỗi lần thua để bù đắp khi thắng. Tiềm năng lợi nhuận cao nhưng rủi ro cũng cao hơn.',
    icon: '🎯',
    color: '#8B5CF6',
    risk: 'high',
    avgReturn: '+30–80% / năm',
    suitableFor: 'Trader chuyên nghiệp, vốn lớn',
    params: [
      { key: 'pair', label: 'Cặp giao dịch', type: 'select', options: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'], defaultValue: 'BTC/USDT' },
      { key: 'baseOrder', label: 'Lệnh cơ bản', type: 'number', defaultValue: '20', unit: 'USDT' },
      { key: 'multiplier', label: 'Hệ số nhân', type: 'number', defaultValue: '2', unit: 'x' },
      { key: 'maxOrders', label: 'Số lệnh tối đa', type: 'number', defaultValue: '5', unit: 'lệnh' },
      { key: 'takeProfit', label: 'Take profit', type: 'number', defaultValue: '2', unit: '%' },
    ],
  },
  {
    id: 'momentum',
    name: 'Momentum Bot',
    description: 'Theo đà thị trường — Mua khi uptrend, bán khi downtrend',
    longDesc: 'Momentum Bot sử dụng chỉ báo kỹ thuật (RSI, MACD) để xác định xu hướng và tự động vào/ra lệnh theo momentum của thị trường.',
    icon: '📈',
    color: '#10B981',
    risk: 'medium',
    avgReturn: '+20–50% / năm',
    suitableFor: 'Thị trường trending, trader trung cấp',
    params: [
      { key: 'pair', label: 'Cặp giao dịch', type: 'select', options: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'], defaultValue: 'BTC/USDT' },
      { key: 'investment', label: 'Vốn giao dịch', type: 'number', defaultValue: '500', unit: 'USDT' },
      { key: 'rsiPeriod', label: 'RSI Period', type: 'number', defaultValue: '14', unit: '' },
      { key: 'stopLoss', label: 'Stop loss', type: 'number', defaultValue: '5', unit: '%' },
      { key: 'takeProfit', label: 'Take profit', type: 'number', defaultValue: '10', unit: '%' },
    ],
  },
];

const RISK_CONFIG = {
  low: { label: 'Thấp', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  medium: { label: 'Trung bình', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  high: { label: 'Cao', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
};

interface ActiveBot {
  id: string;
  strategyId: string;
  strategyName: string;
  icon: string;
  color: string;
  pair: string;
  status: 'running' | 'paused' | 'stopped';
  profit: number;
  profitPct: number;
  trades: number;
  investment: number;
  startDate: string;
  runtime: string;
}

const ACTIVE_BOTS: ActiveBot[] = [
  {
    id: 'bot1', strategyId: 'dca', strategyName: 'DCA Bot', icon: '📅', color: '#3B82F6',
    pair: 'BTC/USDT', status: 'running', profit: 84.20, profitPct: 8.42, trades: 47,
    investment: 1000, startDate: '01/01/2026', runtime: '52 ngày',
  },
  {
    id: 'bot2', strategyId: 'grid', strategyName: 'Grid Bot', icon: '⚡', color: '#F59E0B',
    pair: 'ETH/USDT', status: 'running', profit: 127.40, profitPct: 25.48, trades: 234,
    investment: 500, startDate: '15/01/2026', runtime: '38 ngày',
  },
  {
    id: 'bot3', strategyId: 'momentum', strategyName: 'Momentum Bot', icon: '📈', color: '#10B981',
    pair: 'SOL/USDT', status: 'paused', profit: -12.30, profitPct: -2.46, trades: 18,
    investment: 500, startDate: '10/02/2026', runtime: '13 ngày',
  },
];

interface CreateBotSheetProps {
  strategy: BotStrategy;
  onClose: () => void;
  onCreate: () => void;
}

function CreateBotSheet({ strategy, onClose, onCreate }: CreateBotSheetProps) {
  const c = useThemeColors();
  const [params, setParams] = useState<Record<string, string>>(
    Object.fromEntries(strategy.params.map(p => [p.key, p.defaultValue]))
  );
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col"
        style={{ background: c.surface, border: `1px solid ${c.borderSolid}`, maxWidth: 440, margin: '0 auto', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-6 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: strategy.color + '22' }}>
                {strategy.icon}
              </div>
              <div>
                <h3 style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>{strategy.name}</h3>
                <p style={{ color: c.text2, fontSize: 12 }}>{strategy.suitableFor}</p>
              </div>
            </div>
            <button onClick={onClose}><X size={20} color={c.text2} /></button>
          </div>

          {/* Description */}
          <div className="rounded-2xl p-3" style={{ background: strategy.color + '11', border: `1px solid ${strategy.color}33` }}>
            <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.5 }}>{strategy.longDesc}</p>
          </div>

          {/* Params */}
          {strategy.params.map(param => (
            <div key={param.key}>
              <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 6 }}>
                {param.label} {param.unit && <span style={{ color: c.text3 }}>({param.unit})</span>}
              </label>
              {param.type === 'select' ? (
                <div className="flex gap-2 flex-wrap">
                  {param.options?.map(opt => (
                    <button key={opt} onClick={() => setParams(p => ({ ...p, [param.key]: opt }))}
                      className="px-3 py-2 rounded-xl text-xs font-semibold"
                      style={{
                        background: params[param.key] === opt ? strategy.color : c.surface2,
                        color: params[param.key] === opt ? '#fff' : c.text2,
                        border: `1px solid ${params[param.key] === opt ? strategy.color : c.borderSolid}`,
                      }}>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl px-4"
                  style={{ background: c.surface2, border: `1.5px solid ${strategy.color}44`, height: 52, borderRadius: 14 }}>
                  <input
                    type="number" inputMode="decimal"
                    value={params[param.key]}
                    onChange={e => setParams(p => ({ ...p, [param.key]: e.target.value }))}
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 16, flex: 1, fontFamily: 'monospace' }}
                  />
                  {param.unit && <span style={{ color: c.text3, fontSize: 13 }}>{param.unit}</span>}
                </div>
              )}
            </div>
          ))}

          {/* Risk warning for high risk */}
          {strategy.risk === 'high' && (
            <div className="flex items-start gap-2 p-3 rounded-2xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={14} color="#EF4444" className="shrink-0 mt-1" />
              <p style={{ color: '#EF4444', fontSize: 12, lineHeight: 1.5 }}>
                Chiến lược này có rủi ro cao. Bạn có thể mất nhiều hơn vốn ban đầu nếu thị trường biến động mạnh.
              </p>
            </div>
          )}

          {/* Agreement */}
          <button onClick={() => setAgreed(!agreed)} className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-1"
              style={{ borderColor: agreed ? strategy.color : c.borderSolid, background: agreed ? strategy.color : 'transparent' }}>
              {agreed && <CheckCircle size={14} color="#fff" />}
            </div>
            <span style={{ color: c.text2, fontSize: 12, lineHeight: 1.5, textAlign: 'left' }}>
              Tôi hiểu các rủi ro và đồng ý với <span style={{ color: '#3B82F6' }}>điều khoản sử dụng Bot</span>
            </span>
          </button>

          <button
            onClick={() => { if (agreed) { onCreate(); onClose(); } }}
            disabled={!agreed}
            className="w-full rounded-2xl font-bold text-white"
            style={{
              height: 52, borderRadius: 14,
              background: agreed ? `linear-gradient(135deg, ${strategy.color} 0%, ${strategy.color}aa 100%)` : c.surface2,
              color: agreed ? '#fff' : c.text3,
              boxShadow: agreed ? `0 4px 20px ${strategy.color}44` : 'none',
              fontSize: 16,
            }}>
            {agreed ? `🚀 Khởi chạy ${strategy.name}` : 'Nhập thông số Bot'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TradingBotsPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'marketplace' | 'mybots'>('mybots');
  const [selectedStrategy, setSelectedStrategy] = useState<BotStrategy | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bots, setBots] = useState<ActiveBot[]>(ACTIVE_BOTS);

  const totalProfit = bots.reduce((s, b) => s + b.profit, 0);
  const totalInvestment = bots.reduce((s, b) => s + b.investment, 0);

  const toggleBot = (id: string) => {
    setBots(prev => prev.map(b => b.id === id ? { ...b, status: b.status === 'running' ? 'paused' : 'running' } : b));
  };

  return (
    <PageLayout>
      {selectedStrategy && (
        <CreateBotSheet
          strategy={selectedStrategy}
          onClose={() => setSelectedStrategy(null)}
          onCreate={() => { setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000); }}
        />
      )}

      {showSuccess && (
        <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: c.surface, border: '1px solid #10B981', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxWidth: 440, margin: '0 auto' }}>
          <CheckCircle size={20} color="#10B981" />
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Bot đã được khởi chạy!</p>
            <p style={{ color: c.text2, fontSize: 12 }}>Bot đang hoạt động và giao dịch tự động</p>
          </div>
          <button onClick={() => setShowSuccess(false)}><X size={16} color={c.text3} /></button>
        </div>
      )}

      <Header title="Trading Bots" subtitle="Bot giao dịch · Trade" back />

      {/* Hero / Summary */}
      <div className="mx-5 mt-4 rounded-3xl p-5 relative overflow-hidden"
        style={{ background: c.portfolioBg, border: `1px solid ${c.portfolioBorder}`, boxShadow: c.portfolioShadow }}>
        {/* Decorative glows — blue accent */}
        <div className="absolute -top-14 -right-14 w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 65%)' }} />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)' }} />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />

        <div className="flex items-center gap-4 mb-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(99,102,241,0.2) 100%)',
              border: '1px solid rgba(59,130,246,0.3)',
              boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
            }}>
            <Bot size={26} color="#60A5FA" />
          </div>
          <div>
            <p style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>Giao dịch tự động 24/7</p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>Bot hoạt động ngay cả khi bạn ngủ</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 relative z-10">
          {[
            { label: 'Bot đang chạy', value: bots.filter(b => b.status === 'running').length.toString(), color: '#34D399' },
            { label: 'Tổng đầu tư', value: `$${totalInvestment.toLocaleString()}`, color: '#FFFFFF' },
            { label: 'Lợi nhuận', value: fmtSignedUsd(totalProfit), color: totalProfit >= 0 ? '#34D399' : '#F87171' },
          ].map((s, i) => (
            <div key={s.label} className="rounded-2xl p-3 text-center"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
              }}>
              <p style={{ color: s.color, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <TabBar
        variant="segment"
        tabs={[
          { id: 'mybots', label: `🤖 Bot của tôi (${bots.length})` },
          { id: 'marketplace', label: '🛒 Chiến lược' },
        ]}
        active={tab}
        onChange={setTab}
        className="mx-5 mt-4"
      />

      {/* MY BOTS */}
      {tab === 'mybots' && (
        <div className="px-5 mt-4 flex flex-col gap-3">
          {bots.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.surface2 }}>
                <Bot size={32} color={c.text3} />
              </div>
              <p style={{ color: c.text3, fontSize: 14 }}>Chưa có bot nào đang chạy</p>
              <button onClick={() => setTab('marketplace')}
                className="px-6 py-3 rounded-2xl font-semibold text-white"
                style={{ background: '#3B82F6' }}>
                Tạo Bot mới
              </button>
            </div>
          ) : (
            <div className="contents">
              {bots.map(bot => (
                <TrCard key={bot.id} hover className="p-4"
                  style={{ opacity: bot.status === 'stopped' ? 0.6 : 1 }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: bot.color + '22' }}>
                      {bot.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{bot.strategyName}</p>
                        <span className="px-2 py-1 rounded-md text-xs font-bold" style={{ background: bot.color + '22', color: bot.color }}>{bot.pair}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full"
                          style={{ background: bot.status === 'running' ? '#10B981' : '#F59E0B', boxShadow: bot.status === 'running' ? '0 0 6px #10B981' : 'none' }} />
                        <span style={{ color: bot.status === 'running' ? '#10B981' : '#F59E0B', fontSize: 12, fontWeight: 600 }}>
                          {bot.status === 'running' ? 'Đang chạy' : 'Tạm dừng'}
                        </span>
                        <span style={{ color: c.text3, fontSize: 12 }}>• {bot.runtime}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p style={{ color: bot.profit >= 0 ? '#10B981' : '#EF4444', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                        {fmtSignedUsd(bot.profit)}
                      </p>
                      <p style={{ color: bot.profit >= 0 ? '#10B981' : '#EF4444', fontSize: 12 }}>
                        {fmtPct(bot.profitPct)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: 'Đầu tư', value: `$${bot.investment}` },
                      { label: 'Lệnh', value: `${bot.trades}` },
                      { label: 'Từ', value: bot.startDate },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-3" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 10 }}>{s.label}</p>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => toggleBot(bot.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold"
                      style={{
                        background: bot.status === 'running' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.12)',
                        color: bot.status === 'running' ? '#F59E0B' : '#10B981',
                        border: `1px solid ${bot.status === 'running' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
                      }}>
                      {bot.status === 'running' ? <span className="flex items-center gap-1"><Pause size={12} />Tạm dừng</span> : <span className="flex items-center gap-1"><Play size={12} />Tiếp tục</span>}
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <Settings size={12} />Cài đặt
                    </button>
                    <button onClick={() => setBots(prev => prev.filter(b => b.id !== bot.id))}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <Trash2 size={12} />Xóa
                    </button>
                  </div>
                </TrCard>
              ))}

              {/* Add new bot CTA */}
              <button onClick={() => setTab('marketplace')}
                className="w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-2"
                style={{ background: c.surface, color: '#3B82F6', border: '1px dashed rgba(59,130,246,0.4)', fontSize: 14 }}>
                <Plus size={18} />Thêm Bot mới
              </button>
            </div>
          )}
        </div>
      )}

      {/* MARKETPLACE */}
      {tab === 'marketplace' && (
        <div className="px-5 mt-4 flex flex-col gap-4">
          {/* Overall stats */}
          <TrCard className="p-4" accentBorder="rgba(59,130,246,0.2)">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={16} color="#3B82F6" />
              <p style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600 }}>Hiệu suất chiến lược (30 ngày gần đây)</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'DCA Bot', value: '+9.4%', color: '#3B82F6' },
                { label: 'Grid Bot', value: '+27.1%', color: '#F59E0B' },
                { label: 'Momentum', value: '+18.3%', color: '#10B981' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
                  <p style={{ color: s.color, fontSize: 14, fontWeight: 700 }}>{s.value}</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </TrCard>

          {/* Strategy cards */}
          {STRATEGIES.map(strategy => {
            const risk = RISK_CONFIG[strategy.risk];
            return (
              <TrCard key={strategy.id} overflow rounded="lg">
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: strategy.color + '22', border: `1.5px solid ${strategy.color}44` }}>
                      {strategy.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p style={{ color: '#F0F4FF', fontSize: 16, fontWeight: 700 }}>{strategy.name}</p>
                        <span className="px-2 py-1 rounded-md text-xs font-bold"
                          style={{ background: risk.bg, color: risk.color }}>
                          {risk.label}
                        </span>
                      </div>
                      <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.4 }}>{strategy.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { label: 'Lợi nhuận kỳ vọng', value: strategy.avgReturn, color: '#10B981' },
                      { label: 'Phù hợp với', value: strategy.suitableFor },
                    ].map(r => (
                      <div key={r.label} className="rounded-xl p-3" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: 10 }}>{r.label}</p>
                        <p style={{ color: (r as any).color ?? c.text1, fontSize: 12, fontWeight: 600 }}>{r.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <p style={{ color: c.text3, fontSize: 12 }}>Thông số:</p>
                    <div className="flex gap-2 flex-wrap">
                      {strategy.params.slice(0, 3).map(p => (
                        <span key={p.key} className="px-2 py-1 rounded-lg text-xs"
                          style={{ background: strategy.color + '15', color: strategy.color }}>
                          {p.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => setSelectedStrategy(strategy)}
                    className="w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${strategy.color} 0%, ${strategy.color}99 100%)`,
                      color: '#fff',
                      boxShadow: `0 4px 16px ${strategy.color}44`,
                      fontSize: 14,
                    }}>
                    <Plus size={16} />Tạo Bot {strategy.name}
                  </button>
                </div>
              </TrCard>
            );
          })}

          {/* Info */}
          <TrCard className="p-4" accentBorder="rgba(245,158,11,0.2)">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-1" />
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                <span style={{ color: '#F59E0B', fontWeight: 600 }}>Lưu ý quan trọng:</span> Bot giao dịch không đảm bảo lợi nhuận.
                Hiệu suất trong quá khứ không đại diện cho kết quả tương lai. Chỉ đầu tư số tiền bạn có thể chấp nhận mất.
              </p>
            </div>
          </TrCard>
        </div>
      )}
    </PageLayout>
  );
}