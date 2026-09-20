import React from 'react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import {
  Lock, ShieldCheck, KeyRound, AlertTriangle, Shield,
  Fingerprint, Eye, Server,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { φ } from '../../utils/golden';

export function P2PE2EInfoPage() {
  const c = useThemeColors();

  const INFO_ITEMS = [
    {
      icon: Lock,
      title: 'AES-256 + RSA-2048',
      desc: 'Tin nhắn được mã hóa bằng khóa duy nhất cho mỗi cuộc trò chuyện. Ngay cả VitTrade cũng không thể đọc nội dung.',
      color: '#3B82F6',
    },
    {
      icon: KeyRound,
      title: 'Khóa phiên tạm thời',
      desc: 'Mỗi phiên chat tạo khóa mới. Khóa cũ tự động hủy sau khi đơn hàng hoàn thành, đảm bảo Forward Secrecy.',
      color: '#8B5CF6',
    },
    {
      icon: ShieldCheck,
      title: 'Xác minh danh tính',
      desc: 'Đối tác đã được xác minh KYC. Tin nhắn chỉ giao tiếp với người dùng đã xác thực.',
      color: '#10B981',
    },
    {
      icon: AlertTriangle,
      title: 'Cảnh báo bảo mật',
      desc: 'Không chia sẻ mật khẩu, OTP, seed phrase hay thông tin nhạy cảm qua chat. VitTrade sẽ không bao giờ yêu cầu.',
      color: '#F59E0B',
    },
  ];

  return (
    <PageLayout>
      <Header title="Mã hóa đầu cuối" subtitle="Bảo mật · P2P" back />

      {/* Hero */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.12)' }}>
          <ShieldCheck size={36} color="#10B981" />
        </div>
        <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>End-to-End Encryption</p>
        <p style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>
          Bảo mật cấp quân sự
        </p>
      </div>

      {/* Encryption Visual */}
      <TrCard className="p-4" accentBorder="rgba(16,185,129,0.2)">
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>Bạn</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 rounded-full" style={{ background: '#10B981' }} />
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.12)' }}>
              <Lock size={14} color="#10B981" />
            </div>
            <div className="w-4 h-0.5 rounded-full" style={{ background: '#10B981' }} />
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: '#3B82F6' }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>M</span>
          </div>
        </div>
        <p className="text-center" style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>
          Chỉ bạn và đối tác mới đọc được tin nhắn
        </p>
      </TrCard>

      {/* Info Items */}
      <div className="flex flex-col gap-3">
        {INFO_ITEMS.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
          >
            <TrCard className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: item.color + '14' }}>
                  <item.icon size={18} color={item.color} />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 3 }}>
                    {item.title}
                  </p>
                  <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            </TrCard>
          </motion.div>
        ))}
      </div>

      {/* Security Fingerprint */}
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Fingerprint size={14} color={c.text2} />
          <span style={{ color: c.text2, fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>MÃ XÁC MINH BẢO MẬT</span>
        </div>
        <p style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', letterSpacing: 2, textAlign: 'center', lineHeight: 2 }}>
          7F3A 92D1 B5E8 4C6F{'\n'}
          A1D3 8B2C E9F4 5A7D
        </p>
        <p className="text-center mt-2" style={{ color: c.text3, fontSize: 10 }}>
          So khớp mã này với đối tác để xác minh kết nối an toàn
        </p>
      </TrCard>

      {/* How it works */}
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Cách hoạt động</p>
        {[
          { step: '1', label: 'Tạo khóa', desc: 'Khi bắt đầu chat, cặp khóa RSA-2048 được tạo trên thiết bị', icon: KeyRound },
          { step: '2', label: 'Trao đổi khóa', desc: 'Khóa công khai được trao đổi an toàn qua kênh xác thực', icon: Shield },
          { step: '3', label: 'Mã hóa tin nhắn', desc: 'Mỗi tin nhắn được mã hóa AES-256 với khóa phiên duy nhất', icon: Lock },
          { step: '4', label: 'Giải mã an toàn', desc: 'Chỉ khóa riêng trên thiết bị đối tác mới có thể giải mã', icon: Eye },
        ].map((item, i) => (
          <div key={item.step} className="flex items-start gap-3 mb-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <span style={{ color: '#10B981', fontSize: 10, fontWeight: 700 }}>{item.step}</span>
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{item.label}</p>
              <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </TrCard>

      {/* Server info */}
      <div className="rounded-2xl p-3" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <div className="flex items-start gap-2">
          <Server size={12} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.6 }}>
            VitTrade sử dụng kiến trúc Zero-Knowledge. Máy chủ chỉ lưu trữ tin nhắn đã mã hóa
            và không có khả năng giải mã nội dung.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}