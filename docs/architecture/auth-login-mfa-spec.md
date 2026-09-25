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
