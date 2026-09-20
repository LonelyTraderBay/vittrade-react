import React from 'react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { Shield, FileText, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { φ, φSpace } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';

/* ═══════════════════════════════════════════════════════════
   P2P Insurance Fund — Terms & Conditions / Policy Page
   ═══════════════════════════════════════════════════════════ */

const LAST_UPDATED = '01/03/2026';
const VERSION = '2.1';

interface PolicySection {
  id: string;
  title: string;
  content: string[];
}

const POLICY_SECTIONS: PolicySection[] = [
  {
    id: 'scope',
    title: '1. Phạm vi bảo hiểm',
    content: [
      'Quỹ Bảo Hiểm P2P bảo vệ merchants và buyers trên nền tảng giao dịch P2P khỏi các rủi ro gian lận, chargeback, và lỗi hệ thống trong quá trình giao dịch.',
      'Bảo hiểm áp dụng cho tất cả giao dịch P2P đã hoàn tất trên nền tảng, với điều kiện người dùng đã đóng góp vào quỹ thông qua phí giao dịch.',
      'Bảo hiểm KHÔNG bao gồm: thiệt hại do biến động giá thị trường, lỗi của người dùng trong việc nhập sai địa chỉ ví, hoặc các giao dịch ngoài nền tảng.',
    ],
  },
  {
    id: 'eligibility',
    title: '2. Điều kiện đủ tiêu chuẩn',
    content: [
      'Người dùng phải hoàn tất xác minh danh tính (KYC) ít nhất ở mức "Xác minh" để được bảo hiểm.',
      'Giao dịch phải được thực hiện hoàn toàn trên nền tảng, bao gồm thanh toán và giải phóng coin.',
      'Yêu cầu bồi thường phải được gửi trong vòng 7 ngày kể từ ngày giao dịch xảy ra sự cố.',
      'Mỗi người dùng có hạn mức bồi thường tối đa 100.000.000 VND trong 30 ngày.',
    ],
  },
  {
    id: 'tiers',
    title: '3. Các mức bảo hiểm',
    content: [
      'Thường: Không được bảo hiểm — cần hoàn tất KYC để kích hoạt.',
      'Xác minh: Bảo hiểm 70% giá trị giao dịch — áp dụng cho người dùng đã KYC.',
      'Pro: Bảo hiểm 85% giá trị giao dịch — áp dụng cho merchants Pro đã được phê duyệt.',
      'Elite: Bảo hiểm 100% giá trị giao dịch + 10% bonus — áp dụng cho merchants Elite có uy tín cao.',
    ],
  },
  {
    id: 'contribution',
    title: '4. Đóng góp quỹ',
    content: [
      '0.1% giá trị mỗi giao dịch P2P sẽ được tự động trích vào Quỹ Bảo Hiểm.',
      'Phí đóng góp được hiển thị rõ trong phần phí giao dịch trước khi xác nhận.',
      'Đóng góp không được hoàn lại và không thể rút ra khỏi quỹ.',
    ],
  },
  {
    id: 'claims',
    title: '5. Quy trình yêu cầu bồi thường',
    content: [
      'Bước 1: Gửi yêu cầu bồi thường kèm mã đơn hàng, lý do, số tiền, và mô tả chi tiết.',
      'Bước 2: Đội ngũ hỗ trợ sẽ xem xét yêu cầu trong vòng 48 giờ làm việc.',
      'Bước 3: Nếu được phê duyệt, chi trả sẽ được thực hiện trong vòng 72 giờ vào ví nội bộ.',
      'Bước 4: Nếu bị từ chối, người dùng có thể kháng nghị trong vòng 14 ngày.',
    ],
  },
  {
    id: 'evidence',
    title: '6. Bằng chứng yêu cầu',
    content: [
      'Người dùng cần cung cấp bằng chứng đầy đủ: ảnh chụp màn hình giao dịch, lịch sử chat, sao kê ngân hàng.',
      'Bằng chứng phải là nguyên gốc, không chỉnh sửa. Phát hiện giả mạo sẽ dẫn đến từ chối vĩnh viễn.',
      'Tất cả bằng chứng được mã hóa và chỉ nhân viên có thẩm quyền mới được truy cập.',
    ],
  },
  {
    id: 'exclusions',
    title: '7. Các trường hợp loại trừ',
    content: [
      'Giao dịch ngoài nền tảng hoặc sử dụng kênh thanh toán không được hỗ trợ.',
      'Thiệt hại do biến động giá thị trường sau khi giao dịch hoàn tất.',
      'Yêu cầu gửi sau thời hạn 7 ngày kể từ ngày sự cố.',
      'Người dùng có lịch sử gian lận hoặc vi phạm điều khoản sử dụng.',
      'Yêu cầu vượt quá hạn mức bồi thường trong kỳ 30 ngày.',
    ],
  },
  {
    id: 'privacy',
    title: '8. Bảo mật dữ liệu',
    content: [
      'Thông tin cá nhân và bằng chứng được lưu trữ theo tiêu chuẩn bảo mật AES-256.',
      'Dữ liệu chỉ được sử dụng cho mục đích xem xét yêu cầu bồi thường.',
      'Sau khi yêu cầu được giải quyết, bằng chứng sẽ được lưu trữ trong 90 ngày rồi tự động xóa.',
      'Người dùng có quyền yêu cầu xóa dữ liệu sớm hơn theo chính sách GDPR.',
    ],
  },
  {
    id: 'governance',
    title: '9. Quản trị quỹ',
    content: [
      'Quỹ Bảo Hiểm được kiểm toán định kỳ bởi đơn vị kiểm toán độc lập.',
      'Báo cáo Proof of Reserves được công bố hàng tháng.',
      'Tỷ lệ thanh khoản (Solvency Ratio) được giám sát liên tục và công khai.',
      'Nền tảng có quyền tạm ngưng nhận claims mới nếu tỷ lệ thanh khoản dưới 100%.',
    ],
  },
  {
    id: 'amendments',
    title: '10. Sửa đổi điều khoản',
    content: [
      'Nền tảng có quyền sửa đổi điều khoản bảo hiểm với thông báo trước 30 ngày.',
      'Người dùng sẽ được thông báo qua email và push notification về các thay đổi.',
      'Tiếp tục sử dụng dịch vụ sau ngày có hiệu lực đồng nghĩa với việc chấp nhận điều khoản mới.',
    ],
  },
];

