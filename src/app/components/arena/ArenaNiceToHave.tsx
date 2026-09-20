/**
 * ══════════════════════════════════════════════════════════
 *  Arena Nice-to-Have — Final Polish Components
 * ══════════════════════════════════════════════════════════
 *  11) ShareInviteSheet — deep link + copy + invite friends
 *  12) ArenaOfflineBanner — arena-specific offline state
 *  15) LoadMoreButton — pagination "Xem thêm" pattern
 *  16) ArenaNotificationPrefs — notification toggles for Arena
 *
 *  Note: #13 (Per-message report) already done in Critical #5.
 *        #14 (Dark mode color audit) is a code-level fix, not a component.
 */

import React, { useState } from 'react';
import {
  X, Copy, Check, Link2, Share2, Users, Send,
  WifiOff, RefreshCw, ChevronDown, Bell, BellOff,
  Trophy, MessageCircle, Shield, Zap, Info,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { TrCard } from '../ui/TrCard';
import { CTAButton } from '../ui/CTAButton';
import { SectionHeader } from '../ui/SectionHeader';
import { BottomSheetV2 } from '../ui/BottomSheetV2';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════
   11) SHARE / INVITE MODAL
   ═══════════════════════════════════════════ */

interface ShareInviteSheetProps {
  open: boolean;
  onClose: () => void;
  challengeTitle: string;
  challengeId: string;
  entryPoints: number;
  slotsFilled: number;
  slotsTotal: number;
}

const MOCK_FRIENDS = [
  { id: 'f1', name: 'CryptoWhale', avatar: '🐋', status: 'online' as const },
  { id: 'f2', name: 'ArenaKing', avatar: '👑', status: 'online' as const },
  { id: 'f3', name: 'PredictorPro', avatar: '🎯', status: 'away' as const },
  { id: 'f4', name: 'MoonShot99', avatar: '🌙', status: 'offline' as const },
  { id: 'f5', name: 'DiamondHands', avatar: '💎', status: 'online' as const },
];

