/**
 * ══════════════════════════════════════════════════════════════════
 *  ADVANCED ORDER TYPES — P1 Features
 * ══════════════════════════════════════════════════════════════════
 *  Professional order execution options:
 *  - Post-Only (Maker-only)
 *  - IOC (Immediate or Cancel)
 *  - FOK (Fill or Kill)
 *  - Reduce-Only
 *  - Conditional Orders (Trigger + Execution)
 *  - Iceberg Orders
 */

import React, { useState } from 'react';
import { Info, AlertTriangle, CheckCircle, Snowflake, Eye, EyeOff } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════════
   ORDER TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export type OrderType = 
  | 'market'
  | 'limit'
  | 'stop-market'
  | 'stop-limit'
  | 'trailing-stop';

export type OrderTimeInForce = 
  | 'GTC'  // Good Till Cancel
  | 'IOC'  // Immediate or Cancel
  | 'FOK'  // Fill or Kill
  | 'GTX'; // Good Till Crossing (Post-only)

export interface OrderOptions {
  postOnly?: boolean;
  reduceOnly?: boolean;
  iceberg?: {
    enabled: boolean;
    visibleSize: number;
  };
}

/* ═══════════════════════════════════════════════════════════════
   1. ORDER TYPE SELECTOR WITH ADVANCED OPTIONS
   ═══════════════════════════════════════════════════════════════ */

interface OrderTypeSelectorProps {
  selectedType: OrderType;
  selectedTIF: OrderTimeInForce;
  options: OrderOptions;
  onTypeChange: (type: OrderType) => void;
  onTIFChange: (tif: OrderTimeInForce) => void;
  onOptionsChange: (options: OrderOptions) => void;
  className?: string;
}

