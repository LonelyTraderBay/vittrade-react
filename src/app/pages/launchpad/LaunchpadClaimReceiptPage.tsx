/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadClaimReceiptPage — Reward Claim Receipt + Vesting
 * ══════════════════════════════════════════════════════════════
 *  Pattern A — Standard Detail Page
 *  Features: Claim receipt, vesting timeline, claim history,
 *            next unlock countdown, claim action,
 *            Phase 4.7: Push notification simulation for vesting
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  Gift, CheckCircle, Clock, Lock, Unlock, AlertTriangle,
  ArrowRight, Copy, ChevronRight, X, Info, Shield,
  Coins, TrendingUp, Calendar, FileText, ExternalLink,
  RefreshCw, AlertCircle, Bell, BellRing, Settings,
  Volume2, VolumeX, Award, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  getClaimReceiptForPosition, truncateAddress,
  generateVestingNotifSequence, loadVestingNotifs, saveVestingNotifs,
  markVestingNotifRead, markAllVestingNotifsRead,
  loadVestingNotifPrefs, saveVestingNotifPrefs,
  type RewardClaimReceipt, type RewardVestingEntry, type ClaimHistoryEntry,
  type VestingNotification, type VestingNotifType, type VestingNotifPreferences,
  DEFAULT_VESTING_NOTIF_PREFS,
} from './launchpadData';
import { CountdownTimer, RiskDisclosure } from './LaunchpadComponents';

const TABS = ['Tổng quan', 'Vesting', 'Lịch sử'] as const;
type ClaimTab = typeof TABS[number];

/* ═══════════════════════════════════════════════════════════
   Notification type config
   ═══════════════════════════════════════════════════════════ */

