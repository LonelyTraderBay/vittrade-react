import React, { useState } from 'react';
import { FileText, Download, Printer, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';

interface Section {
  id: string;
  title: string;
  content: string[];
}

const TERMS_SECTIONS: Section[] = [
  {
    id: 'definitions',
    title: '1. Định nghĩa',
    content: [
      '"Nền tảng" có nghĩa là dịch vụ staking được cung cấp bởi chúng tôi thông qua ứng dụng di động và web.',
      '"Người dùng" hoặc "Bạn" có nghĩa là bất kỳ cá nhân hoặc tổ chức nào sử dụng dịch vụ staking.',
      '"Tài sản số" có nghĩa là tiền điện tử, token hoặc tài sản kỹ thuật số khác được hỗ trợ trên nền tảng.',
      '"Staking" có nghĩa là việc khóa tài sản số để tham gia vào cơ chế đồng thuận Proof-of-Stake hoặc các cơ chế tương tự.',
      '"Phần thưởng" có nghĩ là lợi nhuận, tiền lãi hoặc token mới được tạo ra từ hoạt động staking.',
      '"APY" (Annual Percentage Yield) có nghĩa là tỷ lệ phần trăm lợi nhuận hàng năm, đã tính toán lãi kép.',
      '"Kỳ hạn khóa" có nghĩa là khoảng thời gian tài sản bị khóa và không thể rút trước hạn.',
      '"Validator" có nghĩa là nút mạng thực hiện xác thực giao dịch trong cơ chế Proof-of-Stake.',
    ],
  },
  {
    id: 'service-description',
    title: '2. Mô tả dịch vụ',
    content: [
      'Nền tảng cung cấp các sản phẩm staking cho phép bạn kiếm phần thưởng bằng cách khóa tài sản số.',
      'Các loại sản phẩm staking bao gồm:',
      '• Staking Cố định (Fixed Staking): Khóa tài sản trong một kỳ hạn xác định (30, 60, 90, 180, 365 ngày) với APY cố định.',
      '• Staking Linh hoạt (Flexible Staking): Không có kỳ hạn khóa, có thể rút bất kỳ lúc nào, APY có thể thay đổi.',
      '• DeFi Staking: Tham gia vào các pool thanh khoản DeFi với APY cao hơn nhưng rủi ro cao hơn.',
      '• Liquid Staking: Nhận token phái sinh (stToken) có thể giao dịch trong khi vẫn nhận phần thưởng staking.',
      'Phần thưởng được tính toán và phân phối theo lịch trình của từng sản phẩm (hàng ngày, hàng tuần, hoặc vào ngày đến hạn).',
      'Chúng tôi có quyền tạm dừng, sửa đổi, hoặc ngừng cung cấp bất kỳ sản phẩm staking nào với thông báo trước ít nhất 7 ngày.',
    ],
  },
  {
    id: 'eligibility',
    title: '3. Điều kiện tham gia',
    content: [
      'Bạn phải đủ 18 tuổi (hoặc độ tuổi trưởng thành theo pháp luật địa phương) để sử dụng dịch vụ staking.',
      'Bạn phải hoàn tất quy trình xác thực danh tính (KYC) theo yêu cầu của nền tảng.',
      'Bạn phải không nằm trong danh sách các quốc gia hoặc khu vực bị hạn chế:',
      '• Hoa Kỳ (một số tiểu bang)',
      '• Bắc Triều Tiên, Iran, Syria, Cuba (do lệnh trừng phạt quốc tế)',
      '• Các quốc gia khác theo quy định của pháp luật địa phương',
      'Bạn phải có đủ số dư tài sản số để đáp ứng số lượng tối thiểu (minimum stake amount) của từng sản phẩm.',
      'Bạn cam kết tuân thủ mọi quy định pháp luật về thuế, chống rửa tiền (AML), và chống tài trợ khủng bố (CFT) tại quốc gia của bạn.',
    ],
  },
  {
    id: 'staking-mechanism',
    title: '4. Cơ chế Staking',
    content: [
      'Khi bạn đăng ký staking, tài sản của bạn sẽ được chuyển từ ví giao dịch (Spot Wallet) sang ví staking (Earn Wallet).',
      'Tài sản sẽ được ủy thác (delegate) cho các validator đã được nền tảng lựa chọn và thẩm định.',
      'Chúng tôi có toàn quyền quyết định việc chọn validator dựa trên các tiêu chí: hiệu suất, độ tin cậy, phí hoa hồng, và lịch sử hoạt động.',
      'Bạn không thể tự chọn validator trừ khi sử dụng sản phẩm "Validator Selection" (nếu có).',
      'Phần thưởng staking sẽ được tính toán dựa trên:',
      '• Số lượng tài sản đã staking',
      '• APY hiện tại của sản phẩm',
      '• Hiệu suất của validator',
      '• Phí dịch vụ của nền tảng (service fee)',
      'Công thức tính phần thưởng: Rewards = Principal × (APY / 365) × Days - Service Fee',
      'Phần thưởng sẽ được phân phối vào ví staking của bạn và có thể được rút về ví giao dịch hoặc tự động tái đầu tư (auto-compound) nếu bạn bật tính năng này.',
    ],
  },
  {
    id: 'fees',
    title: '5. Phí và Chi phí',
    content: [
      'Phí dịch vụ (Service Fee): 0-20% của phần thưởng staking, tùy thuộc vào sản phẩm.',
      '• Staking Cố định: 5-10% của phần thưởng',
      '• Staking Linh hoạt: 10-15% của phần thưởng',
      '• DeFi Staking: 15-20% của phần thưởng (do rủi ro cao hơn)',
      'Phí gas (Gas Fee): Áp dụng khi chuyển tài sản vào/ra khỏi ví staking. Phí gas do mạng blockchain quyết định và có thể thay đổi theo thời gian thực.',
      'Phí rút sớm (Early Withdrawal Fee): Nếu bạn rút tài sản khỏi sản phẩm Staking Cố định trước kỳ hạn, bạn sẽ bị tính phí:',
      '• Rút sớm trong 30 ngày đầu: Mất 100% phần thưởng đã tích lũy',
      '• Rút sớm sau 30 ngày: Mất 50% phần thưởng đã tích lũy',
      'Không có phí ẩn (hidden fees). Mọi phí đều được công bố rõ ràng trước khi bạn xác nhận giao dịch staking.',
      'Chúng tôi có quyền điều chỉnh phí dịch vụ với thông báo trước ít nhất 14 ngày. Bạn có quyền hủy staking nếu không đồng ý với mức phí mới.',
    ],
  },
  {
    id: 'reward-distribution',
    title: '6. Phân phối Phần thưởng',
    content: [
      'Phần thưởng được phân phối theo lịch trình của từng sản phẩm:',
      '• Staking Linh hoạt: Hàng ngày (00:00 UTC)',
      '• Staking Cố định: Vào ngày đến hạn (maturity date)',
      '• DeFi Staking: Hàng tuần hoặc hàng tháng (tùy pool)',
      'Phần thưởng sẽ được tự động chuyển vào ví staking của bạn.',
      'Nếu bạn bật tính năng "Auto-Compound", phần thưởng sẽ tự động được thêm vào số lượng tài sản đã staking để tăng lợi nhuận kép.',
      'Bạn có thể rút phần thưởng về ví giao dịch bất kỳ lúc nào mà không ảnh hưởng đến số lượng tài sản gốc đã staking.',
      'APY có thể thay đổi dựa trên:',
      '• Điều kiện thị trường',
      '• Tổng số lượng tài sản đang được staking trên mạng',
      '• Hiệu suất của validator',
      '• Quyết định của nhóm phát triển blockchain',
      'Chúng tôi không đảm bảo APY cố định cho sản phẩm Staking Linh hoạt. APY hiển thị là APY ước tính dựa trên dữ liệu lịch sử.',
      'Đối với sản phẩm Staking Cố định, APY được đảm bảo tại thời điểm bạn đăng ký và không thay đổi trong suốt kỳ hạn khóa.',
    ],
  },
  {
    id: 'risks',
    title: '7. Rủi ro',
    content: [
      'Staking tài sản số có rủi ro. Bạn nên đọc kỹ trang "Công bố Rủi ro" trước khi tham gia.',
      'Các rủi ro chính bao gồm:',
      '• Rủi ro thị trường: Giá trị tài sản số có thể giảm mạnh trong kỳ hạn khóa.',
      '• Rủi ro thanh khoản: Bạn không thể bán tài sản khi đang bị khóa.',
      '• Rủi ro slashing: Validator có thể bị phạt (slashed) nếu vi phạm quy tắc mạng, dẫn đến mất một phần tài sản đã staking.',
      '• Rủi ro smart contract: Đối với DeFi Staking, smart contract có thể có lỗ hổng bảo mật.',
      '• Rủi ro đối tác: Nền tảng có thể gặp sự cố kỹ thuật, bị hack, hoặc phá sản.',
      '• Rủi ro pháp lý: Quy định về staking có thể thay đổi, ảnh hưởng đến khả năng tiếp tục cung cấp dịch vụ.',
      'Chúng tôi KHÔNG đảm bảo:',
      '• Lợi nhuận cố định (trừ sản phẩm Fixed Staking)',
      '• Bảo toàn vốn gốc',
      '• Thanh khoản tức thì (instant liquidity)',
      'Chúng tôi khuyến nghị bạn chỉ nên staking số lượng tài sản mà bạn có thể chấp nhận rủi ro mất mát.',
    ],
  },
  {
    id: 'withdrawal-unstaking',
    title: '8. Rút tiền và Hủy Staking',
    content: [
      'Đối với Staking Linh hoạt:',
      '• Bạn có thể hủy staking (unstake) bất kỳ lúc nào.',
      '• Tài sản sẽ được chuyển về ví giao dịch trong vòng 1-3 ngày làm việc (unbonding period).',
      '• Phần thưởng đã tích lũy sẽ được giữ nguyên và có thể rút.',
      'Đối với Staking Cố định:',
      '• Bạn KHÔNG thể rút trước kỳ hạn đến hạn (maturity date) trừ khi chấp nhận phí rút sớm.',
      '• Khi đến hạn, tài sản sẽ tự động được chuyển về ví giao dịch cùng với phần thưởng.',
      '• Nếu bạn không hủy sau khi đến hạn, tài sản có thể được tự động gia hạn (auto-renew) với APY mới (nếu bạn đã bật tính năng này).',
      'Đối với DeFi Staking:',
      '• Thời gian rút tùy thuộc vào smart contract của từng pool.',
      '• Có thể có phí rút (withdrawal fee) hoặc thời gian chờ (cooldown period).',
      'Trong một số trường hợp khẩn cấp (emergency withdrawal), bạn có thể yêu cầu rút ngay lập tức nhưng phải chịu phí cao hơn.',
      'Chúng tôi có quyền tạm dừng việc rút tiền nếu:',
      '• Phát hiện hoạt động đáng ngờ (suspicious activity)',
      '• Yêu cầu từ cơ quan pháp luật',
      '• Sự cố kỹ thuật nghiêm trọng',
    ],
  },
  {
    id: 'slashing',
    title: '9. Chính sách Slashing',
    content: [
      'Slashing là hình phạt tự động do mạng blockchain áp dụng khi validator vi phạm quy tắc.',
      'Các hành vi có thể bị slashing:',
      '• Double signing: Validator ký hai block khác nhau tại cùng một thời điểm',
      '• Downtime: Validator offline quá lâu và không tham gia xác thực',
      '• Malicious behavior: Validator cố tình tấn công mạng',
      'Mức độ phạt (slashing penalty):',
      '• Nhẹ: 0.01% - 1% số lượng tài sản đã staking',
      '• Trung bình: 1% - 5%',
      '• Nghiêm trọng: 5% - 100% (toàn bộ tài sản)',
      'Chúng tôi cố gắng giảm thiểu rủi ro slashing bằng cách:',
      '• Chọn validator uy tín với lịch sử tốt',
      '• Phân tán (diversify) tài sản qua nhiều validator',
      '• Theo dõi hiệu suất validator 24/7',
      '• Chuyển sang validator khác nếu phát hiện vấn đề',
      'Tuy nhiên, chúng tôi KHÔNG thể đảm bảo 100% tránh được slashing.',
      'Trong trường hợp bị slashing:',
      '• Bạn sẽ mất một phần tài sản tương ứng với mức phạt',
      '• Chúng tôi sẽ thông báo qua email và app notification',
      '• Chúng tôi KHÔNG bồi thường thiệt hại do slashing (trừ khi có bảo hiểm)',
      'Một số sản phẩm có "Slashing Insurance" (bảo hiểm slashing) với phí bảo hiểm 0.5-1% APY. Nếu bạn tham gia bảo hiểm, chúng tôi sẽ bồi thường tối đa 50% thiệt hại.',
    ],
  },
  {
    id: 'tax',
    title: '10. Thuế',
    content: [
      'Phần thưởng staking có thể bị đánh thuế tùy theo pháp luật quốc gia của bạn.',
      'Bạn có trách nhiệm tự khai báo và nộp thuế cho phần thưởng staking.',
      'Chúng tôi KHÔNG phải là cố vấn thuế (tax advisor). Vui lòng tham khảo ý kiến chuyên gia thuế địa phương.',
      'Nền tảng cung cấp các công cụ hỗ trợ:',
      '• Lịch sử giao dịch staking (transaction history) có thể xuất CSV/PDF',
      '• Báo cáo thuế tự động (Tax Report) tính toán tổng phần thưởng theo năm',
      '• Hướng dẫn thuế (Tax Guide) cho các quốc gia phổ biến',
      'Đối với một số quốc gia, chúng tôi có thể cung cấp biểu mẫu thuế (tax form) như 1099-MISC (Hoa Kỳ), T5008 (Canada).',
      'Chúng tôi có thể được yêu cầu báo cáo thông tin của bạn cho cơ quan thuế nếu luật pháp địa phương yêu cầu.',
      'Bạn cam kết cung cấp thông tin thuế chính xác (SSN, TIN, hoặc tương đương) khi được yêu cầu.',
    ],
  },
  {
    id: 'liability',
    title: '11. Giới hạn Trách nhiệm',
    content: [
      'Chúng tôi cung cấp dịch vụ staking trên cơ sở "AS IS" (nguyên trạng) và "AS AVAILABLE" (sẵn có).',
      'Chúng tôi KHÔNG đảm bảo:',
      '• Dịch vụ sẽ hoạt động liên tục, an toàn, không có lỗi',
      '• Kết quả staking sẽ chính xác, đáng tin cậy',
      '• APY sẽ không thay đổi',
      '• Tài sản sẽ an toàn tuyệt đối',
      'Chúng tôi KHÔNG chịu trách nhiệm cho:',
      '• Mất mát tài sản do slashing, hack, hoặc sự cố kỹ thuật',
      '• Thiệt hại gián tiếp, ngẫu nhiên, đặc biệt, hoặc do hậu quả',
      '• Mất lợi nhuận, mất dữ liệu, mất uy tín',
      '• Hành động hoặc thiếu sót của validator',
      '• Thay đổi pháp luật hoặc quy định',
      'Trách nhiệm tối đa của chúng tôi đối với bạn bị giới hạn ở:',
      '• Số tiền bạn đã trả cho dịch vụ staking trong 12 tháng gần nhất, HOẶC',
      '• $100 USD, tùy theo số nào nhỏ hơn',
      'Một số quốc gia không cho phép giới hạn trách nhiệm. Nếu bạn ở quốc gia đó, giới hạn trên có thể không áp dụng.',
    ],
  },
  {
    id: 'termination',
    title: '12. Chấm dứt Dịch vụ',
    content: [
      'Bạn có quyền hủy staking và ngừng sử dụng dịch vụ bất kỳ lúc nào.',
      'Chúng tôi có quyền chấm dứt hoặc tạm dừng tài khoản của bạn nếu:',
      '• Bạn vi phạm điều khoản này',
      '• Bạn cung cấp thông tin sai lệch',
      '• Chúng tôi nghi ngờ hoạt động gian lận, rửa tiền, hoặc bất hợp pháp',
      '• Theo yêu cầu của cơ quan pháp luật',
      '• Bạn nằm trong danh sách cấm (blacklist)',
      'Khi tài khoản bị chấm dứt:',
      '• Bạn sẽ nhận được thông báo qua email',
      '• Tài sản đang staking sẽ được hủy (unstake) trong vòng 7-30 ngày',
      '• Phần thưởng đã tích lũy sẽ được giữ nguyên (trừ khi có quyết định khác của pháp luật)',
      '• Bạn vẫn có thể rút tài sản và phần thưởng sau khi hoàn tất unbonding period',
      'Chúng tôi có quyền ngừng cung cấp dịch vụ staking hoàn toàn nếu:',
      '• Thay đổi pháp luật khiến dịch vụ không khả thi',
      '• Quyết định kinh doanh',
      'Trong trường hợp này, chúng tôi sẽ thông báo trước ít nhất 30 ngày và hỗ trợ bạn rút toàn bộ tài sản.',
    ],
  },
  {
    id: 'changes',
    title: '13. Thay đổi Điều khoản',
    content: [
      'Chúng tôi có quyền sửa đổi điều khoản này bất kỳ lúc nào.',
      'Thay đổi quan trọng sẽ được thông báo trước ít nhất 14 ngày qua:',
      '• Email đến địa chỉ đăng ký',
      '• Thông báo trên ứng dụng',
      '• Banner trên trang Staking',
      'Thay đổi nhỏ (typo, làm rõ ngôn ngữ) có thể được áp dụng ngay lập tức.',
      'Nếu bạn tiếp tục sử dụng dịch vụ sau khi thay đổi có hiệu lực, bạn được xem như đã chấp nhận điều khoản mới.',
      'Nếu bạn không đồng ý, bạn có quyền hủy staking và ngừng sử dụng dịch vụ trong vòng 14 ngày mà không bị phí.',
      'Lịch sử thay đổi điều khoản được lưu trữ và bạn có thể xem các phiên bản cũ.',
    ],
  },
  {
    id: 'governing-law',
    title: '14. Luật áp dụng và Giải quyết Tranh chấp',
    content: [
      'Điều khoản này được điều chỉnh bởi luật pháp của [Quốc gia Công ty], không tính đến các quy định xung đột pháp luật.',
      'Mọi tranh chấp phát sinh từ hoặc liên quan đến điều khoản này sẽ được giải quyết theo các bước sau:',
      '• Bước 1: Thương lượng trực tiếp trong vòng 30 ngày',
      '• Bước 2: Hòa giải qua bên thứ ba trung lập trong vòng 60 ngày',
      '• Bước 3: Trọng tài tại [Thành phố] theo luật trọng tài quốc tế',
      'Quyết định của trọng tài là cuối cùng và có tính ràng buộc.',
      'Một số quốc gia yêu cầu giải quyết tranh chấp tại tòa án địa phương. Nếu bạn ở quốc gia đó, bạn có quyền khởi kiện tại tòa án của bạn.',
      'Bạn đồng ý KHÔNG tham gia vào kiện tụng tập thể (class action) đối với chúng tôi. Mọi tranh chấp phải được giải quyết riêng lẻ.',
    ],
  },
  {
    id: 'contact',
    title: '15. Liên hệ',
    content: [
      'Nếu bạn có câu hỏi về điều khoản này, vui lòng liên hệ:',
      '• Email: legal@platform.com',
      '• Support: support@platform.com',
      '• Phone: +1-800-XXX-XXXX (24/7)',
      '• Địa chỉ: [Company Address]',
      'Thời gian phản hồi: 1-3 ngày làm việc.',
    ],
  },
];

const LAST_UPDATED = '01/03/2026';
const VERSION = '2.1';

export function StakingTermsPage() {
  const c = useThemeColors();
  const [expandedSections, setExpandedSections] = useState<string[]>(['definitions']);
  const [hasAccepted, setHasAccepted] = useState(false);

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handlePrint = () => window.print();
  const handleDownload = () => {
    alert('Tính năng tải PDF sẽ sớm ra mắt. Bạn có thể sử dụng "In trang" để lưu thành PDF.');
  };

  return (
    <PageLayout>
      <Header title="Điều khoản Staking" back />

      <PageContent>
        {/* Header Info */}
        <TrCard className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
              <FileText size={24} color="#3B82F6" />
            </div>
            <div className="flex-1">
              <h2 style={{ color: c.text1, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Điều khoản Dịch vụ Staking
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Clock size={13} color={c.text3} />
                  <span style={{ color: c.text3, fontSize: 12 }}>Cập nhật: {LAST_UPDATED}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span style={{ color: c.text3, fontSize: 12 }}>Phiên bản {VERSION}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex gap-2">
              <AlertCircle size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                Vui lòng đọc kỹ điều khoản này trước khi sử dụng dịch vụ staking. Bằng việc đăng ký staking, bạn đồng ý tuân thủ các điều khoản dưới đây.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ background: c.surface2, color: c.text2, fontSize: 13, fontWeight: 600 }}>
              <Printer size={16} />
              In trang
            </button>
            <button onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ background: c.primary, color: '#FFF', fontSize: 13, fontWeight: 600 }}>
              <Download size={16} />
              Tải PDF
            </button>
          </div>
        </TrCard>

        {/* Sections */}
        <div className="flex flex-col gap-3">
          {TERMS_SECTIONS.map(section => {
            const isExpanded = expandedSections.includes(section.id);
            return (
              <TrCard key={section.id} className="overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4"
                  style={{ textAlign: 'left' }}>
                  <span style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
                    {section.title}
                  </span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}>
                    <path
                      d="M5 7.5L10 12.5L15 7.5"
                      stroke={c.text3}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
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
                      {section.content.map((paragraph, idx) => (
                        <p key={idx} style={{
                          color: c.text2,
                          fontSize: 13,
                          lineHeight: 1.7,
                          marginBottom: paragraph.startsWith('•') ? 4 : 12,
                          paddingLeft: paragraph.startsWith('•') ? 16 : 0,
                        }}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </TrCard>
            );
          })}
        </div>

        {/* Acceptance Checkbox */}
        <TrCard className="p-4">
          <button
            onClick={() => setHasAccepted(!hasAccepted)}
            className="flex items-start gap-3">
            <div
              className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5"
              style={{
                borderColor: hasAccepted ? '#10B981' : c.borderSolid,
                background: hasAccepted ? '#10B981' : 'transparent',
              }}>
              {hasAccepted && <CheckCircle size={13} color="#fff" />}
            </div>
            <div className="flex-1">
              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6, textAlign: 'left' }}>
                Tôi đã đọc, hiểu và đồng ý với <span style={{ color: '#3B82F6', fontWeight: 600 }}>Điều khoản Dịch vụ Staking</span> phiên bản {VERSION} ngày {LAST_UPDATED}.
              </p>
              <p style={{ color: c.text3, fontSize: 11, marginTop: 6, textAlign: 'left' }}>
                Bằng việc đánh dấu ô này và tiếp tục sử dụng dịch vụ, bạn tạo ra một thỏa thuận có tính ràng buộc pháp lý giữa bạn và nền tảng.
              </p>
            </div>
          </button>
        </TrCard>

        {/* Footer Disclaimer */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Điều khoản này có hiệu lực từ {LAST_UPDATED}. Phiên bản cũ có thể được xem trong mục "Lịch sử phiên bản". Nếu bạn có câu hỏi, vui lòng liên hệ <span style={{ color: '#3B82F6' }}>legal@platform.com</span>.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
