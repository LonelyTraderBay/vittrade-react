import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  QrCode, AlertTriangle, CheckCircle, Shield,
  ArrowLeft, Clipboard,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { motion } from 'motion/react';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';

/**
 * ══════════════════════════════════════════════════════════
 *  AddressAddPage — Full-page form to add new saved address
 * ══════════════════════════════════════════════════════════
 *  Converted from AddAddressSheet (bottom sheet) for
 *  better UX and consistency with P2P module pattern.
 */

const NETWORKS = [
  { id: 'btc', label: 'BTC', color: '#F7931A' },
  { id: 'erc20', label: 'ETH (ERC20)', color: '#627EEA' },
  { id: 'bep20', label: 'BSC (BEP20)', color: '#F3BA2F' },
  { id: 'trc20', label: 'TRC20', color: '#EF4444' },
  { id: 'sol', label: 'SOL', color: '#9945FF' },
  { id: 'polygon', label: 'Polygon', color: '#8247E5' },
];

const ASSETS = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'MATIC'];

/** Network → Address format hint */
const ADDRESS_HINTS: Record<string, string> = {
  'BTC': 'Bắt đầu với bc1... hoặc 1... hoặc 3...',
  'ETH (ERC20)': 'Bắt đầu với 0x... (42 ký tự)',
  'BSC (BEP20)': 'Bắt đầu với 0x... (42 ký tự)',
  'TRC20': 'Bắt đầu với T... (34 ký tự)',
  'SOL': 'Base58, 32-44 ký tự',
  'Polygon': 'Bắt đầu với 0x... (42 ký tự)',
};

