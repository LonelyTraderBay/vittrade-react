/**
 * WebBotGuidePage — Enterprise Desktop Bot Guide
 * 3-tab layout: Strategies (2-col cards) | Best Practices (grid) | Mistakes (table-like)
 */
import React, { useState } from 'react';
import {
  BookOpen, Play, TrendingUp, Grid3x3, Zap, AlertTriangle,
  ChevronDown, ChevronUp, CheckCircle, XCircle,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';

const STRATEGIES = [
  {
    id: 'dca', name: 'DCA Bot', icon: TrendingUp, color: '#3B82F6',
    difficulty: 'Beginner', diffColor: '#10B981',
    description: 'Tự động mua crypto theo chu kỳ bất kể giá.',
    howItWorks: ['Đặt số tiền đầu tư (VD: $100)', 'Chọn tần suất (ngày, tuần, tháng)', 'Bot tự động mua theo lịch', 'Trung bình giá qua biến động', 'Tốt nhất cho tích lũy dài hạn'],
    pros: ['Chiến lược đơn giản nhất', 'Loại bỏ cảm xúc khi mua', 'Giảm rủi ro timing', 'Tốt cho thị trường biến động'],
    cons: ['Không có cơ chế chốt lời', 'Tiếp tục mua trong downtrend', 'Cần vốn đều đặn'],
    bestFor: 'Nhà đầu tư dài hạn, người mới, thị trường biến động',
    example: { setup: 'Mua $100 BTC mỗi tuần', duration: '6 tháng', result: 'Giá TB: $67,500 vs giá spot: $68,450', profit: '+$127 (1.8%)' },
  },
  {
    id: 'grid', name: 'Grid Bot', icon: Grid3x3, color: '#F59E0B',
    difficulty: 'Intermediate', diffColor: '#F59E0B',
    description: 'Đặt lệnh mua/bán ở nhiều mức giá để kiếm lời từ biến động.',
    howItWorks: ['Xác định khoảng giá (VD: $65K-$70K)', 'Đặt số lưới (VD: 20)', 'Bot đặt lệnh mua/bán tại mỗi mức', 'Kiếm lời từ mỗi dao động giá', 'Tốt nhất trong thị trường sideway'],
    pros: ['Kiếm lời từ biến động', 'Không cần dự đoán hướng', 'Giao dịch tự động 24/7', 'Win rate cao (70-80%)'],
    cons: ['Lỗ khi xu hướng mạnh', 'Cần đủ vốn cho tất cả lưới', 'Có thể bỏ lỡ move lớn ngoài range'],
    bestFor: 'Thị trường sideway, trader tích cực',
    example: { setup: '20 lưới, range $65K-$70K, vốn $1,000', duration: '1 tháng', result: '156 giao dịch, win rate 72.3%', profit: '+$127.40 (12.7%)' },
  },
  {
    id: 'momentum', name: 'Momentum Bot', icon: Zap, color: '#10B981',
    difficulty: 'Advanced', diffColor: '#8B5CF6',
    description: 'Theo xu hướng bằng cách mua khi giá tăng, bán khi giá giảm.',
    howItWorks: ['Theo dõi chuyển động giá và chỉ báo', 'Mua khi phát hiện uptrend', 'Bán khi phát hiện downtrend', 'Trail stop-loss bảo vệ lợi nhuận', 'Tốt nhất cho thị trường trending'],
    pros: ['Nắm bắt chuyển động xu hướng lớn', 'Stop-loss tích hợp', 'Lợi nhuận lớn trong xu hướng', 'Thích nghi với điều kiện thị trường'],
    cons: ['Tín hiệu giả trong thị trường choppy', 'Cần tinh chỉnh thông số', 'Whipsaw trong thị trường sideway'],
    bestFor: 'Thị trường trending (bull/bear), trader có kinh nghiệm',
    example: { setup: 'MA crossover, stop-loss 3%', duration: '2 tháng', result: '23 giao dịch, win rate 68.4%', profit: '+$559 (55.9%)' },
  },
  {
    id: 'martingale', name: 'Martingale Bot', icon: AlertTriangle, color: '#EF4444',
    difficulty: 'Expert', diffColor: '#EF4444',
    description: 'Tăng gấp đôi vị thế sau mỗi lần thua để phục hồi với một lần thắng.',
    howItWorks: ['Bắt đầu với vị thế cơ bản ($100)', 'Nếu thua, gấp đôi ($200)', 'Nếu thua tiếp, gấp đôi ($400)', 'Một lần thắng phục hồi tất cả', '⚠️ RỦI RO CAO - có thể xóa tài khoản'],
    pros: ['Win rate cao (78%+)', 'Phục hồi lỗ nhanh', 'Logic đơn giản'],
    cons: ['Rủi ro thảm họa nếu thua nhiều', 'Cần vốn lớn', 'Max drawdown -30%+', 'Không phù hợp người mới'],
    bestFor: 'Trader chuyên nghiệp, vốn lớn, chấp nhận rủi ro cao',
    example: { setup: 'Base $100, nhân 2x, max 5 lần', duration: '1 tháng', result: '312 giao dịch, win rate 78.9%, max DD -28.7%', profit: '+$894 (89.4%) ⚠️ Rủi ro cao' },
  },
];

const BEST_PRACTICES = [
  { title: 'Bắt đầu nhỏ', desc: 'Bắt đầu với $50-200 để thử nghiệm trước khi tăng vốn.', icon: '💡' },
  { title: 'Backtest trước', desc: 'Luôn backtest chiến lược trên dữ liệu lịch sử trước khi triển khai.', icon: '📊' },
  { title: 'Đặt Stop-Loss', desc: 'Sử dụng giới hạn drawdown và emergency stop để bảo vệ vốn.', icon: '🛡️' },
  { title: 'Theo dõi hàng ngày', desc: 'Kiểm tra hiệu suất bot ít nhất mỗi ngày để phát hiện bất thường.', icon: '👁️' },
  { title: 'Đa dạng hóa', desc: 'Không bỏ hết vốn vào một bot - phân bổ giữa nhiều chiến lược.', icon: '🎯' },
  { title: 'Tránh FOMO', desc: 'Không tạo bot trong điều kiện thị trường cực đoan.', icon: '⚠️' },
];

const COMMON_MISTAKES = [
  { mistake: 'Over-optimize thông số', why: 'Thông số tối ưu trên dữ liệu quá khứ có thể không hoạt động trong tương lai.', fix: 'Dùng thông số đơn giản, robust. Kiểm tra walk-forward validation.' },
  { mistake: 'Bỏ qua phí', why: 'Bot giao dịch nhiều có thể lỗ ròng chỉ từ phí giao dịch.', fix: 'Tính tác động phí. Nhắm lợi nhuận > 2x phí mỗi giao dịch.' },
  { mistake: 'Không quản lý rủi ro', why: 'Bot có thể tích lũy lỗ mà không có stop-loss.', fix: 'Đặt max drawdown (-20%), giới hạn lỗ hàng ngày, dùng emergency stop.' },
  { mistake: 'Thay đổi chiến lược giữa chừng', why: 'Gián đoạn logic chiến lược, có thể gây lỗ.', fix: 'Để bot chạy đủ chu kỳ (7-30 ngày) trước khi điều chỉnh.' },
  { mistake: 'Dùng kết quả demo như cam kết', why: 'Demo không có slippage, fill tức thì, không lỗi mạng.', fix: 'Kỳ vọng kết quả thực tế kém hơn demo 10-20%.' },
];

export function WebBotGuidePage() {
  const c = useThemeColors();
  const [view, setView] = useState<'strategies' | 'practices' | 'mistakes'>('strategies');
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

  const tabs = [
    { id: 'strategies' as const, label: 'Chiến lược Bot' },
    { id: 'practices' as const, label: 'Best Practices' },
    { id: 'mistakes' as const, label: 'Sai lầm thường gặp' },
  ];

  return (
    <PageLayout>
      <Header title="Hướng dẫn Trading Bots" subtitle="Guide · Trading Bots" back />

      <div style={{ padding: '24px 0 40px' }}>
        {/* Intro banner */}
        <div
          className="flex items-start gap-4"
          style={{
            background: 'rgba(59,130,246,0.06)',
            border: '1.5px solid rgba(59,130,246,0.2)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 24,
          }}
        >
          <BookOpen size={WEB_ICON.xl} color="#3B82F6" className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700, marginBottom: 4 }}>
              Hướng dẫn toàn diện về Trading Bots
            </p>
            <p style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.6, margin: 0 }}>
              Tìm hiểu cách hoạt động của từng chiến lược bot, khi nào nên sử dụng và cách tránh sai lầm phổ biến.
              Phù hợp cho cả người mới và trader có kinh nghiệm.
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div
          className="flex items-center gap-1"
          style={{
            background: c.surface2, borderRadius: 12, padding: 4,
            display: 'inline-flex', marginBottom: 24,
          }}
        >
          {tabs.map(t => {
            const active = view === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className="transition-all"
                style={{
                  padding: '10px 24px', borderRadius: 10,
                  fontSize: WEB_FONT.base, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', border: 'none',
                  background: active ? c.surface : 'transparent',
                  color: active ? c.text1 : c.text3,
                  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ─── Strategies ─── */}
        {view === 'strategies' && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {STRATEGIES.map(strategy => {
              const isExpanded = expandedStrategy === strategy.id;
              const SIcon = strategy.icon;
              return (
                <div
                  key={strategy.id}
                  style={{
                    background: c.surface, border: `1px solid ${isExpanded ? strategy.color + '40' : c.border}`,
                    borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s',
                  }}
                >
                  {/* Card header */}
                  <button
                    onClick={() => setExpandedStrategy(isExpanded ? null : strategy.id)}
                    className="w-full text-left"
                    style={{ padding: '20px 24px', cursor: 'pointer', background: 'none', border: 'none' }}
                  >
                    <div className="flex items-start gap-4" style={{ marginBottom: 12 }}>
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 48, height: 48, borderRadius: 14,
                          background: strategy.color + '15',
                        }}
                      >
                        <SIcon size={WEB_ICON.xl} color={strategy.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3" style={{ marginBottom: 6 }}>
                          <span style={{ color: strategy.color, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                            {strategy.name}
                          </span>
                          <span style={{
                            padding: '4px 10px', borderRadius: 8,
                            fontSize: WEB_FONT.xs, fontWeight: 700,
                            background: strategy.diffColor + '15',
                            color: strategy.diffColor,
                          }}>
                            {strategy.difficulty}
                          </span>
                        </div>
                        <p style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.5, margin: 0 }}>
                          {strategy.description}
                        </p>
                      </div>
                      {isExpanded
                        ? <ChevronUp size={WEB_ICON.md} color={c.text3} className="shrink-0" />
                        : <ChevronDown size={WEB_ICON.md} color={c.text3} className="shrink-0" />
                      }
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ padding: '0 24px 24px' }}>
                      {/* How it works */}
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 10 }}>
                          Cách hoạt động:
                        </p>
                        <ol className="flex flex-col" style={{ gap: 6 }}>
                          {strategy.howItWorks.map((step, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span style={{ color: strategy.color, fontWeight: 700, fontSize: WEB_FONT.sm }}>{idx + 1}.</span>
                              <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Pros / Cons side by side */}
                      <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 16 }}>
                        <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 12, padding: '14px 16px' }}>
                          <p style={{ color: '#10B981', fontSize: WEB_FONT.xs, fontWeight: 700, marginBottom: 8 }}>
                            Ưu điểm
                          </p>
                          <ul className="flex flex-col" style={{ gap: 4 }}>
                            {strategy.pros.map((p, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle size={12} color="#10B981" className="shrink-0 mt-0.5" />
                                <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 12, padding: '14px 16px' }}>
                          <p style={{ color: '#EF4444', fontSize: WEB_FONT.xs, fontWeight: 700, marginBottom: 8 }}>
                            Nhược điểm
                          </p>
                          <ul className="flex flex-col" style={{ gap: 4 }}>
                            {strategy.cons.map((con, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <XCircle size={12} color="#EF4444" className="shrink-0 mt-0.5" />
                                <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Best for + example */}
                      <div className="grid grid-cols-2 gap-3">
                        <div style={{ background: c.surface2, borderRadius: 12, padding: '14px 16px' }}>
                          <p style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                            Phù hợp với
                          </p>
                          <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>{strategy.bestFor}</p>
                        </div>
                        <div style={{ background: strategy.color + '08', border: `1px solid ${strategy.color}25`, borderRadius: 12, padding: '14px 16px' }}>
                          <p style={{ color: strategy.color, fontSize: WEB_FONT.xs, fontWeight: 700, marginBottom: 8 }}>
                            Ví dụ thực tế
                          </p>
                          <div className="flex flex-col" style={{ gap: 4 }}>
                            {Object.entries(strategy.example).map(([k, v]) => (
                              <div key={k} className="flex justify-between">
                                <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{k === 'setup' ? 'Setup' : k === 'duration' ? 'Thời gian' : k === 'result' ? 'Kết quả' : 'Lợi nhuận'}:</span>
                                <span style={{ color: k === 'profit' ? '#10B981' : c.text1, fontSize: WEB_FONT.xs, fontWeight: 600 }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Best Practices ─── */}
        {view === 'practices' && (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {BEST_PRACTICES.map((p, idx) => (
              <div
                key={idx}
                style={{
                  background: c.surface, border: `1px solid ${c.border}`,
                  borderRadius: 16, padding: '24px 20px',
                }}
              >
                <span style={{ fontSize: 36, display: 'block', marginBottom: 14 }}>{p.icon}</span>
                <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 8 }}>
                  {p.title}
                </p>
                <p style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.6, margin: 0 }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ─── Common Mistakes ─── */}
        {view === 'mistakes' && (
          <div className="flex flex-col" style={{ gap: 12 }}>
            {COMMON_MISTAKES.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: c.surface, border: `1px solid ${c.border}`,
                  borderRadius: 16, padding: '20px 24px',
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'rgba(239,68,68,0.08)',
                      fontSize: 18,
                    }}
                  >
                    ❌
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: '#EF4444', fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 6 }}>
                      {item.mistake}
                    </p>
                    <p style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.5, marginBottom: 12 }}>
                      {item.why}
                    </p>
                    <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 10, padding: '12px 14px' }}>
                      <p style={{ color: '#10B981', fontSize: WEB_FONT.xs, fontWeight: 700, marginBottom: 4 }}>
                        Cách khắc phục:
                      </p>
                      <p style={{ color: c.text2, fontSize: WEB_FONT.sm, margin: 0 }}>{item.fix}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video tutorials CTA */}
        <div
          className="flex items-center gap-4"
          style={{
            background: c.surface, border: `1px solid ${c.border}`,
            borderRadius: 16, padding: '20px 24px', marginTop: 28,
          }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: 48, height: 48, borderRadius: 14, background: `${c.primary}12` }}
          >
            <Play size={WEB_ICON.xl} color={c.primary} />
          </div>
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 2 }}>
              Video Tutorials
            </p>
            <p style={{ color: c.text3, fontSize: WEB_FONT.sm, margin: 0 }}>
              Xem hướng dẫn video từng bước để làm chủ mỗi chiến lược bot.
            </p>
          </div>
          <button
            style={{
              height: WEB_BUTTON.md, padding: '0 20px', borderRadius: 10,
              fontSize: WEB_FONT.sm, fontWeight: 600, cursor: 'pointer',
              background: c.primary, border: 'none', color: '#fff',
            }}
          >
            Xem tất cả
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
