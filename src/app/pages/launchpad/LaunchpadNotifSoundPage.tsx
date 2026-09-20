/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadNotifSoundPage — Notification Sound Toggle (Phase 4.9)
 * ══════════════════════════════════════════════════════════════
 *  Pattern C — Form with Bottom CTA
 *  Features: Master toggle, per-category sound config, volume sliders,
 *            sound type selector, DND schedule, vibrate toggle,
 *            preview/test sounds, save confirmation
 */

import React, { useState, useCallback } from 'react';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  Volume2, VolumeX, Bell, Vibrate, Moon,
  ChevronDown, ChevronUp, CheckCircle, Play,
  Info, Clock,
} from 'lucide-react';
import {
  loadNotifSoundSettings, saveNotifSoundSettings,
  SOUND_TYPES,
  type NotifSoundSettings, type NotifSoundCategory,
} from './launchpadData';

export function LaunchpadNotifSoundPage() {
  const c = useThemeColors();

  const [settings, setSettings] = useState<NotifSoundSettings>(() => loadNotifSoundSettings());
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSettings = useCallback((updater: (prev: NotifSoundSettings) => NotifSoundSettings) => {
    setSettings(prev => {
      const next = updater(prev);
      setHasChanges(true);
      return next;
    });
  }, []);

  const toggleMaster = () => {
    updateSettings(s => ({ ...s, masterEnabled: !s.masterEnabled }));
  };

  const setMasterVolume = (vol: number) => {
    updateSettings(s => ({ ...s, masterVolume: vol }));
  };

  const toggleVibrate = () => {
    updateSettings(s => ({ ...s, vibrate: !s.vibrate }));
  };

  const toggleDND = () => {
    updateSettings(s => ({ ...s, doNotDisturb: !s.doNotDisturb }));
  };

  const setDNDHour = (field: 'dndStartHour' | 'dndEndHour', val: number) => {
    updateSettings(s => ({ ...s, [field]: val }));
  };

  const toggleCategory = (catId: string) => {
    updateSettings(s => ({
      ...s,
      categories: s.categories.map(cat =>
        cat.id === catId ? { ...cat, enabled: !cat.enabled } : cat
      ),
    }));
  };

  const setCategorySound = (catId: string, soundType: NotifSoundCategory['soundType']) => {
    updateSettings(s => ({
      ...s,
      categories: s.categories.map(cat =>
        cat.id === catId ? { ...cat, soundType } : cat
      ),
    }));
  };

  const setCategoryVolume = (catId: string, volume: number) => {
    updateSettings(s => ({
      ...s,
      categories: s.categories.map(cat =>
        cat.id === catId ? { ...cat, volume } : cat
      ),
    }));
  };

  const previewSound = (catId: string) => {
    setPlayingPreview(catId);
    setTimeout(() => setPlayingPreview(null), 1200);
  };

  const handleSave = () => {
    saveNotifSoundSettings(settings);
    setSaved(true);
    setHasChanges(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PageLayout variant="flush">
      <Header title="Âm thanh thông báo" back />

      <PageContent gap="default">
        {/* Master Controls Hero */}
        <TrCard variant="hero" className="p-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)' }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: settings.masterEnabled ? 'rgba(99,102,241,0.15)' : 'rgba(139,149,179,0.15)' }}>
                  {settings.masterEnabled
                    ? <Volume2 size={20} color="#6366F1" />
                    : <VolumeX size={20} color="#8B95B3" />}
                </div>
                <div>
                  <p style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>Âm thanh tổng</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                    {settings.masterEnabled ? 'Đang bật' : 'Đã tắt'}
                  </p>
                </div>
              </div>
              <ToggleSwitch enabled={settings.masterEnabled} onChange={toggleMaster} />
            </div>

            {/* Master volume slider */}
            {settings.masterEnabled && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Âm lượng tổng</span>
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                    {settings.masterVolume}%
                  </span>
                </div>
                <input
                  type="range" min={0} max={100} value={settings.masterVolume}
                  onChange={e => setMasterVolume(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #6366F1 ${settings.masterVolume}%, rgba(255,255,255,0.15) ${settings.masterVolume}%)` }}
                />
              </div>
            )}
          </div>
        </TrCard>

        {/* Quick toggles */}
        <TrCard className="p-0 overflow-hidden">
          <QuickToggleRow
            icon={<Vibrate size={16} color="#8B5CF6" />}
            label="Rung"
            description="Rung kèm âm thanh thông báo"
            enabled={settings.vibrate}
            onChange={toggleVibrate}
            borderBottom
          />
          <QuickToggleRow
            icon={<Moon size={16} color="#F59E0B" />}
            label="Không làm phiền"
            description={settings.doNotDisturb
              ? `${settings.dndStartHour}:00 – ${settings.dndEndHour}:00`
              : 'Tắt âm thanh theo lịch'}
            enabled={settings.doNotDisturb}
            onChange={toggleDND}
            borderBottom={false}
          />
        </TrCard>

        {/* DND schedule */}
        {settings.doNotDisturb && (
          <TrCard variant="inner" className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} color="#F59E0B" />
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Lịch không làm phiền</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Từ</p>
                <select
                  value={settings.dndStartHour}
                  onChange={e => setDNDHour('dndStartHour', Number(e.target.value))}
                  className="w-full rounded-xl px-3 py-2"
                  style={{ background: c.surface2, color: c.text1, fontSize: 13, border: `1px solid ${c.border}` }}
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Đến</p>
                <select
                  value={settings.dndEndHour}
                  onChange={e => setDNDHour('dndEndHour', Number(e.target.value))}
                  className="w-full rounded-xl px-3 py-2"
                  style={{ background: c.surface2, color: c.text1, fontSize: 13, border: `1px solid ${c.border}` }}
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            </div>
          </TrCard>
        )}

        {/* Category settings */}
        <PageSection label="Âm thanh theo loại" accentColor="#3B82F6">
          <div className="flex flex-col gap-2">
            {settings.categories.map(cat => {
              const isExpanded = expandedCategory === cat.id;
              const isPlaying = playingPreview === cat.id;
              return (
                <TrCard key={cat.id} className="overflow-hidden">
                  {/* Category row */}
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: cat.color + '15' }}>
                      <span style={{ fontSize: 16 }}>{cat.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{cat.label}</p>
                      <p style={{ color: c.text3, fontSize: 10 }}>{cat.description}</p>
                    </div>
                    <ToggleSwitch
                      enabled={cat.enabled && settings.masterEnabled}
                      onChange={() => toggleCategory(cat.id)}
                      small
                    />
                    <button onClick={() => setExpandedCategory(isExpanded ? null : cat.id)} className="p-1">
                      {isExpanded
                        ? <ChevronUp size={14} color={c.text3} />
                        : <ChevronDown size={14} color={c.text3} />}
                    </button>
                  </div>

                  {/* Expanded settings */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0" style={{ borderTop: `1px solid ${c.border}` }}>
                      {/* Sound type */}
                      <div className="mt-3 mb-3">
                        <p style={{ color: c.text3, fontSize: 10, marginBottom: 6 }}>Kiểu âm thanh</p>
                        <div className="flex flex-wrap gap-1.5">
                          {SOUND_TYPES.map(st => (
                            <button key={st.value}
                              onClick={() => setCategorySound(cat.id, st.value as NotifSoundCategory['soundType'])}
                              className="px-3 py-1.5 rounded-lg"
                              style={{
                                background: cat.soundType === st.value ? cat.color + '15' : c.surface2,
                                border: `1px solid ${cat.soundType === st.value ? cat.color + '40' : 'transparent'}`,
                                color: cat.soundType === st.value ? cat.color : c.text3,
                                fontSize: 11, fontWeight: cat.soundType === st.value ? 600 : 400,
                              }}>
                              {st.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Volume */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ color: c.text3, fontSize: 10 }}>Âm lượng</span>
                          <span style={{ color: c.text1, fontSize: 10, fontWeight: 600, fontFamily: 'monospace' }}>
                            {cat.volume}%
                          </span>
                        </div>
                        <input
                          type="range" min={0} max={100} value={cat.volume}
                          onChange={e => setCategoryVolume(cat.id, Number(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{ background: `linear-gradient(to right, ${cat.color} ${cat.volume}%, ${c.surface2} ${cat.volume}%)` }}
                        />
                      </div>

                      {/* Preview */}
                      <button
                        onClick={() => previewSound(cat.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl w-full"
                        style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
                        {isPlaying
                          ? <CheckCircle size={14} color="#10B981" />
                          : <Play size={14} color={cat.color} />}
                        <span style={{ color: isPlaying ? '#10B981' : c.text2, fontSize: 11, fontWeight: 500 }}>
                          {isPlaying ? 'Đang phát...' : 'Nghe thử'}
                        </span>
                        {isPlaying && (
                          <div className="flex gap-0.5 ml-auto">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="w-0.5 rounded-full animate-pulse"
                                style={{ height: 6 + Math.random() * 8, background: cat.color, animationDelay: `${i * 100}ms` }} />
                            ))}
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* Info banner */}
        <div className="rounded-xl p-3 flex items-start gap-2"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
          <Info size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
            Âm thanh chỉ phát khi ứng dụng đang hoạt động. Thông báo push ngoài app sử dụng cài đặt hệ thống thiết bị.
          </p>
        </div>

        <div className="h-[60px]" />
      </PageContent>

      {/* Save footer */}
      <StickyFooter>
        {saved && (
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle size={14} color="#10B981" />
            <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>Đã lưu cài đặt</span>
          </div>
        )}
        <CTAButton onClick={handleSave} disabled={!hasChanges && !saved}>
          <Bell size={16} />
          Lưu cài đặt âm thanh
        </CTAButton>
      </StickyFooter>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   ToggleSwitch — reusable toggle
   ═══════════════════════════════════════════════════════════ */

function ToggleSwitch({ enabled, onChange, small }: { enabled: boolean; onChange: () => void; small?: boolean }) {
  const w = small ? 36 : 44;
  const h = small ? 20 : 24;
  const dot = small ? 16 : 20;
  return (
    <button onClick={onChange}
      className="relative rounded-full transition-colors duration-200 shrink-0"
      style={{ width: w, height: h, background: enabled ? '#6366F1' : 'rgba(139,149,179,0.3)' }}>
      <div className="absolute top-0.5 rounded-full bg-white transition-transform duration-200 shadow"
        style={{ width: dot, height: dot, transform: `translateX(${enabled ? w - dot - 2 : 2}px)` }} />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   QuickToggleRow — settings row with toggle
   ═══════════════════════════════════════════════════════════ */

function QuickToggleRow({ icon, label, description, enabled, onChange, borderBottom }: {
  icon: React.ReactNode; label: string; description: string;
  enabled: boolean; onChange: () => void; borderBottom: boolean;
}) {
  const c = useThemeColors();
  return (
    <div className="flex items-center gap-3 px-4 py-3.5"
      style={{ borderBottom: borderBottom ? `1px solid ${c.border}` : undefined }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: c.surface2 }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{label}</p>
        <p style={{ color: c.text3, fontSize: 10 }}>{description}</p>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} small />
    </div>
  );
}