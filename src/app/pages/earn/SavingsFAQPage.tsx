import React, { useState, useMemo } from 'react';
import {
  HelpCircle, ChevronDown, Search, MessageCircle, Shield,
  X, ThumbsUp, ThumbsDown, ExternalLink,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════
   FAQ Data
   ═══════════════════════════════════════════════════════════ */
type FAQCategory = 'general' | 'products' | 'operations' | 'fees' | 'risks';

interface FAQ {
  id: string;
  category: FAQCategory;
  question: string;
  answer: string;
}

const CATEGORY_CONFIG: Record<FAQCategory, { label: string; color: string; bg: string }> = {
  general: { label: 'Tổng quan', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  products: { label: 'Sản phẩm', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  operations: { label: 'Thao tác', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  fees: { label: 'Phí & Lãi', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  risks: { label: 'Rủi ro', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

const FAQS: FAQ[] = [
  // General
  {
    id: 'g1', category: 'general',
    question: 'Tiết kiệm Crypto là gì?',
    answer: 'Tiết kiệm Crypto cho phép bạn gửi tài sản kỹ thuật số (USDT, BTC, ETH, SOL...) vào các sản phẩm tiết kiệm để nhận lãi suất hàng ngày. Tài sản của bạn được sử dụng để cung cấp thanh khoản cho thị trường, và phần lãi được chia lại cho bạn. Bạn vẫn sở hữu 100% tài sản đã gửi.',
  },
  {
    id: 'g2', category: 'general',
    question: 'Tiết kiệm có khác Staking không?',
    answer: 'Có. Staking yêu cầu khóa token để bảo mật blockchain (Proof of Stake), có rủi ro slashing nếu validator vi phạm. Tiết kiệm đơn giản hơn — bạn gửi tài sản vào pool thanh khoản, không liên quan đến validator. Rủi ro thấp hơn staking nhưng APY thường cũng thấp hơn một chút.',
  },
  {
    id: 'g3', category: 'general',
    question: 'Tôi có mất quyền sở hữu tài sản khi gửi tiết kiệm không?',
    answer: 'KHÔNG. Bạn vẫn sở hữu 100% tài sản đã gửi. Khi rút, bạn nhận lại đúng số tài sản ban đầu + lãi tích lũy (với sản phẩm Linh hoạt) hoặc lãi khi đáo hạn (với sản phẩm Cố định).',
  },
  {
    id: 'g4', category: 'general',
    question: 'Tôi cần tối thiểu bao nhiêu để bắt đầu?',
    answer: 'Số lượng tối thiểu tùy từng sản phẩm, thường từ 1 USDT / 0.0001 BTC. Chúng tôi khuyến nghị bắt đầu với $50-200 ở sản phẩm Linh hoạt để làm quen.',
  },

  // Products
  {
    id: 'p1', category: 'products',
    question: 'Linh hoạt và Cố định khác nhau thế nào?',
    answer: 'Linh hoạt: Rút bất kỳ lúc nào, APY 2-5%, phù hợp nhu cầu thanh khoản. Cố định: Khóa 30/60/90 ngày, APY 4-10%, phù hợp khi không cần dùng tài sản trong thời gian khóa. APY Cố định cao hơn vì nền tảng có thể sử dụng tài sản ổn định hơn.',
  },
  {
    id: 'p2', category: 'products',
    question: 'Auto-compound là gì?',
    answer: 'Auto-compound (tái đầu tư tự động) gộp lãi nhận được vào gốc để tạo lãi kép. Ví dụ: Gửi 1,000 USDT, lãi tháng 1 = 4 USDT → gốc tháng 2 = 1,004 USDT → lãi tính trên 1,004. Hiệu quả tăng 5-15% APY thực tế so với nhận lãi riêng.',
  },
  {
    id: 'p3', category: 'products',
    question: 'Tôi có thể gửi nhiều sản phẩm cùng lúc không?',
    answer: 'Có. Bạn có thể gửi vào nhiều sản phẩm khác nhau cùng lúc. Đây là chiến lược "Ladder" được khuyến nghị: chia tài sản vào nhiều kỳ hạn (Linh hoạt + Cố định 30D + 60D) để cân bằng giữa lãi suất và thanh khoản.',
  },
  {
    id: 'p4', category: 'products',
    question: 'Sản phẩm nào phù hợp với người mới?',
    answer: 'Người mới nên bắt đầu với sản phẩm Linh hoạt trên stablecoin (USDT hoặc USDC). Lý do: (1) Rút được bất kỳ lúc nào nếu cần, (2) Không bị ảnh hưởng bởi biến động giá crypto, (3) APY ổn định hơn. Sau khi quen, có thể thử Cố định 30D.',
  },

  // Operations
  {
    id: 'o1', category: 'operations',
    question: 'Làm sao để gửi tiết kiệm?',
    answer: 'Bước 1: Vào Tiết kiệm → Chọn sản phẩm → Xem APY & điều khoản → Nhập số lượng → Xem lại chi tiết → Xác nhận. Lãi sẽ bắt đầu tích lũy từ ngày hôm sau.',
  },
  {
    id: 'o2', category: 'operations',
    question: 'Rút tiết kiệm mất bao lâu?',
    answer: 'Linh hoạt: Rút tức thì (0-30 phút). Cố định đáo hạn: Tự động trả về ví, 0-2 giờ. Cố định rút sớm: 1-24 giờ xử lý, áp dụng phí phạt.',
  },
  {
    id: 'o3', category: 'operations',
    question: 'Tôi có thể rút một phần không?',
    answer: 'Linh hoạt: Có, rút số lượng bất kỳ (tối thiểu 1 USDT hoặc tương đương). Cố định: Tùy sản phẩm — một số cho phép rút một phần (phí phạt tính trên phần rút), một số yêu cầu rút toàn bộ.',
  },
  {
    id: 'o4', category: 'operations',
    question: 'Lãi được trả khi nào?',
    answer: 'Linh hoạt: Lãi được tính hàng ngày vào lúc 00:00 UTC và phân phối tự động. Nếu bật auto-compound, lãi gộp vào gốc. Nếu không, lãi nằm trong ví tiết kiệm riêng. Cố định: Lãi phân phối tự động hàng ngày hoặc tích lũy trả khi đáo hạn (tùy sản phẩm).',
  },

  // Fees
  {
    id: 'f1', category: 'fees',
    question: 'Có phí gì khi gửi tiết kiệm không?',
    answer: 'Gửi: Miễn phí. Rút Linh hoạt: Miễn phí. Rút sớm Cố định: Phí phạt = mất toàn bộ hoặc một phần lãi tích lũy + có thể tính 0.5-2% phí trên gốc (tùy sản phẩm). Chi tiết phí luôn hiển thị rõ trước khi xác nhận giao dịch.',
  },
  {
    id: 'f2', category: 'fees',
    question: 'APY có cố định hay thay đổi?',
    answer: 'Linh hoạt: APY thay đổi hàng ngày theo cung/cầu thị trường. Cố định: APY được "khóa" tại thời điểm bạn gửi, không thay đổi trong suốt kỳ hạn. Đây là ưu điểm lớn của Cố định — bạn biết chính xác lãi sẽ nhận.',
  },
  {
    id: 'f3', category: 'fees',
    question: 'Phí rút sớm Cố định tính thế nào?',
    answer: 'Khi rút sớm sản phẩm Cố định, phí phạt thường bao gồm: (1) Mất toàn bộ lãi đã tích lũy, (2) Phí phạt 0.5-2% trên số gốc rút (tùy sản phẩm và thời gian đã khóa). Trang Rút sớm luôn hiển thị chính xác phí trước khi bạn xác nhận.',
  },

  // Risks
  {
    id: 'r1', category: 'risks',
    question: 'Tiết kiệm Crypto có rủi ro gì?',
    answer: 'Rủi ro chính: (1) Platform risk — nền tảng gặp sự cố kỹ thuật/tài chính, (2) Market risk — giá tài sản giảm (chỉ áp dụng với BTC, ETH... không áp dụng stablecoin), (3) Smart contract risk — lỗi hợp đồng thông minh. Quỹ Bảo hiểm giúp giảm thiểu một phần rủi ro.',
  },
  {
    id: 'r2', category: 'risks',
    question: 'Quỹ Bảo hiểm hoạt động thế nào?',
    answer: 'Quỹ Bảo hiểm là quỹ dự phòng được tích lũy từ phí giao dịch, dùng để bồi thường cho user khi xảy ra sự cố (hack, lỗi kỹ thuật). Quỹ KHÔNG bảo vệ khỏi thua lỗ do biến động giá thị trường (market risk).',
  },
  {
    id: 'r3', category: 'risks',
    question: 'Tài sản của tôi có an toàn không?',
    answer: 'Chúng tôi áp dụng nhiều lớp bảo mật: mã hóa end-to-end, xác thực 2FA, cold wallet storage cho phần lớn tài sản, audit bên thứ 3 định kỳ, và Quỹ Bảo hiểm. Tuy nhiên, không có hệ thống nào an toàn 100%. Bạn nên bật đầy đủ bảo mật tài khoản và không gửi toàn bộ tài sản.',
  },
  {
    id: 'r4', category: 'risks',
    question: 'Tôi nên gửi bao nhiêu % tổng tài sản?',
    answer: 'Khuyến nghị: Không quá 50-70% tổng tài sản crypto. Luôn giữ 20-30% liquid (ví thường) để có thể giao dịch hoặc xử lý tình huống khẩn cấp. Với số lớn, nên chia thành nhiều sản phẩm và kỳ hạn khác nhau.',
  },
];

const TAB_CONFIG = [
  { key: 'all', label: 'Tất cả' },
  { key: 'general', label: 'Tổng quan' },
  { key: 'products', label: 'Sản phẩm' },
  { key: 'operations', label: 'Thao tác' },
  { key: 'fees', label: 'Phí & Lãi' },
  { key: 'risks', label: 'Rủi ro' },
] as const;
type TabKey = typeof TAB_CONFIG[number]['key'];

/* ─── Accordion Item ─── */
function FAQItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  const c = useThemeColors();
  const { hapticLight } = useHaptic();
  const catCfg = CATEGORY_CONFIG[faq.category];

  return (
    <TrCard>
      <button
        onClick={() => { onToggle(); hapticLight(); }}
        className="flex items-start gap-3 w-full"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: catCfg.bg }}>
          <HelpCircle size={14} color={catCfg.color} />
        </div>
        <div className="flex-1 text-left">
          <div style={{ color: c.text, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, lineHeight: 1.4 }}>
            {faq.question}
          </div>
        </div>
        <div className="shrink-0 mt-0.5 transition-transform"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronDown size={ICON_SIZE.base} color={c.text3} strokeWidth={ICON_STROKE.standard} />
        </div>
      </button>

      {/* Expandable answer — pure CSS grid transition */}
      <div
        className="overflow-hidden transition-all"
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.25s ease',
        }}
      >
        <div className="min-h-0">
          <div className="pt-3 pl-11">
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.7 }}>
              {faq.answer}
            </p>
            {/* Helpful feedback */}
            <div className="flex items-center gap-3 mt-3 pt-2" style={{ borderTop: `1px solid ${c.divider}` }}>
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Hữu ích?</span>
              <button className="flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ background: withAlpha(c.success, ALPHA.ghost) }}>
                <ThumbsUp size={ICON_SIZE.sm} color={c.success} strokeWidth={ICON_STROKE.standard} />
                <span style={{ color: c.success, fontSize: FONT_SCALE.micro }}>Có</span>
              </button>
              <button className="flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ background: withAlpha(c.error, ALPHA.ghost) }}>
                <ThumbsDown size={ICON_SIZE.sm} color={c.error} strokeWidth={ICON_STROKE.standard} />
                <span style={{ color: c.error, fontSize: FONT_SCALE.micro }}>Không</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export function SavingsFAQPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticLight } = useHaptic();

  const [tab, setTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return FAQS.filter(f => {
      const matchTab = tab === 'all' || f.category === tab;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [tab, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: FAQS.length };
    for (const f of FAQS) counts[f.category] = (counts[f.category] || 0) + 1;
    return counts;
  }, []);

  return (
    <PageLayout>
      <Header title="FAQ Tiết kiệm" back />

      <PageContent gap="default">
        {/* Hero */}
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <MessageCircle size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <div style={{ color: c.text, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Câu hỏi thường gặp
              </div>
              <div style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Tìm câu trả lời cho các thắc mắc phổ biến về Tiết kiệm Crypto.
                Không tìm thấy? Liên hệ hỗ trợ bất kỳ lúc nào.
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} color={c.text3}
            className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm câu hỏi..."
            className="w-full h-10 pl-10 pr-10 rounded-xl outline-none"
            style={{
              background: c.surface2,
              border: `1px solid ${c.border}`,
              color: c.text,
              fontSize: 13,
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={16} color={c.text3} />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5">
          {TAB_CONFIG.map(t => {
            const isActive = tab === t.key;
            return (
              <button key={t.key}
                onClick={() => { setTab(t.key); hapticLight(); }}
                className="shrink-0 px-3 py-1.5 rounded-lg flex items-center gap-1"
                style={{
                  background: isActive ? c.chipActiveBg : c.surface2,
                  color: isActive ? c.chipActiveText : c.text3,
                  border: `1px solid ${isActive ? c.chipActiveBorder : c.border}`,
                  fontSize: 11, fontWeight: isActive ? 600 : 400,
                }}>
                {t.label}
                <span style={{
                  fontSize: 9,
                  color: isActive ? c.chipActiveText : c.text3,
                  opacity: 0.7,
                }}>
                  {categoryCounts[t.key] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results count */}
        <div className="flex items-center px-1">
          <span style={{ color: c.text3, fontSize: 11 }}>
            {filtered.length} câu hỏi
            {searchQuery && ' (đã lọc)'}
          </span>
        </div>

        {/* FAQ list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: c.surface2 }}>
              <Search size={24} color={c.text3} />
            </div>
            <span style={{ color: c.text2, fontSize: 14, fontWeight: 500 }}>
              Không tìm thấy câu hỏi
            </span>
            <span style={{ color: c.text3, fontSize: 12 }}>
              Thử từ khóa khác hoặc đổi danh mục
            </span>
            <button onClick={() => { setSearchQuery(''); setTab('all'); }}
              className="px-4 py-2 rounded-xl mt-1"
              style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(faq => (
              <FAQItem
                key={faq.id}
                faq={faq}
                isOpen={openIds.has(faq.id)}
                onToggle={() => toggle(faq.id)}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(59,130,246,0.12)' }}>
              <MessageCircle size={18} color="#3B82F6" />
            </div>
            <div className="flex-1">
              <div style={{ color: c.text, fontSize: 13, fontWeight: 600 }}>
                Vẫn cần hỗ trợ?
              </div>
              <div style={{ color: c.text3, fontSize: 11 }}>
                Liên hệ đội ngũ hỗ trợ 24/7
              </div>
            </div>
            <button
              onClick={() => { navigate(`${prefix}/support`); hapticSelection(); }}
              className="px-3 py-2 rounded-xl flex items-center gap-1"
              style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>
              Liên hệ
              <ExternalLink size={12} />
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
          <Shield size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
          <span style={{ color: '#3B82F6', fontSize: 10, lineHeight: 1.4 }}>
            Thông tin FAQ mang tính giáo dục và giải thích chung. Điều khoản chi tiết của từng sản phẩm
            có thể khác nhau — luôn đọc kỹ trước khi gửi tiết kiệm.
          </span>
        </div>
      </PageContent>
    </PageLayout>
  );
}