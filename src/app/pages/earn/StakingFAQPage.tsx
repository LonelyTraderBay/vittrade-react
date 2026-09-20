import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Search } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

interface FAQ {
  id: string;
  category: 'general' | 'technical' | 'fees' | 'risks' | 'advanced';
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  // General
  {
    id: 'g1',
    category: 'general',
    question: 'Staking là gì và hoạt động như thế nào?',
    answer: 'Staking là quá trình "khóa" cryptocurrency của bạn để hỗ trợ hoạt động của mạng blockchain (xác thực giao dịch, bảo mật mạng) và nhận phần thưởng. Bạn vẫn sở hữu 100% crypto đã stake, chỉ tạm thời không thể giao dịch trong thời gian stake.',
  },
  {
    id: 'g2',
    category: 'general',
    question: 'Tôi có mất quyền sở hữu crypto khi stake không?',
    answer: 'KHÔNG. Bạn vẫn 100% sở hữu crypto đã stake. Chúng tôi chỉ khóa tạm thời để phục vụ mạng blockchain. Bạn có thể rút bất kỳ lúc nào (Flexible) hoặc sau thời gian khóa (Fixed).',
  },
  {
    id: 'g3',
    category: 'general',
    question: 'Phần thưởng được tính như thế nào?',
    answer: 'Phần thưởng tính theo công thức: (Số lượng stake × APY%) / 365 ngày. Ví dụ: Stake 1 ETH với APY 5% = (1 × 5%) / 365 = 0.000137 ETH/ngày. Phần thưởng được phân phối tự động hàng ngày vào ví staking của bạn.',
  },
  {
    id: 'g4',
    category: 'general',
    question: 'Khác biệt giữa Flexible và Fixed?',
    answer: 'Flexible: Rút bất kỳ lúc nào, APY thấp hơn (4-6%). Fixed: Khóa 30-90 ngày, APY cao hơn (6-10%), không rút sớm được (hoặc mất phí). DeFi: Thanh khoản pool, APY cao nhất (10-25%) nhưng rủi ro smart contract.',
  },
  {
    id: 'g5',
    category: 'general',
    question: 'Tôi cần bao nhiêu để bắt đầu stake?',
    answer: 'Không có số lượng tối thiểu chính thức, nhưng chúng tôi khuyến nghị tối thiểu $100 để đảm bảo phần thưởng vượt phí giao dịch. Beginner nên bắt đầu với $100-500 ở Flexible để làm quen.',
  },

  // Technical
  {
    id: 't1',
    category: 'technical',
    question: 'Unbonding period là gì?',
    answer: 'Unbonding period là thời gian chờ từ khi bạn yêu cầu rút đến khi nhận tiền về ví. Fixed staking thường có unbonding 7-14 ngày (tùy blockchain). Trong thời gian này, bạn KHÔNG nhận phần thưởng.',
  },
  {
    id: 't2',
    category: 'technical',
    question: 'Validator là gì? Tôi có cần chọn validator không?',
    answer: 'Validator là node vận hành blockchain (xác thực giao dịch). Mặc định, chúng tôi tự động phân phối qua nhiều validator uy tín. Bạn có thể tự chọn validator (tính năng nâng cao) để tối ưu APY hoặc hỗ trợ validator yêu thích.',
  },
  {
    id: 't3',
    category: 'technical',
    question: 'Auto-compound hoạt động như thế nào?',
    answer: 'Auto-compound tự động thêm phần thưởng vào số lượng stake để tạo lãi kép. Ví dụ: Stake 100 ETH, nhận 0.1 ETH/tháng → Auto-compound sẽ stake thêm 0.1 ETH đó để tháng sau nhận rewards từ 100.1 ETH. APY thực tế cao hơn 5-10% so với không compound.',
  },
  {
    id: 't4',
    category: 'technical',
    question: 'Liquid staking (stETH, rETH) khác gì staking thường?',
    answer: 'Liquid staking cho bạn token đại diện (stETH = staked ETH) ngay khi stake, có thể giao dịch tự do. Staking thường khóa crypto hoàn toàn. Trade-off: Liquid staking có rủi ro depegging (stETH có thể ≠ ETH) và phí swap khi đổi về.',
  },