const NOTIF_TYPE_CFG: Record<VestingNotifType, { icon: typeof Bell; color: string; bg: string }> = {
  unlock_soon: { icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  unlocked: { icon: Unlock, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  claimable: { icon: Gift, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  claimed: { icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  vesting_complete: { icon: Award, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  reward_milestone: { icon: TrendingUp, color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
};

export function LaunchpadClaimReceiptPage() {
  const c = useThemeColors();
  const { positionId } = useParams<{ positionId: string }>();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();

  const [tab, setTab] = useState<ClaimTab>('Tổng quan');
  const [showClaimSheet, setShowClaimSheet] = useState(false);
  const [claimableEntry, setClaimableEntry] = useState<RewardVestingEntry | null>(null);
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<VestingNotification[]>(() => loadVestingNotifs());
  const [activeToast, setActiveToast] = useState<VestingNotification | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastQueueRef = useRef<VestingNotification[]>([]);
  const timeoutsRef = useRef<number[]>([]);
  const notifSimStartedRef = useRef(false);

  const receipt = getClaimReceiptForPosition(positionId || 'sp1');
  const claimedPct = Math.round((receipt.totalClaimed / receipt.totalEarned) * 100);
  const vestedPct = Math.round((receipt.totalVested / receipt.totalEarned) * 100);
  const claimableEntries = receipt.vestingSchedule.filter(v => v.status === 'claimable' || v.status === 'unlocking');
  const claimableTotal = claimableEntries.reduce((s, e) => s + e.amount, 0);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Toast display handler
  const showNextToast = useCallback(() => {
    if (toastQueueRef.current.length === 0) return;
    const next = toastQueueRef.current.shift()!;
    setActiveToast(next);
    setToastVisible(true);

    // Auto-dismiss after 5s
    const dismissId = window.setTimeout(() => {
      setToastVisible(false);
      window.setTimeout(() => {
        setActiveToast(null);
        showNextToast(); // show next in queue
      }, 400);
    }, 5000);
    timeoutsRef.current.push(dismissId);
  }, []);

  // Start notification simulation
  useEffect(() => {
    if (notifSimStartedRef.current) return;
    notifSimStartedRef.current = true;

    const sequence = generateVestingNotifSequence(receipt);
    const prefs = loadVestingNotifPrefs();

    sequence.forEach(({ notif, delayMs }) => {
      const tid = window.setTimeout(() => {
        // Check prefs
        if (notif.type === 'unlock_soon' && !prefs.unlockReminder) return;
        if (notif.type === 'claimable' && !prefs.claimReady) return;
        if (notif.type === 'reward_milestone' && !prefs.milestones) return;

        // Refresh timestamp
        const now = new Date();
        const freshNotif = {
          ...notif,
          id: `vn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
        };

        // Save to storage
        setNotifications(prev => {
          const updated = [freshNotif, ...prev];
          saveVestingNotifs(updated);
          return updated;
        });

        // Queue toast
        toastQueueRef.current.push(freshNotif);
        if (!activeToast) showNextToast();
      }, delayMs);
      timeoutsRef.current.push(tid);
    });

    return () => {
      timeoutsRef.current.forEach(t => window.clearTimeout(t));
      timeoutsRef.current = [];
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Toast queue watcher
  useEffect(() => {
    if (!activeToast && toastQueueRef.current.length > 0) {
      showNextToast();
    }
  }, [activeToast, showNextToast]);

  const handleMarkAllRead = () => {
    const updated = markAllVestingNotifsRead();
    setNotifications(updated);
  };

  const handleNotifClick = (notif: VestingNotification) => {
    const updated = markVestingNotifRead(notif.id);
    setNotifications(updated);

    if (notif.actionPath === 'vesting') setTab('Vesting');
    else if (notif.actionPath === 'claim') {
      const entry = claimableEntries[0];
      if (entry) { setClaimableEntry(entry); setShowClaimSheet(true); }
    }
    setShowNotifCenter(false);
  };

  return (
    <PageLayout>
      {/* Toast notification */}
      {activeToast && (
        <NotifToast
          notif={activeToast}
          visible={toastVisible}
          onDismiss={() => {
            setToastVisible(false);
            setTimeout(() => { setActiveToast(null); showNextToast(); }, 400);
          }}
          onClick={() => {
            setToastVisible(false);
            setTimeout(() => {
              setActiveToast(null);
              handleNotifClick(activeToast);
            }, 300);
          }}
        />
      )}

      {/* Claim sheet */}
      {showClaimSheet && claimableEntry && (
        <ClaimSheet
          entry={claimableEntry}
          receipt={receipt}
          onClose={() => { setShowClaimSheet(false); setClaimableEntry(null); }}
        />
      )}

      {/* Notification center sheet */}
      {showNotifCenter && (
        <NotifCenterSheet
          notifications={notifications}
          onClose={() => setShowNotifCenter(false)}
          onMarkAllRead={handleMarkAllRead}
          onNotifClick={handleNotifClick}
          onOpenPrefs={() => { setShowNotifCenter(false); setTimeout(() => setShowNotifPrefs(true), 300); }}
        />
      )}

      {/* Notification preferences sheet */}
      {showNotifPrefs && (
        <NotifPrefsSheet
          onClose={() => setShowNotifPrefs(false)}
        />
      )}

      <Header
        title="Phần thưởng"
        back
        action={{
          icon: Bell,
          onClick: () => setShowNotifCenter(true),
          ...(unreadCount > 0 ? {} : {}),
        }}
      />

      {/* Unread badge overlay on header */}
      {unreadCount > 0 && (
        <div className="fixed top-2 z-40" style={{ right: 16 }} onClick={() => setShowNotifCenter(true)}>
          <div className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center"
            style={{ background: '#EF4444', minWidth: 16, height: 16, padding: '0 4px' }}>
            <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        </div>
      )}

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {/* Hero */}
        <TrCard variant="hero" className="p-5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full"
            style={{ background: `radial-gradient(circle, ${receipt.projectLogoColor}33 0%, transparent 65%)` }} />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold"
              style={{ background: receipt.projectLogoColor + '22', border: `2px solid ${receipt.projectLogoColor}44`, color: receipt.projectLogoColor }}>
              {receipt.projectSymbol.slice(0, 2)}
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{receipt.projectName}</p>
              <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, fontFamily: 'monospace' }}>
                {receipt.totalEarned.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 600 }}>{receipt.rewardToken}</span>
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                ~${(receipt.totalEarned * receipt.rewardTokenPrice).toLocaleString()} USD
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative z-10 mb-3">
            <div className="flex justify-between mb-1">
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Tiến độ vest</span>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 600 }}>{vestedPct}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full relative" style={{ width: `${vestedPct}%`, background: receipt.projectLogoColor }}>
                <div className="absolute inset-0 rounded-full" style={{
                  width: `${Math.min((claimedPct / vestedPct) * 100, 100)}%`,
                  background: '#10B981',
                  borderRadius: '9999px',
                }} />
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ color: '#10B981', fontSize: 9 }}>Đã nhận {claimedPct}%</span>
              <span style={{ color: receipt.projectLogoColor, fontSize: 9 }}>Đã vest {vestedPct}%</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-2 relative z-10">
            <div className="flex-1 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>Đã nhận</p>
              <p style={{ color: '#10B981', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{receipt.totalClaimed.toLocaleString()}</p>
            </div>
            <div className="flex-1 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>Chờ nhận</p>
              <p style={{ color: '#F59E0B', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{receipt.totalPending.toLocaleString()}</p>
            </div>
            <div className="flex-1 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>Còn khóa</p>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                {(receipt.totalEarned - receipt.totalVested).toLocaleString()}
              </p>
            </div>
          </div>
        </TrCard>

        {/* Tab: Tổng quan */}
        {tab === 'Tổng quan' && (
          <>
            {/* Claimable banner */}
            {claimableTotal > 0 && (
              <TrCard className="p-4" style={{ border: '1px solid rgba(16,185,129,0.3)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(16,185,129,0.12)' }}>
                      <Gift size={18} color="#10B981" />
                    </div>
                    <div>
                      <p style={{ color: '#10B981', fontSize: 12, fontWeight: 700 }}>Có thể nhận ngay</p>
                      <p style={{ color: c.text1, fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
                        {claimableTotal.toLocaleString()} {receipt.rewardToken}
                      </p>
                    </div>
                  </div>
                  <CTAButton
                    variant="success"
                    onClick={() => {
                      setClaimableEntry(claimableEntries[0] || null);
                      setShowClaimSheet(true);
                    }}
                    style={{ paddingLeft: 16, paddingRight: 16, height: 40, borderRadius: 12 }}>
                    Nhận
                  </CTAButton>
                </div>
              </TrCard>
            )}

            {/* Recent notifications preview */}
            {notifications.length > 0 && (
              <TrCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BellRing size={15} color="#F59E0B" />
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Thông báo gần đây</p>
                    {unreadCount > 0 && (
                      <div className="px-1.5 py-0.5 rounded-full" style={{ background: '#EF4444' }}>
                        <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{unreadCount}</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowNotifCenter(true)} className="flex items-center gap-0.5"
                    style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>
                    Xem tất cả <ChevronRight size={12} />
                  </button>
                </div>
                {notifications.slice(0, 2).map(n => {
                  const cfg = NOTIF_TYPE_CFG[n.type] || NOTIF_TYPE_CFG.unlock_soon;
                  const Icon = cfg.icon;
                  return (
                    <div key={n.id} className="flex items-start gap-2.5 py-2 cursor-pointer"
                      style={{ borderBottom: `1px solid ${c.border}`, opacity: n.read ? 0.7 : 1 }}
                      onClick={() => handleNotifClick(n)}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: cfg.bg }}>
                        <Icon size={13} color={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: n.read ? 500 : 700 }}>{n.title}</p>
                        <p className="truncate" style={{ color: c.text3, fontSize: 10 }}>{n.message}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: '#3B82F6' }} />}
                    </div>
                  );
                })}
              </TrCard>
            )}

            {/* Next unlock countdown */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={15} color="#F59E0B" />
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Đợt mở khóa tiếp theo</p>
              </div>
              <CountdownTimer
                targetDate={receipt.nextUnlockDate}
                label={`${receipt.nextUnlockAmount.toLocaleString()} ${receipt.rewardToken} sẽ được mở khóa`}
                color="#F59E0B"
              />
            </TrCard>

            {/* Receipt details */}
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={15} color={c.text2} />
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Chi tiết vị trí</p>
              </div>
              <div className="flex flex-col gap-0">
                {[
                  { label: 'Pool', value: receipt.projectName },
                  { label: 'Token stake', value: `${receipt.stakedAmount.toLocaleString()} ${receipt.stakeToken}` },
                  { label: 'APY', value: `${receipt.poolAPY}%`, color: '#10B981' },
                  { label: 'Reward token', value: receipt.rewardToken },
                  { label: 'Giá token', value: `$${receipt.rewardTokenPrice}` },
                  { label: 'Tổng earned', value: `${receipt.totalEarned.toLocaleString()} ${receipt.rewardToken}` },
                  { label: 'Giá trị earned', value: `$${(receipt.totalEarned * receipt.rewardTokenPrice).toLocaleString()}` },
                  { label: 'Chain', value: receipt.chain },
                  { label: 'Contract', value: truncateAddress(receipt.contractAddress), mono: true },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${c.border}` }}>
                    <span style={{ color: c.text3, fontSize: 12 }}>{r.label}</span>
                    <span style={{ color: (r as any).color || c.text1, fontSize: 12, fontWeight: 600, fontFamily: (r as any).mono ? 'monospace' : undefined }}>
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </TrCard>

            {/* Mini vesting preview */}
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lock size={15} color="#8B5CF6" />
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Lịch vesting</p>
                </div>
                <button onClick={() => setTab('Vesting')} className="flex items-center gap-0.5"
                  style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>
                  Xem tất cả <ChevronRight size={12} />
                </button>
              </div>
              {receipt.vestingSchedule.slice(0, 4).map(v => (
                <VestingMiniRow key={v.id} entry={v} />
              ))}
              {receipt.vestingSchedule.length > 4 && (
                <p className="text-center mt-2" style={{ color: c.text3, fontSize: 11 }}>
                  +{receipt.vestingSchedule.length - 4} đợt nữa
                </p>
              )}
            </TrCard>
          </>
        )}

        {/* Tab: Vesting */}
        {tab === 'Vesting' && (
          <VestingTab receipt={receipt} onClaim={(entry) => { setClaimableEntry(entry); setShowClaimSheet(true); }} />
        )}

        {/* Tab: Lịch sử */}
        {tab === 'Lịch sử' && (
          <ClaimHistoryTab history={receipt.claimHistory} token={receipt.rewardToken} tokenPrice={receipt.rewardTokenPrice} />
        )}

        <RiskDisclosure />
        <div className="h-[60px]" />
      </PageContent>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   NotifToast — slide-in push notification toast
   ═══════════════════════════════════════════════════════════ */

function NotifToast({ notif, visible, onDismiss, onClick }: {
  notif: VestingNotification; visible: boolean; onDismiss: () => void; onClick: () => void;
}) {
  const c = useThemeColors();
  const cfg = NOTIF_TYPE_CFG[notif.type] || NOTIF_TYPE_CFG.unlock_soon;
  const Icon = cfg.icon;

  return (
    <div className="fixed left-3 right-3 z-[100] transition-all duration-400"
      style={{
        top: visible ? 16 : -100,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-20px)',
        transitionProperty: 'top, opacity, transform',
        transitionDuration: '400ms',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        maxWidth: 420,
        margin: '0 auto',
      }}>
      <div className="rounded-2xl p-3 flex items-start gap-3 cursor-pointer"
        style={{
          background: c.surface,
          border: `1px solid ${cfg.color}30`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px ${c.border}`,
        }}
        onClick={onClick}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: cfg.bg }}>
          <Icon size={18} color={cfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{notif.title}</p>
            <button onClick={e => { e.stopPropagation(); onDismiss(); }}
              className="p-0.5 rounded-md" style={{ background: c.surface2 }}>
              <X size={12} color={c.text3} />
            </button>
          </div>
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.4 }}>{notif.message}</p>
          {notif.actionLabel && (
            <p className="mt-1" style={{ color: cfg.color, fontSize: 10, fontWeight: 600 }}>{notif.actionLabel} →</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NotifCenterSheet — notification center bottom sheet
   ═══════════════════════════════════════════════════════════ */

function NotifCenterSheet({ notifications, onClose, onMarkAllRead, onNotifClick, onOpenPrefs }: {
  notifications: VestingNotification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onNotifClick: (n: VestingNotification) => void;
  onOpenPrefs: () => void;
}) {
  const c = useThemeColors();
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col"
        style={{ background: c.surface, maxWidth: 440, margin: '0 auto', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2 sticky top-0 z-10" style={{ background: c.surface }}>
          <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
        </div>
        <div className="px-5 pb-2 flex items-center justify-between sticky top-6 z-10" style={{ background: c.surface }}>
          <div className="flex items-center gap-2">
            <BellRing size={18} color={c.text1} />
            <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 800 }}>Thông báo vesting</h3>
            {unread > 0 && (
              <div className="px-1.5 py-0.5 rounded-full" style={{ background: '#EF4444' }}>
                <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{unread}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onOpenPrefs} className="p-1.5 rounded-lg" style={{ background: c.surface2 }}>
              <Settings size={14} color={c.text3} />
            </button>
            <button onClick={onClose}><X size={20} color={c.text3} /></button>
          </div>
        </div>

        {unread > 0 && (
          <div className="px-5 pb-2">
            <button onClick={onMarkAllRead}
              style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>
              Đánh dấu tất cả đã đọc
            </button>
          </div>
        )}

        <div className="px-5 pb-6 overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell size={36} color={c.text3} className="mx-auto mb-3" />
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Chưa có thông báo</p>
              <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5 }}>
                Thông báo vesting sẽ tự động xuất hiện khi có đợt mở khóa mới.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {notifications.map(n => {
                const cfg = NOTIF_TYPE_CFG[n.type] || NOTIF_TYPE_CFG.unlock_soon;
                const NIcon = cfg.icon;
                return (
                  <div key={n.id}
                    className="flex items-start gap-3 rounded-xl p-3 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      background: n.read ? 'transparent' : `${cfg.color}06`,
                      border: n.read ? `1px solid transparent` : `1px solid ${cfg.color}15`,
                    }}
                    onClick={() => onNotifClick(n)}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: cfg.bg }}>
                      <NIcon size={16} color={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: n.read ? 500 : 700 }}>{n.title}</p>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#3B82F6' }} />}
                      </div>
                      <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.4 }}>{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span style={{ color: c.text3, fontSize: 9 }}>{n.timestamp}</span>
                        {n.actionLabel && (
                          <span style={{ color: cfg.color, fontSize: 9, fontWeight: 600 }}>{n.actionLabel}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NotifPrefsSheet — notification preferences
   ═══════════════════════════════════════════════════════════ */

function NotifPrefsSheet({ onClose }: { onClose: () => void }) {
  const c = useThemeColors();
  const [prefs, setPrefs] = useState<VestingNotifPreferences>(() => loadVestingNotifPrefs());

  const toggle = (key: keyof VestingNotifPreferences) => {
    setPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      saveVestingNotifPrefs(updated);
      return updated;
    });
  };

  const items: { key: keyof VestingNotifPreferences; label: string; desc: string; icon: typeof Bell; color: string }[] = [
    { key: 'unlockReminder', label: 'Nhắc mở khóa', desc: 'Thông báo trước khi đợt vesting mở khóa', icon: Clock, color: '#F59E0B' },
    { key: 'claimReady', label: 'Sẵn sàng nhận', desc: 'Thông báo khi phần thưởng có thể nhận', icon: Gift, color: '#10B981' },
    { key: 'milestones', label: 'Milestone', desc: 'Thông báo khi đạt mục phần thưởng (25%, 50%, 75%)', icon: Award, color: '#EC4899' },
    { key: 'vestingComplete', label: 'Hoàn tất vesting', desc: 'Thông báo khi toàn bộ vesting schedule kết thúc', icon: CheckCircle, color: '#8B5CF6' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl"
        style={{ background: c.surface, maxWidth: 440, margin: '0 auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} /></div>
        <div className="px-5 pb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 800 }}>Cài đặt thông báo</h3>
            <button onClick={onClose}><X size={20} color={c.text3} /></button>
          </div>

          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
            Chọn loại thông báo vesting bạn muốn nhận. Thay đổi có hiệu lực ngay lập tức.
          </p>

          <div className="flex flex-col gap-1">
            {items.map(item => {
              const Icon = item.icon;
              const enabled = prefs[item.key] as boolean;
              return (
                <div key={item.key} className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: c.surface2 }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${item.color}15` }}>
                    <Icon size={16} color={item.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{item.label}</p>
                    <p style={{ color: c.text3, fontSize: 10 }}>{item.desc}</p>
                  </div>
                  <button onClick={() => toggle(item.key)}
                    className="w-11 h-6 rounded-full relative transition-all duration-200"
                    style={{
                      background: enabled ? item.color : c.borderSolid,
                    }}>
                    <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200"
                      style={{ left: enabled ? 22 : 2 }} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl p-3 flex items-start gap-2"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
            <Info size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              Đây là thông báo mô phỏng trong ứng dụng. Trong phiên bản sản xuất, thông báo sẽ được gửi qua push notification và email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VestingMiniRow — compact vesting entry
   ═══════════════════════════════════════════════════════════ */

function VestingMiniRow({ entry }: { entry: RewardVestingEntry }) {
  const c = useThemeColors();
  const statusCfg: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
    claimed: { icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Đã nhận' },
    claimable: { icon: Gift, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', label: 'Nhận ngay' },
    unlocking: { icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Sắp mở' },
    locked: { icon: Lock, color: '#8B95B3', bg: 'rgba(139,149,179,0.1)', label: 'Khóa' },
  };
  const st = statusCfg[entry.status] || statusCfg.locked;
  const Icon = st.icon;

  return (
    <div className="flex items-center gap-2.5 py-2" style={{ borderBottom: `1px solid ${c.border}` }}>
      <Icon size={14} color={st.color} />
      <div className="flex-1 min-w-0">
        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{entry.label}</p>
        <p style={{ color: c.text3, fontSize: 10 }}>{entry.unlockDate}</p>
      </div>
      <div className="text-right">
        <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
          {entry.amount.toLocaleString()} {entry.token}
        </p>
        <span className="px-1.5 py-0.5 rounded-md" style={{ background: st.bg, color: st.color, fontSize: 9, fontWeight: 600 }}>
          {st.label}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VestingTab — full vesting timeline
   ═══════════════════════════════════════════════════════════ */

function VestingTab({ receipt, onClaim }: { receipt: RewardClaimReceipt; onClaim: (e: RewardVestingEntry) => void }) {
  const c = useThemeColors();

  return (
    <div className="flex flex-col gap-4">
      {/* Visual timeline */}
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} color="#8B5CF6" />
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Lịch trình mở khóa</p>
        </div>

        {/* Cumulative progress bar */}
        <div className="mb-4">
          <div className="h-3 rounded-full overflow-hidden flex" style={{ background: c.surface2 }}>
            {receipt.vestingSchedule.map((v, i) => {
              const color = v.status === 'claimed' ? '#10B981'
                : v.status === 'claimable' ? '#3B82F6'
                : v.status === 'unlocking' ? '#F59E0B'
                : c.borderSolid;
              return (
                <div key={v.id} className="h-full"
                  style={{
                    width: `${v.percent}%`,
                    background: color,
                    borderRight: i < receipt.vestingSchedule.length - 1 ? `1px solid ${c.surface}` : 'none',
                  }} />
              );
            })}
          </div>
          <div className="flex mt-1.5 gap-3">
            {[
              { label: 'Đã nhận', color: '#10B981' },
              { label: 'Có thể nhận', color: '#3B82F6' },
              { label: 'Sắp mở', color: '#F59E0B' },
              { label: 'Khóa', color: c.borderSolid },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span style={{ color: c.text3, fontSize: 9 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline entries */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-3 bottom-3 w-px" style={{ background: c.borderSolid }} />

          {receipt.vestingSchedule.map((v, i) => {
            const isClaimed = v.status === 'claimed';
            const isClaimable = v.status === 'claimable' || v.status === 'unlocking';
            const dotColor = isClaimed ? '#10B981' : isClaimable ? '#3B82F6' : c.borderSolid;
            const dotSize = isClaimable ? 12 : 8;

            return (
              <div key={v.id} className="flex gap-3 relative mb-1" style={{ paddingLeft: 36 }}>
                {/* Dot */}
                <div className="absolute left-0 flex items-center justify-center"
                  style={{ width: 30, top: isClaimable ? 8 : 12 }}>
                  <div className="rounded-full" style={{
                    width: dotSize, height: dotSize, background: dotColor,
                    boxShadow: isClaimable ? `0 0 8px ${dotColor}66` : 'none',
                  }} />
                </div>

                <div className="flex-1 rounded-xl p-3 mb-1" style={{
                  background: isClaimable ? 'rgba(59,130,246,0.05)' : c.surface2,
                  border: isClaimable ? '1px solid rgba(59,130,246,0.15)' : `1px solid transparent`,
                }}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{v.label}</span>
                    <span style={{ color: dotColor, fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                      {v.amount.toLocaleString()} {v.token}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: c.text3, fontSize: 10 }}>{v.unlockDate} · {v.percent}%</span>
                    {isClaimed && v.claimedAt && (
                      <span style={{ color: '#10B981', fontSize: 9 }}>
                        <CheckCircle size={9} className="inline mr-0.5" /> {v.claimedAt}
                      </span>
                    )}
                    {isClaimable && (
                      <button onClick={() => onClaim(v)}
                        className="px-2 py-0.5 rounded-lg flex items-center gap-1"
                        style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 10, fontWeight: 600 }}>
                        <Gift size={10} /> Nhận
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </TrCard>

      {/* Vesting info */}
      <div className="rounded-xl p-3 flex items-start gap-2"
        style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
        <Info size={13} color="#8B5CF6" className="shrink-0 mt-0.5" />
        <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
          Phần thưởng được vest theo lịch trình tự động. Token mở khóa sẽ chuyển sang trạng thái "Có thể nhận"
          và bạn có thể claim bất cứ lúc nào sau đó. Token chưa vest vẫn tiếp tục tích lũy.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ClaimHistoryTab — past claim transactions
   ═══════════════════════════════════════════════════════════ */

function ClaimHistoryTab({ history, token, tokenPrice }: {
  history: ClaimHistoryEntry[]; token: string; tokenPrice: number;
}) {
  const c = useThemeColors();

  if (history.length === 0) {
    return (
      <TrCard className="p-8 text-center">
        <Gift size={36} color={c.text3} className="mx-auto mb-3" />
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Chưa có giao dịch nhận thưởng</p>
        <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5 }}>
          Khi bạn nhận phần thưởng, lịch sử sẽ hiển thị ở đây.
        </p>
      </TrCard>
    );
  }

  const totalClaimed = history.reduce((s, h) => s + h.amount, 0);
  const totalUSD = history.reduce((s, h) => s + h.usdValue, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={15} color="#10B981" />
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Tổng đã nhận</p>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 10 }}>Số lượng</p>
            <p style={{ color: '#10B981', fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
              {totalClaimed.toLocaleString()}
            </p>
            <p style={{ color: c.text3, fontSize: 9 }}>{token}</p>
          </div>
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 10 }}>Giá trị</p>
            <p style={{ color: c.text1, fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
              ${totalUSD.toLocaleString()}
            </p>
            <p style={{ color: c.text3, fontSize: 9 }}>USD</p>
          </div>
          <div className="flex-1 rounded-xl p-3 text-center" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 10 }}>Giao dịch</p>
            <p style={{ color: c.text1, fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>
              {history.length}
            </p>
            <p style={{ color: c.text3, fontSize: 9 }}>lần</p>
          </div>
        </div>
      </TrCard>

      {/* Entries */}
      <div className="flex flex-col gap-2">
        {history.map(h => (
          <TrCard key={h.id} className="p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} color={h.status === 'confirmed' ? '#10B981' : '#F59E0B'} />
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                  +{h.amount.toLocaleString()} {h.token}
                </span>
              </div>
              <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>
                ~${h.usdValue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: 10 }}>{h.claimedAt}</span>
              <div className="flex items-center gap-2">
                <span style={{ color: c.text3, fontSize: 9 }}>Gas: {h.gasUsed}</span>
                <span style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace' }}>{h.txHash}</span>
              </div>
            </div>
          </TrCard>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ClaimSheet — bottom sheet to claim rewards
   ═══════════════════════════════════════════════════════════ */

function ClaimSheet({ entry, receipt, onClose }: {
  entry: RewardVestingEntry; receipt: RewardClaimReceipt; onClose: () => void;
}) {
  const c = useThemeColors();
  const [step, setStep] = useState<'review' | 'processing' | 'success'>('review');
  const [processing, setProcessing] = useState(false);

  const usdValue = entry.amount * receipt.rewardTokenPrice;
  const txHash = '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6);

  const handleClaim = () => {
    setStep('processing');
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep('success');
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col"
        style={{ background: c.surface, maxWidth: 440, margin: '0 auto', maxHeight: '90vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2 sticky top-0 z-10" style={{ background: c.surface }}>
          <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
        </div>
        <div className="px-5 pb-6 flex flex-col gap-4">
          {step === 'review' && (
            <>
              <div className="flex items-center justify-between">
                <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 800 }}>Nhận phần thưởng</h3>
                <button onClick={onClose}><X size={20} color={c.text3} /></button>
              </div>

              <div className="text-center py-3">
                <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.12)' }}>
                  <Gift size={24} color="#10B981" />
                </div>
                <p style={{ color: c.text1, fontSize: 24, fontWeight: 800, fontFamily: 'monospace' }}>
                  {entry.amount.toLocaleString()} {entry.token}
                </p>
                <p style={{ color: c.text3, fontSize: 12 }}>~${usdValue.toLocaleString()} USD</p>
              </div>

              <div className="flex flex-col gap-0">
                {[
                  { label: 'Đợt', value: entry.label },
                  { label: 'Ngày mở khóa', value: entry.unlockDate },
                  { label: 'Số lượng', value: `${entry.amount.toLocaleString()} ${entry.token}` },
                  { label: 'Giá trị', value: `$${usdValue.toLocaleString()}` },
                  { label: 'Chain', value: receipt.chain },
                  { label: 'Gas ước tính', value: '~$0.15' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${c.border}` }}>
                    <span style={{ color: c.text2, fontSize: 12 }}>{r.label}</span>
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-3 flex items-start gap-2"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                <Info size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  Token sẽ được gửi về ví của bạn trên {receipt.chain} sau khi giao dịch được xác nhận.
                </p>
              </div>

              <CTAButton variant="success" onClick={handleClaim}>
                Xác nhận nhận {entry.amount.toLocaleString()} {entry.token}
              </CTAButton>
            </>
          )}

          {step === 'processing' && (
            <div className="py-8 text-center">
              <RefreshCw size={32} color={receipt.projectLogoColor} className="mx-auto mb-4 animate-spin" />
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Đang xử lý...</p>
              <p style={{ color: c.text3, fontSize: 12 }}>Gửi giao dịch lên {receipt.chain}</p>
            </div>
          )}

          {step === 'success' && (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <CheckCircle size={32} color="#10B981" />
                </div>
                <h3 style={{ color: c.text1, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Nhận thành công!</h3>
                <p style={{ color: c.text2, fontSize: 13 }}>
                  {entry.amount.toLocaleString()} {entry.token} đã được gửi về ví của bạn
                </p>
              </div>

              <TrCard className="p-3">
                {[
                  { label: 'Số lượng', value: `${entry.amount.toLocaleString()} ${entry.token}` },
                  { label: 'Giá trị', value: `~$${usdValue.toLocaleString()}` },
                  { label: 'Tx Hash', value: txHash },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${c.border}` }}>
                    <span style={{ color: c.text3, fontSize: 12 }}>{r.label}</span>
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</span>
                  </div>
                ))}
              </TrCard>

              <CTAButton variant="success" onClick={onClose}>
                Hoàn tất
              </CTAButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}