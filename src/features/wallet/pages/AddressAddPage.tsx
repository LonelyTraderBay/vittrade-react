import { useState } from 'react';
import { AlertTriangle, CheckCircle, Clipboard, Shield } from 'lucide-react';
import { useNavigate } from 'react-router';
import { CTAButton } from '@/shared/ui/CTAButton';
import { Header } from '@/shared/ui/layout/Header';
import { InputField } from '@/shared/ui/InputField';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout, StickyFooter } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useActionToast } from '@/shared/hooks/useActionToast';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { useWalletAddressBookCreateMutation } from '../model/wallet-queries';

const NETWORKS = ['BTC', 'ETH (ERC20)', 'BSC (BEP20)', 'TRC20', 'SOL', 'Polygon'];
const ASSETS = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'MATIC'];
const ADDRESS_HINTS: Record<string, string> = {
  BTC: 'Bắt đầu với bc1…, 1… hoặc 3…',
  'ETH (ERC20)': 'Bắt đầu với 0x… (42 ký tự)',
  'BSC (BEP20)': 'Bắt đầu với 0x… (42 ký tự)',
  TRC20: 'Bắt đầu với T… (34 ký tự)',
  SOL: 'Base58, 32–44 ký tự',
  Polygon: 'Bắt đầu với 0x… (42 ký tự)',
};

function idempotencyKey() {
  return `address-book-create-${crypto.randomUUID()}`;
}

