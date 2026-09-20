import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { CTAButton } from '../../components/ui/CTAButton';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { P2P_PAYMENT_METHODS, P2PPaymentMethod } from '../../data/mockData';
import { φ, φIcon } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import {
  Plus, CreditCard, Smartphone, CheckCircle, Trash2, Edit3, Star,
  Shield, AlertTriangle,
} from 'lucide-react';

export function P2PPaymentMethodsPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess, hapticError } = useHaptic();
  const prefix = useRoutePrefix();
  const [methods, setMethods] = useState<P2PPaymentMethod[]>(P2P_PAYMENT_METHODS);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setMethods(prev => prev.filter(m => m.id !== id));
    setDeleteConfirm(null);
    hapticError();
  };

  const handleSetDefault = (id: string) => {
    setMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
    hapticSelection();
  };

  const bankMethods = methods.filter(m => m.type === 'bank');
  const ewalletMethods = methods.filter(m => m.type === 'ewallet');

  const renderMethod = (pm: P2PPaymentMethod) => (
    <TrCard key={pm.id} rounded="sm" className="p-4"
      accentBorder={pm.isDefault ? 'rgba(59,130,246,0.3)' : undefined}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: pm.type === 'bank' ? 'rgba(59,130,246,0.1)' : 'rgba(168,85,247,0.1)' }}>
          {pm.type === 'bank' ? <CreditCard size={φIcon.md} color="#3B82F6" /> : <Smartphone size={φIcon.md} color="#A855F7" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{pm.bankName}</span>
            {pm.isVerified && <Shield size={12} color="#10B981" fill="rgba(16,185,129,0.2)" />}
            {pm.isDefault && (
              <span className="px-1.5 py-0.5 rounded text-xs font-bold"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 9 }}>Mặc định</span>
            )}
          </div>
          <p style={{ color: c.text1, fontSize: φ.sm, fontFamily: 'monospace', fontWeight: 600 }}>{pm.accountNumber}</p>
          <p style={{ color: c.text3, fontSize: 11 }}>{pm.accountName}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => { navigate(`${prefix}/p2p/payment-method/add?type=${pm.type}`); hapticSelection(); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: c.surface2 }}>
            <Edit3 size={14} color={c.text2} />
          </button>
          <button onClick={() => setDeleteConfirm(pm.id)} className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.08)' }}>
            <Trash2 size={14} color="#EF4444" />
          </button>
        </div>
      </div>
      {!pm.isDefault && (
        <button onClick={() => handleSetDefault(pm.id)}
          className="w-full mt-3 py-2 rounded-lg text-xs font-semibold"
          style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}` }}>
          <Star size={10} className="inline mr-1" />Đặt làm mặc định
        </button>
      )}
      {!pm.isVerified && (
        <div className="flex items-center gap-1.5 mt-2">
          <AlertTriangle size={10} color="#F59E0B" />
          <span style={{ color: '#F59E0B', fontSize: 10 }}>Chưa xác minh — Cần xác minh để sử dụng trên P2P</span>
        </div>
      )}
    </TrCard>
  );

  return (
    <PageLayout>
      <Header title="Phương thức thanh toán" subtitle="Thanh toán · P2P" back />

      <PageContent gap="default">
        {/* Add Buttons */}
        <div className="flex gap-3">
          <button onClick={() => { navigate(`${prefix}/p2p/payment-method/add?type=bank`); hapticSelection(); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'rgba(59,130,246,0.08)', color: '#3B82F6', border: '1px dashed rgba(59,130,246,0.3)' }}>
            <Plus size={16} /><CreditCard size={14} /> Thêm ngân hàng
          </button>
          <button onClick={() => { navigate(`${prefix}/p2p/payment-method/add?type=ewallet`); hapticSelection(); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'rgba(168,85,247,0.08)', color: '#A855F7', border: '1px dashed rgba(168,85,247,0.3)' }}>
            <Plus size={16} /><Smartphone size={14} /> Thêm ví điện tử
          </button>
        </div>

        {/* Bank Accounts */}
        {bankMethods.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600 }}>
              <CreditCard size={14} className="inline mr-2" />Tài khoản ngân hàng ({bankMethods.length})
            </h3>
            {bankMethods.map(renderMethod)}
          </div>
        )}

        {/* E-wallets */}
        {ewalletMethods.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600 }}>
              <Smartphone size={14} className="inline mr-2" />Ví điện tử ({ewalletMethods.length})
            </h3>
            {ewalletMethods.map(renderMethod)}
          </div>
        )}

        {methods.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: c.surface2 }}>
              <CreditCard size={36} color={c.borderSolid} />
            </div>
            <p style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600 }}>Chưa có phương thức thanh toán</p>
            <p style={{ color: c.text3, fontSize: 11, textAlign: 'center', maxWidth: 260 }}>
              Thêm tài khoản ngân hàng hoặc ví điện tử để giao dịch P2P
            </p>
          </div>
        )}

        {/* Security Notice */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <p style={{ color: '#3B82F6', fontSize: 11, lineHeight: 1.6 }}>
            <Shield size={10} className="inline mr-1" />
            Thông tin thanh toán chỉ hiển thị cho đối tác khi đơn hàng P2P được tạo. VitTrade không lưu trữ mật khẩu ngân hàng.
          </p>
        </div>
      </PageContent>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm); }}
        variant="danger"
        icon={<Trash2 size={24} color="#EF4444" />}
        title="Xóa phương thức thanh toán?"
        description="Hành động này không thể hoàn tác. Quảng cáo P2P sử dụng phương thức này sẽ cần cập nhật lại."
        confirmText="Xóa"
      />
    </PageLayout>
  );
}