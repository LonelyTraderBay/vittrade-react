import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Camera, Check } from 'lucide-react';
import { USER_PROFILE } from '../../data/mockData';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { CTAButton } from '../../components/ui/CTAButton';
import { useThemeColors } from '../../hooks/useThemeColors';

export function EditProfilePage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const [fullName, setFullName] = useState(USER_PROFILE.fullName);
  const [phone, setPhone] = useState(USER_PROFILE.phone ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      navigate(-1);
    }, 800);
  };

  return (
    <PageLayout>
      {/* Header */}
      <Header
        title="Chỉnh sửa hồ sơ"
        subtitle="Chỉnh sửa · Profile"
        back
      />

      <PageContent gap="default">
        {/* Avatar */}
        <div className="flex flex-col items-center py-6">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}
            >
              <span style={{ color: '#fff', fontSize: 36, fontWeight: 700 }}>
                {fullName.charAt(0)}
              </span>
            </div>
            <button
              className="absolute bottom-0 right-0 w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: '#3B82F6', border: `2px solid ${c.bg}` }}
              aria-label="Đổi ảnh đại diện"
            >
              <Camera size={14} color="#fff" />
            </button>
          </div>
          <p style={{ color: c.text3, fontSize: 12, marginTop: 10 }}>Nhấn vào biểu tượng camera để thay đổi</p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          {/* Full name */}
          <div>
            <label style={{ color: c.text2, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              HỌ VÀ TÊN
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full rounded-2xl px-4"
              style={{
                background: c.surface2,
                border: `1.5px solid ${c.borderSolid}`,
                color: c.text1,
                fontSize: 15,
                height: 52,
                outline: 'none',
              }}
              placeholder="Nhập họ và tên"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label style={{ color: c.text2, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              EMAIL
            </label>
            <input
              type="email"
              value={USER_PROFILE.email}
              readOnly
              className="w-full rounded-2xl px-4"
              style={{
                background: c.hoverBg,
                border: `1.5px solid ${c.borderSolid}`,
                color: c.text3,
                fontSize: 15,
                height: 52,
                outline: 'none',
                cursor: 'not-allowed',
              }}
            />
            <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>Email không thể thay đổi</p>
          </div>

          {/* Phone */}
          <div>
            <label style={{ color: c.text2, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              SỐ ĐIỆN THOẠI
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full rounded-2xl px-4"
              style={{
                background: c.surface2,
                border: `1.5px solid ${c.borderSolid}`,
                color: c.text1,
                fontSize: 15,
                height: 52,
                outline: 'none',
              }}
              placeholder="+84 xxx xxx xxx"
            />
          </div>

          {/* Save button */}
          <CTAButton
            onClick={handleSave}
            loading={isSaving}
            variant="primary"
          >
            {isSaving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
          </CTAButton>
        </div>
      </PageContent>
    </PageLayout>
  );
}