export function AddressAddPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const toast = useActionToast();
  const { hasPermission } = useAuth();
  const canManageAddressBook =
    hasPermission('wallet:write') || hasPermission('wallet:address-book');
  const createMutation = useWalletAddressBookCreateMutation();
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('ETH (ERC20)');
  const [asset, setAsset] = useState('ETH');
  const [memo, setMemo] = useState('');
  const [whitelisted, setWhitelisted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const canSave =
    canManageAddressBook && label.trim().length > 0 && address.trim().length >= 20 && confirmed;

  const handlePaste = async () => {
    try {
      const value = await navigator.clipboard.readText();
      if (value) setAddress(value);
    } catch {
      toast.error('Không thể đọc clipboard.');
    }
  };

  const handleSave = () => {
    void createMutation
      .mutateAsync({
        request: {
          label: label.trim(),
          address: address.trim(),
          network,
          asset,
          memo: memo.trim() || undefined,
          isWhitelisted: whitelisted,
        },
        idempotencyKey: idempotencyKey(),
      })
      .then(() => {
        toast.success(`Đã lưu địa chỉ “${label.trim()}”.`);
        navigate(`${prefix}/wallet/address-book`);
      })
      .catch(() => toast.error('Không thể lưu địa chỉ. Vui lòng kiểm tra thông tin.'));
  };

  return (
    <PageLayout variant="flush">
      <Header title="Thêm địa chỉ mới" subtitle="Sổ địa chỉ · Wallet" back />
      <PageContent gap="relaxed" grow>
        {!canManageAddressBook && (
          <p role="alert" style={{ color: colors.error, fontSize: 12 }}>
            Wallet address-book permission is required to add a withdrawal address.
          </p>
        )}
        <InputField
          id="wallet-address-book-label"
          label={
            <>
              Tên địa chỉ{' '}
              <span aria-hidden="true" style={{ color: colors.error }}>
                *
              </span>
            </>
          }
          required
          value={label}
          disabled={!canManageAddressBook}
          onChange={(event) => setLabel(event.target.value)}
          maxLength={30}
          placeholder="Ví lạnh cá nhân, Sàn Binance…"
        />
        <div>
          <p style={{ color: colors.text2, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Mạng lưới
          </p>
          <div className="grid grid-cols-3 gap-2">
            {NETWORKS.map((item) => (
              <button
                key={item}
                disabled={!canManageAddressBook}
                onClick={() => setNetwork(item)}
                aria-pressed={network === item}
                className="px-2 py-2.5 rounded-xl text-xs font-semibold"
                style={{
                  background: network === item ? colors.chipActiveBg : colors.surface2,
                  color: network === item ? colors.chipActiveText : colors.chipText,
                  border: `1px solid ${network === item ? colors.chipActiveBorder : colors.borderSolid}`,
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ color: colors.text2, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Tài sản
          </p>
          <div className="flex flex-wrap gap-2">
            {ASSETS.map((item) => (
              <button
                key={item}
                disabled={!canManageAddressBook}
                onClick={() => setAsset(item)}
                aria-pressed={asset === item}
                className="px-4 py-2 rounded-xl text-xs font-semibold"
                style={{
                  background: asset === item ? colors.chipActiveBg : colors.chipBg,
                  color: asset === item ? colors.chipActiveText : colors.chipText,
                  border: `1px solid ${asset === item ? colors.chipActiveBorder : colors.chipBorder}`,
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <InputField
          id="wallet-address-book-address"
          label={
            <>
              Địa chỉ ví{' '}
              <span aria-hidden="true" style={{ color: colors.error }}>
                *
              </span>
            </>
          }
          required
          value={address}
          disabled={!canManageAddressBook}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Nhập hoặc dán địa chỉ…"
          className="font-mono"
          style={{ fontSize: 13, fontFamily: 'monospace' }}
          helper={ADDRESS_HINTS[network]}
          suffix={
            <button
              type="button"
              disabled={!canManageAddressBook}
              onClick={handlePaste}
              aria-label="Dán địa chỉ từ clipboard"
              className="p-1.5 rounded-lg"
              style={{ background: colors.hoverBg }}
            >
              <Clipboard size={16} color={colors.text2} />
            </button>
          }
        />
        <InputField
          id="wallet-address-book-memo"
          label={
            <>
              Memo / Tag <span style={{ color: colors.text3, fontWeight: 400 }}>(tùy chọn)</span>
            </>
          }
          value={memo}
          disabled={!canManageAddressBook}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="Nhập memo nếu cần…"
        />
        <TrCard className="p-4">
          <button
            disabled={!canManageAddressBook}
            onClick={() => setWhitelisted((value) => !value)}
            aria-pressed={whitelisted}
            className="flex items-center gap-3 w-full"
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: whitelisted ? 'rgba(16,185,129,0.1)' : colors.surface2 }}
            >
              <Shield size={18} color={whitelisted ? '#10B981' : colors.text3} />
            </div>
            <div className="flex-1 text-left">
              <p style={{ color: colors.text1, fontSize: 14, fontWeight: 600 }}>
                Thêm vào Whitelist
              </p>
              <p style={{ color: colors.text3, fontSize: 12 }}>
                Chỉ rút tiền đến địa chỉ whitelist
              </p>
            </div>
            <span
              className="w-11 h-6 rounded-full relative"
              style={{
                background: whitelisted ? '#10B981' : colors.surface2,
                border: `1px solid ${colors.borderSolid}`,
              }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                style={{ left: whitelisted ? 22 : 3 }}
              />
            </span>
          </button>
        </TrCard>
        <div
          className="flex items-start gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
        >
          <AlertTriangle size={16} color="#F59E0B" />
          <p style={{ color: colors.text2, fontSize: 12, lineHeight: 1.6 }}>
            Kiểm tra kỹ địa chỉ và mạng lưới. Gửi sai địa chỉ có thể mất tài sản vĩnh viễn.
          </p>
        </div>
        <button
          disabled={!canManageAddressBook}
          onClick={() => setConfirmed((value) => !value)}
          aria-pressed={confirmed}
          className="flex items-start gap-3"
        >
          <span
            className="w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0"
            style={{
              borderColor: confirmed ? '#10B981' : colors.borderSolid,
              background: confirmed ? '#10B981' : 'transparent',
            }}
          >
            {confirmed && <CheckCircle size={14} color="#fff" />}
          </span>
          <span style={{ color: colors.text2, fontSize: 13, lineHeight: 1.5, textAlign: 'left' }}>
            Tôi xác nhận địa chỉ ví và mạng lưới chính xác. Tôi hiểu giao dịch sai địa chỉ không thể
            hoàn lại.
          </span>
        </button>
      </PageContent>
      <StickyFooter>
        <CTAButton onClick={handleSave} disabled={!canSave || createMutation.isPending}>
          {createMutation.isPending ? 'Đang lưu…' : 'Lưu địa chỉ'}
        </CTAButton>
      </StickyFooter>
    </PageLayout>
  );
}
