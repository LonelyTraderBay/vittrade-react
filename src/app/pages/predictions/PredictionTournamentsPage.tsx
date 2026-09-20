/**
 * ══════════════════════════════════════════════════════════════
 *  PredictionTournamentsPage — Prediction Markets Advanced Feature 3/4
 * ══════════════════════════════════════════════════════════════
 *  Tournaments & Challenges: Active tournaments, Leaderboards,
 *  Prize pools, Entry requirements, My tournament positions
 *  Pattern B — Page with Tabs (Active/My/Past)
 *  Compliance: §9.6 No gambling promotion, clear rules
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import {
  Trophy, Users, Clock, DollarSign, Target, Award,
  TrendingUp, ChevronRight, Calendar, Info, CheckCircle,
  Star, Zap, BarChart3,
} from 'lucide-react';

const TABS = ['Dang dien ra', 'Cua toi', 'Ket thuc'] as const;
type Tab = typeof TABS[number];

interface Tournament {
  id: string;
  name: string;
  description: string;
  prizePool: number;
  participants: number;
  maxParticipants: number;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'ended';
  entryFee: number;
  category: string;
  myRank?: number;
  myScore?: number;
  isJoined?: boolean;
  requiredLevel?: number;
  featured?: boolean;
}

const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 'tour1',
    name: 'Crypto Masters Q1 2026',
    description: 'Predict top crypto events this quarter. Best accuracy wins!',
    prizePool: 50000,
    participants: 1247,
    maxParticipants: 2000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-03-31'),
    status: 'active',
    entryFee: 0,
    category: 'Crypto',
    isJoined: true,
    myRank: 34,
    myScore: 892,
    requiredLevel: 0,
    featured: true,
  },
  {
    id: 'tour2',
    name: 'Politics Prediction Challenge',
    description: 'Forecast political outcomes worldwide',
    prizePool: 30000,
    participants: 847,
    maxParticipants: 1500,
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-04-30'),
    status: 'active',
    entryFee: 10,
    category: 'Politics',
    requiredLevel: 3,
    featured: false,
  },
  {
    id: 'tour3',
    name: 'Tech Innovation Cup',
    description: 'Predict breakthrough tech announcements',
    prizePool: 25000,
    participants: 0,
    maxParticipants: 1000,
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-06-30'),
    status: 'upcoming',
    entryFee: 5,
    category: 'Tech',
    requiredLevel: 2,
    featured: false,
  },
  {
    id: 'tour4',
    name: 'Macro Economics Pro',
    description: 'For expert traders: GDP, inflation, rates',
    prizePool: 100000,
    participants: 523,
    maxParticipants: 500,
    startDate: new Date('2025-10-01'),
    endDate: new Date('2025-12-31'),
    status: 'ended',
    entryFee: 50,
    category: 'Macro',
    isJoined: true,
    myRank: 12,
    myScore: 1547,
    requiredLevel: 5,
    featured: false,
  },
];

const LEADERBOARD = [
  { rank: 1, name: 'PredictionKing', score: 2341, prize: 15000 },
  { rank: 2, name: 'CryptoOracle', score: 2198, prize: 10000 },
  { rank: 3, name: 'ChartWizard', score: 2089, prize: 7500 },
  { rank: 4, name: 'MacroMaster', score: 1876, prize: 5000 },
  { rank: 5, name: 'TrendFollower', score: 1654, prize: 3000 },
];

export function PredictionTournamentsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<Tab>('Dang dien ra');

  const activeTournaments = MOCK_TOURNAMENTS.filter((t) => t.status === 'active');
  const myTournaments = MOCK_TOURNAMENTS.filter((t) => t.isJoined);
  const pastTournaments = MOCK_TOURNAMENTS.filter((t) => t.status === 'ended');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return c.buy;
      case 'upcoming':
        return c.warn;
      case 'ended':
        return '#6B7280';
      default:
        return c.text3;
    }
  };

  const getDaysRemaining = (endDate: Date) => {
    const diff = endDate.getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Ended';
    if (days === 0) return 'Ends today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const renderTournamentCard = (tournament: Tournament) => (
    <button
      key={tournament.id}
      onClick={() => navigate(`${prefix}/predictions/tournament/${tournament.id}`)}
      className="w-full rounded-2xl p-4 hover:opacity-90 transition-opacity active:scale-[0.98]"
      style={{
        background: tournament.featured ? 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))' : c.surface,
        border: `1px solid ${tournament.featured ? 'rgba(59,130,246,0.3)' : c.border}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {tournament.featured && <Star size={14} color="#F59E0B" fill="#F59E0B" />}
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{tournament.name}</p>
          </div>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>{tournament.description}</p>
        </div>
        <span
          className="px-2 py-1 rounded-lg text-[10px] font-semibold ml-2"
          style={{
            background: `${getStatusColor(tournament.status)}20`,
            color: getStatusColor(tournament.status),
          }}
        >
          {tournament.status.toUpperCase()}
        </span>
      </div>

      {/* My Position (if joined) */}
      {tournament.isJoined && tournament.myRank && (
        <div
          className="rounded-xl p-2 mb-3 flex items-center justify-between"
          style={{ background: 'rgba(16,185,129,0.08)' }}
        >
          <p style={{ color: c.text2, fontSize: 11 }}>Your rank</p>
          <p style={{ color: c.buy, fontSize: 13, fontWeight: 700 }}>
            #{tournament.myRank} · {tournament.myScore} pts
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign size={12} color={c.text3} />
            <p style={{ color: c.text3, fontSize: 10 }}>Prize Pool</p>
          </div>
          <p style={{ color: c.buy, fontSize: 15, fontWeight: 700 }}>
            ${tournament.prizePool.toLocaleString()}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Users size={12} color={c.text3} />
            <p style={{ color: c.text3, fontSize: 10 }}>Participants</p>
          </div>
          <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>
            {tournament.participants}/{tournament.maxParticipants}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={12} color={c.text3} />
            <p style={{ color: c.text3, fontSize: 10 }}>Duration</p>
          </div>
          <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
            {getDaysRemaining(tournament.endDate)}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Target size={12} color={c.text3} />
            <p style={{ color: c.text3, fontSize: 10 }}>Entry Fee</p>
          </div>
          <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
            {tournament.entryFee === 0 ? 'Free' : `$${tournament.entryFee}`}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${c.border}` }}>
        <span
          className="px-2 py-1 rounded-lg text-[10px]"
          style={{ background: c.chipBg, color: c.chipText }}
        >
          {tournament.category}
        </span>
        <div className="flex items-center gap-1">
          <p style={{ color: tournament.isJoined ? c.buy : c.text3, fontSize: 11, fontWeight: 600 }}>
            {tournament.isJoined ? 'Joined' : 'View Details'}
          </p>
          <ChevronRight size={14} color={c.text3} />
        </div>
      </div>
    </button>
  );

  return (
    <PageLayout>
      <Header title="Tournaments" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'Dang dien ra' && (
          <>
            {/* Featured Tournament */}
            {activeTournaments.filter((t) => t.featured).map((tournament) => (
              <div key={tournament.id}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Zap size={14} color="#F59E0B" />
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Featured</p>
                </div>
                {renderTournamentCard(tournament)}
              </div>
            ))}

            {/* Active Tournaments */}
            <PageSection label="Tat ca giai dau">
              <div className="space-y-3">
                {activeTournaments.filter((t) => !t.featured).map((tournament) => renderTournamentCard(tournament))}
              </div>
            </PageSection>

            {/* Upcoming */}
            {MOCK_TOURNAMENTS.filter((t) => t.status === 'upcoming').length > 0 && (
              <PageSection label="Sap dien ra">
                <div className="space-y-3">
                  {MOCK_TOURNAMENTS.filter((t) => t.status === 'upcoming').map((tournament) =>
                    renderTournamentCard(tournament)
                  )}
                </div>
              </PageSection>
            )}

            {/* Info */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <Info size={14} color="#3B82F6" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Tournaments are skill-based competitions. Prizes distributed based on prediction accuracy.
                Read rules carefully before joining.
              </p>
            </div>
          </>
        )}

        {tab === 'Cua toi' && (
          <>
            {/* My Stats */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                Tournament Stats
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Joined</p>
                  <p style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>{myTournaments.length}</p>
                </div>
                <div className="text-center">
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Best Rank</p>
                  <p style={{ color: c.buy, fontSize: 20, fontWeight: 700 }}>
                    #{Math.min(...myTournaments.map((t) => t.myRank || 999))}
                  </p>
                </div>
                <div className="text-center">
                  <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Total Prizes</p>
                  <p style={{ color: c.warn, fontSize: 20, fontWeight: 700 }}>$2,400</p>
                </div>
              </div>
            </div>

            {/* My Tournaments */}
            <PageSection label="Giai dau dang tham gia">
              {myTournaments.length === 0 ? (
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <Trophy size={48} color={c.text3} style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: c.text2, fontSize: 13, marginBottom: 4 }}>
                    Chua tham gia giai dau nao
                  </p>
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    Xem tab "Dang dien ra" de tham gia
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTournaments.map((tournament) => renderTournamentCard(tournament))}
                </div>
              )}
            </PageSection>
          </>
        )}

        {tab === 'Ket thuc' && (
          <>
            {/* Past Tournaments */}
            <PageSection label="Giai dau da ket thuc">
              {pastTournaments.length === 0 ? (
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{ background: c.surface, border: `1px solid ${c.border}` }}
                >
                  <Calendar size={48} color={c.text3} style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: c.text2, fontSize: 13 }}>Chua co giai dau ket thuc</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastTournaments.map((tournament) => renderTournamentCard(tournament))}
                </div>
              )}
            </PageSection>

            {/* Example Leaderboard */}
            {pastTournaments.length > 0 && (
              <PageSection label="Final Leaderboard - Macro Economics Pro">
                <div className="space-y-2">
                  {LEADERBOARD.map((entry) => (
                    <div
                      key={entry.rank}
                      className="rounded-xl p-3 flex items-center justify-between"
                      style={{
                        background: entry.rank <= 3 ? `${getStatusColor('active')}08` : c.surface,
                        border: `1px solid ${entry.rank <= 3 ? getStatusColor('active') + '20' : c.border}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center" style={{ width: 32 }}>
                          {entry.rank === 1 && <Trophy size={20} color="#F59E0B" fill="#F59E0B" />}
                          {entry.rank === 2 && <Award size={18} color="#9CA3AF" fill="#9CA3AF" />}
                          {entry.rank === 3 && <Award size={16} color="#D97706" fill="#D97706" />}
                          {entry.rank > 3 && (
                            <p style={{ color: c.text2, fontSize: 14, fontWeight: 700 }}>
                              #{entry.rank}
                            </p>
                          )}
                        </div>
                        <div>
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                            {entry.name}
                          </p>
                          <p style={{ color: c.text3, fontSize: 11 }}>{entry.score} points</p>
                        </div>
                      </div>
                      <p style={{ color: c.buy, fontSize: 14, fontWeight: 700 }}>
                        ${entry.prize.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </PageSection>
            )}
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}