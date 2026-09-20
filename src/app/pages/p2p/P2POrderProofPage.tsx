import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import {
  Upload, Image, Camera, FileImage, CheckCircle, AlertTriangle, Shield, Trash2,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { CTAButton } from '../../components/ui/CTAButton';
import { TrCard } from '../../components/ui/TrCard';
import { P2P_ORDER, P2P_ORDERS } from '../../data/mockData';
import { fmtVnd } from '../../data/formatNumber';
import { φ } from '../../utils/golden';

export function P2POrderProofPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const { orderId } = useParams();
  const order = (orderId ? P2P_ORDERS.find(o => o.id === orderId) : null) || P2P_ORDER;

  const [proofs, setProofs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (type: 'camera' | 'gallery') => {
    setIsUploading(true);
    hapticSelection();
    await new Promise(r => setTimeout(r, 600));
    setProofs(prev => [...prev, `proof_${type}_${Date.now()}.jpg`]);
    setIsUploading(false);
    hapticSuccess();
  };

  const removeProof = (idx: number) => {
    setProofs(prev => prev.filter((_, i) => i !== idx));
    hapticSelection();
  };

  const handleConfirm = () => {
    hapticSuccess();
    navigate(-1);
  };

  return (
    <PageLayout>
      <Header title="Bằng chứng thanh toán" subtitle="Đơn hàng · P2P" back />

      {/* Order ref */}
      <TrCard className="p-3">
        <div className="flex items-center justify-between">
          <span style={{ color: c.text3, fontSize: 11 }}>Đơn hàng</span>
          <span style={{ color: c.text1, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{order.orderNumber}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span style={{ color: c.text3, fontSize: 11 }}>Số tiền</span>
          <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{fmtVnd(order.total)} VND</span>
        </div>
      </TrCard>

      {/* Upload Area */}
      <div>
        <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, marginBottom: 4 }}>Tải ảnh bằng chứng</p>
        <p style={{ color: c.text3, fontSize: 11, marginBottom: 12 }}>
          Chụp ảnh giao dịch ngân hàng hiển thị rõ số tiền, thời gian và người nhận.
        </p>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => handleUpload('camera')}
            disabled={isUploading}
            className="flex-1 rounded-2xl p-6 flex flex-col items-center gap-3"
            style={{ background: c.surface2, border: `2px dashed ${c.borderSolid}` }}
          >
            <Camera size={28} color="#3B82F6" />
            <span style={{ color: '#3B82F6', fontSize: 12, fontWeight: 700 }}>Chụp ảnh</span>
            <span style={{ color: c.text3, fontSize: 9 }}>Mở camera</span>
          </button>
          <button
            onClick={() => handleUpload('gallery')}
            disabled={isUploading}
            className="flex-1 rounded-2xl p-6 flex flex-col items-center gap-3"
            style={{ background: c.surface2, border: `2px dashed ${c.borderSolid}` }}
          >
            <FileImage size={28} color="#8B5CF6" />
            <span style={{ color: '#8B5CF6', fontSize: 12, fontWeight: 700 }}>Thư viện</span>
            <span style={{ color: c.text3, fontSize: 9 }}>Chọn từ ảnh</span>
          </button>
        </div>
      </div>

      {/* Uploaded Proofs */}
      {proofs.length > 0 && (
        <div>
          <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
            Đã tải ({proofs.length}/3)
          </p>
          <div className="flex flex-wrap gap-3">
            {proofs.map((proof, i) => (
              <div key={proof} className="relative">
                <div className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.2)' }}>
                  <Image size={24} color="#10B981" />
                  <span style={{ color: '#10B981', fontSize: 9, marginTop: 4, fontWeight: 600 }}>Ảnh {i + 1}</span>
                </div>
                <button
                  onClick={() => removeProof(i)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: '#EF4444', boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>
                  <Trash2 size={10} color="#fff" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <TrCard className="p-3">
        <p style={{ color: c.text2, fontSize: 10, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>HƯỚNG DẪN CHỤP ẢNH</p>
        {[
          'Chụp toàn bộ màn hình giao dịch ngân hàng',
          'Hiển thị rõ số tiền, ngày giờ và người nhận',
          'Nội dung chuyển khoản phải đúng mã đơn',
          'Không chỉnh sửa hoặc cắt ghép ảnh',
        ].map((tip, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            <CheckCircle size={10} color="#10B981" />
            <span style={{ color: c.text3, fontSize: 10 }}>{tip}</span>
          </div>
        ))}
      </TrCard>

      {/* Warning */}
      <div className="rounded-2xl p-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
        <div className="flex items-start gap-2">
          <AlertTriangle size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
          <p style={{ color: '#D97706', fontSize: 10, lineHeight: 1.6 }}>
            Tải bằng chứng giả mạo là vi phạm nghiêm trọng và có thể dẫn đến khóa tài khoản vĩnh viễn.
          </p>
        </div>
      </div>

      <div className="flex-1" />

      <CTAButton onClick={handleConfirm} disabled={proofs.length === 0}>
        <div className="flex items-center gap-2">
          <Upload size={16} />
          Xác nhận ({proofs.length} ảnh)
        </div>
      </CTAButton>
      <div style={{ height: 16 }} />
    </PageLayout>
  );
}