/**
 * ══════════════════════════════════════════════════════════
 *  WEB KYC VERIFICATION PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/profile/kyc
 *
 *  KYC (Know Your Customer) verification center
 *  - KYC level status (Lv0 → Lv3)
 *  - Verification steps & requirements
 *  - Upload document wizard
 *  - Verification progress tracking
 *  - Limits comparison per level
 *  - Compliance disclosure
 *
 *  Guidelines compliance:
 *  - §14.3: High-risk actions require preview + confirm
 *  - §15.1: Neutral, compliance-first tone
 *  - §21.4: Header with breadcrumb
 *  - 2-column layout
 *  - WEB_FONT.SIZE tokens
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  Camera,
  CreditCard,
  Info,
  Download,
} from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT } from '@/shared/theme/webTokens';
import { PageLayout } from '@/shared/ui/layout/PageLayout';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

type KYCLevel = 0 | 1 | 2 | 3;
type KYCStatus = 'not_started' | 'pending' | 'approved' | 'rejected';
type DocumentType = 'id_front' | 'id_back' | 'selfie' | 'proof_of_address';

interface KYCLevelInfo {
  level: KYCLevel;
  name: string;
  color: string;
  depositLimit: string;
  withdrawalLimit: string;
  features: string[];
  requirements: string[];
}

interface UserKYCStatus {
  currentLevel: KYCLevel;
  status: KYCStatus;
  statusMessage?: string;
  submittedDate?: string;
  approvedDate?: string;
  documents: Partial<Record<DocumentType, { uploaded: boolean; status: KYCStatus }>>;
}

const KYC_LEVELS: KYCLevelInfo[] = [
  {
    level: 0,
    name: 'Lv0 — Chưa xác minh',
    color: '#94A3B8',
    depositLimit: '$1,000/ngày',
    withdrawalLimit: 'Không cho phép',
    features: ['Giao dịch cơ bản', 'Xem thị trường'],
    requirements: ['Đăng ký tài khoản'],
  },
  {
    level: 1,
    name: 'Lv1 — Cơ bản',
    color: '#3B82F6',
    depositLimit: '$10,000/ngày',
    withdrawalLimit: '$2,000/ngày',
    features: ['Nạp/Rút crypto', 'P2P Trading', 'Staking cơ bản'],
    requirements: ['Email xác thực', 'Số điện thoại', 'Thông tin cá nhân'],
  },
  {
    level: 2,
    name: 'Lv2 — Nâng cao',
    color: '#10B981',
    depositLimit: '$100,000/ngày',
    withdrawalLimit: '$50,000/ngày',
    features: ['API Trading', 'VIP Program', 'OTC Trading', 'Margin Trading'],
    requirements: ['CMND/CCCD', 'Ảnh selfie', 'Xác thực sinh trắc'],
  },
  {
    level: 3,
    name: 'Lv3 — Tổ chức/VIP',
    color: '#F59E0B',
    depositLimit: 'Không giới hạn',
    withdrawalLimit: '$500,000/ngày',
    features: [
      'Tất cả tính năng Lv2',
      'Account Manager',
      'Institutional Services',
      'Custom Limits',
    ],
    requirements: ['Giấy tờ bổ sung', 'Proof of Address', 'Nguồn tài sản', 'Video call KYC'],
  },
];

const USER_KYC: UserKYCStatus = {
  currentLevel: 1,
  status: 'approved',
  approvedDate: '2026-01-15',
  documents: {
    id_front: { uploaded: true, status: 'approved' },
    id_back: { uploaded: true, status: 'approved' },
    selfie: { uploaded: true, status: 'approved' },
    proof_of_address: { uploaded: false, status: 'not_started' },
  },
};

const DOCUMENT_TYPES: {
  id: DocumentType;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: 'id_front',
    label: 'CMND/CCCD mặt trước',
    icon: CreditCard,
    description: 'Ảnh rõ nét, không che, không chỉnh sửa',
  },
  {
    id: 'id_back',
    label: 'CMND/CCCD mặt sau',
    icon: CreditCard,
    description: 'Ảnh rõ nét, đầy đủ thông tin',
  },
  {
    id: 'selfie',
    label: 'Ảnh selfie với CMND',
    icon: Camera,
    description: 'Giữ CMND cạnh khuôn mặt, nhìn thẳng camera',
  },
  {
    id: 'proof_of_address',
    label: 'Giấy xác nhận địa chỉ',
    icon: FileText,
    description: 'Hóa đơn điện/nước/internet trong 3 tháng gần nhất',
  },
];

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function LevelProgressCard({
  userKYC,
  levels,
}: {
  userKYC: UserKYCStatus;
  levels: KYCLevelInfo[];
}) {
  const c = useThemeColors();
  const currentLevel = levels[userKYC.currentLevel];
  const nextLevel = levels[userKYC.currentLevel + 1];

  const getStatusIcon = () => {
    switch (userKYC.status) {
      case 'approved':
        return <CheckCircle2 size={28} color="#10B981" />;
      case 'pending':
        return <Clock size={28} color="#F59E0B" />;
      case 'rejected':
        return <XCircle size={28} color="#EF4444" />;
      default:
        return <AlertTriangle size={28} color="#94A3B8" />;
    }
  };

  const getStatusText = () => {
    switch (userKYC.status) {
      case 'approved':
        return 'Đã xác minh';
      case 'pending':
        return 'Đang xử lý';
      case 'rejected':
        return 'Từ chối';
      default:
        return 'Chưa xác minh';
    }
  };

  const getStatusColor = () => {
    switch (userKYC.status) {
      case 'approved':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'rejected':
        return '#EF4444';
      default:
        return '#94A3B8';
    }
  };

  return (
    <div
      className="p-6 rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${currentLevel.color}20, ${currentLevel.color}05)`,
        border: `2px solid ${currentLevel.color}40`,
      }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 64,
            height: 64,
            background: currentLevel.color,
          }}
        >
          <ShieldCheck size={32} color="#fff" />
        </div>
        <div className="flex-1">
          <div style={{ color: c.text2, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
            KYC hiện tại
          </div>
          <div style={{ color: c.text1, fontSize: 20, fontWeight: 800 }}>{currentLevel.name}</div>
          <div className="flex items-center gap-2 mt-2">
            {getStatusIcon()}
            <span
              style={{ color: getStatusColor(), fontSize: WEB_FONT.SIZE.CAPTION, fontWeight: 700 }}
            >
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${c.divider}` }}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
              Nạp tối đa
            </div>
            <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
              {currentLevel.depositLimit}
            </div>
          </div>
          <div>
            <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, marginBottom: 4 }}>
              Rút tối đa
            </div>
            <div style={{ color: c.text1, fontSize: WEB_FONT.SIZE.BODY, fontWeight: 700 }}>
              {currentLevel.withdrawalLimit}
            </div>
          </div>
        </div>
      </div>

      {nextLevel && userKYC.status === 'approved' && (
        <button
          className="w-full mt-4 px-4 py-2.5 rounded-lg transition-colors"
          style={{
            background: nextLevel.color,
            color: '#fff',
            fontSize: WEB_FONT.SIZE.CAPTION,
            fontWeight: 600,
            border: 'none',
          }}
        >
          Nâng cấp lên {nextLevel.name.split('—')[0].trim()}
        </button>
      )}
    </div>
  );
}

function DocumentUploadCard({
  doc,
  userDoc,
}: {
  doc: (typeof DOCUMENT_TYPES)[0];
  userDoc?: UserKYCStatus['documents'][DocumentType];
}) {
  const c = useThemeColors();
  const Icon = doc.icon;

  const getStatusBadge = () => {
    if (!userDoc || !userDoc.uploaded) {
      return (
        <span
          className="px-2 py-1 rounded-md"
          style={{
            background: '#94A3B820',
            color: '#64748B',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          Chưa tải
        </span>
      );
    }

    switch (userDoc.status) {
      case 'approved':
        return (
          <span
            className="px-2 py-1 rounded-md flex items-center gap-1"
            style={{
              background: '#10B98115',
              color: '#10B981',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={12} />
            Đã duyệt
          </span>
        );
      case 'pending':
        return (
          <span
            className="px-2 py-1 rounded-md flex items-center gap-1"
            style={{
              background: '#F59E0B15',
              color: '#F59E0B',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Clock size={12} />
            Đang xử lý
          </span>
        );
      case 'rejected':
        return (
          <span
            className="px-2 py-1 rounded-md flex items-center gap-1"
            style={{
              background: '#EF444415',
              color: '#EF4444',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <XCircle size={12} />
            Từ chối
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{
            width: 48,
            height: 48,
            background: userDoc?.status === 'approved' ? '#10B98115' : `${c.text3}10`,
          }}
        >
          <Icon size={24} color={userDoc?.status === 'approved' ? '#10B981' : c.text3} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            style={{
              color: c.text1,
              fontSize: WEB_FONT.SIZE.BODY,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {doc.label}
          </div>
          <div style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION, lineHeight: 1.4 }}>
            {doc.description}
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {(!userDoc || !userDoc.uploaded) && (
        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors"
          style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            color: c.text2,
            fontSize: WEB_FONT.SIZE.CAPTION,
            fontWeight: 600,
          }}
        >
          <Upload size={14} />
          Tải lên
        </button>
      )}

      {userDoc?.uploaded && userDoc.status === 'rejected' && (
        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors"
          style={{
            background: '#EF444415',
            border: `1px solid #EF4444`,
            color: '#EF4444',
            fontSize: WEB_FONT.SIZE.CAPTION,
            fontWeight: 600,
          }}
        >
          <Upload size={14} />
          Tải lại
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebKYCPage() {
  const c = useThemeColors();
  const [activeTab, setActiveTab] = useState<'overview' | 'upload'>('overview');

  return (
    <PageLayout>
      <div className="flex" style={{ minHeight: '100%' }}>
        {/* ═══ LEFT SIDEBAR (300px) ═══ */}
        <div
          className="flex flex-col"
          style={{
            width: 300,
            background: c.surface,
            borderRight: `1px solid ${c.divider}`,
            position: 'sticky',
            top: 0,
            alignSelf: 'flex-start',
            maxHeight: '100vh',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5"
            style={{
              height: 60,
              borderBottom: `1px solid ${c.divider}`,
            }}
          >
            <h2
              style={{
                color: c.text1,
                fontSize: WEB_FONT.SIZE.H2,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Xác minh KYC
            </h2>
          </div>

          {/* Current Level Card */}
          <div className="p-4">
            <LevelProgressCard userKYC={USER_KYC} levels={KYC_LEVELS} />
          </div>

          {/* Compliance Notice */}
          <div className="px-4 pb-4">
            <div
              className="p-3 rounded-lg"
              style={{
                background: '#3B82F615',
                border: `1px solid #3B82F640`,
              }}
            >
              <div className="flex items-start gap-2">
                <Info size={16} color="#3B82F6" className="flex-shrink-0 mt-0.5" />
                <div>
                  <div
                    style={{
                      color: '#3B82F6',
                      fontSize: WEB_FONT.SIZE.CAPTION,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Bảo mật & Tuân thủ
                  </div>
                  <div style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                    Thông tin của bạn được mã hóa và bảo vệ theo tiêu chuẩn quốc tế. Chúng tôi tuân
                    thủ quy định AML/KYC.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="px-4 pb-4">
            <div
              style={{
                color: c.text2,
                fontSize: WEB_FONT.SIZE.CAPTION,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Tài liệu hỗ trợ
            </div>
            <div className="flex flex-col gap-2">
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.text2,
                  fontSize: WEB_FONT.SIZE.CAPTION,
                  fontWeight: 600,
                }}
              >
                <FileText size={14} />
                Hướng dẫn KYC
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.text2,
                  fontSize: WEB_FONT.SIZE.CAPTION,
                  fontWeight: 600,
                }}
              >
                <Download size={14} />
                Mẫu giấy tờ
              </button>
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto p-8">
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2 rounded-lg transition-all"
                style={{
                  background: activeTab === 'overview' ? '#3B82F6' : 'transparent',
                  color: activeTab === 'overview' ? '#fff' : c.text2,
                  fontSize: WEB_FONT.SIZE.BODY,
                  fontWeight: 600,
                  border: activeTab === 'overview' ? 'none' : `1px solid ${c.border}`,
                }}
              >
                Tổng quan cấp độ
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className="px-4 py-2 rounded-lg transition-all"
                style={{
                  background: activeTab === 'upload' ? '#3B82F6' : 'transparent',
                  color: activeTab === 'upload' ? '#fff' : c.text2,
                  fontSize: WEB_FONT.SIZE.BODY,
                  fontWeight: 600,
                  border: activeTab === 'upload' ? 'none' : `1px solid ${c.border}`,
                }}
              >
                Tải giấy tờ
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <section>
                <h3
                  className="mb-4"
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.SIZE.H3,
                    fontWeight: 700,
                  }}
                >
                  So sánh cấp độ KYC
                </h3>

                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: c.surface,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: c.bg }}>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: 16,
                            color: c.text2,
                            fontSize: WEB_FONT.SIZE.CAPTION,
                            fontWeight: 600,
                            borderBottom: `1px solid ${c.divider}`,
                          }}
                        >
                          Cấp độ
                        </th>
                        <th
                          style={{
                            textAlign: 'right',
                            padding: 16,
                            color: c.text2,
                            fontSize: WEB_FONT.SIZE.CAPTION,
                            fontWeight: 600,
                            borderBottom: `1px solid ${c.divider}`,
                          }}
                        >
                          Nạp/ngày
                        </th>
                        <th
                          style={{
                            textAlign: 'right',
                            padding: 16,
                            color: c.text2,
                            fontSize: WEB_FONT.SIZE.CAPTION,
                            fontWeight: 600,
                            borderBottom: `1px solid ${c.divider}`,
                          }}
                        >
                          Rút/ngày
                        </th>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: 16,
                            color: c.text2,
                            fontSize: WEB_FONT.SIZE.CAPTION,
                            fontWeight: 600,
                            borderBottom: `1px solid ${c.divider}`,
                          }}
                        >
                          Tính năng
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {KYC_LEVELS.map((level) => {
                        const isCurrent = level.level === USER_KYC.currentLevel;
                        return (
                          <tr
                            key={level.level}
                            style={{
                              background: isCurrent ? `${level.color}10` : 'transparent',
                              borderBottom: `1px solid ${c.divider}`,
                            }}
                          >
                            <td style={{ padding: 16 }}>
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex items-center justify-center rounded-lg"
                                  style={{
                                    width: 40,
                                    height: 40,
                                    background: level.color,
                                  }}
                                >
                                  <ShieldCheck size={20} color="#fff" />
                                </div>
                                <div>
                                  <div
                                    style={{
                                      color: c.text1,
                                      fontSize: WEB_FONT.SIZE.BODY,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {level.name}
                                  </div>
                                  {isCurrent && (
                                    <div
                                      style={{
                                        color: level.color,
                                        fontSize: WEB_FONT.SIZE.CAPTION,
                                        fontWeight: 600,
                                      }}
                                    >
                                      Hiện tại
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td
                              style={{
                                textAlign: 'right',
                                padding: 16,
                                color: c.text1,
                                fontSize: WEB_FONT.SIZE.BODY,
                                fontWeight: 600,
                              }}
                            >
                              {level.depositLimit}
                            </td>
                            <td
                              style={{
                                textAlign: 'right',
                                padding: 16,
                                color: c.text1,
                                fontSize: WEB_FONT.SIZE.BODY,
                                fontWeight: 600,
                              }}
                            >
                              {level.withdrawalLimit}
                            </td>
                            <td style={{ padding: 16 }}>
                              <div className="flex flex-wrap gap-1">
                                {level.features.slice(0, 2).map((feature, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 rounded"
                                    style={{
                                      background: `${level.color}15`,
                                      color: level.color,
                                      fontSize: WEB_FONT.SIZE.CAPTION,
                                      fontWeight: 600,
                                    }}
                                  >
                                    {feature}
                                  </span>
                                ))}
                                {level.features.length > 2 && (
                                  <span style={{ color: c.text3, fontSize: WEB_FONT.SIZE.CAPTION }}>
                                    +{level.features.length - 2}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <section>
                <h3
                  className="mb-4"
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.SIZE.H3,
                    fontWeight: 700,
                  }}
                >
                  Tải lên giấy tờ xác minh
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {DOCUMENT_TYPES.map((doc) => (
                    <DocumentUploadCard
                      key={doc.id}
                      doc={doc}
                      userDoc={USER_KYC.documents[doc.id]}
                    />
                  ))}
                </div>

                <div
                  className="mt-6 p-4 rounded-xl"
                  style={{
                    background: '#F59E0B15',
                    border: `1px solid #F59E0B40`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} color="#F59E0B" className="flex-shrink-0 mt-0.5" />
                    <div>
                      <div
                        style={{
                          color: '#F59E0B',
                          fontSize: WEB_FONT.SIZE.BODY,
                          fontWeight: 700,
                          marginBottom: 8,
                        }}
                      >
                        Lưu ý quan trọng
                      </div>
                      <ul
                        style={{
                          color: c.text2,
                          fontSize: WEB_FONT.SIZE.CAPTION,
                          lineHeight: 1.6,
                          margin: 0,
                          paddingLeft: 20,
                        }}
                      >
                        <li>Ảnh rõ nét, đầy đủ 4 góc, không bị mờ hoặc chói sáng</li>
                        <li>Thông tin trên giấy tờ phải khớp với thông tin đã đăng ký</li>
                        <li>Chấp nhận định dạng: JPG, PNG. Dung lượng tối đa: 5MB</li>
                        <li>Thời gian xử lý: 1-3 ngày làm việc</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
