import { Activity, Clock, Sliders, Target } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

type TrackEvent = (eventName: string, properties?: Record<string, string>) => void;

export function DCAAdvancedToolsSection({
  isDevelopment,
  routePrefix,
  trackEvent,
}: {
  isDevelopment: boolean;
  routePrefix: string;
  trackEvent: TrackEvent;
}) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const { hapticSelection } = useHaptic();
  return (
    <>
      {' '}
      {/* Advanced tools remain development-only until their API contracts are implemented. */}
      {isDevelopment && (
        <div className="space-y-3">
          <p className="text-[14px]" style={{ fontWeight: 600, color: c.text1 }}>
            Công cụ nâng cao
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Portfolio Optimizer */}
            <button
              onClick={() => {
                hapticSelection();
                navigate(`${routePrefix}/dca/portfolio-optimizer`);
                trackEvent('dca_tool_opened', { tool: 'portfolio_optimizer' });
              }}
              className="flex flex-col items-start p-4 rounded-xl text-left active:scale-[0.97] transition-transform"
              style={{ background: c.surface2 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(139,92,246,0.12)' }}
              >
                <Target className="w-5 h-5" style={{ color: '#8B5CF6' }} />
              </div>
              <span className="text-[13px] mb-1" style={{ fontWeight: 600, color: c.text1 }}>
                Portfolio Optimizer
              </span>
              <span className="text-[11px]" style={{ lineHeight: 1.3, color: c.text2 }}>
                Frontier, risk, backtest
              </span>
            </button>

            {/* Dynamic Amount */}
            <button
              onClick={() => {
                hapticSelection();
                navigate(`${routePrefix}/dca/dynamic-amount`);
                trackEvent('dca_tool_opened', { tool: 'dynamic_amount' });
              }}
              className="flex flex-col items-start p-4 rounded-xl text-left active:scale-[0.97] transition-transform"
              style={{ background: c.surface2 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(59,130,246,0.12)' }}
              >
                <Activity className="w-5 h-5" style={{ color: '#3B82F6' }} />
              </div>
              <span className="text-[13px] mb-1" style={{ fontWeight: 600, color: c.text1 }}>
                Dynamic Amount
              </span>
              <span className="text-[11px]" style={{ lineHeight: 1.3, color: c.text2 }}>
                Điều chỉnh lượng mua thông minh
              </span>
            </button>

            {/* Auto-Rebalance */}
            <button
              onClick={() => {
                hapticSelection();
                navigate(`${routePrefix}/dca/rebalance/config`);
                trackEvent('dca_tool_opened', { tool: 'rebalance' });
              }}
              className="flex flex-col items-start p-4 rounded-xl text-left active:scale-[0.97] transition-transform"
              style={{ background: c.surface2 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(16,185,129,0.12)' }}
              >
                <Sliders className="w-5 h-5" style={{ color: '#10B981' }} />
              </div>
              <span className="text-[13px] mb-1" style={{ fontWeight: 600, color: c.text1 }}>
                Auto-Rebalance
              </span>
              <span className="text-[11px]" style={{ lineHeight: 1.3, color: c.text2 }}>
                Cân bằng danh mục tự động
              </span>
            </button>

            {/* Smart Schedule */}
            <button
              onClick={() => {
                hapticSelection();
                navigate(`${routePrefix}/dca/schedule/config`);
                trackEvent('dca_tool_opened', { tool: 'schedule' });
              }}
              className="flex flex-col items-start p-4 rounded-xl text-left active:scale-[0.97] transition-transform"
              style={{ background: c.surface2 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(245,158,11,0.12)' }}
              >
                <Clock className="w-5 h-5" style={{ color: '#F59E0B' }} />
              </div>
              <span className="text-[13px] mb-1" style={{ fontWeight: 600, color: c.text1 }}>
                Smart Schedule
              </span>
              <span className="text-[11px]" style={{ lineHeight: 1.3, color: c.text2 }}>
                Lịch mua theo thị trường
              </span>
            </button>
          </div>
        </div>
      )}{' '}
    </>
  );
}
