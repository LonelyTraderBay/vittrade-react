import {
  Activity,
  CheckCircle,
  Clock,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

export function CopyEducationHowItWorksTab() {
  const c = useThemeColors();
  return (
    <div className="flex flex-col gap-5">
      {/* How it Works */}
      <TrCard className="p-4">
        <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          Copy Trading hoạt động như thế nào?
        </h3>

        <div className="space-y-4">
          {[
            {
              step: 1,
              icon: Users,
              title: 'Chọn provider',
              desc: 'Bạn chọn một provider (trader) dựa trên hiệu suất, chiến lược và risk level. Provider phải được xác minh và công khai thông tin.',
              color: c.primary,
            },
            {
              step: 2,
              icon: Target,
              title: 'Cấu hình sao chép',
              desc: 'Bạn chọn số tiền copy, tỷ lệ sao chép (vd: 50% = provider mở $1000, bạn mở $500), và các giới hạn rủi ro (stop-loss, take-profit).',
              color: c.primary,
            },
            {
              step: 3,
              icon: Zap,
              title: 'Sao chép tự động',
              desc: 'Khi provider mở/đóng lệnh, hệ thống tự động sao chép vào tài khoản của bạn trong vòng 0.5-3 giây. Giá có thể khác nhau (slippage).',
              color: c.primary,
            },
            {
              step: 4,
              icon: Activity,
              title: 'Theo dõi & điều chỉnh',
              desc: 'Bạn có thể xem real-time P/L, tắt copy bất cứ lúc nào, hoặc điều chỉnh cấu hình. Các vị thế đang mở vẫn theo provider cho đến khi đóng.',
              color: c.primary,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="flex gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: item.color + '15' }}
                >
                  <span style={{ color: item.color, fontSize: 14, fontWeight: 700 }}>
                    {item.step}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} color={c.text1} />
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{item.title}</p>
                  </div>
                  <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </TrCard>

      {/* Copy Modes */}
      <TrCard className="p-4">
        <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          Các chế độ sao chép
        </h3>

        <div className="space-y-3">
          {[
            {
              mode: 'Mirror Copy',
              desc: 'Sao chép chính xác tỷ lệ vị thế. Provider mở 10% portfolio, bạn cũng mở 10%.',
              pros: 'Đơn giản, rủi ro tương tự provider',
              cons: 'Không linh hoạt, phụ thuộc hoàn toàn vào provider',
              color: '#3B82F6',
            },
            {
              mode: 'Fixed Ratio',
              desc: 'Bạn đặt tỷ lệ cố định (vd: 50%). Provider mở $1000, bạn mở $500.',
              pros: 'Kiểm soát vốn tốt hơn, dễ tính toán',
              cons: 'Vẫn phụ thuộc vào timing của provider',
              color: '#10B981',
            },
            {
              mode: 'Smart Copy',
              desc: 'Hệ thống điều chỉnh size dựa trên volatility và risk của từng trade.',
              pros: 'Tối ưu risk-adjusted returns',
              cons: 'Phức tạp hơn, kết quả khác xa provider',
              color: '#F59E0B',
            },
          ].map((item) => (
            <div
              key={item.mode}
              className="p-3 rounded-xl"
              style={{ background: c.surface2, border: `1px solid ${c.border}` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{item.mode}</p>
              </div>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.4, marginBottom: 2 }}>
                {item.desc}
              </p>
              <div className="flex gap-4 mt-2">
                <div className="flex items-start gap-1">
                  <CheckCircle size={10} color="#10B981" className="mt-0.5" />
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.3 }}>{item.pros}</p>
                </div>
                <div className="flex items-start gap-1">
                  <XCircle size={10} color="#EF4444" className="mt-0.5" />
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.3 }}>{item.cons}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </TrCard>

      {/* Key Concepts */}
      <TrCard className="p-4">
        <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          Khái niệm quan trọng
        </h3>

        <div className="space-y-2">
          {[
            {
              term: 'Slippage',
              def: 'Chênh lệch giá giữa lệnh của provider và lệnh của bạn. Thường 0.05-0.2%. Trong thị trường biến động mạnh có thể lên 0.5-1%.',
              icon: TrendingDown,
            },
            {
              term: 'High-Water Mark',
              def: 'Provider chỉ nhận performance fee trên profit mới (vượt đỉnh cũ). Nếu tài khoản $10k → $12k → $11k → $13k, fee chỉ tính trên $1k cuối.',
              icon: TrendingUp,
            },
            {
              term: 'Position Sizing',
              def: 'Cách tính kích thước vị thế sao chép. Mirror = tỷ lệ %, Fixed = số tiền cố định, Smart = dynamic dựa trên risk.',
              icon: Target,
            },
            {
              term: 'Execution Delay',
              def: 'Thời gian từ khi provider mở lệnh đến khi lệnh của bạn execute. Thường 0.5-3 giây. Delay cao → slippage cao.',
              icon: Clock,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.term} className="flex gap-2">
                <Icon size={14} color={c.primary} className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{item.term}</p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>{item.def}</p>
                </div>
              </div>
            );
          })}
        </div>
      </TrCard>
    </div>
  );
}
