import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Eye, Lock, RefreshCw, Shield, CheckCircle, X, Plus,
  AlertTriangle, Copy, Globe, Key,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { motion } from 'motion/react';

/**
 * ══════════════════════════════════════════════════════════
 *  ApiKeyCreatePage — Full-page multi-step API key creation
 * ══════════════════════════════════════════════════════════
 *  Converted from CreateKeySheet (bottom sheet) for
 *  better UX and consistency with enterprise pattern.
 *
 *  3-step flow: Form → Confirm → Result (show keys)
 */

const PERMISSION_CONFIG = {
  read: { label: 'Đọc dữ liệu', desc: 'Xem số dư, lịch sử giao dịch, thông tin tài khoản', color: '#3B82F6', icon: Eye },
  trade: { label: 'Giao dịch', desc: 'Đặt lệnh, hủy lệnh, chỉnh sửa lệnh', color: '#F59E0B', icon: RefreshCw },
  withdraw: { label: 'Rút tiền', desc: 'Rút tài sản ra ví ngoài — quyền nguy hiểm', color: '#EF4444', icon: Lock },
} as const;

type Permission = keyof typeof PERMISSION_CONFIG;

export function ApiKeyCreatePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticLight, hapticSuccess, hapticWarning } = useHaptic();

  // Form state
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>(['read']);
  const [ipInput, setIpInput] = useState('');
  const [ips, setIps] = useState<string[]>([]);
  const [expiry, setExpiry] = useState<'none' | '30d' | '90d' | '1y'>('none');

  // Steps
  const [step, setStep] = useState<'form' | 'confirm' | 'result'>('form');
  const [newKey, setNewKey] = useState<{ key: string; secret: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const togglePermission = (p: Permission) => {
    if (p === 'read') return; // read is always on
    if (p === 'withdraw') hapticWarning();
    else hapticLight();
    setPermissions(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const addIp = () => {
    const trimmed = ipInput.trim();
    if (!trimmed) return;
    // Basic IP validation
    if (!/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(trimmed)) return;
    if (!ips.includes(trimmed)) {
      setIps(prev => [...prev, trimmed]);
      hapticLight();
    }
    setIpInput('');
  };

  const handleCreate = () => {
    const key = 'vt_live_' + Array.from({ length: 32 }, () =>
      'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
    ).join('');
    const secret = 'sk_live_' + Array.from({ length: 32 }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
    ).join('');
    setNewKey({ key, secret });
    setStep('result');
    hapticSuccess();
  };

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    hapticLight();
    setTimeout(() => setCopiedField(null), 2000);
  };

  const canProceed = name.trim().length >= 3;

  const EXPIRY_OPTIONS = [
    { id: 'none', label: 'Không hết hạn', desc: 'Hoạt động vĩnh viễn' },
    { id: '30d', label: '30 ngày', desc: 'Hết hạn sau 1 tháng' },
    { id: '90d', label: '90 ngày', desc: 'Hết hạn sau 3 tháng' },
    { id: '1y', label: '1 năm', desc: 'Hết hạn sau 12 tháng' },
  ] as const;

  // ─── Step 3: Result ───
  if (step === 'result' && newKey) {
    return (
      <PageLayout>
        <Header title="API Key đã tạo" subtitle="API · Profile" back={false} />

        <PageContent gap="relaxed" grow>
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.25)' }}>
              <CheckCircle size={40} color="#10B981" />
            </div>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>Tạo thành công!</p>
          </motion.div>

          {/* Critical warning */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-3 rounded-2xl px-4 py-3"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle size={16} color="#EF4444" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                Lưu Secret Key ngay!
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Secret Key chỉ hiển thị <span style={{ fontWeight: 700, color: '#EF4444' }}>MỘT LẦN DUY NHẤT</span>.
                Sau khi rời trang này, bạn sẽ không thể xem lại.
              </p>
            </div>
          </motion.div>

          {/* API Key */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text3, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  API Key
                </span>
                <button
                  onClick={() => handleCopy('key', newKey.key)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                  style={{ background: copiedField === 'key' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.1)', border: `1px solid ${copiedField === 'key' ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.2)'}` }}
                >
                  {copiedField === 'key' ? <CheckCircle size={12} color="#10B981" /> : <Copy size={12} color="#3B82F6" />}
                  <span style={{ fontSize: 11, fontWeight: 600, color: copiedField === 'key' ? '#10B981' : '#3B82F6' }}>
                    {copiedField === 'key' ? 'Đã copy' : 'Sao chép'}
                  </span>
                </button>
              </div>
              <p style={{ color: c.text1, fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.6 }}>
                {newKey.key}
              </p>
            </TrCard>
          </motion.div>

          {/* Secret Key */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <TrCard className="p-4" accentBorder="rgba(239,68,68,0.2)">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: '#EF4444', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Secret Key
                </span>
                <button
                  onClick={() => handleCopy('secret', newKey.secret)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                  style={{ background: copiedField === 'secret' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.08)', border: `1px solid ${copiedField === 'secret' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.15)'}` }}
                >
                  {copiedField === 'secret' ? <CheckCircle size={12} color="#10B981" /> : <Copy size={12} color="#EF4444" />}
                  <span style={{ fontSize: 11, fontWeight: 600, color: copiedField === 'secret' ? '#10B981' : '#EF4444' }}>
                    {copiedField === 'secret' ? 'Đã copy' : 'Sao chép'}
                  </span>
                </button>
              </div>
              <p style={{ color: c.text1, fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.6 }}>
                {newKey.secret}
              </p>
            </TrCard>
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <TrCard className="p-4">
              <p style={{ color: c.text3, fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Chi tiết
              </p>
              {[
                { k: 'Tên', v: name },
                { k: 'Quyền', v: permissions.map(p => PERMISSION_CONFIG[p].label).join(', ') },
                { k: 'IP Whitelist', v: ips.length > 0 ? `${ips.length} IPs` : 'Không giới hạn' },
                { k: 'Hết hạn', v: EXPIRY_OPTIONS.find(e => e.id === expiry)?.label || 'Không' },
              ].map(row => (
                <div key={row.k} className="flex justify-between py-1.5">
                  <span style={{ color: c.text3, fontSize: 12 }}>{row.k}</span>
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{row.v}</span>
                </div>
              ))}
            </TrCard>
          </motion.div>
        </PageContent>

        <PageContent padding="compact">
          <CTAButton onClick={() => navigate(`${prefix}/profile/api`)}>
            Đã lưu, quay lại
          </CTAButton>
        </PageContent>
      </PageLayout>
    );
  }

  // ─── Step 2: Confirm ───
  if (step === 'confirm') {
    return (
      <PageLayout>
        <Header title="Xác nhận tạo API Key" subtitle="API · Profile" back />

        <PageContent gap="relaxed" grow>
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.25)' }}>
              <CheckCircle size={40} color="#10B981" />
            </div>
            <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>Xác nhận tạo API Key</p>
          </motion.div>

          <TrCard className="p-4">
            {[
              { k: 'Tên API Key', v: name },
              { k: 'Quyền truy cập', v: permissions.map(p => PERMISSION_CONFIG[p].label).join(', ') },
              { k: 'IP Whitelist', v: ips.length > 0 ? ips.join(', ') : 'Không giới hạn' },
              { k: 'Thời hạn', v: EXPIRY_OPTIONS.find(e => e.id === expiry)?.label || 'Không hết hạn' },
            ].map(row => (
              <div key={row.k} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                <span style={{ color: c.text2, fontSize: 13 }}>{row.k}</span>
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{row.v}</span>
              </div>
            ))}
          </TrCard>

          {permissions.includes('withdraw') && (
            <div className="flex items-start gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={16} color="#EF4444" className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Cảnh báo bảo mật</p>
                <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                  API Key này có quyền <span style={{ fontWeight: 700, color: '#EF4444' }}>rút tiền</span>.
                  Hãy chắc chắn giới hạn IP và bảo mật key cẩn thận.
                </p>
              </div>
            </div>
          )}

          {ips.length === 0 && (
            <div className="flex items-start gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <AlertTriangle size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
              <p style={{ color: '#F59E0B', fontSize: 12, lineHeight: 1.6 }}>
                Key không giới hạn IP. Bất kỳ ai có key đều có thể truy cập. Khuyến nghị thêm IP whitelist.
              </p>
            </div>
          )}
        </PageContent>

        <PageContent padding="compact">
          <div className="flex flex-col gap-3">
            <CTAButton onClick={handleCreate}>
              Tạo API Key
            </CTAButton>
            <button onClick={() => { setStep('form'); hapticLight(); }}
              style={{ color: c.text2, fontSize: 14, fontWeight: 600, padding: '8px 0' }}>
              Quay lại chỉnh sửa
            </button>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  // ─── Step 1: Form ───
  return (
    <PageLayout>
      <Header title="Tạo API Key mới" subtitle="API · Profile" back />

      <PageContent gap="relaxed" grow>
        {/* ═══ Name ═══ */}
        <div>
          <label style={{ color: c.text2, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Tên API Key <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="VD: Trading Bot Alpha, Portfolio Tracker..."
            maxLength={30}
            className="w-full rounded-2xl px-4"
            style={{
              background: c.surface2,
              border: `1.5px solid ${name.trim().length >= 3 ? c.chipActiveBorder : c.borderSolid}`,
              color: c.text1,
              fontSize: 15,
              height: 52,
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
          />
          <div className="flex justify-between mt-1.5 px-1">
            <span style={{ color: c.text3, fontSize: 11 }}>Tối thiểu 3 ký tự</span>
            <span style={{ color: name.length > 25 ? '#F59E0B' : c.text3, fontSize: 11 }}>
              {name.length}/30
            </span>
          </div>
        </div>

        {/* ═══ Permissions ═══ */}
        <div>
          <label style={{ color: c.text2, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Quyền truy cập <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <div className="flex flex-col gap-2.5">
            {(Object.entries(PERMISSION_CONFIG) as [Permission, typeof PERMISSION_CONFIG[Permission]][]).map(([key, cfg]) => {
              const isActive = permissions.includes(key);
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => togglePermission(key)}
                  className="flex items-center gap-3 p-4 rounded-2xl w-full"
                  style={{
                    background: isActive ? cfg.color + '0A' : c.surface2,
                    border: `1.5px solid ${isActive ? cfg.color + '44' : c.borderSolid}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: isActive ? cfg.color + '15' : c.surface, border: `1px solid ${isActive ? cfg.color + '33' : c.borderSolid}` }}>
                    <Icon size={18} color={isActive ? cfg.color : c.text3} />
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ color: isActive ? c.text1 : c.text2, fontSize: 14, fontWeight: 600 }}>
                      {cfg.label}
                      {key === 'read' && <span style={{ color: c.text3, fontWeight: 400 }}> (bắt buộc)</span>}
                    </p>
                    <p style={{ color: c.text3, fontSize: 12 }}>{cfg.desc}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{
                      borderColor: isActive ? cfg.color : c.borderSolid,
                      background: isActive ? cfg.color : 'transparent',
                      transition: 'all 0.2s ease',
                    }}>
                    {isActive && <CheckCircle size={14} color="#fff" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ IP Whitelist ═══ */}
        <div>
          <label style={{ color: c.text2, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            IP Whitelist <span style={{ color: c.text3, fontWeight: 400 }}>(khuyến nghị)</span>
          </label>
          <div className="flex gap-2">
            <input
              value={ipInput}
              onChange={e => setIpInput(e.target.value)}
              placeholder="VD: 192.168.1.100"
              className="flex-1 rounded-2xl px-4"
              style={{
                background: c.surface2,
                border: `1.5px solid ${c.borderSolid}`,
                color: c.text1,
                fontSize: 14,
                height: 48,
                outline: 'none',
                fontFamily: 'monospace',
              }}
              onKeyDown={e => e.key === 'Enter' && addIp()}
            />
            <button
              onClick={addIp}
              className="h-12 px-5 rounded-2xl font-semibold"
              style={{ background: '#3B82F6', color: '#fff', fontSize: 14 }}
            >
              <Plus size={16} />
            </button>
          </div>
          {ips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {ips.map((ip, i) => (
                <span key={ip} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                  <Globe size={11} />
                  {ip}
                  <button onClick={() => setIps(prev => prev.filter((_, j) => j !== i))}>
                    <X size={11} color="#10B981" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {ips.length === 0 && (
            <p style={{ color: '#F59E0B', fontSize: 11, marginTop: 6, paddingLeft: 4 }}>
              Không có IP whitelist — key có thể được dùng từ bất kỳ đâu
            </p>
          )}
        </div>

        {/* ═══ Expiry ═══ */}
        <div>
          <label style={{ color: c.text2, fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Thời hạn
          </label>
          <div className="grid grid-cols-2 gap-2">
            {EXPIRY_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => { setExpiry(opt.id); hapticLight(); }}
                className="flex flex-col items-start px-3 py-2.5 rounded-xl"
                style={{
                  background: expiry === opt.id ? c.chipActiveBg : c.surface2,
                  color: expiry === opt.id ? c.chipActiveText : c.chipText,
                  border: `1.5px solid ${expiry === opt.id ? c.chipActiveBorder : c.borderSolid}`,
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</span>
                <span style={{ fontSize: 10, color: c.text3 }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ Withdraw warning ═══ */}
        {permissions.includes('withdraw') && (
          <div className="flex items-start gap-3 rounded-2xl px-4 py-3"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle size={16} color="#EF4444" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Cảnh báo: Quyền rút tiền</p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Quyền rút tiền rất nguy hiểm. Chỉ bật khi thực sự cần thiết.
                Luôn giới hạn IP khi cấp quyền này.
              </p>
            </div>
          </div>
        )}

        {/* ═══ Security tips ═══ */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} color="#3B82F6" />
            <span style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600 }}>Mẹo bảo mật</span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              'Luôn giới hạn IP whitelist cho API key',
              'Không chia sẻ Secret Key với bất kỳ ai',
              'Tạo key riêng cho từng ứng dụng/bot',
              'Chỉ cấp quyền tối thiểu cần thiết',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(59,130,246,0.12)' }}>
                  <span style={{ color: '#3B82F6', fontSize: 9, fontWeight: 700 }}>{i + 1}</span>
                </div>
                <span style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </TrCard>
      </PageContent>

      {/* ═══ CTA ═══ */}
      <PageContent padding="compact">
        <CTAButton onClick={() => { setStep('confirm'); hapticLight(); }} disabled={!canProceed}>
          Tiếp tục
        </CTAButton>
      </PageContent>
    </PageLayout>
  );
}