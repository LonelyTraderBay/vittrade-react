import React from 'react';
import { CheckCircle, Shield, TrendingUp, Award, Crown, ChevronRight, Users, BarChart3, Zap } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { P2P_TRADING_LEVELS, P2P_USER_LEVEL } from '../../data/mockData';
import { fmtVnd, fmtPct, fmtCompact } from '../../data/formatNumber';
import { φ } from '../../utils/golden';

const LEVEL_ICONS = [Shield, TrendingUp, Award, Crown];

// Helper: Convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function P2PTradingLevelPage() {
  const c = useThemeColors();
  const userLevel = P2P_USER_LEVEL;
  const currentLevelData = P2P_TRADING_LEVELS.find(l => l.id === userLevel.currentLevel);

  // Safety check - prevent render if data not ready
  if (!currentLevelData) {
    return (
      <PageLayout>
        <Header title="Cấp độ giao dịch P2P" subtitle="Cấp bậc · P2P" back />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: c.text3 }} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Cấp độ giao dịch P2P" subtitle="Cấp bậc · P2P" back />

      <div className="flex-1 px-5 py-5 flex flex-col gap-4" style={{ paddingBottom: 40 }}>
        {/* Current level hero — REDESIGNED with vibrant colors */}
        <TrCard className="overflow-hidden" style={{ padding: 0 }}>
          {/* Top section: Level badge with vibrant gradient background */}
          <div 
            className="px-5 py-4" 
            style={{ 
              background: `linear-gradient(135deg, ${hexToRgba(currentLevelData.color, 0.15)} 0%, ${hexToRgba(currentLevelData.color, 0.06)} 100%)`,
              borderBottom: `1px solid ${hexToRgba(currentLevelData.color, 0.18)}`,
            }}
          >
            <div className="flex items-center gap-3">
              {/* Level Icon */}
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ 
                  background: currentLevelData.gradient,
                  boxShadow: `0 6px 20px ${hexToRgba(currentLevelData.color, 0.3)}`,
                }}
              >
                <Award size={28} color="#fff" strokeWidth={2.5} />
              </div>
              
              {/* Level Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ 
                    color: c.text1, 
                    fontSize: φ.lg, 
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}>
                    Lv.{userLevel.currentLevel} {currentLevelData.nameVi}
                  </span>
                  <span 
                    className="px-2.5 py-1 rounded-lg"
                    style={{ 
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
                      color: '#fff', 
                      fontWeight: 700, 
                      fontSize: 11,
                      lineHeight: 1,
                      boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                    }}
                  >
                    Hiện tại
                  </span>
                </div>
                
                {/* Fee Highlight - Most important info */}
                <div className="flex items-center gap-1.5">
                  <Zap size={15} color={currentLevelData.color} fill={currentLevelData.color} />
                  <span style={{ 
                    color: currentLevelData.color, 
                    fontSize: φ.body, 
                    fontWeight: 700,
                  }}>
                    Phí giao dịch {fmtPct(userLevel.fee, 2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid - 2x2 with vibrant accent colors */}
          <div className="px-5 py-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Completed Orders */}
              <div 
                className="rounded-xl p-3"
                style={{ 
                  background: `linear-gradient(135deg, #3B82F615 0%, #3B82F608 100%)`,
                  border: `1.5px solid #3B82F630`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: '#3B82F620' }}
                  >
                    <Users size={13} color="#3B82F6" strokeWidth={2.5} />
                  </div>
                  <span style={{ color: c.text2, fontSize: 11, fontWeight: 600, lineHeight: 1 }}>
                    Giao dịch hoàn tất
                  </span>
                </div>
                <p style={{ 
                  color: '#3B82F6', 
                  fontSize: 22, 
                  fontWeight: 700, 
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.2,
                }}>
                  {userLevel.completedOrders}
                </p>
              </div>

              {/* Volume */}
              <div 
                className="rounded-xl p-3"
                style={{ 
                  background: `linear-gradient(135deg, #10B98115 0%, #10B98108 100%)`,
                  border: `1.5px solid #10B98130`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: '#10B98120' }}
                  >
                    <BarChart3 size={13} color="#10B981" strokeWidth={2.5} />
                  </div>
                  <span style={{ color: c.text2, fontSize: 11, fontWeight: 600, lineHeight: 1 }}>
                    Volume tích lũy
                  </span>
                </div>
                <p style={{ 
                  color: '#10B981', 
                  fontSize: 17, 
                  fontWeight: 700, 
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.2,
                }}>
                  {fmtCompact(userLevel.accumulatedVolume)}
                </p>
                <p style={{ 
                  color: c.text3, 
                  fontSize: 10, 
                  marginTop: 2,
                  lineHeight: 1,
                }}>
                  {fmtVnd(userLevel.accumulatedVolume)} đ
                </p>
              </div>
            </div>

            {/* Daily Limit Progress */}
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${c.divider}` }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                  Hạn mức ngày
                </span>
                <span 
                  className="px-2 py-0.5 rounded-lg"
                  style={{ 
                    color: currentLevelData.color, 
                    fontSize: φ.sm, 
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    background: hexToRgba(currentLevelData.color, 0.08),
                  }}
                >
                  {Math.round((userLevel.dailyUsed / userLevel.dailyLimit) * 100)}%
                </span>
              </div>
              
              <div 
                className="w-full h-2.5 rounded-full overflow-hidden" 
                style={{ 
                  background: c.surface2,
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(userLevel.dailyUsed / userLevel.dailyLimit) * 100}%`,
                    background: currentLevelData.gradient,
                    boxShadow: `0 0 8px ${hexToRgba(currentLevelData.color, 0.37)}`,
                  }} 
                />
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span style={{ color: c.text2, fontSize: 11, fontWeight: 600, lineHeight: 1 }}>
                  Đã dùng: <span style={{ color: currentLevelData.color, fontWeight: 700 }}>{fmtVnd(userLevel.dailyUsed)}</span> đ
                </span>
                <span style={{ color: c.text3, fontSize: 11, fontWeight: 600, lineHeight: 1 }}>
                  Tối đa: {fmtVnd(userLevel.dailyLimit)} đ
                </span>
              </div>
            </div>
          </div>
        </TrCard>

        {/* Level up progress */}
        {userLevel.currentLevel < 4 && (
          <TrCard className="p-3" accentBorder="rgba(139,92,246,0.3)">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} color="#8B5CF6" />
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                Tiến trình lên Lv.{userLevel.currentLevel + 1}
              </span>
              <div className="flex-1" />
              <span style={{ color: '#8B5CF6', fontSize: 12, fontWeight: 700 }}>
                {Math.round(userLevel.nextLevelProgress * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden mt-2" style={{ background: c.surface2 }}>
              <div className="h-full rounded-full"
                style={{
                  width: `${userLevel.nextLevelProgress * 100}%`,
                  background: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
                }} />
            </div>
          </TrCard>
        )}

        {/* All levels */}
        <p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: -4 }}>Tất cả cấp độ</p>

        <div className="flex flex-col gap-3">
          {P2P_TRADING_LEVELS.map((level) => {
            const isCurrent = level.id === userLevel.currentLevel;
            const isLocked = level.id > userLevel.currentLevel;
            const isPassed = level.id < userLevel.currentLevel;
            const LevelIcon = LEVEL_ICONS[level.id - 1];

            return (
              <TrCard 
                key={level.id} 
                className="overflow-hidden" 
                style={{ 
                  padding: 0,
                  border: isCurrent ? `2px solid ${level.color}` : `1px solid ${c.divider}`,
                  opacity: isLocked ? 0.7 : 1,
                  transform: isCurrent ? 'scale(1)' : 'scale(1)',
                  boxShadow: isCurrent ? `0 8px 24px ${level.color}30` : 'none',
                }}
              >
                {/* Header with gradient background */}
                <div 
                  className="px-4 py-3"
                  style={{ 
                    background: isCurrent 
                      ? `linear-gradient(135deg, ${level.color}20 0%, ${level.color}08 100%)`
                      : isPassed 
                        ? `linear-gradient(135deg, ${level.color}10 0%, ${level.color}05 100%)`
                        : c.surface2,
                    borderBottom: `1px solid ${isCurrent ? level.color + '30' : c.divider}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Level Icon */}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ 
                        background: isLocked ? c.surface2 : level.gradient,
                        boxShadow: isLocked ? 'none' : `0 4px 12px ${level.color}40`,
                      }}
                    >
                      <LevelIcon size={22} color={isLocked ? c.text3 : '#fff'} strokeWidth={2.5} />
                    </div>
                    
                    {/* Level Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span style={{ 
                          color: c.text1, 
                          fontSize: 15, 
                          fontWeight: 700,
                          lineHeight: 1.2,
                        }}>
                          Lv.{level.id} {level.nameVi}
                        </span>
                        
                        {isCurrent && (
                          <span 
                            className="px-2 py-0.5 rounded-md"
                            style={{ 
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
                              color: '#fff', 
                              fontWeight: 700, 
                              fontSize: 10,
                              lineHeight: 1.2,
                              boxShadow: '0 2px 6px rgba(16,185,129,0.3)',
                            }}
                          >
                            Hiện tại
                          </span>
                        )}
                        
                        {isLocked && (
                          <span 
                            className="px-2 py-0.5 rounded-md"
                            style={{ 
                              background: c.surface2, 
                              color: c.text3, 
                              fontSize: 10,
                              fontWeight: 600,
                              lineHeight: 1.2,
                            }}
                          >
                            Chưa đạt
                          </span>
                        )}
                        
                        {isPassed && (
                          <CheckCircle size={14} color="#10B981" fill="rgba(16,185,129,0.2)" />
                        )}
                      </div>
                      
                      {/* Fee Highlight */}
                      <div className="flex items-center gap-1.5">
                        <Zap 
                          size={13} 
                          color={isLocked ? c.text3 : level.color} 
                          fill={isLocked ? 'none' : level.color}
                        />
                        <span style={{ 
                          color: isLocked ? c.text3 : level.color, 
                          fontSize: 13, 
                          fontWeight: 700,
                        }}>
                          Phí {fmtPct(level.fee, level.fee === 0.1 ? 1 : 2)}
                        </span>
                        
                        {/* Discount badge if lower fee */}
                        {level.id > 1 && !isLocked && (
                          <span 
                            className="px-1.5 py-0.5 rounded"
                            style={{ 
                              background: `${level.color}15`, 
                              color: level.color, 
                              fontSize: 9,
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                          >
                            -{Math.round(((P2P_TRADING_LEVELS[0].fee - level.fee) / P2P_TRADING_LEVELS[0].fee) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight size={18} color={c.text3} />
                  </div>
                </div>

                {/* Body */}
                <div className="px-4 py-3">
                  {/* Limits Grid with icons */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div 
                      className="rounded-lg p-2.5"
                      style={{ 
                        background: isCurrent 
                          ? `linear-gradient(135deg, ${level.color}10 0%, ${level.color}05 100%)`
                          : c.surface2,
                        border: `1px solid ${isCurrent ? level.color + '20' : c.divider}`,
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp size={11} color={c.text3} strokeWidth={2.5} />
                        <span style={{ color: c.text3, fontSize: 10, fontWeight: 600, lineHeight: 1 }}>
                          Hạn mức/ngày
                        </span>
                      </div>
                      <p style={{ 
                        color: isCurrent ? level.color : c.text1, 
                        fontSize: 13, 
                        fontWeight: 700, 
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1.2,
                      }}>
                        {level.dailyLimit === 0 ? '∞' : fmtCompact(level.dailyLimit)}
                      </p>
                    </div>
                    
                    <div 
                      className="rounded-lg p-2.5"
                      style={{ 
                        background: isCurrent 
                          ? `linear-gradient(135deg, ${level.color}10 0%, ${level.color}05 100%)`
                          : c.surface2,
                        border: `1px solid ${isCurrent ? level.color + '20' : c.divider}`,
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <BarChart3 size={11} color={c.text3} strokeWidth={2.5} />
                        <span style={{ color: c.text3, fontSize: 10, fontWeight: 600, lineHeight: 1 }}>
                          Hạn mức/đơn
                        </span>
                      </div>
                      <p style={{ 
                        color: isCurrent ? level.color : c.text1, 
                        fontSize: 13, 
                        fontWeight: 700, 
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1.2,
                      }}>
                        {level.perOrderLimit === 0 ? '∞' : fmtCompact(level.perOrderLimit)}
                      </p>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="flex flex-col gap-1.5">
                    <p style={{ color: c.text2, fontSize: 10, fontWeight: 700, marginBottom: 1 }}>
                      Yêu cầu:
                    </p>
                    {level.requirements.map((req, idx) => {
                      const isCompleted = !isLocked;
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle 
                            size={13}
                            color={isCompleted ? '#10B981' : c.text3}
                            fill={isCompleted ? 'rgba(16,185,129,0.2)' : 'none'} 
                            strokeWidth={2.5}
                          />
                          <span style={{ 
                            color: isCompleted ? c.text2 : c.text3, 
                            fontSize: 11.5,
                            lineHeight: 1.4,
                          }}>
                            {req}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Call to action for next level */}
                  {isLocked && level.id === userLevel.currentLevel + 1 && (
                    <div 
                      className="mt-3 pt-3 flex items-center gap-2"
                      style={{ borderTop: `1px solid ${c.divider}` }}
                    >
                      <div 
                        className="flex-1 rounded-lg px-3 py-2 flex items-center justify-center gap-2"
                        style={{ 
                          background: `linear-gradient(135deg, ${level.color}15 0%, ${level.color}08 100%)`,
                          border: `1px solid ${level.color}30`,
                        }}
                      >
                        <TrendingUp size={14} color={level.color} strokeWidth={2.5} />
                        <span style={{ 
                          color: level.color, 
                          fontSize: 12, 
                          fontWeight: 700,
                        }}>
                          Nâng cấp lên {level.nameVi}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </TrCard>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