export function AddressAddPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticLight, hapticSuccess } = useHaptic();
  const actionToast = useActionToast();

  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('ETH (ERC20)');
  const [asset, setAsset] = useState('ETH');
  const [agreed, setAgreed] = useState(false);
  const [whitelist, setWhitelist] = useState(false);
  const [memo, setMemo] = useState('');
  const [saved, setSaved] = useState(false);

  const canSave = label.trim().length > 0 && address.trim().length > 8 && agreed;

  const handleSave = () => {
    if (!canSave) return;
    setSaved(true);
    actionToast.success(TOAST.WALLET.ADDRESS_SAVED(label), { haptic: 'success' });
    setTimeout(() => {
      navigate(`${prefix}/wallet/address-book`);
    }, 1500);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAddress(text);
        hapticLight();
      }
    } catch {
      // Clipboard API not available
    }
  };

  // ─── Success state ───
  if (saved) {
    return (
      <PageLayout>
        <Header title="Thêm địa chỉ" subtitle="Sổ địa chỉ · Wallet" back />
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.25)' }}
          >
            <CheckCircle size={40} color="#10B981" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>Đã lưu thành công!</p>
            <p style={{ color: c.text2, fontSize: 14, marginTop: 6 }}>
              Địa chỉ "{label}" đã được thêm vào sổ địa chỉ.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
          >
            <Shield size={14} color="#10B981" />
            <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>
              {whitelist ? 'Đã thêm vào whitelist' : 'Chưa whitelist — có thể bật sau'}
            </span>
          </motion.div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout variant="flush">
      <Header title="Thêm địa chỉ mới" subtitle="Sổ địa chỉ · Wallet" back />

      <PageContent gap="relaxed" grow>
        {/* ═══ Label ═══ */}
        <div>
          <label style={{ color: c.text2, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Tên địa chỉ <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="VD: Ví lạnh cá nhân, Sàn Binance..."
            maxLength={30}
            className="w-full rounded-2xl px-4"
            style={{
              background: c.surface2,
              border: `1.5px solid ${label.trim() ? c.chipActiveBorder : c.borderSolid}`,
              color: c.text1,
              fontSize: 15,
              height: 52,
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
          />
          <div className="flex justify-between mt-1.5 px-1">
            <span style={{ color: c.text3, fontSize: 11 }}>Đặt tên dễ nhớ cho ví</span>
            <span style={{ color: label.length > 25 ? '#F59E0B' : c.text3, fontSize: 11 }}>
              {label.length}/30
            </span>
          </div>
        </div>

        {/* ═══ Network ═══ */}
        <div>
          <label style={{ color: c.text2, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Mạng lưới <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {NETWORKS.map(n => (
              <button
                key={n.id}
                onClick={() => { setNetwork(n.label); hapticLight(); }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{
                  background: network === n.label ? c.chipActiveBg : c.surface2,
                  color: network === n.label ? c.chipActiveText : c.chipText,
                  border: `1.5px solid ${network === n.label ? c.chipActiveBorder : c.borderSolid}`,
                  transition: 'all 0.2s ease',
                }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: n.color }} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>{n.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ Asset ═══ */}
        <div>
          <label style={{ color: c.text2, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Tài sản
          </label>
          <div className="flex flex-wrap gap-2">
            {ASSETS.map(a => (
              <button
                key={a}
                onClick={() => { setAsset(a); hapticLight(); }}
                className="px-4 py-2 rounded-xl"
                style={{
                  background: asset === a ? c.chipActiveBg : c.chipBg,
                  color: asset === a ? c.chipActiveText : c.chipText,
                  border: `1px solid ${asset === a ? c.chipActiveBorder : c.chipBorder}`,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ Address ═══ */}
        <div>
          <label style={{ color: c.text2, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Địa chỉ ví <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <div
            className="flex items-center gap-2 rounded-2xl px-4"
            style={{
              background: c.surface2,
              border: `1.5px solid ${address.trim().length > 8 ? c.chipActiveBorder : c.borderSolid}`,
              minHeight: 52,
              borderRadius: 14,
              transition: 'border-color 0.2s ease',
            }}
          >
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Nhập hoặc dán địa chỉ..."
              className="flex-1"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: c.text1,
                fontSize: 13,
                fontFamily: 'monospace',
              }}
            />
            <button onClick={handlePaste} className="shrink-0 p-1.5 rounded-lg" style={{ background: c.hoverBg }}>
              <Clipboard size={16} color={c.text2} />
            </button>
            <button className="shrink-0 p-1.5 rounded-lg" style={{ background: c.hoverBg }}>
              <QrCode size={16} color={c.text2} />
            </button>
          </div>
          <span style={{ color: c.text3, fontSize: 11, marginTop: 4, display: 'block', paddingLeft: 4 }}>
            {ADDRESS_HINTS[network] || 'Nhập chính xác địa chỉ ví'}
          </span>
        </div>

        {/* ═══ Memo (Optional) ═══ */}
        <div>
          <label style={{ color: c.text2, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Memo / Tag <span style={{ color: c.text3, fontWeight: 400 }}>(tùy chọn)</span>
          </label>
          <input
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="Nhập memo nếu cần..."
            className="w-full rounded-2xl px-4"
            style={{
              background: c.surface2,
              border: `1.5px solid ${c.borderSolid}`,
              color: c.text1,
              fontSize: 14,
              height: 48,
              outline: 'none',
            }}
          />
        </div>

        {/* ═══ Whitelist toggle ═══ */}
        <TrCard className="p-4">
          <button onClick={() => { setWhitelist(!whitelist); hapticLight(); }} className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: whitelist ? 'rgba(16,185,129,0.1)' : c.surface2, border: `1px solid ${whitelist ? 'rgba(16,185,129,0.3)' : c.borderSolid}` }}>
              <Shield size={18} color={whitelist ? '#10B981' : c.text3} />
            </div>
            <div className="flex-1 text-left">
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Thêm vào Whitelist</p>
              <p style={{ color: c.text3, fontSize: 12 }}>Chỉ rút tiền đến địa chỉ whitelist</p>
            </div>
            <div className="w-11 h-6 rounded-full relative"
              style={{
                background: whitelist ? '#10B981' : c.surface2,
                border: `1.5px solid ${whitelist ? '#10B981' : c.borderSolid}`,
                transition: 'all 0.2s ease',
              }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
                style={{
                  left: whitelist ? 22 : 3,
                  transition: 'left 0.2s ease',
                }}
              />
            </div>
          </button>
        </TrCard>

        {/* ═══ Warning ═══ */}
        <div className="flex items-start gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <AlertTriangle size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Lưu ý quan trọng</p>
            <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
              Kiểm tra kỹ địa chỉ và mạng lưới trước khi lưu.
              Rút tiền sai địa chỉ hoặc sai mạng sẽ mất vĩnh viễn
              và không thể khôi phục.
            </p>
          </div>
        </div>

        {/* ═══ Agreement ═══ */}
        <button onClick={() => { setAgreed(!agreed); hapticLight(); }} className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5"
            style={{
              borderColor: agreed ? '#10B981' : c.borderSolid,
              background: agreed ? '#10B981' : 'transparent',
              transition: 'all 0.2s ease',
            }}>
            {agreed && <CheckCircle size={14} color="#fff" />}
          </div>
          <span style={{ color: c.text2, fontSize: 13, lineHeight: 1.5, textAlign: 'left' }}>
            Tôi xác nhận địa chỉ ví và mạng lưới chính xác.
            Tôi hiểu rằng gửi tiền sai địa chỉ sẽ không thể hoàn lại.
          </span>
        </button>

        {/* ═══ Preview card ═══ */}
        {label.trim() && address.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <TrCard className="p-4">
              <p style={{ color: c.text3, fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Xem trước
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { k: 'Tên', v: label },
                  { k: 'Mạng', v: network },
                  { k: 'Tài sản', v: asset },
                  { k: 'Địa chỉ', v: `${address.slice(0, 16)}...${address.length > 16 ? address.slice(-8) : ''}` },
                  ...(memo ? [{ k: 'Memo', v: memo }] : []),
                  { k: 'Whitelist', v: whitelist ? '✓ Có' : '✕ Không' },
                ].map(row => (
                  <div key={row.k} className="flex justify-between">
                    <span style={{ color: c.text3, fontSize: 12 }}>{row.k}</span>
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: row.k === 'Địa chỉ' ? 'monospace' : 'inherit' }}>
                      {row.v}
                    </span>
                  </div>
                ))}
              </div>
            </TrCard>
          </motion.div>
        )}
      </PageContent>

      {/* ═══ CTA ═══ */}
      <StickyFooter>
        <CTAButton onClick={handleSave} disabled={!canSave}>
          Lưu địa chỉ
        </CTAButton>
      </StickyFooter>
    </PageLayout>
  );
}