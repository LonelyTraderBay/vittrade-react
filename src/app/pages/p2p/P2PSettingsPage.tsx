import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import {
  Bell, Shield, Eye, Clock, Globe, MessageSquare,
  ChevronRight, Lock, Smartphone, UserX, ToggleLeft, ToggleRight,
  Volume2, Fingerprint, AlertTriangle, Wallet, Settings2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';

/* ═══════════════════════════════════════════════════════════
   P2P Settings / Preferences Page
   Enterprise-level trading configuration
   ═══════════════════════════════════════════════════════════ */

export function P2PSettingsPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();

  /* ─── Trade Preferences ─── */
  const [defaultAsset, setDefaultAsset] = useState('USDT');
  const [defaultCurrency, setDefaultCurrency] = useState('VND');
  const [defaultPayWindow, setDefaultPayWindow] = useState('15');
  const [autoConfirmEnabled, setAutoConfirmEnabled] = useState(false);
  const [autoConfirmThreshold, setAutoConfirmThreshold] = useState('500000');

  /* ─── Notifications ─── */
  const [notifOrder, setNotifOrder] = useState(true);
  const [notifChat, setNotifChat] = useState(true);
  const [notifPrice, setNotifPrice] = useState(false);
  const [notifPromo, setNotifPromo] = useState(true);
  const [notifSound, setNotifSound] = useState(true);

  /* ─── Privacy ─── */
  const [showOnline, setShowOnline] = useState(true);
  const [showCompletion, setShowCompletion] = useState(true);
  const [showVolume, setShowVolume] = useState(false);
  const [showLastSeen, setShowLastSeen] = useState(true);

  /* ─── Security ─── */
  const [require2FA, setRequire2FA] = useState(true);
  const [requirePin, setRequirePin] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState(false);

  /* ─── Trading Hours ─── */
  const [tradingHoursMode, setTradingHoursMode] = useState<'247' | 'custom'>('247');
  const [customStart, setCustomStart] = useState('08:00');
  const [customEnd, setCustomEnd] = useState('22:00');

  /* ─── Auto Reply ─── */
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoReplyBuy, setAutoReplyBuy] = useState('Cảm ơn bạn! Vui lòng chuyển khoản theo thông tin bên dưới.');
  const [autoReplyEdit, setAutoReplyEdit] = useState(false);

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    hapticSuccess();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  /* ─── Toggle Row ─── */
  const ToggleRow = ({ icon: Icon, label, desc, value, onChange, color = '#3B82F6' }: {
    icon: React.ElementType; label: string; desc?: string;
    value: boolean; onChange: (v: boolean) => void; color?: string;
  }) => (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: color + '14' }}>
        <Icon size={14} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{label}</p>
        {desc && <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>{desc}</p>}
      </div>
      <button
        onClick={() => { onChange(!value); hapticSelection(); }}
        className="w-11 h-6 rounded-full relative shrink-0"
        style={{ background: value ? color : c.surface2, border: `1px solid ${value ? color : c.borderSolid}`, transition: 'all 0.25s ease' }}
      >
        <div className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
          style={{ background: '#fff', left: value ? 24 : 2 }} />
      </button>
    </div>
  );

  /* ─── Nav Row ─── */
  const NavRow = ({ icon: Icon, label, desc, color = '#3B82F6', onClick }: {
    icon: React.ElementType; label: string; desc?: string;
    color?: string; onClick: () => void;
  }) => (
    <button onClick={() => { onClick(); hapticSelection(); }}
      className="w-full flex items-center gap-3 py-3"
      style={{ borderBottom: `1px solid ${c.divider}` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: color + '14' }}>
        <Icon size={14} color={color} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{label}</p>
        {desc && <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>{desc}</p>}
      </div>
      <ChevronRight size={14} color={c.text3} />
    </button>
  );

  return (
    <PageLayout>
      <Header title="Cài đặt P2P" subtitle="Cài đặt · P2P" back />

      <div className="flex-1 px-5 py-4 pb-8 flex flex-col gap-5">
        {/* ═══ 1. Trade Preferences ═══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SectionLabel icon={Settings2} label="Tùy chọn giao dịch" color="#3B82F6" c={c} />
          <TrCard className="p-4">
            {/* Default Asset */}
            <div className="mb-3">
              <p style={{ color: c.text2, fontSize: 11, marginBottom: 6, fontWeight: 600 }}>Tài sản mặc định</p>
              <div className="flex gap-2">
                {['USDT', 'BTC', 'ETH', 'BNB'].map(a => (
                  <button key={a} onClick={() => { setDefaultAsset(a); hapticSelection(); }}
                    className="px-3 py-1.5 rounded-xl text-xs"
                    style={{
                      background: defaultAsset === a ? c.chipActiveBg : c.chipBg,
                      color: defaultAsset === a ? c.chipActiveText : c.chipText,
                      border: `1px solid ${defaultAsset === a ? c.chipActiveBorder : c.chipBorder}`,
                      fontWeight: 700,
                    }}>{a}</button>
                ))}
              </div>
            </div>

            {/* Default Currency */}
            <div className="mb-3">
              <p style={{ color: c.text2, fontSize: 11, marginBottom: 6, fontWeight: 600 }}>Tiền tệ mặc định</p>
              <div className="flex gap-2">
                {['VND', 'USD', 'EUR'].map(cr => (
                  <button key={cr} onClick={() => { setDefaultCurrency(cr); hapticSelection(); }}
                    className="px-3 py-1.5 rounded-xl text-xs"
                    style={{
                      background: defaultCurrency === cr ? c.chipActiveBg : c.chipBg,
                      color: defaultCurrency === cr ? c.chipActiveText : c.chipText,
                      border: `1px solid ${defaultCurrency === cr ? c.chipActiveBorder : c.chipBorder}`,
                      fontWeight: 700,
                    }}>{cr}</button>
                ))}
              </div>
            </div>

            {/* Default Payment Window */}
            <div className="mb-3">
              <p style={{ color: c.text2, fontSize: 11, marginBottom: 6, fontWeight: 600 }}>Thời gian thanh toán mặc định</p>
              <div className="flex gap-2">
                {['15', '30', '60'].map(w => (
                  <button key={w} onClick={() => { setDefaultPayWindow(w); hapticSelection(); }}
                    className="flex-1 py-2 rounded-xl text-xs"
                    style={{
                      background: defaultPayWindow === w ? c.chipActiveBg : c.chipBg,
                      color: defaultPayWindow === w ? c.chipActiveText : c.chipText,
                      border: `1px solid ${defaultPayWindow === w ? c.chipActiveBorder : c.chipBorder}`,
                      fontWeight: 700,
                    }}>{w} phút</button>
                ))}
              </div>
            </div>

            {/* Auto Confirm */}
            <ToggleRow
              icon={Wallet}
              label="Tự động xác nhận"
              desc={autoConfirmEnabled ? `Đơn dưới ${parseInt(autoConfirmThreshold).toLocaleString('vi')}đ` : 'Tắt — xác nhận thủ công'}
              value={autoConfirmEnabled}
              onChange={setAutoConfirmEnabled}
              color="#10B981"
            />
            {autoConfirmEnabled && (
              <div className="pl-11 pt-2">
                <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Ngưỡng tự động xác nhận (VND)</p>
                <div className="flex gap-2">
                  {['500000', '1000000', '5000000'].map(t => (
                    <button key={t} onClick={() => { setAutoConfirmThreshold(t); hapticSelection(); }}
                      className="px-2 py-1 rounded-lg text-xs"
                      style={{
                        background: autoConfirmThreshold === t ? 'rgba(16,185,129,0.12)' : c.surface2,
                        color: autoConfirmThreshold === t ? '#10B981' : c.text3,
                        fontWeight: 600,
                      }}>{parseInt(t).toLocaleString('vi')}đ</button>
                  ))}
                </div>
              </div>
            )}
          </TrCard>
        </motion.div>

        {/* ═══ 2. Notifications ═══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionLabel icon={Bell} label="Thông báo" color="#F59E0B" c={c} />
          <TrCard className="px-4">
            <ToggleRow icon={Bell} label="Đơn hàng" desc="Thông báo khi có đơn mới, xác nhận, tranh chấp" value={notifOrder} onChange={setNotifOrder} color="#3B82F6" />
            <ToggleRow icon={MessageSquare} label="Tin nhắn" desc="Thông báo tin nhắn mới trong chat" value={notifChat} onChange={setNotifChat} color="#10B981" />
            <ToggleRow icon={AlertTriangle} label="Cảnh báo giá" desc="Khi giá thị trường biến động lớn" value={notifPrice} onChange={setNotifPrice} color="#EF4444" />
            <ToggleRow icon={Globe} label="Khuyến mãi" desc="Ưu đãi phí, sự kiện P2P" value={notifPromo} onChange={setNotifPromo} color="#8B5CF6" />
            <ToggleRow icon={Volume2} label="Âm thanh" desc="Phát âm thanh khi có thông báo" value={notifSound} onChange={setNotifSound} color="#F59E0B" />
          </TrCard>
        </motion.div>

        {/* ═══ 3. Privacy ═══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SectionLabel icon={Eye} label="Quyền riêng tư" color="#8B5CF6" c={c} />
          <TrCard className="px-4">
            <ToggleRow icon={Eye} label="Trạng thái online" desc="Hiển thị trạng thái trực tuyến cho đối tác" value={showOnline} onChange={setShowOnline} color="#10B981" />
            <ToggleRow icon={Shield} label="Tỷ lệ hoàn thành" desc="Hiển thị % hoàn thành trên profile" value={showCompletion} onChange={setShowCompletion} color="#3B82F6" />
            <ToggleRow icon={Wallet} label="Khối lượng giao dịch" desc="Hiển thị tổng volume giao dịch" value={showVolume} onChange={setShowVolume} color="#F59E0B" />
            <ToggleRow icon={Clock} label="Lần hoạt động cuối" desc="Hiển thị 'hoạt động X phút trước'" value={showLastSeen} onChange={setShowLastSeen} color="#8B5CF6" />
          </TrCard>
        </motion.div>

        {/* ═══ 4. Security ═══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SectionLabel icon={Shield} label="Bảo mật giao dịch" color="#EF4444" c={c} />
          <TrCard className="px-4">
            <ToggleRow icon={Lock} label="Xác thực 2FA" desc="Yêu cầu 2FA cho mọi giao dịch P2P" value={require2FA} onChange={setRequire2FA} color="#EF4444" />
            <ToggleRow icon={Fingerprint} label="Mã PIN giao dịch" desc="Nhập PIN khi xác nhận đã nhận tiền" value={requirePin} onChange={setRequirePin} color="#8B5CF6" />
            <ToggleRow icon={Globe} label="IP Whitelist" desc="Chỉ cho phép giao dịch từ IP đã đăng ký" value={ipWhitelist} onChange={setIpWhitelist} color="#3B82F6" />
            <NavRow icon={Smartphone} label="Thiết bị tin cậy" desc="3 thiết bị đã xác minh" color="#10B981" onClick={() => navigate(`${prefix}/profile/devices`)} />
            <NavRow icon={UserX} label="Danh sách chặn" desc="Quản lý người dùng đã chặn" color="#EF4444" onClick={() => navigate(`${prefix}/p2p/blacklist`)} />
          </TrCard>
        </motion.div>

        {/* ═══ 5. Trading Hours ═══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <SectionLabel icon={Clock} label="Giờ giao dịch" color="#10B981" c={c} />
          <TrCard className="p-4">
            <div className="flex rounded-xl p-1 mb-3" style={{ background: c.surface2 }}>
              <button onClick={() => { setTradingHoursMode('247'); hapticSelection(); }}
                className="flex-1 py-2 rounded-lg text-xs"
                style={{ background: tradingHoursMode === '247' ? c.chipActiveBg : 'transparent', color: tradingHoursMode === '247' ? c.chipActiveText : c.text3, fontWeight: 700 }}>
                24/7
              </button>
              <button onClick={() => { setTradingHoursMode('custom'); hapticSelection(); }}
                className="flex-1 py-2 rounded-lg text-xs"
                style={{ background: tradingHoursMode === 'custom' ? c.chipActiveBg : 'transparent', color: tradingHoursMode === 'custom' ? c.chipActiveText : c.text3, fontWeight: 700 }}>
                Tùy chỉnh
              </button>
            </div>
            {tradingHoursMode === 'custom' && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Bắt đầu</p>
                  <div className="rounded-xl px-3 py-2 text-center"
                    style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                    <span style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{customStart}</span>
                  </div>
                </div>
                <span style={{ color: c.text3, fontSize: 14, marginTop: 14 }}>—</span>
                <div className="flex-1">
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Kết thúc</p>
                  <div className="rounded-xl px-3 py-2 text-center"
                    style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                    <span style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{customEnd}</span>
                  </div>
                </div>
              </div>
            )}
            <p className="mt-2" style={{ color: c.text3, fontSize: 10 }}>
              {tradingHoursMode === '247'
                ? 'Quảng cáo của bạn hiển thị mọi lúc.'
                : `Quảng cáo chỉ hiển thị từ ${customStart} đến ${customEnd} (GMT+7).`}
            </p>
          </TrCard>
        </motion.div>

        {/* ═══ 6. Auto-Reply Templates ═══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <SectionLabel icon={MessageSquare} label="Tin nhắn tự động" color="#3B82F6" c={c} />
          <TrCard className="p-4">
            <ToggleRow
              icon={MessageSquare}
              label="Tự động gửi tin nhắn"
              desc="Gửi ngay khi đối tác tạo đơn"
              value={autoReplyEnabled}
              onChange={setAutoReplyEnabled}
              color="#3B82F6"
            />
            {autoReplyEnabled && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <p style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>Mẫu tin nhắn MUA</p>
                  <button onClick={() => { setAutoReplyEdit(!autoReplyEdit); hapticSelection(); }}
                    style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>
                    {autoReplyEdit ? 'Xong' : 'Sửa'}
                  </button>
                </div>
                {autoReplyEdit ? (
                  <textarea
                    value={autoReplyBuy}
                    onChange={e => setAutoReplyBuy(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl px-3 py-2.5"
                    style={{ background: c.surface2, border: `1.5px solid ${c.chipActiveBorder}`, color: c.text1, fontSize: 12, outline: 'none', resize: 'none', lineHeight: 1.6 }}
                  />
                ) : (
                  <div className="rounded-xl px-3 py-2.5" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>{autoReplyBuy}</p>
                  </div>
                )}
              </div>
            )}
          </TrCard>
        </motion.div>

        {/* ═══ Save Button ═══ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <CTAButton onClick={handleSave} variant={saved ? 'success' : 'primary'}>
            {saved ? 'Đã lưu thành công!' : 'Lưu cài đặt'}
          </CTAButton>
        </motion.div>
      </div>
    </PageLayout>
  );
}

/* ═══ Section Label Sub-component ═══ */
function SectionLabel({ icon: Icon, label, color, c }: {
  icon: React.ElementType; label: string; color: string; c: Record<string, any>;
}) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <Icon size={14} color={color} />
      <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{label}</span>
    </div>
  );
}