export function ShareInviteSheet({ open, onClose, challengeTitle, challengeId, entryPoints, slotsFilled, slotsTotal }: ShareInviteSheetProps) {
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const actionToast = useActionToast();
  const [copied, setCopied] = useState(false);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'link' | 'friends'>('link');

  const deepLink = `https://app.trvn.vn/arena/challenge/${challengeId}`;
  const openSlots = slotsTotal - slotsFilled;

  const handleCopy = () => {
    hapticSuccess();
    setCopied(true);
    actionToast.success('Đã sao chép link challenge');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = (friendId: string) => {
    hapticSelection();
    setInvited(prev => {
      const next = new Set(prev);
      if (next.has(friendId)) {
        next.delete(friendId);
      } else {
        next.add(friendId);
      }
      return next;
    });
  };

  const handleSendInvites = () => {
    hapticSuccess();
    actionToast.success(`Đã gửi lời mời đến ${invited.size} bạn bè`);
    setInvited(new Set());
    onClose();
  };

  const handleClose = () => {
    setCopied(false);
    setInvited(new Set());
    onClose();
  };

  return (
    <BottomSheetV2 open={open} onClose={handleClose} title="Chia sẻ & Mời bạn">
        {/* Challenge preview card */}
        <TrCard className="p-3 mb-4">
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate mb-1">{challengeTitle}</p>
          <div className="flex items-center gap-3">
            <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600, fontFamily: 'monospace' }}>
              {entryPoints} pts
            </span>
            <span style={{ color: c.text3, fontSize: 10 }}>·</span>
            <span style={{ color: openSlots > 0 ? '#10B981' : '#EF4444', fontSize: φ.xs, fontWeight: 600 }}>
              {openSlots > 0 ? `${openSlots} slot trống` : 'Đã đầy'}
            </span>
          </div>
        </TrCard>

        {/* Tab: Link / Friends */}
        <div className="flex gap-2 mb-4">
          {(['link', 'friends'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); hapticSelection(); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
              style={{
                background: activeTab === tab ? c.chipActiveBg : c.chipBg,
                border: `1.5px solid ${activeTab === tab ? c.chipActiveBorder : c.chipBorder}`,
                color: activeTab === tab ? c.chipActiveText : c.chipText,
                fontSize: φ.xs, fontWeight: 600, minHeight: 44,
              }}
            >
              {tab === 'link' ? <><Link2 size={13} /> Link</> : <><Users size={13} /> Bạn bè</>}
            </button>
          ))}
        </div>

        {activeTab === 'link' && (
          <div className="flex flex-col gap-3">
            {/* Deep link */}
            <div className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
              <Link2 size={14} color={c.text3} className="shrink-0" />
              <span className="flex-1 truncate" style={{ color: c.text1, fontSize: 11, fontFamily: 'monospace' }}>
                {deepLink}
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 active:opacity-70"
                style={{
                  background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(139,92,246,0.12)',
                  color: copied ? '#10B981' : '#8B5CF6',
                  fontSize: 10, fontWeight: 600, minHeight: 32,
                }}
              >
                {copied ? <><Check size={10} /> Đã sao chép</> : <><Copy size={10} /> Sao chép</>}
              </button>
            </div>

            {/* Share options grid */}
            <p style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600, marginTop: 4 }}>Chia sẻ qua</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Telegram', emoji: '📨', color: '#0088cc' },
                { label: 'Zalo', emoji: '💬', color: '#0068FF' },
                { label: 'Facebook', emoji: '📘', color: '#1877F2' },
                { label: 'Twitter', emoji: '🐦', color: '#1DA1F2' },
              ].map(app => (
                <button
                  key={app.label}
                  onClick={() => { hapticSelection(); actionToast.success(`Đang mở ${app.label}...`); }}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl active:opacity-70"
                  style={{ background: c.surface2 }}
                >
                  <span style={{ fontSize: 20 }}>{app.emoji}</span>
                  <span style={{ color: c.text2, fontSize: 9, fontWeight: 600 }}>{app.label}</span>
                </button>
              ))}
            </div>

            {/* Share text preview */}
            <TrCard className="p-3">
              <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Tin nhắn mẫu</p>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, fontStyle: 'italic' }}>
                "Tham gia challenge "{challengeTitle}" trên Arena! 🎯 Entry: {entryPoints} pts. Còn {openSlots} slot. {deepLink}"
              </p>
            </TrCard>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="flex flex-col gap-2">
            <p style={{ color: c.text2, fontSize: φ.xs, marginBottom: 4 }}>
              Chọn bạn bè để gửi lời mời ({invited.size} đã chọn)
            </p>
            {MOCK_FRIENDS.map(friend => {
              const isInvited = invited.has(friend.id);
              const statusColors = { online: '#10B981', away: '#F59E0B', offline: '#94A3B8' };
              return (
                <button
                  key={friend.id}
                  onClick={() => handleInvite(friend.id)}
                  className="flex items-center gap-3 p-3 rounded-xl w-full text-left active:opacity-70"
                  style={{
                    background: isInvited ? 'rgba(139,92,246,0.06)' : c.surface2,
                    border: isInvited ? '1.5px solid rgba(139,92,246,0.2)' : `1.5px solid transparent`,
                    minHeight: 52,
                  }}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: c.chipBg, fontSize: 20 }}>
                      {friend.avatar}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                      style={{ background: statusColors[friend.status], borderColor: c.surface }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{friend.name}</p>
                    <p style={{ color: c.text3, fontSize: 10 }}>
                      {friend.status === 'online' ? 'Đang online' : friend.status === 'away' ? 'Vắng mặt' : 'Offline'}
                    </p>
                  </div>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{
                    background: isInvited ? '#8B5CF6' : 'transparent',
                    border: isInvited ? '2px solid #8B5CF6' : `2px solid ${c.borderSolid}`,
                  }}>
                    {isInvited && <Check size={14} color="#fff" />}
                  </div>
                </button>
              );
            })}

            {invited.size > 0 && (
              <CTAButton onClick={handleSendInvites}>
                <div className="flex items-center gap-2 justify-center">
                  <Send size={14} /> Gửi lời mời ({invited.size})
                </div>
              </CTAButton>
            )}
          </div>
        )}
    </BottomSheetV2>
  );
}


