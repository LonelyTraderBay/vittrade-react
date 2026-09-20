import React, { useState } from 'react';
import { AlertTriangle, TrendingDown, Lock, Code, Building2, Scale, Globe, ChevronRight } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';

interface RiskCategory {
  id: string;
  icon: React.ElementType;
  title: string;
  level: 'low' | 'medium' | 'high';
  description: string;
  details: string[];
  examples: string[];
  mitigation: string[];
}

const RISK_CATEGORIES: RiskCategory[] = [
  {
    id: 'market',
    icon: TrendingDown,
    title: 'Rủi ro Thị trường',
    level: 'high',
    description: 'Giá trị tài sản số có thể biến động mạnh trong kỳ hạn khóa, dẫn đến thua lỗ vốn gốc dù vẫn nhận phần thưởng staking.',
    details: [
      'Giá tài sản số có thể giảm 20-80% trong thời gian ngắn do:',
      '• Tin tức tiêu cực về dự án',
      '• Thay đổi quy định pháp luật',
      '• Sự cố kỹ thuật trên blockchain',
      '• Bán tháo hàng loạt (panic selling)',
      '• Thao túng thị trường (market manipulation)',
      'Trong kỳ hạn khóa (Fixed Staking), bạn KHÔNG thể bán tài sản để cắt lỗ.',
      'Phần thưởng staking (5-20% APY) có thể KHÔNG đủ bù đắp thua lỗ giá (có thể -50% hoặc hơn).',
      'Ví dụ: Bạn stake 1 BTC tại giá $67,000. APY 8%. Sau 90 ngày, BTC giảm xuống $50,000. Bạn nhận 0.02 BTC phần thưởng (~$1,000) nhưng mất $17,000 giá trị gốc. Tổng lỗ: -$16,000.',
    ],
    examples: [
      'Terra (LUNA) sụp đổ từ $80 xuống $0.0001 trong 1 tuần (5/2022)',
      'FTX phá sản khiến FTT giảm từ $25 xuống $1 trong 2 ngày (11/2022)',
      'Bitcoin giảm từ $69,000 xuống $15,500 trong 12 tháng (2022)',
    ],
    mitigation: [
      'Chỉ stake tài sản bạn sẵn sàng giữ dài hạn (hodl)',
      'Phân tán (diversify) qua nhiều tài sản, không all-in một coin',
      'Chọn Flexible Staking thay vì Fixed nếu lo ngại biến động giá',
      'Theo dõi tin tức thị trường thường xuyên',
      'Chấp nhận phí rút sớm nếu thấy rủi ro quá lớn',
    ],
  },
  {
    id: 'liquidity',
    icon: Lock,
    title: 'Rủi ro Thanh khoản',
    level: 'high',
    description: 'Tài sản bị khóa trong kỳ hạn, không thể bán hoặc chuyển đổi ngay lập tức, dẫn đến mất cơ hội đầu tư khác hoặc không thể ứng phó với tình huống khẩn cấp.',
    details: [
      'Fixed Staking: Tài sản bị khóa hoàn toàn trong 30-365 ngày.',
      'Flexible Staking: Có thể rút nhưng cần chờ unbonding period 1-21 ngày.',
      'Trong thời gian khóa, bạn KHÔNG thể:',
      '• Bán tài sản khi giá tăng để chốt lời',
      '• Chuyển tài sản sang sàn khác để arbitrage',
      '• Sử dụng tài sản làm tài sản thế chấp (collateral)',
      '• Rút tiền khẩn cấp cho nhu cầu cá nhân',
      'Rủi ro cơ hội (opportunity cost): Nếu có cơ hội đầu tư tốt hơn xuất hiện, bạn không thể tham gia.',
      'Phí rút sớm có thể rất cao (50-100% phần thưởng), làm mất hết lợi nhuận.',
    ],
    examples: [
      'Bạn stake ETH 90 ngày. Sau 30 ngày, ETH tăng 50%. Bạn muốn chốt lời nhưng không thể.',
      'Bạn stake USDT cố định. Đột nhiên cần tiền khẩn cấp cho y tế nhưng tài sản đang khóa.',
      'Bạn stake SOL. Một sàn mới niêm yết SOL với giá cao hơn 10% nhưng bạn không thể chuyển để bán.',
    ],
    mitigation: [
      'Chỉ stake số tiền dư (surplus fund), không phải tiền cần dùng khẩn cấp',
      'Giữ 20-30% tài sản ở dạng liquid (không staking) để linh hoạt',
      'Chọn Flexible Staking nếu cần thanh khoản cao',
      'Phân chia staking thành nhiều kỳ hạn khác nhau (ladder strategy)',
      'Xem xét Liquid Staking (nhận stToken có thể giao dịch)',
    ],
  },
  {
    id: 'slashing',
    icon: AlertTriangle,
    title: 'Rủi ro Slashing',
    level: 'medium',
    description: 'Validator vi phạm quy tắc mạng (downtime, double signing) sẽ bị phạt, dẫn đến mất một phần tài sản đã staking. Bạn chia sẻ rủi ro này với validator.',
    details: [
      'Slashing là hình phạt tự động do mạng blockchain áp dụng.',
      'Các hành vi bị slashing:',
      '• Double signing: Validator ký 2 block khác nhau tại cùng thời điểm',
      '• Downtime: Validator offline quá 24-48 giờ',
      '• Censorship: Validator cố tình bỏ qua giao dịch hợp lệ',
      '• Malicious attack: Validator tấn công mạng',
      'Mức phạt:',
      '• Downtime: 0.01% - 1% tài sản',
      '• Double signing: 5% - 100% tài sản',
      'Bạn KHÔNG thể ngăn chặn slashing nếu validator vi phạm.',
      'Nền tảng chọn validator uy tín nhưng KHÔNG đảm bảo 100% tránh slashing.',
      'Một số mạng có "jailing" (tạm khóa validator) trước khi slashing, nhưng không phải tất cả.',
    ],
    examples: [
      'Ethereum 2.0: Validator offline 1 tuần bị phạt ~0.5 ETH (~$1,200)',
      'Cosmos: Validator double sign bị phạt 5% tổng stake (~$50,000)',
      'Polkadot: Validator bị hack, phạt toàn bộ stake (~$1M)',
    ],
    mitigation: [
      'Nền tảng chọn validator top-tier với uptime >99.9%',
      'Phân tán tài sản qua nhiều validator (nếu có tính năng)',
      'Theo dõi hiệu suất validator 24/7',
      'Tham gia Slashing Insurance (phí 0.5-1% APY)',
      'Chuyển sang validator khác nếu thấy vấn đề',
    ],
  },
  {
    id: 'smart-contract',
    icon: Code,
    title: 'Rủi ro Smart Contract',
    level: 'high',
    description: 'Đối với DeFi Staking, smart contract có thể có lỗ hổng bảo mật, bị hack, hoặc có bug dẫn đến mất toàn bộ tài sản.',
    details: [
      'Smart contract là code chạy trên blockchain, không thể sửa đổi sau khi deploy.',
      'Rủi ro bảo mật:',
      '• Reentrancy attack: Hacker rút tiền nhiều lần',
      '• Integer overflow: Tính toán sai số học',
      '• Access control bug: Người không có quyền truy cập được fund',
      '• Flash loan attack: Thao túng giá trong 1 transaction',
      'Ngay cả contract đã audit vẫn có thể bị hack (5-10% xác suất).',
      'Nếu contract bị hack, bạn có thể mất 100% tài sản và KHÔNG được hoàn lại.',
      'Một số protocol có insurance fund nhưng không đảm bảo bồi thường đủ.',
      'Rug pull: Developer tạo contract độc hại, rút toàn bộ tiền và biến mất.',
    ],
    examples: [
      'The DAO hack (2016): Mất $60M ETH do reentrancy bug',
      'Poly Network hack (2021): Mất $600M do access control bug',
      'Wormhole hack (2022): Mất $320M do signature verification bug',
      'Mango Markets (2022): Mất $110M do oracle manipulation',
    ],
    mitigation: [
      'Chỉ stake trên protocol đã audit bởi firm uy tín (CertiK, OpenZeppelin)',
      'Kiểm tra TVL (Total Value Locked): Protocol lớn thường an toàn hơn',
      'Đọc audit report trước khi stake',
      'Phân tán qua nhiều protocol, không all-in một pool',
      'Tham gia insurance protocol (Nexus Mutual, InsurAce)',
      'Rút tiền ngay nếu phát hiện bất thường',
    ],
  },
  {
    id: 'counterparty',
    icon: Building2,
    title: 'Rủi ro Đối tác',
    level: 'medium',
    description: 'Nền tảng hoặc validator có thể gặp sự cố kỹ thuật, bị hack, phá sản, hoặc hành động gian lận, dẫn đến mất tài sản.',
    details: [
      'Nền tảng giữ custody (quyền giữ tài sản) của bạn.',
      'Rủi ro từ nền tảng:',
      '• Hack: Hacker xâm nhập hệ thống và rút tài sản',
      '• Inside job: Nhân viên gian lận',
      '• Phá sản: Công ty phá sản, tài sản bị đóng băng',
      '• Exit scam: Công ty đóng cửa đột ngột và chiếm tài sản',
      'Rủi ro từ validator:',
      '• Downtime: Validator offline, không nhận phần thưởng',
      '• Tăng commission: Validator tăng phí hoa hồng đột ngột',
      '• Bỏ trốn: Validator đóng node và biến mất',
      'Bạn KHÔNG có quyền kiểm soát tài sản khi đã stake (non-custodial staking ngoại trừ).',
      'Trong trường hợp phá sản, bạn có thể mất toàn bộ hoặc chỉ nhận lại một phần tài sản.',
    ],
    examples: [
      'Mt. Gox phá sản (2014): User mất 850,000 BTC, mất 8 năm mới nhận lại 20%',
      'QuadrigaCX (2019): CEO chết, mất $190M, user không nhận lại được tiền',
      'Celsius phá sản (2022): Đóng băng rút tiền, user chờ 1 năm+ chưa nhận lại',
      'BlockFi phá sản (2022): User nhận lại ~50-70% tài sản',
    ],
    mitigation: [
      'Kiểm tra độ uy tín nền tảng: License, audit, team public',
      'Chọn nền tảng có bảo hiểm (SAFU fund, insurance coverage)',
      'Không stake toàn bộ tài sản ở một nền tảng (diversify)',
      'Theo dõi tin tức về nền tảng thường xuyên',
      'Rút tiền ngay nếu thấy dấu hiệu bất thường (tạm dừng rút, thay đổi ToS đột ngột)',
    ],
  },
  {
    id: 'regulatory',
    icon: Scale,
    title: 'Rủi ro Pháp lý',
    level: 'medium',
    description: 'Quy định về staking có thể thay đổi, dẫn đến dịch vụ bị cấm, thuế tăng, hoặc tài sản bị đóng băng.',
    details: [
      'Staking chưa có khung pháp lý rõ ràng ở nhiều quốc gia.',
      'Rủi ro pháp lý:',
      '• Cấm staking: Chính phủ cấm hoàn toàn dịch vụ',
      '• Yêu cầu license: Nền tảng phải có giấy phép mới hoạt động',
      '• Thuế tăng: Phần thưởng staking bị đánh thuế cao (30-50%)',
      '• AML/KYC nghiêm: Yêu cầu xác thực danh tính phức tạp',
      '• Đóng băng tài sản: Cơ quan pháp luật yêu cầu đóng băng tài khoản',
      'Nếu dịch vụ bị cấm, nền tảng có thể:',
      '• Ngừng cung cấp dịch vụ tại quốc gia đó',
      '• Yêu cầu user rút toàn bộ tài sản trong thời hạn ngắn',
      '• Trong trường hợp xấu nhất, tài sản có thể bị tịch thu',
    ],
    examples: [
      'Trung Quốc cấm staking (2021): User Trung Quốc phải rút tiền trong 30 ngày',
      'SEC Hoa Kỳ điều tra Kraken (2023): Kraken phải đóng dịch vụ staking tại US',
      'EU MiCA regulation (2024): Yêu cầu license, nhiều nền tảng rút khỏi EU',
    ],
    mitigation: [
      'Theo dõi tin tức pháp lý tại quốc gia bạn',
      'Khai báo thuế đầy đủ để tránh rủi ro pháp lý',
      'Chọn nền tảng có license/đăng ký hợp pháp',
      'Sẵn sàng rút tiền nếu có dấu hiệu cấm',
      'Tham khảo luật sư crypto nếu stake số lượng lớn',
    ],
  },
  {
    id: 'technical',
    icon: Globe,
    title: 'Rủi ro Kỹ thuật',
    level: 'low',
    description: 'Sự cố kỹ thuật trên blockchain hoặc nền tảng có thể dẫn đến mất phần thưởng, delay rút tiền, hoặc dữ liệu sai.',
    details: [
      'Rủi ro từ blockchain:',
      '• Hard fork: Blockchain tách thành 2 chain, gây rối loạn',
      '• Network congestion: Mạng quá tải, giao dịch bị trễ',
      '• Consensus bug: Lỗi trong cơ chế đồng thuận',
      '• 51% attack: Một nhóm kiểm soát >50% hashrate/stake',
      'Rủi ro từ nền tảng:',
      '• Downtime: Server sập, không thể truy cập tài khoản',
      '• Data loss: Mất dữ liệu giao dịch',
      '• UI bug: Hiển thị số liệu sai',
      '• API error: Không rút được tiền do lỗi kỹ thuật',
      'Các sự cố kỹ thuật thường được khắc phục trong 24-72 giờ.',
      'Trong thời gian sự cố, bạn có thể không rút được tiền hoặc không nhận được phần thưởng.',
    ],
    examples: [
      'Ethereum hard fork (2016): Tách thành ETH và ETC',
      'Solana downtime (2021-2022): Offline 17+ lần, mỗi lần 4-18 giờ',
      'Binance API outage (2020): User không rút được tiền trong 6 giờ',
    ],
    mitigation: [
      'Nền tảng có disaster recovery plan',
      'Backup data thường xuyên',
      'Theo dõi status page của blockchain',
      'Kiên nhẫn chờ khắc phục sự cố',
      'Contact support nếu vấn đề kéo dài >24 giờ',
    ],
  },
];

