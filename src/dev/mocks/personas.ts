export const DEV_PREVIEW_PERSONAS = [
  {
    id: 'developer',
    label: 'Developer · đăng nhập thường',
    email: 'developer@vittrade.local',
    password: 'Preview-123!',
  },
  {
    id: 'market',
    label: 'Market QA · watchlist và cảnh báo mock',
    email: 'market@vittrade.local',
    password: 'Preview-123!',
  },
  {
    id: 'demo',
    label: 'Demo · đăng nhập thường',
    email: 'demo@vittrade.vn',
    password: 'demo',
  },
  {
    id: 'arena',
    label: 'Arena · chỉ tham gia challenge mock',
    email: 'arena@vittrade.local',
    password: 'Preview-123!',
  },
  {
    id: 'wallet',
    label: 'Wallet · quyền giao dịch mock',
    email: 'wallet@vittrade.local',
    password: 'Preview-123!',
  },
  {
    id: 'dca',
    label: 'DCA · quyền quản lý kế hoạch mock',
    email: 'dca@vittrade.local',
    password: 'Preview-123!',
  },
  {
    id: 'support',
    label: 'Support · quyền nội dung và ticket mock',
    email: 'support@vittrade.local',
    password: 'Preview-123!',
  },
  {
    id: 'admin',
    label: 'Admin · chỉ xem dữ liệu quản trị mock',
    email: 'admin@vittrade.local',
    password: 'Preview-123!',
  },
  {
    id: 'mfa',
    label: 'MFA · cần mã xác thực',
    email: 'mfa@vittrade.local',
    password: 'Preview-123!',
  },
  {
    id: 'locked',
    label: 'Tài khoản bị khóa · HTTP 423',
    email: 'locked@vittrade.local',
    password: 'Preview-123!',
  },
] as const;

export type DevPreviewPersonaId = (typeof DEV_PREVIEW_PERSONAS)[number]['id'];