/* ═══════════════════════════════════════════
   12) ARENA OFFLINE BANNER
   ═══════════════════════════════════════════ */

interface ArenaOfflineBannerProps {
  isOffline: boolean;
  onRetry: () => void;
  lastUpdated?: string;
}

export function ArenaOfflineBanner({ isOffline, onRetry, lastUpdated }: ArenaOfflineBannerProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  if (!isOffline) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mx-5 mt-2 mb-1 flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}
    >
      <WifiOff size={16} color="#F59E0B" className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600, lineHeight: 1.4 }}>
          Mất kết nối
        </p>
        <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
          {lastUpdated ? `Dữ liệu cập nhật lần cuối: ${lastUpdated}` : 'Đang hiển thị dữ liệu gần nhất'}
        </p>
      </div>
      <button
        onClick={() => { hapticSelection(); onRetry(); }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg shrink-0 active:opacity-70"
        style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontSize: 10, fontWeight: 600, minHeight: 32 }}
      >
        <RefreshCw size={10} /> Thử lại
      </button>
    </motion.div>
  );
}


/* ═══════════════════════════════════════════
   15) LOAD MORE BUTTON — Pagination
   ═══════════════════════════════════════════ */

interface LoadMoreButtonProps {
  onClick: () => void;
  loading?: boolean;
  hasMore: boolean;
  loadedCount: number;
  totalCount: number;
}

export function LoadMoreButton({ onClick, loading, hasMore, loadedCount, totalCount }: LoadMoreButtonProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  if (!hasMore) {
    return (
      <p className="text-center py-3" style={{ color: c.text3, fontSize: φ.xs }}>
        Đã hiển thị tất cả ({totalCount})
      </p>
    );
  }

  return (
    <button
      onClick={() => { hapticSelection(); onClick(); }}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl active:opacity-70"
      style={{
        background: c.chipBg,
        border: `1px solid ${c.chipBorder}`,
        color: c.chipText,
        fontSize: φ.xs,
        fontWeight: 600,
        minHeight: 44,
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw size={13} />
        </motion.div>
      ) : (
        <ChevronDown size={13} />
      )}
      {loading ? 'Đang tải...' : `Xem thêm (${loadedCount}/${totalCount})`}
    </button>
  );
}


/* ═══════════════════════════════════════════
   16) ARENA NOTIFICATION PREFERENCES
   ═══════════════════════════════════════════ */

interface ArenaNotifPref {
  key: string;
  label: string;
  desc: string;
  icon: typeof Bell;
  color: string;
  enabled: boolean;
}

const DEFAULT_ARENA_NOTIF_PREFS: ArenaNotifPref[] = [
  { key: 'challenge_updates', label: 'Cập nhật challenge', desc: 'Khi challenge bắt đầu, kết thúc, kết quả', icon: Trophy, color: '#F59E0B', enabled: true },
  { key: 'your_turn', label: 'Đến lượt bạn', desc: 'Nhắc khi cần xác nhận kết quả', icon: Zap, color: '#8B5CF6', enabled: true },
  { key: 'chat_messages', label: 'Tin nhắn chat', desc: 'Tin nhắn mới trong challenge', icon: MessageCircle, color: '#3B82F6', enabled: true },
  { key: 'invites', label: 'Lời mời', desc: 'Khi bạn bè mời tham gia challenge', icon: Users, color: '#10B981', enabled: true },
  { key: 'points_earned', label: 'Arena Points', desc: 'Khi nhận/mất Arena Points', icon: Trophy, color: '#F59E0B', enabled: false },
  { key: 'safety_alerts', label: 'Cảnh báo an toàn', desc: 'Tranh chấp, void, moderation', icon: Shield, color: '#EF4444', enabled: true },
];

