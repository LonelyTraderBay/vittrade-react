import { CheckCircle } from 'lucide-react';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

export function CopyEducationMistakesTab() {
  const c = useThemeColors();
  return (
    <div className="flex flex-col gap-5">
      {/* Common Mistakes */}
      <TrCard className="p-4">
        <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          10 sai lầm phổ biến
        </h3>

        <div className="space-y-3">
          {[
            {
              mistake: 'Chỉ nhìn ROI, không nhìn Max Drawdown',
              why: 'Provider có ROI 200% nhưng Max DD 60% = bạn có thể mất 60% vốn trước khi phục hồi.',
              fix: 'Chọn provider có Max DD <25%, Win Rate >55%, Sharpe Ratio >1.5',
              severity: 'critical',
            },
            {
              mistake: 'Copy 100% vốn vào 1 provider',
              why: 'Nếu provider đột nhiên thay đổi chiến lược hoặc có string of losses, bạn mất tất cả.',
              fix: 'Không copy quá 20% vốn cho 1 provider. Chia đều cho 3-5 providers.',
              severity: 'critical',
            },
            {
              mistake: 'Không đặt stop-loss riêng',
              why: 'Provider có thể chấp nhận DD 50%, nhưng bạn chỉ chấp nhận 15%. Dùng stop của provider = risk không match.',
              fix: 'Đặt stop-loss chặt hơn provider nếu risk tolerance thấp',
              severity: 'high',
            },
            {
              mistake: 'Copy provider mới (<3 tháng track record)',
              why: 'Track record ngắn có thể do may mắn hoặc demo account. Chưa qua thị trường xấu.',
              fix: 'Chỉ copy provider có >6 tháng verified track record',
              severity: 'high',
            },
            {
              mistake: 'Không theo dõi, để "auto-pilot"',
              why: 'Provider có thể thay đổi chiến lược, tăng leverage, hoặc gặp vấn đề. Bạn không biết cho đến khi quá muộn.',
              fix: 'Check portfolio ít nhất 2-3 lần/tuần, set alert cho DD >10%',
              severity: 'medium',
            },
            {
              mistake: 'Dừng copy ngay khi lỗ',
              why: 'Copy Trading cần thời gian. Dừng ngay khi lỗ 5-10% = bạn chỉ chịu loss, không hưởng recovery.',
              fix: 'Commit ít nhất 1-3 tháng, trừ khi provider vi phạm risk limits',
              severity: 'medium',
            },
            {
              mistake: 'Copy nhiều provider cùng strategy',
              why: 'Copy 5 providers đều scalping BTC/USDT = không diversify, risk vẫn tập trung.',
              fix: 'Diversify cả strategy (scalping/swing/arbitrage) và assets (BTC/ETH/alts)',
              severity: 'medium',
            },
            {
              mistake: 'Không đọc conflict of interest disclosure',
              why: 'Provider có thể nhận spread rebate, trade cho chính mình trước followers, hoặc có lợi ích khác.',
              fix: 'Đọc kỹ disclosure, tránh provider có conflict chưa công khai',
              severity: 'medium',
            },
            {
              mistake: 'Copy trong thị trường sideways/low volatility',
              why: 'Provider scalper cần volatility để lời. Thị trường sideways → nhiều trades, ít lời, phí cao.',
              fix: 'Chọn provider phù hợp với điều kiện thị trường hiện tại',
              severity: 'low',
            },
            {
              mistake: 'Quên tính thuế',
              why: 'Copy trading generate rất nhiều trades → nhiều taxable events. Có thể nợ thuế dù tổng thể lỗ.',
              fix: 'Consult tax advisor, export audit trail để khai thuế đúng',
              severity: 'low',
            },
          ].map((item, idx) => {
            const severityColor =
              item.severity === 'critical'
                ? '#EF4444'
                : item.severity === 'high'
                  ? '#F59E0B'
                  : '#6B7280';
            return (
              <div
                key={idx}
                className="p-3 rounded-xl"
                style={{ background: c.surface2, border: `1px solid ${c.border}` }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className="shrink-0 mt-0.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: severityColor + '22' }}
                    >
                      <span style={{ color: severityColor, fontSize: 10, fontWeight: 700 }}>
                        {idx + 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p
                      style={{
                        color: c.text1,
                        fontSize: 12,
                        fontWeight: 600,
                        marginBottom: 1,
                      }}
                    >
                      {item.mistake}
                    </p>
                    <p
                      style={{
                        color: c.text3,
                        fontSize: 10,
                        lineHeight: 1.4,
                        marginBottom: 2,
                      }}
                    >
                      <strong style={{ color: c.text2 }}>Tại sao sai:</strong> {item.why}
                    </p>
                    <div className="flex items-start gap-1">
                      <CheckCircle size={10} color="#10B981" className="shrink-0 mt-0.5" />
                      <p style={{ color: '#10B981', fontSize: 10, lineHeight: 1.4 }}>
                        <strong>Cách fix:</strong> {item.fix}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </TrCard>
    </div>
  );
}
