/**
 * ══════════════════════════════════════════════════════════════════
 *  TRADE SETTINGS PAGE — Sprint 2B
 * ══════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { Settings, Shield, Bell, Eye, Sliders, ChevronRight, Info } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { useActionToast } from '../../hooks/useActionToast';
import { useTradeSettings } from '../../hooks/useTradeSettings';

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const c = useThemeColors();
  return (
    <button onClick={onToggle} className="w-11 h-6 rounded-full relative transition-all"
      style={{ background: on ? '#10B981' : c.surface3 }}>
      <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm"
        style={{ left: on ? 22 : 2 }} />
    </button>
  );
}

export function TradeSettingsPage() {
  const c = useThemeColors();
  const actionToast = useActionToast();
  const { settings, updateSettings, resetSettings } = useTradeSettings();

  const defaultOrderType = settings.defaultOrderType;
  const defaultSlippage = settings.defaultSlippage;
  const confirmOrders = settings.confirmOrders;
  const skipConfirmSmall = settings.skipConfirmSmall;
  const smallOrderThreshold = settings.smallOrderThreshold;
  const soundOnFill = settings.soundOnFill;
  const hapticOnFill = settings.hapticOnFill;
  const showTpsl = settings.showTpsl;
  const bracketMode = settings.bracketMode;
  const priceDecimals = settings.priceDecimals;
  const defaultPctButtons = settings.defaultPctButtons;
  const showOrderBook = settings.showOrderBook;
  const showRecentTrades = settings.showRecentTrades;
  const chartTimeframe = settings.chartTimeframe;

  const SLIPPAGE_PRESETS = [0.1, 0.3, 0.5, 1.0, 2.0];
  const ORDER_TYPES = [
    { id: 'market', label: 'Thị trường' },
    { id: 'limit', label: 'Giới hạn' },
    { id: 'stop', label: 'Dừng lỗ' },
  ];
  const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D'];

  return (
    <PageLayout>
      <Header title="Cài đặt giao dịch" back />
      <PageContent gap="relaxed">

        {/* ─── Order Defaults ─── */}
        <PageSection label="Mặc định lệnh">
          <TrCard rounded="md" className="p-4 flex flex-col gap-4">
            {/* Default order type */}
            <div>
              <p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Loại lệnh mặc định
              </p>
              <div className="flex gap-2">
                {ORDER_TYPES.map(type => (
                  <button key={type.id}
                    onClick={() => updateSettings({ defaultOrderType: type.id })}
                    className="flex-1 py-2 rounded-lg text-center"
                    style={{
                      background: defaultOrderType === type.id ? c.chipActiveBg : c.surface2,
                      color: defaultOrderType === type.id ? c.chipActiveText : c.text2,
                      border: `1px solid ${defaultOrderType === type.id ? c.chipActiveBorder : c.borderSolid}`,
                      fontSize: 12, fontWeight: defaultOrderType === type.id ? 700 : 500,
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Default slippage */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>
                  Trượt giá tối đa (Market orders)
                </p>
                <span style={{ color: c.primary, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                  {defaultSlippage}%
                </span>
              </div>
              <div className="flex gap-2">
                {SLIPPAGE_PRESETS.map(val => (
                  <button key={val}
                    onClick={() => updateSettings({ defaultSlippage: val })}
                    className="flex-1 py-1.5 rounded-lg text-center"
                    style={{
                      background: defaultSlippage === val ? c.chipActiveBg : c.surface2,
                      color: defaultSlippage === val ? c.chipActiveText : c.text2,
                      border: `1px solid ${defaultSlippage === val ? c.chipActiveBorder : c.borderSolid}`,
                      fontSize: 11, fontWeight: 600,
                    }}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* TP/SL default */}
            <SettingRow
              label="Mặc định mở TP/SL"
              description="Tự động mở form TP/SL khi đặt lệnh"
              trailing={<Toggle on={showTpsl} onToggle={() => updateSettings({ showTpsl: !showTpsl })} />}
            />

            {/* Bracket mode */}
            {showTpsl && (
              <SettingRow
                label="Bracket Order mặc định"
                description="Bắt buộc cả TP và SL (linked). Khi một lệnh khớp, lệnh còn lại tự hủy."
                trailing={<Toggle on={bracketMode} onToggle={() => updateSettings({ bracketMode: !bracketMode })} />}
              />
            )}
          </TrCard>
        </PageSection>

        {/* ─── Confirmation ─── */}
        <PageSection label="Xác nhận lệnh">
          <TrCard rounded="md" className="p-4 flex flex-col gap-4">
            <SettingRow
              label="Xác nhận trước khi đặt lệnh"
              description="Hiển thị bottom sheet xác nhận"
              trailing={<Toggle on={confirmOrders} onToggle={() => updateSettings({ confirmOrders: !confirmOrders })} />}
            />
            {confirmOrders && (
              <SettingRow
                label="Bỏ qua xác nhận cho lệnh nhỏ"
                description={`Lệnh < $${smallOrderThreshold} không cần xác nhận`}
                trailing={<Toggle on={skipConfirmSmall} onToggle={() => updateSettings({ skipConfirmSmall: !skipConfirmSmall })} />}
              />
            )}
            {confirmOrders && skipConfirmSmall && (
              <div>
                <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Ngưỡng lệnh nhỏ (USDT)</p>
                <input
                  type="number"
                  value={smallOrderThreshold}
                  onChange={e => updateSettings({ smallOrderThreshold: e.target.value })}
                  className="w-full rounded-lg px-3 py-2"
                  style={{
                    background: c.surface2, border: `1px solid ${c.borderSolid}`,
                    color: c.text1, fontSize: 14, fontFamily: 'monospace', outline: 'none',
                  }}
                />
              </div>
            )}
          </TrCard>
        </PageSection>

        {/* ─── Feedback ─── */}
        <PageSection label="Phản hồi">
          <TrCard rounded="md" className="p-4 flex flex-col gap-4">
            <SettingRow
              label="Âm thanh khi khớp lệnh"
              trailing={<Toggle on={soundOnFill} onToggle={() => updateSettings({ soundOnFill: !soundOnFill })} />}
            />
            <SettingRow
              label="Rung khi khớp lệnh"
              trailing={<Toggle on={hapticOnFill} onToggle={() => updateSettings({ hapticOnFill: !hapticOnFill })} />}
            />
          </TrCard>
        </PageSection>

        {/* ─── Display ─── */}
        <PageSection label="Hiển thị">
          <TrCard rounded="md" className="p-4 flex flex-col gap-4">
            <SettingRow
              label="Hiển thị Order Book"
              description="Trong màn hình giao dịch"
              trailing={<Toggle on={showOrderBook} onToggle={() => updateSettings({ showOrderBook: !showOrderBook })} />}
            />
            <SettingRow
              label="Hiển thị Giao dịch gần đây"
              description="Time & Sales feed"
              trailing={<Toggle on={showRecentTrades} onToggle={() => updateSettings({ showRecentTrades: !showRecentTrades })} />}
            />
            <SettingRow
              label="Nút phần trăm nhanh"
              description="25% / 50% / 75% / 100%"
              trailing={<Toggle on={defaultPctButtons} onToggle={() => updateSettings({ defaultPctButtons: !defaultPctButtons })} />}
            />

            {/* Chart timeframe */}
            <div>
              <p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Khung thời gian chart mặc định
              </p>
              <div className="flex gap-1.5">
                {TIMEFRAMES.map(tf => (
                  <button key={tf}
                    onClick={() => updateSettings({ chartTimeframe: tf })}
                    className="flex-1 py-1.5 rounded-lg text-center"
                    style={{
                      background: chartTimeframe === tf ? c.chipActiveBg : c.surface2,
                      color: chartTimeframe === tf ? c.chipActiveText : c.text2,
                      border: `1px solid ${chartTimeframe === tf ? c.chipActiveBorder : c.borderSolid}`,
                      fontSize: 11, fontWeight: chartTimeframe === tf ? 700 : 500,
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Price decimals */}
            <div>
              <p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Chữ số thập phân giá
              </p>
              <div className="flex gap-2">
                {['auto', '2', '4', '6'].map(d => (
                  <button key={d}
                    onClick={() => updateSettings({ priceDecimals: d })}
                    className="flex-1 py-1.5 rounded-lg text-center"
                    style={{
                      background: priceDecimals === d ? c.chipActiveBg : c.surface2,
                      color: priceDecimals === d ? c.chipActiveText : c.text2,
                      border: `1px solid ${priceDecimals === d ? c.chipActiveBorder : c.borderSolid}`,
                      fontSize: 11, fontWeight: 600,
                    }}
                  >
                    {d === 'auto' ? 'Tự động' : d}
                  </button>
                ))}
              </div>
            </div>
          </TrCard>
        </PageSection>

        {/* Reset button */}
        <button
          onClick={() => {
            resetSettings();
            actionToast.success('Đã đặt lại cài đặt mặc định');
          }}
          className="w-full py-3 rounded-xl"
          style={{
            background: 'rgba(239,68,68,0.08)',
            color: '#EF4444',
            border: '1px solid rgba(239,68,68,0.2)',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Đặt lại mặc định
        </button>

        {/* Info note */}
        <div className="mx-0 flex items-start gap-2 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
          <Info size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: '#3B82F6', fontSize: 11, lineHeight: 1.5 }}>
            Cài đặt được lưu cục bộ trên thiết bị và áp dụng ngay khi thay đổi. Đăng nhập trên thiết bị khác sẽ dùng cài đặt mặc định.
          </p>
        </div>

      </PageContent>
    </PageLayout>
  );
}

function SettingRow({ label, description, trailing }: {
  label: string; description?: string; trailing?: React.ReactNode;
}) {
  const c = useThemeColors();
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1">
        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{label}</p>
        {description && <p style={{ color: c.text3, fontSize: 11, marginTop: 1 }}>{description}</p>}
      </div>
      {trailing}
    </div>
  );
}