export function P2PInsurancePolicyPage() {
  const c = useThemeColors();

  return (
    <PageLayout>
      <Header title="Điều khoản Bảo hiểm P2P" subtitle="Bảo hiểm · P2P" back />

      <PageContent gap="relaxed">
        {/* Header card */}
        <TrCard className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
              <Shield size={24} color="#3B82F6" />
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, lineHeight: 1.3 }}>
                Điều khoản & Chính sách
              </p>
              <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>
                Quỹ Bảo Hiểm P2P
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <FileText size={12} color={c.text3} />
              <span style={{ color: c.text3, fontSize: 11 }}>Phiên bản {VERSION}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle size={12} color="#10B981" />
              <span style={{ color: c.text3, fontSize: 11 }}>Cập nhật: {LAST_UPDATED}</span>
            </div>
          </div>
        </TrCard>

        {/* Important notice */}
        <div
          className="p-4 rounded-xl flex items-start gap-3"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
        >
          <AlertTriangle size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: '#3B82F6', fontSize: φ.sm, lineHeight: 1.6 }}>
            Vui lòng đọc kỹ các điều khoản trước khi sử dụng dịch vụ bảo hiểm P2P.
            Bằng việc gửi yêu cầu bồi thường, bạn xác nhận đã đọc và đồng ý với toàn bộ điều khoản này.
          </p>
        </div>

        {/* Policy sections */}
        {POLICY_SECTIONS.map(section => (
          <TrCard key={section.id} className="p-5">
            <p style={{
              color: c.text1, fontSize: φ.body, fontWeight: 700,
              lineHeight: 1.5, marginBottom: 12,
            }}>
              {section.title}
            </p>
            <div className="flex flex-col gap-3">
              {section.content.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
                    style={{ background: c.text3 }}
                  />
                  <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.6 }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </TrCard>
        ))}

        {/* Privacy footer */}
        <div
          className="flex items-start gap-2 p-3 rounded-xl"
          style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
        >
          <Lock size={12} color={c.text3} className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
            Tài liệu này tuân thủ quy định bảo vệ dữ liệu cá nhân và được lưu trữ an toàn.
            Mọi thắc mắc vui lòng liên hệ support@platform.com.
          </p>
        </div>

        <div style={{ height: 8 }} />
      </PageContent>
    </PageLayout>
  );
}