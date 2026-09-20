import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, RefreshCw, Lock, Shield, CheckCircle, X, Plus, Trash2, Key, ToggleRight, ToggleLeft, Copy, Globe, Clock, Info, ChevronRight, AlertTriangle } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  secret: string;
  permissions: ('read' | 'trade' | 'withdraw')[];
  ipWhitelist: string[];
  createdAt: string;
  expiresAt: string | null;
  lastUsed: string | null;
  isActive: boolean;
  requestCount: number;
}

const MOCK_KEYS: ApiKey[] = [
  { id: 'key1', name: 'Trading Bot Alpha', key: 'vt_live_4x7j9mKpQr2LwNvSbEuF8yTcZdHgXkAm', secret: 'sk_live_J8mK3pRtYxWvCqBnZ5hGfD2sLuNaE9cT', permissions: ['read', 'trade'], ipWhitelist: ['192.168.1.100', '10.0.0.5'], createdAt: '10/01/2026', expiresAt: '10/01/2027', lastUsed: '23/02/2026 14:23', isActive: true, requestCount: 45231 },
  { id: 'key2', name: 'Portfolio Tracker', key: 'vt_live_9nRdBsWkMpL3xTaEjQzYcV7hGfC2uNm', secret: 'sk_live_C4yBfNrKxZpD8wTqLuMaV2jEsGcH7iR', permissions: ['read'], ipWhitelist: [], createdAt: '05/02/2026', expiresAt: null, lastUsed: '22/02/2026 09:15', isActive: true, requestCount: 12840 },
  { id: 'key3', name: 'Test Key (Cũ)', key: 'vt_live_2hFcPqLsAkX6rBnJmWdYvT8eGzNuCjQ', secret: 'sk_live_X6jNzQpMsRvKcT3bGaHwF9yLuB2dEiC', permissions: ['read', 'trade', 'withdraw'], ipWhitelist: [], createdAt: '01/12/2025', expiresAt: '01/12/2025', lastUsed: '30/11/2025 22:00', isActive: false, requestCount: 892 },
];

const PERMISSION_CONFIG = {
  read: { label: 'Đọc', desc: 'Xem số dư, lịch sử giao dịch', color: '#3B82F6', icon: Eye },
  trade: { label: 'Giao dịch', desc: 'Đặt và hủy lệnh', color: '#F59E0B', icon: RefreshCw },
  withdraw: { label: 'Rút tiền', desc: 'Rút tài sản ra ngoài', color: '#EF4444', icon: Lock },
};

