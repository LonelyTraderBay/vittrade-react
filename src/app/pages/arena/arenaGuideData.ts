import {
  Sparkles, Target, Users, Shield, Zap, Trophy, ChevronDown, ChevronUp,
  ChevronRight, Clock, CheckCircle, Play, HelpCircle, BookOpen, AlertTriangle,
  Star, FileText, Search, Eye, Lock, Award, ArrowRight, Info, Lightbulb,
  Gift, Layers, Settings, Percent, Receipt, BarChart3, ThumbsUp,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   Arena Guide Data — Separated for performance
   ═══════════════════════════════════════════════════════════ */

/* ─── Step-by-step: Tạo Challenge ─── */
export const STEPS_CREATE = [
  {
    step: 1,
    icon: Layers,
    title: 'Chọn Template',
    desc: 'Chọn template phù hợp: Dự đoán, Thử thách, Cá cược bạn bè... Mỗi template có luật và cấu trúc sẵn giúp bạn bắt đầu nhanh.',
    color: '#8B5CF6',
    tip: 'Bắt đầu với "Dự đoán giá" — đơn giản và phổ biến nhất.',
  },
  {
    step: 2,
    icon: Users,
    title: 'Thiết lập cấu trúc',
    desc: 'Chọn format: 1v1, team vs team hoặc Open Lobby. Cài đặt số người tham gia tối đa và kiểu tham gia (công khai, mời, unlisted).',
    color: '#3B82F6',
    tip: 'Open Lobby phù hợp khi bạn muốn nhiều người tham gia.',
  },
  {
    step: 3,
    icon: FileText,
    title: 'Viết luật chơi',
    desc: 'Đặt tên, mô tả rõ ràng, chọn điều kiện thắng, luật hòa và luật hủy. Luật càng rõ → tranh chấp càng ít.',
    color: '#10B981',
    tip: 'Dùng Smart Rule Builder để tạo luật chuyên nghiệp tự động.',
  },
  {
    step: 4,
    icon: Target,
    title: 'Chọn cách xác nhận kết quả',
    desc: 'Auto (từ nguồn dữ liệu), Mutual Confirm, Referee hoặc Community Vote. Chọn phù hợp với loại challenge.',
    color: '#F59E0B',
    tip: 'Auto resolution ít tranh chấp nhất — ưu tiên khi có thể.',
  },
  {
    step: 5,
    icon: Gift,
    title: 'Cài đặt Points & Phần thưởng',
    desc: 'Đặt entry points, chọn kiểu phân chia thưởng (Winner All, Top 3, chia đều...). Xem trước pool dự kiến.',
    color: '#EC4899',
    tip: 'Entry 50–200 pts thu hút nhiều người nhất theo thống kê.',
  },
  {
    step: 6,
    icon: CheckCircle,
    title: 'Review & Đăng',
    desc: 'Kiểm tra toàn bộ thông tin, preview trước khi publish. Hệ thống sẽ kiểm tra Rule Clarity Score và đưa gợi ý.',
    color: '#06B6D4',
    tip: 'Rule Clarity Score >= 80% → challenge ít bị tranh chấp.',
  },
];

/* ─── Step-by-step: Tham gia Challenge ─── */
export const STEPS_JOIN = [
  {
    step: 1,
    icon: Search,
    title: 'Tìm challenge phù hợp',
    desc: 'Duyệt danh sách phòng đang mở, lọc theo category, format, entry points hoặc tìm kiếm theo tên.',
    color: '#3B82F6',
    tip: 'Lọc theo "Fair Play" để chơi an toàn hơn.',
  },
  {
    step: 2,
    icon: Eye,
    title: 'Xem chi tiết & Luật chơi',
    desc: 'Đọc kỹ luật, điều kiện thắng, cách xác nhận kết quả. Kiểm tra Trust Score của creator.',
    color: '#8B5CF6',
    tip: 'Creator có Trust >= 85% thường tạo challenge chất lượng.',
  },
  {
    step: 3,
    icon: Zap,
    title: 'Tham gia & Đặt cược',
    desc: 'Xác nhận entry points, chọn vị trí/đội (nếu team). Points bị khóa trong pool cho đến khi có kết quả.',
    color: '#F59E0B',
    tip: 'Points được khóa an toàn — không ai có thể rút trước kết quả.',
  },
  {
    step: 4,
    icon: Trophy,
    title: 'Chờ kết quả & Nhận thưởng',
    desc: 'Kết quả tự xác nhận hoặc cần vote. Nếu thắng, points tự động chuyển vào ví. Thua thì mất entry.',
    color: '#10B981',
    tip: 'Theo dõi timeline trực tiếp trên trang challenge.',
  },
];

/* ─── Pro Tips for Creating Attractive Challenges ─── */
export const PRO_TIPS = [
  {
    icon: '🎯',
    title: 'Đặt tên hấp dẫn, rõ ràng',
    desc: 'Tên tốt: "BTC phá 100K trước 30/6?" — ngắn, rõ chủ đề, có deadline. Tránh: "Ai đoán đúng?"',
    category: 'naming',
    impact: 'high',
  },
  {
    icon: '📝',
    title: 'Viết luật chơi chi tiết',
    desc: 'Nêu rõ: nguồn dữ liệu, điều kiện thắng, cách xử lý hòa/hủy. Dùng Smart Rule Builder để tạo luật chuẩn tự động.',
    category: 'rules',
    impact: 'high',
  },
  {
    icon: '💰',
    title: 'Entry points vừa phải',
    desc: 'Entry 50–200 pts: thu hút nhiều người, rủi ro vừa. Entry quá cao (500+) chỉ phù hợp khi bạn đã có uy tín.',
    category: 'pricing',
    impact: 'high',
  },
  {
    icon: '⏰',
    title: 'Thời hạn hợp lý',
    desc: 'Challenge 1–7 ngày hoạt động tốt nhất. Quá ngắn (<1h) ít người kịp join, quá dài (>30 ngày) mất hứng thú.',
    category: 'timing',
    impact: 'medium',
  },
  {
    icon: '🏷️',
    title: 'Gắn tag đúng category',
    desc: 'Tag chính xác giúp challenge xuất hiện đúng đối tượng. Crypto, Sports, Tech... chọn phù hợp nội dung.',
    category: 'discovery',
    impact: 'medium',
  },
  {
    icon: '🛡️',
    title: 'Bật Fair Play badge',
    desc: 'Lưu challenge thành Mode và xây dựng Trust Score. Challenge có Fair Play badge thu hút gấp 2x người chơi.',
    category: 'trust',
    impact: 'high',
  },
  {
    icon: '🤖',
    title: 'Ưu tiên Auto Resolution',
    desc: 'Kết quả tự động = ít tranh chấp. Dùng nguồn dữ liệu uy tín (CoinGecko, ESPN...) nếu có thể.',
    category: 'resolution',
    impact: 'high',
  },
  {
    icon: '🏆',
    title: 'Phân thưởng hấp dẫn',
    desc: 'Top 3 hoặc Top 5 phù hợp khi >10 người. Winner Takes All kịch tính hơn cho 1v1 / nhóm nhỏ.',
    category: 'rewards',
    impact: 'medium',
  },
  {
    icon: '📢',
    title: 'Chia sẻ để thu hút',
    desc: 'Gửi link challenge cho bạn bè, share trên group. Challenge nhiều người tham gia = pool lớn hơn = hấp dẫn hơn.',
    category: 'marketing',
    impact: 'medium',
  },
  {
    icon: '🔄',
    title: 'Lưu thành Mode để tái sử dụng',
    desc: 'Mode hay sẽ được cộng đồng clone. Bạn nhận Trust Score + được hiển thị trong Creator nổi bật.',
    category: 'growth',
    impact: 'medium',
  },
];

/* ─── Safety Tips ─── */
export const SAFETY_TIPS = [
  { icon: Shield, title: 'Points, không phải tiền thật', desc: 'Arena chỉ dùng Arena Points — không liên quan đến tài sản crypto hay fiat. Chơi thoải mái, không rủi ro tài chính.', color: '#3B82F6' },
  { icon: Lock, title: 'Pool Points được khóa an toàn', desc: 'Entry points được khóa trong pool cho đến khi challenge kết thúc và có kết quả. Không ai (kể cả creator) rút được.', color: '#8B5CF6' },
  { icon: AlertTriangle, title: 'Đọc kỹ luật trước khi join', desc: 'Luôn đọc hết luật chơi, điều kiện thắng/thua, và cách xác nhận kết quả trước khi tham gia.', color: '#F59E0B' },
  { icon: Eye, title: 'Kiểm tra Trust Score của creator', desc: 'Ưu tiên challenge từ creator có Trust Score cao (>80%) và Fair Play badge. Xem lịch sử tranh chấp.', color: '#10B981' },
  { icon: Users, title: 'Báo cáo nếu nghi ngờ', desc: 'Thấy challenge bất thường? Nhấn "Báo cáo" — đội ngũ sẽ kiểm tra trong 24h. Bảo vệ cộng đồng!', color: '#EF4444' },
  { icon: FileText, title: 'Tranh chấp có quy trình rõ ràng', desc: 'Nếu không đồng ý kết quả, mở tranh chấp trong Resolution Center. Bằng chứng + cộng đồng vote = công bằng.', color: '#06B6D4' },
];

/* ─── FAQ ─── */
export const FAQ_DATA = [
  { q: 'Arena Points là gì?', a: 'Arena Points là đơn vị dùng trong Open Arena để tham gia challenge. Points không phải tiền thật và không liên quan đến crypto/fiat. Bạn nhận Points từ hoạt động trên nền tảng, hoàn thành nhiệm vụ, hoặc thắng challenge.' },
  { q: 'Tạo challenge có mất phí không?', a: 'Không mất phí tạo. Tuy nhiên, nếu bạn đặt entry points, bạn cũng cần stake cùng số points vào pool (tuỳ cấu hình). Creator có thể đặt creator cut (tối đa 5%) từ pool.' },
  { q: 'Làm sao để challenge thu hút nhiều người?', a: 'Đặt tên rõ ràng, entry points vừa phải (50–200), luật chơi minh bạch, dùng Auto Resolution nếu có thể, và chia sẻ link cho bạn bè. Challenge có Fair Play badge thu hút gấp 2x.' },
  { q: 'Kết quả được xác nhận như thế nào?', a: '4 cách: (1) Auto — lấy từ nguồn dữ liệu tự động, (2) Mutual Confirm — cả 2 bên xác nhận, (3) Referee — trọng tài quyết định, (4) Community Vote — cộng đồng bình chọn. Auto ít tranh chấp nhất.' },
  { q: 'Nếu tôi không đồng ý kết quả thì sao?', a: 'Bạn có thể mở tranh chấp (dispute) trong Resolution Center. Cung cấp bằng chứng, đợi đánh giá. Quy trình minh bạch với timeline rõ ràng.' },
  { q: 'Rule Clarity Score là gì?', a: 'Điểm đánh giá mức độ rõ ràng của luật chơi (0–100%). Hệ thống tự động phân tích tên, mô tả, điều kiện thắng, luật hòa/hủy. Score >= 80% giúp giảm tranh chấp và tăng uy tín.' },
  { q: 'Tôi có thể chỉnh sửa challenge sau khi đăng?', a: 'Không thể chỉnh sửa sau khi có người tham gia. Bạn có thể hủy challenge (nếu chưa ai join) hoặc tạo challenge mới. Lưu thành Mode để tái sử dụng dễ dàng.' },
  { q: 'Trust Score được tính như thế nào?', a: 'Dựa trên: tỷ lệ hoàn thành challenge, số tranh chấp, đánh giá từ cộng đồng, tuổi tài khoản, và Fair Play history. Score cao = được ưu tiên hiển thị.' },
  { q: 'Tiền thưởng từ đâu mà có?', a: 'Pool thưởng = tổng entry points của tất cả người tham gia. Người thắng nhận pool theo tỷ lệ phân chia đã được cài đặt từ đầu (minh bạch 100%).' },
];

/* ─── Example Challenges ─── */
export const EXAMPLE_CHALLENGES = [
  {
    title: 'BTC phá 100K trước 30/6?',
    template: 'Dự đoán giá',
    entry: 100,
    format: 'Open Lobby',
    resolution: 'Auto',
    players: '42/100',
    rating: 'Tốt',
    ratingColor: '#10B981',
    reasons: ['Tên rõ ràng, có deadline', 'Entry vừa phải', 'Auto resolution'],
  },
  {
    title: 'Ai đoán đúng?',
    template: 'Dự đoán',
    entry: 500,
    format: '1v1',
    resolution: 'Mutual',
    players: '0/2',
    rating: 'Cần cải thiện',
    ratingColor: '#F59E0B',
    reasons: ['Tên mơ hồ, thiếu chủ đề', 'Entry cao cho beginner', 'Thiếu mô tả chi tiết'],
  },
];

/* ─── Key Concepts ─── */
export const KEY_CONCEPTS = [
  { term: 'Arena Points', def: 'Đơn vị dùng trong Open Arena để tham gia challenge. Không phải tiền thật.' },
  { term: 'Template', def: 'Mẫu challenge có sẵn cấu trúc và luật — bạn chỉ cần điền nội dung.' },
  { term: 'Mode', def: 'Challenge template đã hoàn chỉnh, có thể chia sẻ và clone bởi người khác.' },
  { term: 'Resolution', def: 'Cách xác nhận kết quả: Auto, Mutual, Referee, hoặc Community Vote.' },
  { term: 'Trust Score', def: 'Điểm uy tín của creator dựa trên lịch sử tạo challenge và tỷ lệ tranh chấp.' },
  { term: 'Rule Clarity', def: 'Điểm đánh giá mức độ rõ ràng của luật chơi (0–100%). Càng cao càng ít tranh chấp.' },
  { term: 'Fair Play', def: 'Huy hiệu cho challenge/creator tuân thủ quy tắc cộng đồng. Tăng độ tin cậy.' },
];

/* ─── Checklist Items ─── */
export const CHECKLIST_ITEMS = [
  'Tên challenge rõ ràng, có chủ đề và deadline',
  'Mô tả đầy đủ điều kiện thắng/thua',
  'Entry points phù hợp đối tượng (50–200 pts)',
  'Chọn Resolution method (ưu tiên Auto)',
  'Kiểm tra Rule Clarity Score >= 80%',
  'Thiết lập luật hòa và luật hủy',
  'Preview và đọc lại toàn bộ trước khi đăng',
];
