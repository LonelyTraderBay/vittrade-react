/**
 * WebBotRiskDisclosurePage — Enterprise Desktop Risk Disclosure
 * 2-column risk cards + compliance footer
 */
import React, { useState } from 'react';
import { browserStorage } from '@/shared/lib/browser-storage';
import {
  AlertTriangle,
  TrendingDown,
  Zap,
  Clock,
  DollarSign,
  Shield,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Header } from '@/shared/ui/layout/Header';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT, WEB_ICON, WEB_BUTTON } from '@/shared/theme/webTokens';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

const RISK_CATEGORIES = [
  {
    id: 'market',
    icon: TrendingDown,
    title: 'Rủi ro biến động thị trường',
    color: '#EF4444',
    description:
      'Thị trường tiền mã hóa cực kỳ biến động và có thể di chuyển nhanh chóng ngược vị thế của bạn.',
    examples: [
      'Bitcoin từng giảm 30% trong một ngày do flash crash',
      'Altcoin có thể mất 50-90% giá trị trong bear market',
      'Tin tức có thể gây biến động 10-20% chỉ trong vài phút',
    ],
    mitigation:
      'Sử dụng stop-loss, đa dạng hóa tài sản, và không bao giờ đầu tư nhiều hơn mức bạn có thể chấp nhận mất.',
  },
  {
    id: 'leverage',
    icon: Zap,
    title: 'Rủi ro Leverage & Martingale',
    color: '#F59E0B',
    description:
      'Chiến lược tăng kích thước vị thế (như Martingale) có thể khuếch đại lỗ theo cấp số nhân.',
    examples: [
      'Martingale cần 10x vốn ban đầu sau 3-4 lần thua liên tiếp',
      'Liquidation có thể xảy ra trước khi phục hồi',
      'Lỗ tích lũy có thể vượt tổng số dư tài khoản',
    ],
    mitigation:
      'Đặt giới hạn kích thước vị thế nghiêm ngặt, dùng hệ số nhân bảo thủ, theo dõi drawdown.',
  },
  {
    id: 'liquidity',
    icon: DollarSign,
    title: 'Rủi ro thanh khoản & Slippage',
    color: '#8B5CF6',
    description: 'Thị trường thanh khoản thấp có thể không thực hiện lệnh ở giá kỳ vọng.',
    examples: [
      'Limit order có thể không fill trong giai đoạn biến động',
      'Market order có thể thực hiện kém 2-5% so với giá hiển thị',
      'Lệnh lớn có thể di chuyển thị trường bất lợi',
    ],
    mitigation:
      'Giao dịch cặp thanh khoản cao (BTC/USDT, ETH/USDT), dùng limit order, chia nhỏ lệnh lớn.',
  },
  {
    id: 'technical',
    icon: AlertTriangle,
    title: 'Rủi ro lỗi kỹ thuật',
    color: '#EF4444',
    description: 'Bug hệ thống, lỗi mạng hoặc sàn downtime có thể gây hành vi bot bất thường.',
    examples: [
      'Lỗi API sàn có thể ngăn bot thực hiện lệnh',
      'Độ trễ mạng gây bỏ lỡ cơ hội hoặc lệnh trùng',
      'Bug phần mềm có thể thực hiện giao dịch ngoài ý muốn',
    ],
    mitigation:
      'Bật cảnh báo emergency stop, theo dõi bot thường xuyên, test chiến lược ở demo trước.',
  },
  {
    id: 'timing',
    icon: Clock,
    title: 'Rủi ro thực hiện & Timing',
    color: '#3B82F6',
    description: 'Độ trễ giữa sinh tín hiệu và thực hiện lệnh có thể giảm lợi nhuận.',
    examples: [
      'Kết quả backtest giả định thực hiện tức thì (không thực tế)',
      'Giao dịch thực tế có độ trễ 0.1-1 giây',
      'Chiến lược tần suất cao nhạy cảm nhất với timing',
    ],
    mitigation: 'Tính đến độ trễ thực hiện trong backtest, tránh over-optimize chiến lược.',
  },
  {
    id: 'regulatory',
    icon: Shield,
    title: 'Rủi ro pháp lý',
    color: '#10B981',
    description: 'Thay đổi quy định có thể ảnh hưởng khả năng giao dịch hoặc truy cập vốn.',
    examples: [
      'Giao dịch tự động có thể bị hạn chế ở một số khu vực',
      'Yêu cầu KYC/AML có thể đóng băng rút tiền',
      'Nghĩa vụ báo cáo thuế áp dụng cho mọi giao dịch bot',
    ],
    mitigation:
      'Đảm bảo tuân thủ luật địa phương, lưu giữ hồ sơ giao dịch chi tiết, tham vấn chuyên gia thuế.',
  },
];

