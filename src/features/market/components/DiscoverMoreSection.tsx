import { ChevronRight, Gamepad2, Target } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { φ } from '@/shared/lib/golden';
import { hexToRgba } from '@/shared/lib/string';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import { TrCard } from '@/shared/ui/TrCard';

export function DiscoverMoreSection() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();

  return (
    <div>
      <SectionHeader title="Khám phá thêm" accent accentColor="#6366F1" mb={8} />
      <TrCard overflow>
        {[
          {
            icon: Target,
            title: 'Prediction Markets',
            subtitle: 'Dự đoán sự kiện · Xác suất · Vị thế',
            color: '#8B5CF6',
            badge: 'Real positions',
            route: `${prefix}/markets/predictions`,
          },
          {
            icon: Gamepad2,
            title: 'Open Arena',
            subtitle: 'Creator modes · Thách đấu · Arena Points',
            color: '#F59E0B',
            badge: 'Points only',
            route: `${prefix}/arena`,
          },
        ].map((item, i) => (
          <button
            key={item.title}
            onClick={() => {
              navigate(item.route);
              hapticSelection();
            }}
            className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:opacity-70"
            style={{
              borderBottom: i === 0 ? `1px solid ${c.divider}` : 'none',
              minHeight: 52,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: hexToRgba(item.color, 12) }}
            >
              <item.icon size={18} color={item.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>{item.title}</p>
                <span
                  className="px-1.5 py-0.5 rounded"
                  style={{
                    background: hexToRgba(item.color, 10),
                    color: item.color,
                    fontSize: 8,
                    fontWeight: 700,
                  }}
                >
                  {item.badge}
                </span>
              </div>
              <p style={{ color: c.text3, fontSize: φ.xs }}>{item.subtitle}</p>
            </div>
            <ChevronRight size={12} color={c.text3} />
          </button>
        ))}
      </TrCard>
    </div>
  );
}
