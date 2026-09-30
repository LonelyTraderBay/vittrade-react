# Auth login MFA challenge flow

## Mục tiêu

Mô hình hóa đăng nhập có MFA thành một flow hai bước có contract rõ ràng: password
login chỉ tạo session khi backend xác nhận không cần MFA; nếu cần MFA, backend trả
challenge dùng một lần và frontend chuyển sang OTP. Không tạo authenticated session
hoặc phát access token trước khi challenge được xác minh.

## Hiện trạng và vấn đề

- `POST /auth/login` hiện được khai báo trả `AuthSession`, nhưng mô tả OpenAPI nói
  response có thể là session hoặc MFA challenge.
- `AuthApi.login`, `AuthAdapter.login`, `AuthContext.signIn` và hai trang login đều
  giả định request thành công luôn tạo session rồi điều hướng vào app.
- OTP page gọi `verifyMfa` với `contact`, `code` và `purpose`; không có challenge ID
  được backend phát hành để ràng buộc OTP với lần đăng nhập vừa hoàn tất password.
- Các màn hình MFA phía production vì vậy chưa có đường đi từ login response tới OTP.

## Thiết kế contract

`POST /auth/login` trả một discriminated union:

```ts
type LoginResult =
  | { status: 'authenticated'; session: AuthSession }
  | {
      status: 'mfa_required';
      challenge: {
        id: string;
        method: 'totp' | 'sms' | 'email';
        maskedDestination?: string;
        expiresAt: string;
      };
    };
```

`POST /auth/login/mfa/verify` nhận `{ challengeId, code }` và chỉ trả `AuthSession`
cho challenge còn hạn, chưa dùng, thuộc lần đăng nhập đó và được backend xác minh.
Challenge không chứa access token, refresh token, quyền hoặc thông tin user.

Backend chịu trách nhiệm rate limit, giới hạn số lần thử, hết hạn, single use,
account lockout và thu hồi challenge. Frontend không dùng `contact` hoặc `purpose`
do client tự chọn làm bằng chứng xác thực. Contract mô tả `400` cho mã sai, `410`
cho challenge không còn hợp lệ, `423` cho tài khoản bị khóa và `429` cho giới hạn
xác thực để UI xử lý đúng.

## Ranh giới và luồng frontend

1. Auth API parse cả hai nhánh `LoginResult` bằng runtime schema.
2. Shared auth provider chỉ gọi `applySession` khi nhận nhánh `authenticated`.
   Nhánh challenge không đặt trạng thái session, role, permission hay access token.
3. Phone và web login điều hướng tới OTP bằng navigation state chỉ gồm challenge ID,
   method, masked destination và expiry. Không ghi challenge vào local/session storage.
4. OTP page yêu cầu challenge state hợp lệ; khi thiếu hoặc hết hạn, trả user về login.
   Nếu challenge hết hạn trong khi trang đang mở, timer chuyển về login và submit
   cũng kiểm tra lại hạn ngay trước khi gọi API.
5. Verify dùng challenge-specific API. Session chỉ được áp dụng sau response hợp lệ.
   Verify thất bại phân biệt mã sai, challenge hết hạn, rate limit, account lockout
   và lỗi dịch vụ; recovery điều hướng về login hoặc account-locked khi phù hợp.
6. Thành công điều hướng tới route trong app bằng `replace`; nút resend chỉ xuất hiện
   sau khi backend có contract phát hành challenge mới.

## Tương thích và giới hạn

- Đăng nhập không yêu cầu MFA tiếp tục trả nhánh `authenticated`.
- Đăng nhập demo vẫn chỉ tồn tại trong dev/test và không tạo đường tắt production.
- Registration, password reset, password change và MFA setup giữ contract riêng;
  không tái sử dụng login challenge cho các mục đích đó.
- Contract tests dùng MSW và E2E chạy trên backend interceptors chứng minh frontend
  flow, nhưng không chứng minh cookie flags, rate limiting hay MFA policy của backend.
- Production certification vẫn cần kiểm thử HTTPS staging với backend thật.

## Tiêu chí chấp nhận

- OpenAPI response schema và TypeScript types khớp hai nhánh login.
- Payload login hoặc challenge không hợp lệ bị từ chối tại API boundary.
- Nhánh challenge không cấp session/token, và OTP verify chỉ gửi challenge ID cùng mã.
- Sai mã, challenge hết hạn, challenge thiếu và backend failure không vào app.
- Verify thành công tạo session memory-only và điều hướng vào app.
- Cả phone và web shell có test contract; demo/registration hiện hữu không đổi.
- Typecheck, lint, format, unit/integration, production build, auth E2E và security
  boundary checks qua. Backend staging được ghi nhận là bằng chứng riêng.