const ADDITIONAL_WARNINGS = [
  {
    title: 'Không đảm bảo lợi nhuận',
    text: 'Bot có thể liên tục thua lỗ. Chiến lược hoạt động trong backtest có thể thất bại trong giao dịch thực.',
  },
  {
    title: 'Phí tích lũy lỗ',
    text: 'Mỗi giao dịch chịu phí sàn (0.1-0.5%). Bot giao dịch nhiều có thể lỗ ròng chỉ từ phí.',
  },
  {
    title: 'Thao túng thị trường',
    text: 'Thị trường crypto ít quy định hơn và dễ bị thao túng, wash trading, pump-and-dump.',
  },
  {
    title: 'Thanh lý tài khoản',
    text: 'Nếu dùng margin/leverage, toàn bộ tài khoản có thể bị thanh lý khi thị trường bất lợi.',
  },
  {
    title: 'Không hoàn trả khi mất vốn',
    text: 'Không như tài chính truyền thống, giao dịch crypto phần lớn không được bảo hiểm.',
  },
];

export function WebBotRiskDisclosurePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [acknowledged, setAcknowledged] = useState(false);

  const handleAcknowledge = () => {
    browserStorage.local.setItem('bot_risk_acknowledged', new Date().toISOString());
    toast.success('Risk disclosure acknowledged');
    navigate(-1);
  };

  return (
    <PageLayout>
      <Header title="Risk Disclosure" subtitle="Công bố rủi ro · Trading Bots" back />

      <div style={{ padding: '24px 0 40px' }}>
        {/* Critical warning banner */}
        <div
          className="flex items-start gap-4"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '2px solid rgba(239,68,68,0.25)',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 24,
          }}
        >
          <AlertTriangle size={WEB_ICON.xl} color="#EF4444" className="shrink-0 mt-0.5" />
          <div>
            <p
              style={{ color: '#EF4444', fontSize: WEB_FONT.lg, fontWeight: 700, marginBottom: 4 }}
            >
              CẢNH BÁO RỦI RO CAO
            </p>
            <p style={{ color: c.text1, fontSize: WEB_FONT.base, lineHeight: 1.7, margin: 0 }}>
              Trading Bots là <strong>sản phẩm tài chính phức tạp</strong> có rủi ro mất vốn đáng
              kể. Bạn có thể mất toàn bộ khoản đầu tư. Chỉ sử dụng vốn bạn có thể chấp nhận mất hoàn
              toàn.
            </p>
          </div>
        </div>

        {/* Past performance disclaimer */}
        <div
          className="flex items-start gap-4"
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 24,
          }}
        >
          <TrendingDown size={WEB_ICON.lg} color={c.text3} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 6 }}>
              Hiệu suất quá khứ
            </p>
            <p style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.6, margin: 0 }}>
              Kết quả backtest và hiệu suất lịch sử <strong>không đảm bảo kết quả tương lai</strong>
              . Điều kiện thị trường thay đổi, chiến lược hoạt động trước đây có thể thất bại. Luôn
              giả định hiệu suất thực tế sẽ kém hơn backtest do slippage, phí và độ trễ thực hiện.
            </p>
          </div>
        </div>

        {/* Risk categories — 2 column */}
        <h3 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700, marginBottom: 16 }}>
          Danh mục rủi ro
        </h3>
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 28 }}
        >
          {RISK_CATEGORIES.map((risk) => {
            const RIcon = risk.icon;
            return (
              <div
                key={risk.id}
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                }}
              >
                {/* Header */}
                <div className="flex items-start gap-3" style={{ marginBottom: 14 }}>
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: risk.color + '12',
                    }}
                  >
                    <RIcon size={WEB_ICON.lg} color={risk.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        color: risk.color,
                        fontSize: WEB_FONT.md,
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      {risk.title}
                    </p>
                    <p
                      style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.6, margin: 0 }}
                    >
                      {risk.description}
                    </p>
                  </div>
                </div>

                {/* Examples */}
                <div style={{ marginBottom: 12 }}>
                  <p
                    style={{
                      color: c.text3,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}
                  >
                    Ví dụ thực tế:
                  </p>
                  <ul className="flex flex-col" style={{ gap: 4 }}>
                    {risk.examples.map((ex, i) => (
                      <li key={i} className="flex gap-2">
                        <span style={{ color: risk.color, fontSize: 8, lineHeight: '20px' }}>
                          ●
                        </span>
                        <span style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                          {ex}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mitigation */}
                <div style={{ background: c.surface2, borderRadius: 10, padding: '12px 14px' }}>
                  <p
                    style={{
                      color: c.text3,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    CÁCH GIẢM THIỂU:
                  </p>
                  <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5, margin: 0 }}>
                    {risk.mitigation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional warnings */}
        <h3 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700, marginBottom: 16 }}>
          Cảnh báo bổ sung
        </h3>
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 28,
          }}
        >
          <div className="flex flex-col" style={{ gap: 16 }}>
            {ADDITIONAL_WARNINGS.map((w, idx) => (
              <div
                key={idx}
                style={{
                  paddingBottom: idx < ADDITIONAL_WARNINGS.length - 1 ? 16 : 0,
                  borderBottom:
                    idx < ADDITIONAL_WARNINGS.length - 1 ? `1px solid ${c.divider}` : 'none',
                }}
              >
                <p
                  style={{
                    color: '#EF4444',
                    fontSize: WEB_FONT.sm,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  ⚠️ {w.title}
                </p>
                <p style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.6, margin: 0 }}>
                  {w.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Regulatory notice */}
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 28,
          }}
        >
          <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 8 }}>
            MiFID II / ESMA / SEC Compliance
          </p>
          <p style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.6, marginBottom: 12 }}>
            Trading Bots được phân loại là <strong>sản phẩm tài chính phức tạp</strong> theo quy
            định EU (MiFID II) và US (SEC). Bạn phải hoàn thành đánh giá phù hợp để đảm bảo bạn hiểu
            rủi ro trước khi sử dụng.
          </p>
          <div className="flex flex-col" style={{ gap: 4 }}>
            {[
              'EU: Chịu giới hạn leverage ESMA và bảo vệ số dư âm',
              'US: Có thể bị hạn chế dựa trên tư cách nhà đầu tư',
              'UK: Yêu cầu đánh giá FCA cho sản phẩm phức tạp',
            ].map((note, i) => (
              <div key={i} className="flex gap-2">
                <span style={{ color: c.text3 }}>•</span>
                <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>{note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Acknowledgment + CTA */}
        <div
          className="flex items-center gap-6"
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 16,
            padding: '20px 24px',
          }}
        >
          <button
            onClick={() => setAcknowledged(!acknowledged)}
            className="flex items-start gap-3 flex-1 text-left"
            style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                marginTop: 1,
                border: `2px solid ${acknowledged ? '#EF4444' : c.border}`,
                background: acknowledged ? '#EF4444' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              {acknowledged && <CheckCircle2 size={16} color="#fff" />}
            </div>
            <div>
              <p
                style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 4 }}
              >
                Tôi xác nhận và chấp nhận tất cả rủi ro đã công bố
              </p>
              <p style={{ color: c.text3, fontSize: WEB_FONT.sm, lineHeight: 1.5, margin: 0 }}>
                Tôi hiểu rằng Trading Bots có rủi ro cao, tôi có thể mất toàn bộ khoản đầu tư, và
                hiệu suất quá khứ không đảm bảo kết quả tương lai.
              </p>
            </div>
          </button>
          <button
            onClick={() => {
              if (acknowledged) handleAcknowledge();
            }}
            disabled={!acknowledged}
            style={{
              height: WEB_BUTTON.lg,
              padding: '0 32px',
              borderRadius: 12,
              fontSize: WEB_FONT.md,
              fontWeight: 700,
              border: 'none',
              cursor: acknowledged ? 'pointer' : 'not-allowed',
              background: acknowledged ? '#EF4444' : c.surface2,
              color: acknowledged ? '#fff' : c.text3,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {acknowledged ? 'Tôi hiểu rủi ro — Tiếp tục' : 'Xác nhận để tiếp tục'}
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
