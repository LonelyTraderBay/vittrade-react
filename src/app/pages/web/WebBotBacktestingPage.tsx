/**
 * WebBotBacktestingPage — Enterprise Desktop Backtesting
 * Config panel (left) + Results panel (right) side-by-side
 */
import React, { useState } from 'react';
import {
  Play, TrendingUp, AlertTriangle, CheckCircle2, BarChart3,
  Calendar, RefreshCw, Download,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_ICON, WEB_BUTTON, WEB_SPACING } from '../../components/layout/webConstants';
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer,
  XAxis, YAxis, Tooltip,
} from 'recharts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

const STRATEGIES = [
  { id: 'dca', name: 'DCA Bot', color: '#3B82F6' },
  { id: 'grid', name: 'Grid Bot', color: '#F59E0B' },
  { id: 'momentum', name: 'Momentum Bot', color: '#10B981' },
  { id: 'martingale', name: 'Martingale Bot', color: '#8B5CF6' },
];
const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'ADA/USDT'];
const DATE_RANGES = [
  { id: '1m', label: '1 Tháng' },
  { id: '3m', label: '3 Tháng' },
  { id: '6m', label: '6 Tháng' },
  { id: '1y', label: '1 Năm' },
];

const EQUITY_DATA = [
  { date: '2025-09-01', equity: 1000 }, { date: '2025-09-15', equity: 1045 },
  { date: '2025-10-01', equity: 1120 }, { date: '2025-10-15', equity: 1098 },
  { date: '2025-11-01', equity: 1187 }, { date: '2025-11-15', equity: 1234 },
  { date: '2025-12-01', equity: 1298 }, { date: '2025-12-15', equity: 1356 },
  { date: '2026-01-01', equity: 1402 }, { date: '2026-01-15', equity: 1478 },
  { date: '2026-02-01', equity: 1523 }, { date: '2026-02-15', equity: 1612 },
  { date: '2026-03-01', equity: 1689 }, { date: '2026-03-08', equity: 1745 },
];
const DRAWDOWN_DATA = [
  { date: '2025-09-01', dd: 0 }, { date: '2025-09-15', dd: -2.1 },
  { date: '2025-10-01', dd: 0 }, { date: '2025-10-15', dd: -4.5 },
  { date: '2025-11-01', dd: 0 }, { date: '2025-11-15', dd: -1.8 },
  { date: '2025-12-01', dd: 0 }, { date: '2025-12-15', dd: -3.2 },
  { date: '2026-01-01', dd: 0 }, { date: '2026-01-15', dd: -2.7 },
  { date: '2026-02-01', dd: 0 }, { date: '2026-02-15', dd: -1.4 },
  { date: '2026-03-01', dd: 0 }, { date: '2026-03-08', dd: -0.8 },
];
const MONTHLY_DATA = [
  { month: 'Sep', ret: 4.5 }, { month: 'Oct', ret: 7.2 }, { month: 'Nov', ret: 8.9 },
  { month: 'Dec', ret: 6.4 }, { month: 'Jan', ret: 9.1 }, { month: 'Feb', ret: 11.3 },
  { month: 'Mar', ret: 7.8 },
];

const METRICS = {
  finalEquity: 1745, totalReturn: 745, returnPercent: 74.5,
  sharpeRatio: 2.14, maxDrawdown: -4.5, winRate: 72.3,
  totalTrades: 234, avgWin: 15.8, avgLoss: -8.2,
  profitFactor: 2.87, bestTrade: 48.3, worstTrade: -22.1,
};