export function ApiManagementPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [keys, setKeys] = useState<ApiKey[]>(MOCK_KEYS);
  const [showSecretId, setShowSecretId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const actionToast = useActionToast();

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    actionToast.success(TOAST.COPY.API_KEY);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleKey = (id: string) => {
    const key = keys.find(k => k.id === id);
    setKeys(prev => prev.map(k => k.id === id ? { ...k, isActive: !k.isActive } : k));
    actionToast.info(key?.isActive ? TOAST.API.KEY_DEACTIVATED : TOAST.API.KEY_ACTIVATED);
  };
  const deleteKey = (id: string) => {
    setKeys(prev => prev.filter(k => k.id !== id));
    setDeleteId(null);
    actionToast.warning(TOAST.API.KEY_DELETED);
  };

  const handleCreate = (data: Partial<ApiKey>) => {
    const newKey: ApiKey = {
      id: `key${Date.now()}`, name: data.name ?? 'API Key mới',
      key: 'vt_live_' + Math.random().toString(36).substring(2, 30),
      secret: 'sk_live_' + Math.random().toString(36).substring(2, 30),
      permissions: data.permissions ?? ['read'], ipWhitelist: data.ipWhitelist ?? [],
      createdAt: new Date().toLocaleDateString('vi-VN'), expiresAt: null, lastUsed: null, isActive: true, requestCount: 0,
    };
    setKeys(prev => [newKey, ...prev]);
    actionToast.success(TOAST.API.KEY_CREATED(newKey.name), { haptic: 'success' });
  };

  const maskedKey = (key: string) => key.substring(0, 12) + '••••••••••••' + key.substring(key.length - 6);

  return (
    <PageLayout>
      {deleteId && (
        <ConfirmationDialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={() => deleteKey(deleteId)}
          variant="danger"
          icon={<Trash2 size={24} color="#EF4444" />}
          title="Xoá API Key?"
          description="Thao tác này không thể hoàn tác. Tất cả kết nối sử dụng key này sẽ ngừng hoạt động."
          confirmText="Xoá"
        />
      )}

      <Header title="Quản lý API" subtitle="API · Profile" back
        right={
          <button onClick={() => navigate(`${prefix}/profile/api/create`)} className="w-10 h-10 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <Plus size={20} color="#3B82F6" />
          </button>
        }
      />

      <PageContent gap="default">
        {keys.map(apiKey => (
          <TrCard key={apiKey.id} className="p-4"
            accentBorder={!apiKey.isActive ? 'rgba(239,68,68,0.15)' : undefined}
            style={{ opacity: apiKey.isActive ? 1 : 0.65 }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: apiKey.isActive ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.1)', border: `1px solid ${apiKey.isActive ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                <Key size={18} color={apiKey.isActive ? '#3B82F6' : '#EF4444'} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{apiKey.name}</p>
                  <span className="px-1.5 py-0.5 rounded-md text-xs font-semibold"
                    style={{ background: apiKey.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)', color: apiKey.isActive ? '#10B981' : '#EF4444' }}>
                    {apiKey.isActive ? '● Active' : '● Disabled'}
                  </span>
                </div>
                <p style={{ color: c.text3, fontSize: 11 }}>Tạo: {apiKey.createdAt}{apiKey.expiresAt ? ` • Hết hạn: ${apiKey.expiresAt}` : ' • Không hết hạn'}</p>
              </div>
              <button onClick={() => toggleKey(apiKey.id)}>
                {apiKey.isActive ? <ToggleRight size={28} color="#10B981" /> : <ToggleLeft size={28} color={c.text3} />}
              </button>
            </div>

            <div className="rounded-xl px-3 py-2 mb-2 flex items-center gap-2" style={{ background: c.surface2 }}>
              <span style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>API KEY</span>
              <span style={{ color: c.text1, fontSize: 11, fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{maskedKey(apiKey.key)}</span>
              <button onClick={() => handleCopy(apiKey.id + '_key', apiKey.key)}>
                {copiedId === apiKey.id + '_key' ? <CheckCircle size={14} color="#10B981" /> : <Copy size={14} color={c.text2} />}
              </button>
            </div>

            <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2" style={{ background: c.surface2, border: '1px solid rgba(239,68,68,0.1)' }}>
              <span style={{ color: '#EF4444', fontSize: 10, fontWeight: 600 }}>SECRET</span>
              <span style={{ color: c.text1, fontSize: 11, fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {showSecretId === apiKey.id ? apiKey.secret : '••••••••••••••••••••••••'}
              </span>
              <button onClick={() => setShowSecretId(showSecretId === apiKey.id ? null : apiKey.id)} className="mr-1">
                {showSecretId === apiKey.id ? <EyeOff size={14} color={c.text2} /> : <Eye size={14} color={c.text2} />}
              </button>
              {showSecretId === apiKey.id && (
                <button onClick={() => handleCopy(apiKey.id + '_secret', apiKey.secret)}>
                  {copiedId === apiKey.id + '_secret' ? <CheckCircle size={14} color="#10B981" /> : <Copy size={14} color={c.text2} />}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {apiKey.permissions.map(p => {
                const cfg = PERMISSION_CONFIG[p];
                return (
                  <span key={p} className="px-2 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: cfg.color + '15', color: cfg.color, border: `1px solid ${cfg.color}33` }}>{cfg.label}</span>
                );
              })}
              {apiKey.ipWhitelist.length > 0 ? (
                <span className="px-2 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Globe size={11} className="inline mr-0.5" />{apiKey.ipWhitelist.length} IPs
                </span>
              ) : (
                <span className="px-2 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                  ⚠️ Không giới hạn IP
                </span>
              )}
            </div>

            <div className="flex justify-between mb-3">
              <span style={{ color: c.text3, fontSize: 11 }}><Clock size={10} className="inline mr-0.5" />Dùng lần cuối: {apiKey.lastUsed ?? 'Chưa dùng'}</span>
              <span style={{ color: c.text3, fontSize: 11 }}>{apiKey.requestCount.toLocaleString()} requests</span>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>
                <RefreshCw size={12} className="inline mr-1" />Tạo lại Secret
              </button>
              <button onClick={() => setDeleteId(apiKey.id)}
                className="w-10 h-9 flex items-center justify-center rounded-xl"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <Trash2 size={15} color="#EF4444" />
              </button>
            </div>
          </TrCard>
        ))}

        <TrCard>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
            <Info size={20} color="#3B82F6" />
          </div>
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Tài liệu API</p>
            <p style={{ color: c.text3, fontSize: 12 }}>Xem hướng dẫn tích hợp và endpoint</p>
          </div>
          <ChevronRight size={16} color={c.text3} />
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}