interface ArenaNotificationPrefsProps {
  open: boolean;
  onClose: () => void;
}

export function ArenaNotificationPrefs({ open, onClose }: ArenaNotificationPrefsProps) {
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const actionToast = useActionToast();
  const [prefs, setPrefs] = useState<ArenaNotifPref[]>(DEFAULT_ARENA_NOTIF_PREFS);
  const [muteAll, setMuteAll] = useState(false);

  const togglePref = (key: string) => {
    hapticSelection();
    setPrefs(prev => prev.map(p => p.key === key ? { ...p, enabled: !p.enabled } : p));
  };

  const handleSave = () => {
    hapticSuccess();
    actionToast.success('Đã lưu cài đặt thông báo Arena');
    onClose();
  };

  const handleMuteAll = () => {
    hapticSelection();
    const newMute = !muteAll;
    setMuteAll(newMute);
    if (newMute) {
      setPrefs(prev => prev.map(p => ({ ...p, enabled: false })));
    } else {
      setPrefs(DEFAULT_ARENA_NOTIF_PREFS);
    }
  };

  return (
    <BottomSheetV2 open={open} onClose={onClose} title="Thông báo Arena">
        {/* Mute all toggle */}
        <button
          onClick={handleMuteAll}
          className="w-full flex items-center gap-3 p-3.5 rounded-xl mb-4 active:opacity-70"
          style={{
            background: muteAll ? 'rgba(239,68,68,0.06)' : c.surface2,
            border: muteAll ? '1.5px solid rgba(239,68,68,0.15)' : `1.5px solid transparent`,
            minHeight: 52,
          }}
        >
          {muteAll ? <BellOff size={18} color="#EF4444" /> : <Bell size={18} color={c.text2} />}
          <div className="flex-1 text-left">
            <p style={{ color: muteAll ? '#EF4444' : c.text1, fontSize: φ.sm, fontWeight: 600 }}>
              {muteAll ? 'Đã tắt tất cả thông báo' : 'Tắt tất cả thông báo Arena'}
            </p>
            <p style={{ color: c.text3, fontSize: 10 }}>
              {muteAll ? 'Bật lại để nhận thông báo' : 'Bạn sẽ không nhận thông báo Arena nào'}
            </p>
          </div>
          <div className="w-11 h-6 rounded-full p-0.5 transition-colors"
            style={{ background: muteAll ? '#EF4444' : c.surface2 }}>
            <div className="w-5 h-5 rounded-full transition-transform"
              style={{
                background: '#fff',
                transform: muteAll ? 'translateX(20px)' : 'translateX(0)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }} />
          </div>
        </button>

        {/* Individual preferences */}
        <div className="flex flex-col gap-1">
          {prefs.map((pref, i) => (
            <button
              key={pref.key}
              onClick={() => togglePref(pref.key)}
              disabled={muteAll}
              className="flex items-center gap-3 p-3 rounded-xl w-full text-left active:opacity-70"
              style={{
                opacity: muteAll ? 0.4 : 1,
                minHeight: 56,
              }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: hexToRgba(pref.color, 12) }}>
                <pref.icon size={16} color={pref.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{pref.label}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{pref.desc}</p>
              </div>
              <div className="w-11 h-6 rounded-full p-0.5 transition-colors shrink-0"
                style={{ background: pref.enabled ? pref.color : c.surface2 }}>
                <div className="w-5 h-5 rounded-full transition-transform"
                  style={{
                    background: '#fff',
                    transform: pref.enabled ? 'translateX(20px)' : 'translateX(0)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }} />
              </div>
            </button>
          ))}
        </div>

        {/* Info note */}
        <TrCard className="p-2.5 flex items-start gap-2 mt-3 mb-4">
          <Info size={12} color={c.text3} className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
            Cảnh báo an toàn (tranh chấp, void) luôn được gửi bất kể cài đặt, theo chính sách bảo vệ người dùng.
          </p>
        </TrCard>

        <CTAButton onClick={handleSave}>
          Lưu cài đặt
        </CTAButton>
    </BottomSheetV2>
  );
}