## Vòng đời session và vô hiệu hóa kết quả cũ

`AuthSessionProvider` sở hữu session trong bộ nhớ và access token; các feature đọc
trạng thái qua auth context. `operationRef.current` là số thứ tự của các thao tác
auth đang chạy. Một phản hồi chỉ được áp dụng session/token khi số đã chụp lúc bắt
đầu vẫn bằng số hiện tại.

| Sự kiện | Hành vi hiện tại trong provider | Điều kiện được phép cập nhật session/token |
|---|---|---|
| Mount với `initialSession` xác định | Dùng session đã truyền, không gọi `getSession`; effect nạp access token vào bộ nhớ | Chỉ giá trị khởi tạo của provider |
| Bootstrap `getSession` | Tăng số thao tác; cleanup khi unmount/đổi adapter; bỏ kết quả nếu thao tác không còn mới nhất | Provider còn hoạt động và số thao tác còn khớp |
| Login thường | Tăng số thao tác, chuyển sang loading; chỉ nhánh `authenticated` nhận session; nhánh MFA giữ unauthenticated | Số thao tác login còn khớp |
| Login đồng bộ tương thích (`loginSync`) | Chạy adapter đồng bộ; sau khi trả session thành công, tăng số thao tác rồi áp session/token | Login đồng bộ thành công vô hiệu mọi thao tác cũ; nếu adapter ném lỗi thì không đổi trạng thái |
| Login MFA, MFA xác minh, hoặc xác nhận MFA setup | Mỗi request tăng số thao tác; success áp session, lỗi được xử lý theo từng API | Số thao tác tương ứng còn khớp |
| Refresh do 401 hoặc timer gần hết hạn | `refreshSession` tăng số thao tác; success áp session/null; lỗi hiện trạng thái lỗi và xóa session | Số refresh còn khớp |
| Logout tại tab hiện hành | Tăng số thao tác, xóa session/token ngay, phát `logout` qua `BroadcastChannel`, rồi gọi API logout; lỗi mạng không khôi phục phiên cục bộ | Không có response logout nào được phép đặt lại session/token |
| Logout nhận từ tab khác | Tăng số thao tác trước khi gọi `applySession(null)` để xóa session/token | Mọi kết quả thành công/lỗi của operation bắt đầu trước message đều không thể ghi lại session, token hay lỗi lên provider |
| Đổi user ID hoặc logout làm user ID đổi | `SessionQueryCacheBoundary` xóa TanStack Query cache | Cache cũ không được giữ qua ranh giới người dùng |

### Bất biến và giới hạn

1. Logout cục bộ hoặc thông báo logout từ tab khác phải làm cũ mọi auth operation
   đã bắt đầu trước sự kiện đó; late success và late error không được ghi session,
   token, trạng thái lỗi hay quyền lên provider. Promise cũ vẫn trả kết quả theo API
   cho caller; route bảo vệ dựa trên auth context hiện tại để quyết định quyền truy cập.
2. Login mới sau logout được phép; chỉ operation mới nhất của cùng provider có thể
   cập nhật trạng thái của nó.
3. Token vẫn chỉ lưu trong bộ nhớ. Cache được xóa khi user ID đổi; auth provider là
   nguồn sự thật, không sao chép session vào feature.
4. F01 được tái hiện trên HEAD baseline `41869d7`: state `false/null` đổi thành
   `true/token` sau khi refresh cũ trả về sau logout từ tab khác. Regression A03.02
   tái hiện lỗi trước sửa; listener hiện tăng `operationRef` trước khi xóa session.
   Một regression riêng cũng bắt lỗi `loginSync` cũ ghi đè refresh đang chờ; login
   đồng bộ thành công hiện tăng serial trước khi áp session.
5. Kiểm thử frontend chỉ chứng minh trạng thái cục bộ. Thu hồi refresh cookie/token,
   khả năng dùng token cũ tại backend và dữ liệu thật phải được xác nhận riêng trên
   staging với backend.

### Kết quả kiểm chứng A03

- `AuthSessionProvider.test.tsx`, `AuthContext.tsx` và các auth tests liên quan: 18
  file, 130 test pass. Ma trận có late refresh/bootstrap/login/MFA success, late
  refresh error, login mới thắng kết quả cũ, `loginSync` thắng refresh cũ, và đóng
  channel/gỡ listener sau unmount.
- Hai TypeScript project checks, ESLint, Prettier và `git diff --check` pass; staging
  build pass; auth browser E2E pass 5/5 trên build staging với API interception.
- Đây là bằng chứng frontend dùng adapter/MSW/intercepted API. Chưa kiểm chứng cookie
  flags, thu hồi token server-side, rate limit hoặc dữ liệu backend thật.