function ChipSelector({ options, value, onChange, colorMap }: {
  options: { id: string; label: string; color?: string }[];
  value: string;
  onChange: (v: string) => void;
  colorMap?: Record<string, string>;
}) {
  const c = useThemeColors();
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const active = value === o.id;
        const color = o.color || colorMap?.[o.id] || c.primary;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              padding: '8px 16px', borderRadius: 10,
              fontSize: WEB_FONT.sm, fontWeight: active ? 700 : 500,
              cursor: 'pointer',
              background: active ? color : c.surface2,
              color: active ? '#fff' : c.text2,
              border: `1px solid ${active ? color : c.border}`,
              transition: 'all 0.15s',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MetricBox({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  const c = useThemeColors();
  return (
    <div style={{ background: c.surface2, borderRadius: 10, padding: '12px 14px' }}>
      <p style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 500, textTransform: 'uppercase' as const, marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ color: color || c.text1, fontSize: WEB_FONT.lg, fontWeight: 700, fontVariantNumeric: 'tabular-nums', margin: 0 }}>
        {value}
      </p>
      {sub && <p style={{ color: c.text3, fontSize: WEB_FONT.xs, margin: 0, marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

export function WebBotBacktestingPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [step, setStep] = useState<'config' | 'running' | 'results'>('config');
  const [strategy, setStrategy] = useState('grid');
  const [pair, setPair] = useState('BTC/USDT');
  const [range, setRange] = useState('6m');
  const [capital, setCapital] = useState('1000');
  const [progress, setProgress] = useState(0);

  const stratColor = STRATEGIES.find(s => s.id === strategy)?.color || '#3B82F6';
  const recommendation = METRICS.sharpeRatio >= 1.5 && METRICS.maxDrawdown > -10;

  const handleRun = () => {
    setStep('running'); setProgress(0);
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setTimeout(() => setStep('results'), 400); return 100; }
        return p + 8;
      });
    }, 200);
  };

  const tooltipStyle = { background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: WEB_FONT.xs };

  /* Running state */
  if (step === 'running') {
    return (
      <PageLayout>
        <Header title="Đang chạy Backtest..." back={false} />
        <div className="flex flex-col items-center justify-center" style={{ padding: '80px 0' }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 120, height: 120, borderRadius: '50%',
              background: `conic-gradient(${stratColor} ${progress * 3.6}deg, ${c.surface2} 0deg)`,
              marginBottom: 24,
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{ width: 100, height: 100, borderRadius: '50%', background: c.bg }}
            >
              <BarChart3 size={44} color={stratColor} />
            </div>
          </div>
          <p style={{ color: c.text1, fontSize: WEB_FONT['2xl'], fontWeight: 700, marginBottom: 8 }}>
            {progress}%
          </p>
          <p style={{ color: c.text2, fontSize: WEB_FONT.md }}>
            {progress < 30 ? 'Đang tải dữ liệu lịch sử...' :
             progress < 60 ? 'Mô phỏng giao dịch...' :
             progress < 90 ? 'Tính toán metrics...' : 'Tạo báo cáo...'}
          </p>
          <div style={{ width: 320, height: 6, borderRadius: 3, background: c.surface2, marginTop: 20, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: stratColor, width: `${progress}%`, transition: 'width 0.2s' }} />
          </div>
        </div>
      </PageLayout>
    );
  }

  /* Results state — side by side */
  if (step === 'results') {
    return (
      <PageLayout>
        <Header title="Kết quả Backtest" subtitle="Backtesting · Trading Bots" back action={{ icon: Download, onClick: () => toast.success('Đang xuất báo cáo...') }} />

        <div style={{ padding: '24px 0 40px' }}>
          {/* Recommendation banner */}
          <div
            className="flex items-center gap-4"
            style={{
              background: recommendation ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
              border: `1.5px solid ${recommendation ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
              borderRadius: 16, padding: '16px 24px', marginBottom: 24,
            }}
          >
            {recommendation
              ? <CheckCircle2 size={WEB_ICON.xl} color="#10B981" />
              : <AlertTriangle size={WEB_ICON.xl} color="#F59E0B" />
            }
            <div className="flex-1">
              <p style={{ color: recommendation ? '#10B981' : '#F59E0B', fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 2 }}>
                {recommendation ? 'Khuyến nghị triển khai' : 'Cần tối ưu trước khi triển khai'}
              </p>
              <p style={{ color: c.text2, fontSize: WEB_FONT.sm, margin: 0 }}>
                {recommendation
                  ? 'Sharpe ratio tốt (> 1.5) và drawdown thấp. Chiến lược hoạt động tốt trên dữ liệu lịch sử.'
                  : 'Cân nhắc điều chỉnh thông số hoặc thử date range khác để cải thiện Sharpe ratio.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('config')}
                style={{
                  height: WEB_BUTTON.md, padding: '0 20px', borderRadius: 10,
                  fontSize: WEB_FONT.sm, fontWeight: 600, cursor: 'pointer',
                  background: c.surface, border: `1px solid ${c.border}`, color: c.text1,
                }}
              >
                <RefreshCw size={WEB_ICON.xs} style={{ marginRight: 6, display: 'inline' }} />
                Chạy lại
              </button>
              <button
                onClick={() => { toast.success('Chuyển đến tạo bot...'); navigate(-1); }}
                style={{
                  height: WEB_BUTTON.md, padding: '0 20px', borderRadius: 10,
                  fontSize: WEB_FONT.sm, fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: recommendation ? '#10B981' : c.primary, color: '#fff',
                }}
              >
                <CheckCircle2 size={WEB_ICON.xs} style={{ marginRight: 6, display: 'inline' }} />
                {recommendation ? 'Deploy Bot' : 'Deploy Anyway'}
              </button>
            </div>
          </div>

          {/* Key metrics row */}
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
            <MetricBox label="Tổng lợi nhuận" value={`+$${METRICS.totalReturn}`} color="#10B981" sub={`+${METRICS.returnPercent}%`} />
            <MetricBox label="Sharpe Ratio" value={METRICS.sharpeRatio.toString()} sub="Xuất sắc" />
            <MetricBox label="Max Drawdown" value={`${METRICS.maxDrawdown}%`} color="#EF4444" sub="Rủi ro thấp" />
            <MetricBox label="Win Rate" value={`${METRICS.winRate}%`} color="#10B981" sub={`${METRICS.totalTrades} giao dịch`} />
          </div>

          {/* Charts — 2 column */}
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 24 }}>
            {/* Equity curve */}
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20 }}>
              <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>Equity Curve</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={EQUITY_DATA}>
                  <defs><linearGradient id="eqG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="date" stroke={c.text3} style={{ fontSize: 10 }} tickLine={false} tickFormatter={v => new Date(v).toLocaleDateString('vi', { month: 'short' })} />
                  <YAxis stroke={c.text3} style={{ fontSize: 10 }} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`$${v}`, 'Equity']} />
                  <Area type="monotone" dataKey="equity" stroke="#10B981" strokeWidth={2} fill="url(#eqG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Drawdown */}
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20 }}>
              <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>Drawdown</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={DRAWDOWN_DATA}>
                  <defs><linearGradient id="ddG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#EF4444" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="date" stroke={c.text3} style={{ fontSize: 10 }} tickLine={false} tickFormatter={v => new Date(v).toLocaleDateString('vi', { month: 'short' })} />
                  <YAxis stroke={c.text3} style={{ fontSize: 10 }} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Drawdown']} />
                  <Area type="monotone" dataKey="dd" stroke="#EF4444" strokeWidth={2} fill="url(#ddG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly returns + detailed metrics */}
          <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 24 }}>
            {/* Monthly returns */}
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20 }}>
              <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>Lợi nhuận theo tháng</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={MONTHLY_DATA}>
                  <XAxis dataKey="month" stroke={c.text3} style={{ fontSize: 10 }} tickLine={false} />
                  <YAxis stroke={c.text3} style={{ fontSize: 10 }} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Return']} />
                  <Bar dataKey="ret" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed metrics */}
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20 }}>
              <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>Chi tiết hiệu suất</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Profit Factor', value: METRICS.profitFactor.toString(), color: '#10B981' },
                  { label: 'Avg Win', value: `+$${METRICS.avgWin}`, color: '#10B981' },
                  { label: 'Avg Loss', value: `$${METRICS.avgLoss}`, color: '#EF4444' },
                  { label: 'Best Trade', value: `+$${METRICS.bestTrade}`, color: '#10B981' },
                  { label: 'Worst Trade', value: `$${METRICS.worstTrade}`, color: '#EF4444' },
                  { label: 'Final Equity', value: `$${METRICS.finalEquity}`, color: c.text1 },
                ].map(m => (
                  <MetricBox key={m.label} label={m.label} value={m.value} color={m.color} />
                ))}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div
            className="flex items-start gap-3"
            style={{
              background: c.surface, border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 14, padding: '16px 20px',
            }}
          >
            <AlertTriangle size={WEB_ICON.md} color="#F59E0B" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.6, margin: 0 }}>
              <span style={{ color: '#F59E0B', fontWeight: 700 }}>Lưu ý:</span>{' '}
              Hiệu suất quá khứ không đảm bảo kết quả tương lai. Giao dịch thực tế sẽ có slippage, phí và độ trễ
              không phản ánh trong backtest này. Dùng kết quả này làm tham khảo, không phải cam kết.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  /* Config state */
  return (
    <PageLayout>
      <Header title="Backtest Strategy" subtitle="Backtesting · Trading Bots" back />

      <div style={{ padding: '24px 0 40px' }}>
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 360px', alignItems: 'flex-start' }}>
          {/* Left: Config form */}
          <div className="flex flex-col" style={{ gap: 24 }}>
            {/* Strategy */}
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: '20px 24px' }}>
              <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 14 }}>
                Chọn chiến lược
              </p>
              <div className="grid grid-cols-2 gap-3">
                {STRATEGIES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStrategy(s.id)}
                    className="flex items-center gap-3 text-left transition-all"
                    style={{
                      padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                      background: strategy === s.id ? s.color + '12' : c.surface2,
                      border: `2px solid ${strategy === s.id ? s.color : 'transparent'}`,
                    }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                    <span style={{
                      color: strategy === s.id ? s.color : c.text1,
                      fontSize: WEB_FONT.md, fontWeight: strategy === s.id ? 700 : 500,
                    }}>
                      {s.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pair */}
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: '20px 24px' }}>
              <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 14 }}>
                Cặp giao dịch
              </p>
              <ChipSelector
                options={PAIRS.map(p => ({ id: p, label: p }))}
                value={pair}
                onChange={setPair}
                colorMap={Object.fromEntries(PAIRS.map(p => [p, stratColor]))}
              />
            </div>

            {/* Date range */}
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: '20px 24px' }}>
              <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 14 }}>
                Khoảng thời gian
              </p>
              <ChipSelector
                options={DATE_RANGES}
                value={range}
                onChange={setRange}
                colorMap={Object.fromEntries(DATE_RANGES.map(d => [d.id, stratColor]))}
              />
            </div>

            {/* Capital */}
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: '20px 24px' }}>
              <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 14 }}>
                Vốn ban đầu
              </p>
              <div
                className="flex items-center gap-3"
                style={{
                  background: c.surface2, border: `1.5px solid ${stratColor}33`,
                  height: WEB_SPACING.rowDefault, borderRadius: 12, padding: '0 16px',
                }}
              >
                <input
                  type="number"
                  inputMode="decimal"
                  value={capital}
                  onChange={e => setCapital(e.target.value)}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: c.text1, fontSize: WEB_FONT.lg, flex: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
                <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>USDT</span>
              </div>
            </div>
          </div>

          {/* Right: Summary + CTA */}
          <div className="flex flex-col" style={{ gap: 16, position: 'sticky', top: 24 }}>
            {/* Summary card */}
            <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: '20px 24px' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
                <Calendar size={WEB_ICON.md} color={stratColor} />
                <span style={{ color: stratColor, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                  Tóm tắt Backtest
                </span>
              </div>
              <div className="flex flex-col" style={{ gap: 12 }}>
                {[
                  { label: 'Chiến lược', value: STRATEGIES.find(s => s.id === strategy)?.name || '' },
                  { label: 'Cặp giao dịch', value: pair },
                  { label: 'Khoảng thời gian', value: DATE_RANGES.find(d => d.id === range)?.label || '' },
                  { label: 'Vốn ban đầu', value: `$${Number(capital).toLocaleString()}` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>{r.label}</span>
                    <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Run button */}
            <button
              onClick={handleRun}
              className="flex items-center justify-center gap-2 w-full"
              style={{
                height: WEB_BUTTON.lg, borderRadius: 12,
                fontSize: WEB_FONT.md, fontWeight: 700, cursor: 'pointer', border: 'none',
                background: `linear-gradient(135deg, ${stratColor} 0%, ${stratColor}bb 100%)`,
                color: '#fff', boxShadow: `0 4px 16px ${stratColor}30`,
              }}
            >
              <Play size={WEB_ICON.sm} />
              Chạy Backtest
            </button>

            {/* Info note */}
            <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.6, margin: 0 }}>
                Backtest sẽ mô phỏng chiến lược trên dữ liệu lịch sử. Thời gian xử lý phụ thuộc vào khoảng thời gian và độ phức tạp chiến lược.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