  // Fees
  {
    id: 'f1',
    category: 'fees',
    question: 'Có phí gì khi stake không?',
    answer: 'Không có phí stake ban đầu. Phí duy nhất là commission của validator (5-10% từ phần thưởng, KHÔNG từ vốn gốc). Ví dụ: Nhận 100 USDT rewards, validator lấy 8 USDT commission, bạn nhận 92 USDT.',
  },
  {
    id: 'f2',
    category: 'fees',
    question: 'Có phí rút không?',
    answer: 'Flexible: KHÔNG phí rút. Fixed: Rút đúng hạn = KHÔNG phí. Rút sớm (early withdrawal) = mất 1-5% số lượng stake hoặc mất toàn bộ phần thưởng tích lũy. Luôn đọc kỹ điều khoản trước khi stake Fixed.',
  },
  {
    id: 'f3',
    category: 'fees',
    question: 'Gas fee có ảnh hưởng không?',
    answer: 'Gas fee chỉ ảnh hưởng khi bạn stake/unstake (1 lần), KHÔNG ảnh hưởng phần thưởng hàng ngày. Nên stake khi gas thấp (&lt;20 gwei). Auto-compound có gas optimization để chỉ compound khi gas thấp.',
  },

  // Risks
  {
    id: 'r1',
    category: 'risks',
    question: 'Slashing là gì? Tôi có thể mất tiền không?',
    answer: 'Slashing là hình phạt khi validator vi phạm quy tắc mạng (downtime quá lâu, double-sign). Bạn có thể mất 0.01-5% số lượng stake. Rủi ro rất thấp nếu chọn validator uy tín (Top Tier). Nên mua insurance cho số lượng &gt;$50,000.',
  },
  {
    id: 'r2',
    category: 'risks',
    question: 'Insurance bồi thường những gì?',
    answer: 'Insurance bồi thường 25-75% thiệt hại từ: Slashing penalty, Validator downtime loss, Smart contract bug. KHÔNG bồi thường: Market risk (giá crypto giảm), Phí rút sớm tự nguyện, Mất mật khẩu/private key.',
  },
  {
    id: 'r3',
    category: 'risks',
    question: 'Nếu giá crypto giảm, tôi có mất tiền không?',
    answer: 'Số lượng crypto stake của bạn KHÔNG đổi (vẫn nhận phần thưởng bình thường). Nhưng giá trị USD giảm theo giá thị trường. Đây là market risk, không phải rủi ro staking. Nếu lo ngại, stake stablecoin (USDT, USDC) có APY 6-8%.',
  },
  {
    id: 'r4',
    category: 'risks',
    question: 'Làm sao để giảm rủi ro?',
    answer: 'Chiến lược 3 tầng: (1) Chọn validator Top Tier/Recommended, (2) Đa dạng hóa: 50% Flexible + 30% Fixed + 20% DeFi, (3) Mua insurance cho số lượng lớn. Không stake quá 50% tổng tài sản crypto.',
  },

