import { CheckCircle, Lock, Shield, Target, TrendingUp, Trophy, Zap } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useP2PAchievementsQuery } from '../model/p2p-achievement-queries';
import type { P2PAchievementCategory } from '../model/p2p-types';

const categoryLabels: Record<P2PAchievementCategory, string> = {
  trades: 'Giao dịch',
  volume: 'Khối lượng',
  trust: 'Uy tín',
  special: 'Đặc biệt',
};

const categoryIcons: Record<P2PAchievementCategory, typeof Trophy> = {
  trades: Target,
  volume: TrendingUp,
  trust: Shield,
  special: Zap,
};

export function P2PAchievementsPage() {
  const colors = useThemeColors();
  const query = useP2PAchievementsQuery();
  const achievements = query.data?.items ?? [];

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="Thành tích P2P" subtitle="Thành tích · P2P" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải thành tích…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (query.isError) {
    return (
      <PageLayout>
        <Header title="Thành tích P2P" subtitle="Thành tích · P2P" back />
        <ErrorState
          title="Không thể tải thành tích P2P"
          actionLabel="Thử lại"
          onAction={() => void query.refetch()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Thành tích P2P" subtitle="Thành tích · P2P" back />
      <PageContent gap="default">
        <TrCard variant="hero" className="p-5">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.25)' }}
            >
              <Trophy size={28} color="#FBBF24" />
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Thành tích đạt được</p>
              <p style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>
                {query.data?.totalUnlocked ?? 0}/{achievements.length}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Stat label="Điểm uy tín" value={`+${query.data?.totalPoints ?? 0}`} color="#FBBF24" />
            <Stat label="Huy hiệu" value={String(query.data?.badgeCount ?? 0)} color="#34D399" />
            <Stat
              label="Cấp hiện tại"
              value={`Lv.${query.data?.currentLevel ?? 0}`}
              color="#60A5FA"
            />
          </div>
        </TrCard>

        {(['trades', 'volume', 'trust', 'special'] as const).map((category) => {
          const items = achievements.filter((achievement) => achievement.category === category);
          if (items.length === 0) return null;
          const Icon = categoryIcons[category];
          return (
            <section key={category}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={15} color={colors.primary} />
                <h2 style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                  {categoryLabels[category]}
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((achievement) => (
                  <TrCard key={achievement.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: achievement.unlocked
                            ? 'rgba(16,185,129,0.12)'
                            : colors.surface2,
                        }}
                      >
                        {achievement.unlocked ? (
                          <CheckCircle size={18} color="#10B981" />
                        ) : (
                          <Lock size={17} color={colors.text3} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p style={{ color: colors.text1, fontSize: 13, fontWeight: 700 }}>
                            {achievement.title}
                          </p>
                          <span
                            style={{
                              color: achievement.unlocked ? '#10B981' : colors.text3,
                              fontSize: 10,
                            }}
                          >
                            {Math.round(achievement.progress)}%
                          </span>
                        </div>
                        <p style={{ color: colors.text3, fontSize: 11, marginTop: 3 }}>
                          {achievement.description}
                        </p>
                        <div
                          className="h-1.5 rounded-full mt-3"
                          style={{ background: colors.surface2 }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${achievement.progress}%`,
                              background: achievement.unlocked ? '#10B981' : colors.primary,
                            }}
                          />
                        </div>
                        <p style={{ color: colors.text3, fontSize: 10, marginTop: 5 }}>
                          {achievement.currentValue} / {achievement.targetValue} {achievement.unit}
                          {achievement.reward ? ` · ${achievement.reward}` : ''}
                        </p>
                      </div>
                    </div>
                  </TrCard>
                ))}
              </div>
            </section>
          );
        })}
      </PageContent>
    </PageLayout>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="flex-1 rounded-xl py-2 px-3 flex flex-col items-center"
      style={{ background: 'rgba(255,255,255,0.08)' }}
    >
      <span style={{ color, fontSize: 16, fontWeight: 700 }}>{value}</span>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{label}</span>
    </div>
  );
}