export function OrderTypeSelector({
  selectedType,
  selectedTIF,
  options,
  onTypeChange,
  onTIFChange,
  onOptionsChange,
  className = '',
}: OrderTypeSelectorProps) {
  const c = useThemeColors();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const orderTypes: { value: OrderType; label: string; description: string }[] = [
    { value: 'market', label: 'Market', description: 'Khớp ngay lập tức với giá tốt nhất' },
    { value: 'limit', label: 'Limit', description: 'Đặt giá mong muốn, chờ khớp' },
    { value: 'stop-market', label: 'Stop Market', description: 'Kích hoạt Market khi chạm trigger' },
    { value: 'stop-limit', label: 'Stop Limit', description: 'Kích hoạt Limit khi chạm trigger' },
    { value: 'trailing-stop', label: 'Trailing Stop', description: 'Stop tự động điều chỉnh theo giá' },
  ];

  const timeInForce: { value: OrderTimeInForce; label: string; description: string; disabled?: boolean }[] = [
    { value: 'GTC', label: 'GTC', description: 'Good Till Cancel - Lệnh tồn tại cho đến khi khớp hoặc hủy' },
    { value: 'IOC', label: 'IOC', description: 'Immediate or Cancel - Khớp ngay phần có thể, hủy phần còn lại' },
    { value: 'FOK', label: 'FOK', description: 'Fill or Kill - Khớp toàn bộ ngay hoặc hủy' },
    { value: 'GTX', label: 'Post-Only', description: 'Chỉ làm maker, không bao giờ ăn sổ lệnh (taker)', disabled: selectedType === 'market' },
  ];

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Basic Order Type */}
      <div>
        <label style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 8, display: 'block' }}>
          Loại lệnh
        </label>
        <div className="grid grid-cols-2 gap-2">
          {orderTypes.slice(0, 2).map(type => (
            <button
              key={type.value}
              onClick={() => onTypeChange(type.value)}
              className="rounded-xl p-3 text-left transition-all"
              style={{
                background: selectedType === type.value ? c.chipActiveBg : c.surface,
                border: `1.5px solid ${selectedType === type.value ? c.chipActiveBorder : c.borderSolid}`,
              }}
            >
              <p style={{ color: selectedType === type.value ? c.chipActiveText : c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                {type.label}
              </p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 2 }}>
                {type.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Order Types */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center justify-between py-2 px-3 rounded-xl"
        style={{ background: c.surface2 }}
      >
        <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
          Advanced Order Types
        </span>
        <span style={{ color: c.primary, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
          {showAdvanced ? 'Ẩn' : 'Hiện'}
        </span>
      </button>

      {showAdvanced && (
        <div className="flex flex-col gap-2">
          {orderTypes.slice(2).map(type => (
            <button
              key={type.value}
              onClick={() => onTypeChange(type.value)}
              className="rounded-xl p-3 text-left transition-all"
              style={{
                background: selectedType === type.value ? c.chipActiveBg : c.surface,
                border: `1.5px solid ${selectedType === type.value ? c.chipActiveBorder : c.borderSolid}`,
              }}
            >
              <p style={{ color: selectedType === type.value ? c.chipActiveText : c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                {type.label}
              </p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 2 }}>
                {type.description}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Time In Force (for Limit orders) */}
      {(selectedType === 'limit' || selectedType === 'stop-limit') && (
        <div>
          <label style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, marginBottom: 8, display: 'block' }}>
            Time In Force
          </label>
          <div className="grid grid-cols-2 gap-2">
            {timeInForce.map(tif => (
              <button
                key={tif.value}
                onClick={() => !tif.disabled && onTIFChange(tif.value)}
                disabled={tif.disabled}
                className="rounded-xl p-2.5 text-center transition-all"
                style={{
                  background: selectedTIF === tif.value ? c.primary : c.surface2,
                  color: selectedTIF === tif.value ? '#fff' : tif.disabled ? c.text3 : c.text2,
                  fontSize: FONT_SCALE.xs,
                  fontWeight: selectedTIF === tif.value ? FONT_WEIGHT.bold : FONT_WEIGHT.semibold,
                  opacity: tif.disabled ? 0.5 : 1,
                  cursor: tif.disabled ? 'not-allowed' : 'pointer',
                }}
                title={tif.description}
              >
                {tif.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Order Options */}
      <TrCard className="p-3">
        <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, marginBottom: 8 }}>
          Tùy chọn lệnh
        </p>
        <div className="flex flex-col gap-2">
          {/* Reduce Only */}
          <label className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.reduceOnly || false}
                onChange={e => onOptionsChange({ ...options, reduceOnly: e.target.checked })}
                style={{ accentColor: c.primary }}
              />
              <div>
                <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                  Reduce-Only
                </p>
                <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                  Lệnh chỉ đóng vị thế, không mở vị thế mới
                </p>
              </div>
            </div>
          </label>

          {/* Iceberg */}
          {(selectedType === 'limit' || selectedType === 'stop-limit') && (
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.iceberg?.enabled || false}
                  onChange={e => onOptionsChange({ 
                    ...options, 
                    iceberg: { enabled: e.target.checked, visibleSize: options.iceberg?.visibleSize || 10 }
                  })}
                  style={{ accentColor: c.primary }}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <Snowflake size={12} color={c.primary} />
                    <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                      Iceberg Order
                    </p>
                  </div>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                    Ẩn size thực, chỉ hiện một phần trên sổ lệnh
                  </p>
                </div>
              </div>
            </label>
          )}
        </div>
      </TrCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. ORDER TYPE INFO CARDS
   ═══════════════════════════════════════════════════════════════ */

interface OrderTypeInfoProps {
  type: OrderTimeInForce;
  className?: string;
}

export function OrderTypeInfo({ type, className = '' }: OrderTypeInfoProps) {
  const c = useThemeColors();

  const configs = {
    GTC: {
      title: 'GTC (Good Till Cancel)',
      color: '#3B82F6',
      icon: Info,
      description: 'Lệnh tồn tại trên sổ lệnh cho đến khi được khớp hoặc bạn hủy thủ công.',
      features: [
        'Lệnh không tự động hủy',
        'Có thể khớp từng phần',
        'Phù hợp cho limit order dài hạn',
      ],
      example: 'Bạn đặt mua BTC ở $60,000. Lệnh sẽ chờ cho đến khi giá chạm $60,000 hoặc bạn hủy.',
    },
    IOC: {
      title: 'IOC (Immediate or Cancel)',
      color: '#F59E0B',
      icon: AlertTriangle,
      description: 'Khớp ngay phần có thể, hủy phần còn lại. Không để lệnh trên sổ.',
      features: [
        'Khớp ngay lập tức với giá tốt nhất',
        'Phần không khớp được sẽ tự động hủy',
        'Tránh slippage lớn hơn mong đợi',
      ],
      example: 'Đặt mua 1 BTC, chỉ có 0.5 BTC ở giá bạn muốn → Khớp 0.5 BTC, hủy 0.5 BTC còn lại.',
    },
    FOK: {
      title: 'FOK (Fill or Kill)',
      color: '#EF4444',
      icon: AlertTriangle,
      description: 'Phải khớp toàn bộ ngay lập tức, nếu không hủy toàn bộ lệnh.',
      features: [
        'All or nothing - không khớp từng phần',
        'Đảm bảo khớp đủ size hoặc không khớp',
        'Dùng khi cần chắc chắn execution size',
      ],
      example: 'Muốn mua chính xác 1 BTC. Nếu không đủ thanh khoản để khớp 1 BTC, lệnh bị hủy hoàn toàn.',
    },
    GTX: {
      title: 'GTX / Post-Only (Maker-Only)',
      color: '#10B981',
      icon: CheckCircle,
      description: 'Lệnh chỉ làm maker, không bao giờ ăn sổ lệnh (taker). Đảm bảo được phí maker thấp hơn.',
      features: [
        'Chỉ được khớp khi là maker',
        'Hưởng maker fee rebate (phí thấp hơn hoặc nhận rebate)',
        'Lệnh tự động hủy nếu sẽ khớp ngay (taker)',
      ],
      example: 'Đặt limit $65,000 khi giá market là $65,100. Nếu giá giảm xuống $65,000, lệnh khớp với phí maker. Nếu bạn đặt $65,100 (giá market), lệnh sẽ bị hủy ngay vì sẽ là taker.',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <TrCard
      className={`p-4 ${className}`}
      style={{ background: withAlpha(config.color, ALPHA.hover), border: `1.5px solid ${withAlpha(config.color, ALPHA.soft)}` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: withAlpha(config.color, ALPHA.muted) }}
        >
          <Icon size={ICON_SIZE.md} color={config.color} strokeWidth={ICON_STROKE.bold} />
        </div>
        <div className="flex-1">
          <p style={{ color: config.color, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 4 }}>
            {config.title}
          </p>
          <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5, marginBottom: 8 }}>
            {config.description}
          </p>

          <div className="flex flex-col gap-1.5 mb-3">
            {config.features.map((feature, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span style={{ color: config.color, fontSize: FONT_SCALE.micro }}>•</span>
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{feature}</p>
              </div>
            ))}
          </div>

          <div
            className="px-2.5 py-2 rounded-lg"
            style={{ background: c.surface2 }}
          >
            <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
              <strong style={{ color: c.text2 }}>Ví dụ:</strong> {config.example}
            </p>
          </div>
        </div>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. ICEBERG ORDER CONFIGURATOR
   ═══════════════════════════════════════════════════════════════ */

interface IcebergConfigProps {
  totalSize: number;
  visibleSize: number;
  onVisibleSizeChange: (size: number) => void;
  className?: string;
}

export function IcebergConfig({ totalSize, visibleSize, onVisibleSizeChange, className = '' }: IcebergConfigProps) {
  const c = useThemeColors();

  const visiblePercentage = (visibleSize / totalSize) * 100;
  const hiddenSize = totalSize - visibleSize;

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Snowflake size={ICON_SIZE.sm} color="#3B82F6" strokeWidth={ICON_STROKE.standard} />
        <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
          Iceberg Order
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {/* Visual representation */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Visible</span>
              <span style={{ color: '#3B82F6', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                {visibleSize.toFixed(4)}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${visiblePercentage}%`,
                  background: '#3B82F6',
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Eye size={16} color="#3B82F6" />
            <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{visiblePercentage.toFixed(0)}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Hidden</span>
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                {hiddenSize.toFixed(4)}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${100 - visiblePercentage}%`,
                  background: c.text3,
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <EyeOff size={16} color={c.text3} />
            <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{(100 - visiblePercentage).toFixed(0)}%</span>
          </div>
        </div>

        {/* Slider */}
        <div>
          <label style={{ color: c.text2, fontSize: FONT_SCALE.xs, display: 'block', marginBottom: 4 }}>
            Visible size
          </label>
          <input
            type="range"
            min={totalSize * 0.05} // Minimum 5%
            max={totalSize * 0.5}  // Maximum 50%
            step={totalSize * 0.01}
            value={visibleSize}
            onChange={e => onVisibleSizeChange(parseFloat(e.target.value))}
            className="w-full"
            style={{ accentColor: '#3B82F6' }}
          />
          <div className="flex justify-between mt-1">
            <span style={{ color: c.text3, fontSize: 10 }}>5%</span>
            <span style={{ color: '#3B82F6', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
              {visibleSize.toFixed(4)}
            </span>
            <span style={{ color: c.text3, fontSize: 10 }}>50%</span>
          </div>
        </div>

        {/* Info */}
        <div
          className="flex items-start gap-2 p-2.5 rounded-xl"
          style={{ background: withAlpha('#3B82F6', ALPHA.hover) }}
        >
          <Info size={12} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
            Iceberg order ẩn size thực tế. Chỉ {visibleSize.toFixed(4)} hiện trên sổ lệnh. Khi phần visible khớp, phần hidden sẽ tự động lộ ra từng phần cho đến hết.
          </p>
        </div>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. REDUCE-ONLY INDICATOR
   ═══════════════════════════════════════════════════════════════ */

interface ReduceOnlyIndicatorProps {
  enabled: boolean;
  currentPosition: number;
  orderSize: number;
  className?: string;
}

export function ReduceOnlyIndicator({ enabled, currentPosition, orderSize, className = '' }: ReduceOnlyIndicatorProps) {
  const c = useThemeColors();

  if (!enabled) return null;

  const willFullyClose = orderSize >= Math.abs(currentPosition);

  return (
    <TrCard
      className={`p-3 ${className}`}
      style={{ background: withAlpha('#8B5CF6', ALPHA.hover), border: `1.5px solid ${withAlpha('#8B5CF6', ALPHA.soft)}` }}
    >
      <div className="flex items-start gap-2">
        <Shield size={ICON_SIZE.sm} color="#8B5CF6" className="shrink-0 mt-0.5" />
        <div className="flex-1">
          <p style={{ color: '#8B5CF6', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, marginBottom: 2 }}>
            Reduce-Only Mode
          </p>
          <p style={{ color: c.text2, fontSize: FONT_SCALE.micro, lineHeight: 1.5 }}>
            {willFullyClose
              ? `Lệnh này sẽ đóng toàn bộ vị thế hiện tại (${Math.abs(currentPosition).toFixed(4)})`
              : `Lệnh này sẽ giảm vị thế từ ${Math.abs(currentPosition).toFixed(4)} xuống ${(Math.abs(currentPosition) - orderSize).toFixed(4)}`}
          </p>
          <p style={{ color: c.text3, fontSize: 10, marginTop: 4 }}>
            ⚠️ Lệnh sẽ tự động hủy nếu bạn không có vị thế hoặc đã đóng hết
          </p>
        </div>
      </div>
    </TrCard>
  );
}