const RISK_LEVELS = {
  low: { label: 'Thấp', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  medium: { label: 'Trung bình', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  high: { label: 'Cao', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

export function StakingRiskDisclosurePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<'overview' | 'categories' | 'assessment'>('overview');
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);

  return (
    <PageLayout>
      <Header title="Công bố Rủi ro" back />

      <PageContent>
        {/* Warning Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
          <div className="flex gap-3">
            <AlertTriangle size={24} color="#EF4444" className="shrink-0" />
            <div>
              <p style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                Cảnh báo Rủi ro Quan trọng
              </p>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6 }}>
                Staking tài sản số có rủi ro mất vốn. Phần thưởng không được đảm bảo. Chỉ stake số tiền bạn có thể chấp nhận mất. Đọc kỹ các rủi ro dưới đây trước khi tham gia.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'overview', label: 'Tổng quan' },
            { id: 'categories', label: 'Các loại rủi ro' },
            { id: 'assessment', label: 'Đánh giá' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {tab === 'overview' && (
          <>
            <PageSection label="Tóm tắt Rủi ro">
              <TrCard className="p-4">
                <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
                  Staking là hoạt động khóa tài sản số để tham gia vào mạng blockchain và nhận phần thưởng. Mặc dù có lợi nhuận tiềm năng, staking đi kèm với nhiều rủi ro có thể dẫn đến mất một phần hoặc toàn bộ tài sản.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(RISK_LEVELS).map(([level, config]) => {
                    const count = RISK_CATEGORIES.filter(r => r.level === level).length;
                    return (
                      <div key={level} className="rounded-xl p-3 text-center"
                        style={{ background: config.bg, border: `1px solid ${config.color}33` }}>
                        <p style={{ color: config.color, fontSize: 20, fontWeight: 700 }}>{count}</p>
                        <p style={{ color: c.text3, fontSize: 10 }}>Rủi ro {config.label}</p>
                      </div>
                    );
                  })}
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="Rủi ro theo Sản phẩm">
              {[
                { name: 'Staking Linh hoạt', risks: ['market', 'liquidity', 'counterparty'], riskLevel: 'medium' as const },
                { name: 'Staking Cố định', risks: ['market', 'liquidity', 'slashing', 'counterparty'], riskLevel: 'high' as const },
                { name: 'DeFi Staking', risks: ['market', 'liquidity', 'smart-contract', 'counterparty'], riskLevel: 'high' as const },
              ].map(product => (
                <TrCard key={product.name} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{product.name}</span>
                    <span className="px-2 py-1 rounded-lg text-xs font-bold"
                      style={{ background: RISK_LEVELS[product.riskLevel].bg, color: RISK_LEVELS[product.riskLevel].color }}>
                      Rủi ro {RISK_LEVELS[product.riskLevel].label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {product.risks.map(riskId => {
                      const risk = RISK_CATEGORIES.find(r => r.id === riskId);
                      if (!risk) return null;
                      return (
                        <span key={riskId} className="px-2 py-1 rounded-lg text-xs"
                          style={{ background: c.surface2, color: c.text2 }}>
                          {risk.title}
                        </span>
                      );
                    })}
                  </div>
                </TrCard>
              ))}
            </PageSection>

            <TrCard className="p-4">
              <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.6, textAlign: 'center' }}>
                Nền tảng KHÔNG đảm bảo lợi nhuận, bảo toàn vốn, hoặc thanh khoản. Bạn chịu hoàn toàn rủi ro khi tham gia staking. Vui lòng đọc kỹ từng loại rủi ro trong tab "Các loại rủi ro".
              </p>
            </TrCard>
          </>
        )}

        {tab === 'categories' && (
          <div className="flex flex-col gap-3">
            {RISK_CATEGORIES.map(risk => {
              const Icon = risk.icon;
              const config = RISK_LEVELS[risk.level];
              const isExpanded = expandedRisk === risk.id;
              return (
                <TrCard key={risk.id} className="overflow-hidden">
                  <button
                    onClick={() => setExpandedRisk(isExpanded ? null : risk.id)}
                    className="w-full p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: config.bg, border: `1.5px solid ${config.color}33` }}>
                        <Icon size={20} color={config.color} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{risk.title}</span>
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                            style={{ background: config.bg, color: config.color }}>
                            {config.label}
                          </span>
                        </div>
                        <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                          {risk.description}
                        </p>
                      </div>
                      <ChevronRight
                        size={20}
                        color={c.text3}
                        style={{
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    </div>
                  </button>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateRows: isExpanded ? '1fr' : '0fr',
                      transition: 'grid-template-rows 0.3s ease',
                      overflow: 'hidden',
                    }}>
                    <div style={{ minHeight: 0 }}>
                      <div className="px-4 pb-4" style={{ borderTop: `1px solid ${c.divider}`, paddingTop: 16 }}>
                        <div className="mb-4">
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Chi tiết:</p>
                          {risk.details.map((detail, idx) => (
                            <p key={idx} style={{
                              color: c.text2,
                              fontSize: 12,
                              lineHeight: 1.6,
                              marginBottom: detail.startsWith('•') ? 2 : 8,
                              paddingLeft: detail.startsWith('•') ? 12 : 0,
                            }}>
                              {detail}
                            </p>
                          ))}
                        </div>

                        <div className="mb-4">
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Ví dụ thực tế:</p>
                          {risk.examples.map((example, idx) => (
                            <div key={idx} className="rounded-lg p-2 mb-2" style={{ background: 'rgba(239,68,68,0.06)' }}>
                              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>• {example}</p>
                            </div>
                          ))}
                        </div>

                        <div>
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Cách giảm thiểu:</p>
                          {risk.mitigation.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2 mb-2">
                              <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: '#10B981' }} />
                              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        )}

        {tab === 'assessment' && (
          <>
            <TrCard className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
                  <Scale size={24} color="#3B82F6" />
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                    Đánh giá Rủi ro Cá nhân
                  </p>
                  <p style={{ color: c.text3, fontSize: 12 }}>
                    Xác định mức rủi ro phù hợp với bạn
                  </p>
                </div>
              </div>
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                Trước khi stake, bạn nên đánh giá khả năng chấp nhận rủi ro của mình. Làm bài quiz ngắn để nhận gợi ý sản phẩm phù hợp.
              </p>
              <button
                onClick={() => navigate(`${prefix}/earn/risk-assessment`)}
                className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                style={{ background: c.primary, color: '#FFF' }}>
                Bắt đầu đánh giá rủi ro
                <ChevronRight size={18} />
              </button>
            </TrCard>

            <PageSection label="Câu hỏi thường gặp">
              {[
                {
                  q: 'Tôi có thể mất hết tiền khi stake không?',
                  a: 'Có. Trong trường hợp xấu nhất (ví dụ: smart contract bị hack, nền tảng phá sản, hoặc validator bị slashing 100%), bạn có thể mất toàn bộ tài sản. Tuy nhiên, xác suất này thường <5% nếu bạn chọn nền tảng uy tín.'
                },
                {
                  q: 'APY có được đảm bảo không?',
                  a: 'Fixed Staking: APY được đảm bảo tại thời điểm đăng ký. Flexible/DeFi Staking: APY có thể thay đổi hàng ngày dựa trên điều kiện thị trường.'
                },
                {
                  q: 'Nếu tôi rút sớm thì sao?',
                  a: 'Fixed Staking: Bạn sẽ mất 50-100% phần thưởng đã tích lũy. Flexible Staking: Rút bất kỳ lúc nào nhưng cần chờ unbonding 1-21 ngày.'
                },
                {
                  q: 'Có bảo hiểm nào không?',
                  a: 'Một số sản phẩm có Slashing Insurance (bồi thường tối đa 50% thiệt hại) với phí 0.5-1% APY. DeFi pools có thể tham gia insurance protocol như Nexus Mutual.'
                },
              ].map((item, idx) => (
                <TrCard key={idx} className="p-4">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    {item.q}
                  </p>
                  <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                    {item.a}
                  </p>
                </TrCard>
              ))}
            </PageSection>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}
