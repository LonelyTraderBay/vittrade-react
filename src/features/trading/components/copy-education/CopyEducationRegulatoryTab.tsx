import { CheckCircle, Shield } from 'lucide-react';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

export function CopyEducationRegulatoryTab() {
  const c = useThemeColors();
  return (
    <div className="flex flex-col gap-5">
      {/* Regulatory Framework */}
      <TrCard className="p-4">
        <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          Khung pháp lý
        </h3>

        <div className="space-y-3">
          {[
            {
              regulation: 'MiFID II (EU)',
              applies: 'Markets in Financial Instruments Directive',
              requirements: [
                'Appropriateness assessment trước khi copy (Art. 25.3)',
                'Provider phải công khai: compensation, conflicts, performance',
                'Cooling-off period 24-48h cho first-time copiers',
                'Past performance disclaimers bắt buộc',
              ],
            },
            {
              regulation: 'ESMA Guidelines',
              applies: 'European Securities and Markets Authority',
              requirements: [
                'Risk warnings phải rõ ràng, nổi bật',
                'Max Drawdown phải hiển thị cùng ROI',
                'Không được dùng ngôn ngữ hype/FOMO',
                'Investor protection: circuit breakers, position limits',
              ],
            },
            {
              regulation: 'Local Regulations',
              applies: 'Tùy thuộc vào quốc gia',
              requirements: [
                'Một số quốc gia cấm Copy Trading hoàn toàn',
                'KYC/AML requirements khác nhau',
                'Tax reporting obligations',
                'Investor compensation schemes (nếu có)',
              ],
            },
          ].map((item) => (
            <div
              key={item.regulation}
              className="p-3 rounded-xl"
              style={{ background: c.surface2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} color={c.primary} />
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{item.regulation}</p>
              </div>
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>{item.applies}</p>
              <ul className="space-y-1">
                {item.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <div
                      className="w-1 h-1 rounded-full mt-1.5"
                      style={{ background: c.primary }}
                    />
                    <span style={{ color: c.text2, fontSize: 10, lineHeight: 1.4 }}>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </TrCard>

      {/* Your Rights */}
      <TrCard className="p-4">
        <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          Quyền lợi của bạn
        </h3>

        <div className="space-y-2">
          {[
            'Được đánh giá appropriateness trước khi copy',
            'Được cooling-off period để suy nghĩ',
            'Được access đầy đủ performance history và risk metrics',
            'Được biết tất cả conflicts of interest của provider',
            'Được dừng copy bất cứ lúc nào (vị thế đang mở sẽ theo provider)',
            'Được export audit trail cho tax reporting',
            'Được khiếu nại nếu provider vi phạm disclosure obligations',
            'Được investor protection (tùy jurisdictions)',
          ].map((right, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <CheckCircle size={14} color="#10B981" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{right}</p>
            </div>
          ))}
        </div>
      </TrCard>

      {/* Disclaimers */}
      <div
        className="p-4 rounded-2xl"
        style={{ background: c.surface2, border: `1px solid ${c.border}` }}
      >
        <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.6, textAlign: 'center' }}>
          <strong style={{ color: c.text1 }}>Investment Disclaimer:</strong> Copy Trading không phải
          là lời khuyên đầu tư. Provider không phải investment advisor được cấp phép. Hiệu suất quá
          khứ không đảm bảo kết quả tương lai. Bạn có thể mất toàn bộ vốn đầu tư. Chỉ đầu tư số tiền
          bạn có thể chấp nhận mất. Platform không chịu trách nhiệm cho kết quả copy trading của
          bạn.
        </p>
      </div>
    </div>
  );
}