  // Advanced
  {
    id: 'a1',
    category: 'advanced',
    question: 'MEV (Maximal Extractable Value) là gì?',
    answer: 'MEV là lợi nhuận thêm mà validator có thể kiếm từ việc sắp xếp giao dịch trong block. Một số validator chia MEV với stakers (tăng APY 0.5-1%). Tính năng MEV Protection đảm bảo validator không lạm dụng MEV để gây thiệt hại cho user.',
  },
  {
    id: 'a2',
    category: 'advanced',
    question: 'Tôi có thể chuyển stake sang validator khác không?',
    answer: 'CÓ, nhưng phải unstake (chờ unbonding 7-14 ngày) rồi stake lại với validator mới. Trong thời gian này, bạn mất phần thưởng. Nên cân nhắc kỹ trước khi chuyển, trừ khi validator hiện tại có vấn đề nghiêm trọng (uptime &lt;99%).',
  },
  {
    id: 'a3',
    category: 'advanced',
    question: 'Có thể dùng staking để vay/cho vay DeFi không?',
    answer: 'CÓ, nếu dùng liquid staking token (stETH, rETH). Bạn có thể dùng chúng làm collateral ở Aave, Compound để vay tiền, hoặc farm thêm APY ở Curve, Uniswap. Nhưng rủi ro cao hơn (liquidation risk, smart contract risk).',
  },
  {
    id: 'a4',
    category: 'advanced',
    question: 'APY thay đổi có ảnh hưởng vị thế hiện tại không?',
    answer: 'Flexible: APY thay đổi áp dụng NGAY LẬP TỨC. Fixed: APY cố định theo lúc stake, KHÔNG bị ảnh hưởng khi market thay đổi. Đây là lý do Fixed APY thấp hơn market (đổi lấy sự ổn định). Bạn sẽ nhận notification 24h trước khi APY thay đổi.',
  },
];

export function StakingFAQPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'general' | 'technical' | 'fees' | 'risks' | 'advanced'>('general');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = FAQS.filter(faq => {
    const matchCategory = faq.category === tab;
    const matchSearch = !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <PageLayout>
      <Header title="FAQ" back />

      <PageContent>
        {/* Search */}
        <div className="flex items-center gap-2 px-4 rounded-xl" style={{ background: c.surface2, height: 44 }}>
          <Search size={18} color={c.text3} />
          <input
            type="text"
            placeholder="Tìm câu hỏi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ color: c.text1, fontSize: 14 }}
          />
        </div>

        {/* Category Tabs */}
        <TabBar
          tabs={[
            { id: 'general', label: 'Cơ bản' },
            { id: 'technical', label: 'Kỹ thuật' },
            { id: 'fees', label: 'Phí' },
            { id: 'risks', label: 'Rủi ro' },
            { id: 'advanced', label: 'Nâng cao' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {/* Results */}
        {searchQuery && (
          <div>
            <p style={{ color: c.text2, fontSize: 13 }}>
              Tìm thấy {filtered.length} kết quả
            </p>
          </div>
        )}

        {/* FAQ List */}
        <PageSection label="">
          {filtered.length === 0 ? (
            <TrCard className="p-8">
              <div className="flex flex-col items-center gap-3">
                <HelpCircle size={48} color={c.text3} />
                <p style={{ color: c.text3, fontSize: 14, textAlign: 'center' }}>
                  Không tìm thấy câu hỏi phù hợp
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: c.primary, color: '#FFF' }}>
                  Xóa tìm kiếm
                </button>
              </div>
            </TrCard>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map(faq => (
                <TrCard key={faq.id} className="overflow-hidden">
                  <button
                    onClick={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                    className="w-full p-4 flex items-start gap-3 text-left">
                    <HelpCircle size={18} color="#3B82F6" className="shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, lineHeight: 1.5 }}>
                        {faq.question}
                      </p>
                    </div>
                    <ChevronDown
                      size={20}
                      color={c.text3}
                      className="shrink-0 transition-transform"
                      style={{
                        transform: openFAQ === faq.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>
                  <div
                    className="grid transition-all"
                    style={{
                      gridTemplateRows: openFAQ === faq.id ? '1fr' : '0fr',
                    }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div className="px-4 pb-4 pl-11">
                        <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7 }}>
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          )}
        </PageSection>

        {/* Contact Support */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
            Không tìm thấy câu trả lời?
          </p>
          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
            Liên hệ đội ngũ support 24/7. Thời gian phản hồi trung bình: &lt;2 giờ.
          </p>
          <div className="flex gap-2">
            <button
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: c.primary, color: '#FFF' }}>
              Live Chat
            </button>
            <button
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: c.surface2, color: c.text1 }}>
              Email Support
            </button>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
