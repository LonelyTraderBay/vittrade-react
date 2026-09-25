import { useState } from 'react';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

export function CopyEducationFeesTab() {
  const c = useThemeColors();
  const [feeCapital, setFeeCapital] = useState(5000);
  const [feeProfit, setFeeProfit] = useState(15);
  const [feeTrades, setFeeTrades] = useState(50);
  const platformFee = feeCapital * 0.001;
  const performanceFee = feeCapital * (feeProfit / 100) * 0.1;
  const tradingFees = feeTrades * 2 * 0.0025 * (feeCapital / 50);
  const totalFees = platformFee + performanceFee + tradingFees;
  const grossProfit = feeCapital * (feeProfit / 100);
  const netProfit = grossProfit - totalFees;
  const effectiveFeePercent = (totalFees / grossProfit) * 100;
  return (
    <div className="flex flex-col gap-5">
      {/* Fee Calculator */}
      <TrCard className="p-4">
        <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          Máy tính phí
        </h3>

        <div className="space-y-3 mb-4">
          <div>
            <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 4 }}>
              Số vốn copy (USD)
            </label>
            <input
              type="number"
              value={feeCapital}
              onChange={(e) => setFeeCapital(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl"
              style={{
                background: c.surface2,
                border: `1px solid ${c.border}`,
                color: c.text1,
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 4 }}>
              Lợi nhuận dự kiến (%)
            </label>
            <input
              type="number"
              value={feeProfit}
              onChange={(e) => setFeeProfit(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl"
              style={{
                background: c.surface2,
                border: `1px solid ${c.border}`,
                color: c.text1,
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 4 }}>
              Số lượng trades (30 ngày)
            </label>
            <input
              type="number"
              value={feeTrades}
              onChange={(e) => setFeeTrades(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl"
              style={{
                background: c.surface2,
                border: `1px solid ${c.border}`,
                color: c.text1,
                fontSize: 14,
              }}
            />
          </div>
        </div>

        {/* Results */}
        <div className="p-4 rounded-xl" style={{ background: c.surface2 }}>
          <div className="flex justify-between items-center mb-2">
            <span style={{ color: c.text3, fontSize: 11 }}>Platform fee (0.1%)</span>
            <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>
              ${platformFee.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span style={{ color: c.text3, fontSize: 11 }}>Performance fee (10% of profit)</span>
            <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>
              ${performanceFee.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span style={{ color: c.text3, fontSize: 11 }}>Trading fees (~0.25%)</span>
            <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>
              ${tradingFees.toFixed(2)}
            </span>
          </div>
          <div className="h-px mb-3" style={{ background: c.border }} />
          <div className="flex justify-between items-center mb-2">
            <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Tổng phí</span>
            <span style={{ color: '#EF4444', fontSize: 14, fontWeight: 700 }}>
              ${totalFees.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Lợi nhuận gross</span>
            <span style={{ color: '#10B981', fontSize: 14, fontWeight: 700 }}>
              ${grossProfit.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Lợi nhuận NET</span>
            <span style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>
              ${netProfit.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-3 p-3 rounded-xl" style={{ background: c.primaryAlpha08 }}>
          <p style={{ color: c.primary, fontSize: 11, lineHeight: 1.4 }}>
            <strong>Phí thực tế: {effectiveFeePercent.toFixed(1)}%</strong> của lợi nhuận. Chưa tính
            slippage (thường thêm 0.5-2%).
          </p>
        </div>
      </TrCard>

      {/* Fee Structure Breakdown */}
      <TrCard className="p-4">
        <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          Chi tiết cấu trúc phí
        </h3>

        <div className="space-y-3">
          {[
            {
              fee: 'Platform Fee (0.1%)',
              when: 'Tính khi bắt đầu copy',
              example: 'Copy $10,000 → phí $10',
              note: 'Không hoàn lại nếu dừng copy sớm',
            },
            {
              fee: 'Performance Fee (10%)',
              when: 'Tính hàng tháng trên profit',
              example: 'Lời $1,000 → phí $100',
              note: 'High-water mark: chỉ tính trên profit mới',
            },
            {
              fee: 'Trading Fee (0.25%)',
              when: 'Mỗi lần mở/đóng lệnh',
              example: '50 trades/tháng, size trung bình $2k → phí ~$25',
              note: 'Cao nếu provider trade thường xuyên',
            },
            {
              fee: 'Slippage (0.5-2%)',
              when: 'Mỗi lệnh (không phải phí, là chi phí ẩn)',
              example: 'Provider mua $100, bạn mua $100.50 → slippage $0.50',
              note: 'Cao trong thị trường biến động',
            },
          ].map((item) => (
            <div key={item.fee} className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                {item.fee}
              </p>
              <div className="space-y-1">
                <div className="flex gap-2">
                  <span style={{ color: c.text3, fontSize: 10 }}>Khi nào:</span>
                  <span style={{ color: c.text2, fontSize: 10 }}>{item.when}</span>
                </div>
                <div className="flex gap-2">
                  <span style={{ color: c.text3, fontSize: 10 }}>Ví dụ:</span>
                  <span style={{ color: c.text2, fontSize: 10 }}>{item.example}</span>
                </div>
                <div className="flex gap-2">
                  <span style={{ color: c.text3, fontSize: 10 }}>Lưu ý:</span>
                  <span style={{ color: c.text2, fontSize: 10 }}>{item.note}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </TrCard>
    </div>
  );
}
