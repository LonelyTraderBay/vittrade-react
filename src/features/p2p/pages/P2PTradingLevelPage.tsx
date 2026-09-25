import { Award, BarChart3, CheckCircle, Crown, Shield, TrendingUp, Users, Zap } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtCompact, fmtPct, fmtVnd } from '@/shared/lib/formatNumber';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useP2POverviewQuery } from '../model/p2p-overview-queries';

const LEVEL_ICONS = [Shield, TrendingUp, Award, Crown];

const hexToRgba = (hex: string, alpha: number) => {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export function P2PTradingLevelPage() {
  const colors = useThemeColors();
  const overviewQuery = useP2POverviewQuery();
  const overview = overviewQuery.data;
  const userLevel = overview?.userLevel;
  const currentLevel = overview?.tradingLevels.find(
    (level) => level.id === userLevel?.currentLevel,
  );

  if (overviewQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Cấp độ giao dịch P2P" subtitle="Cấp bậc · P2P" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải cấp độ giao dịch…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (overviewQuery.isError || !overview || !userLevel || !currentLevel) {
    return (
      <PageLayout>
        <Header title="Cấp độ giao dịch P2P" subtitle="Cấp bậc · P2P" back />
        <ErrorState
          title="Không thể tải cấp độ giao dịch P2P"
          actionLabel="Thử lại"
          onAction={() => void overviewQuery.refetch()}
        />
      </PageLayout>
    );
  }

  const CurrentIcon = LEVEL_ICONS[currentLevel.id - 1] ?? Award;
  const dailyUsage =
    userLevel.dailyLimit > 0 ? (userLevel.dailyUsed / userLevel.dailyLimit) * 100 : 0;

  return (
    <PageLayout>
      <Header title="Cấp độ giao dịch P2P" subtitle="Cấp bậc · P2P" back />
      <PageContent gap="default">
        <TrCard className="overflow-hidden" style={{ padding: 0 }}>
          <div
            className="px-5 py-4"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(currentLevel.color, 0.15)}, ${hexToRgba(currentLevel.color, 0.06)})`,
              borderBottom: `1px solid ${hexToRgba(currentLevel.color, 0.18)}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: currentLevel.gradient,
                  boxShadow: `0 6px 20px ${hexToRgba(currentLevel.color, 0.3)}`,
                }}
              >
                <CurrentIcon size={28} color="#fff" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: colors.text1, fontSize: 18, fontWeight: 700 }}>
                    Lv.{userLevel.currentLevel} {currentLevel.nameVi}
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-lg"
                    style={{ background: '#10B981', color: '#fff', fontWeight: 700, fontSize: 10 }}
                  >
                    Hiện tại
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap size={15} color={currentLevel.color} fill={currentLevel.color} />
                  <span style={{ color: currentLevel.color, fontSize: 13, fontWeight: 700 }}>
                    Phí giao dịch {fmtPct(userLevel.fee, 2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Metric
                icon={<Users size={13} color="#3B82F6" />}
                label="Giao dịch hoàn tất"
                value={String(userLevel.completedOrders)}
                color="#3B82F6"
                colors={colors}
              />
              <Metric
                icon={<BarChart3 size={13} color="#10B981" />}
                label="Volume tích lũy"
                value={fmtCompact(userLevel.accumulatedVolume)}
                sub={fmtVnd(userLevel.accumulatedVolume)}
                color="#10B981"
                colors={colors}
              />
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.divider}` }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>
                  Hạn mức ngày
                </span>
                <span style={{ color: currentLevel.color, fontSize: 13, fontWeight: 700 }}>
                  {Math.round(dailyUsage)}%
                </span>
              </div>
              <div
                className="w-full h-2.5 rounded-full overflow-hidden"
                style={{ background: colors.surface2 }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(dailyUsage, 100)}%`,
                    background: currentLevel.gradient,
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span style={{ color: colors.text2, fontSize: 11 }}>
                  Đã dùng: {fmtVnd(userLevel.dailyUsed)} đ
                </span>
                <span style={{ color: colors.text3, fontSize: 11 }}>
                  Tối đa: {fmtVnd(userLevel.dailyLimit)} đ
                </span>
              </div>
            </div>
          </div>
        </TrCard>

        {userLevel.currentLevel < 4 && (
          <TrCard className="p-3" accentBorder="rgba(139,92,246,0.3)">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} color="#8B5CF6" />
              <span style={{ color: colors.text1, fontSize: 12, fontWeight: 600 }}>
                Tiến trình lên Lv.{userLevel.currentLevel + 1}
              </span>
              <span className="ml-auto" style={{ color: '#8B5CF6', fontSize: 12, fontWeight: 700 }}>
                {Math.round(userLevel.nextLevelProgress * 100)}%
              </span>
            </div>
            <div
              className="w-full h-1.5 rounded-full overflow-hidden mt-2"
              style={{ background: colors.surface2 }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${userLevel.nextLevelProgress * 100}%`,
                  background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)',
                }}
              />
            </div>
          </TrCard>
        )}

        <p style={{ color: colors.text2, fontSize: 12, fontWeight: 600 }}>Tất cả cấp độ</p>
        <div className="flex flex-col gap-3">
          {overview.tradingLevels.map((level) => {
            const LevelIcon = LEVEL_ICONS[level.id - 1] ?? Award;
            const isCurrent = level.id === userLevel.currentLevel;
            const isPassed = level.id < userLevel.currentLevel;
            return (
              <TrCard
                key={level.id}
                className="p-4"
                style={{
                  border: isCurrent ? `2px solid ${level.color}` : `1px solid ${colors.divider}`,
                  opacity: level.id > userLevel.currentLevel ? 0.7 : 1,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: isPassed || isCurrent ? level.gradient : colors.surface2 }}
                  >
                    <LevelIcon size={20} color={isPassed || isCurrent ? '#fff' : colors.text3} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                        Lv.{level.id} {level.nameVi}
                      </span>
                      {isCurrent && (
                        <span style={{ color: '#10B981', fontSize: 10, fontWeight: 700 }}>
                          ĐANG DÙNG
                        </span>
                      )}
                      {isPassed && <CheckCircle size={14} color="#10B981" />}
                    </div>
                    <p style={{ color: level.color, fontSize: 11, fontWeight: 600 }}>
                      Phí {fmtPct(level.fee, 2)} · Hạn mức {fmtVnd(level.dailyLimit)} đ/ngày
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {level.requirements.map((requirement) => (
                    <span
                      key={requirement}
                      className="rounded-lg px-2 py-1"
                      style={{
                        background: hexToRgba(level.color, 0.08),
                        color: colors.text2,
                        fontSize: 10,
                      }}
                    >
                      {requirement}
                    </span>
                  ))}
                </div>
              </TrCard>
            );
          })}
        </div>
      </PageContent>
    </PageLayout>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  color,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: `${color}08`, border: `1.5px solid ${color}30` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          {icon}
        </div>
        <span style={{ color: colors.text2, fontSize: 11, fontWeight: 600 }}>{label}</span>
      </div>
      <p style={{ color, fontSize: 18, fontWeight: 700 }}>{value}</p>
      {sub && <p style={{ color: colors.text3, fontSize: 10, marginTop: 2 }}>{sub} đ</p>}
    </div>
  );
}
