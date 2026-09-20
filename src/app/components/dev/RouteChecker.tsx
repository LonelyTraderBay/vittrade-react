import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';

const STAKING_ROUTES = [
  // Phase 1: Compliance
  { path: '/earn/staking/terms', name: 'Terms of Service', phase: 1 },
  { path: '/earn/staking/risk-disclosure', name: 'Risk Disclosure', phase: 1 },
  { path: '/earn/staking/withdrawal-policy', name: 'Withdrawal Policy', phase: 1 },
  { path: '/earn/staking/tax-guide', name: 'Tax Guide', phase: 1 },
  { path: '/earn/staking/risk-assessment', name: 'Risk Assessment', phase: 1 },
  
  // Phase 2: Portfolio
  { path: '/earn/dashboard', name: 'Dashboard', phase: 2 },
  { path: '/earn/analytics', name: 'Analytics', phase: 2 },
  { path: '/earn/history', name: 'History', phase: 2 },
  { path: '/earn/calendar', name: 'Earnings Calendar', phase: 2 },
  
  // Phase 3: Advanced
  { path: '/earn/validator-selection', name: 'Validator Selection', phase: 3 },
  { path: '/earn/auto-compound', name: 'Auto-Compound', phase: 3 },
  { path: '/earn/liquid-staking', name: 'Liquid Staking', phase: 3 },
  { path: '/earn/insurance', name: 'Insurance', phase: 3 },
  { path: '/earn/advanced-orders', name: 'Advanced Orders ⭐', phase: 3 },
  { path: '/earn/multi-chain', name: 'Multi-Chain ⭐', phase: 3 },
  { path: '/earn/institutional', name: 'Institutional ⭐', phase: 3 },
  
  // Phase 4: UX
  { path: '/earn/guide', name: 'Guide', phase: 4 },
  { path: '/earn/faq', name: 'FAQ', phase: 4 },
  { path: '/earn/notifications', name: 'Notifications', phase: 4 },
  { path: '/earn/recommendations', name: 'Recommendations', phase: 4 },
  
  // Phase 5: Regulatory
  { path: '/earn/regulatory-framework', name: 'Regulatory Framework', phase: 5 },
  { path: '/earn/audit-reports', name: 'Audit Reports', phase: 5 },
  { path: '/earn/custody', name: 'Custody', phase: 5 },
  { path: '/earn/suitability-assessment', name: 'Suitability Assessment', phase: 5 },
  { path: '/earn/insurance-fund-transparency', name: 'Insurance Fund', phase: 5 },
  { path: '/earn/transaction-reporting', name: 'Transaction Reporting', phase: 5 },
  { path: '/earn/api-documentation', name: 'API Documentation', phase: 5 },
  { path: '/earn/proof-of-reserves', name: 'Proof of Reserves', phase: 5 },
  
  // Phase 6: Risk Management
  { path: '/earn/risk-dashboard', name: 'Risk Dashboard', phase: 6 },
  { path: '/earn/slashing-history', name: 'Slashing History', phase: 6 },
  { path: '/earn/validator-health-monitor', name: 'Validator Health', phase: 6 },
  { path: '/earn/risk-score-calculator', name: 'Risk Calculator', phase: 6 },
  { path: '/earn/emergency-actions', name: 'Emergency Actions', phase: 6 },
  { path: '/earn/contingency-plan', name: 'Contingency Plan', phase: 6 },
  
  // Phase 7: Social & Community
  { path: '/earn/social-feed', name: 'Social Feed', phase: 7 },
  { path: '/earn/community-governance', name: 'Governance', phase: 7 },
  { path: '/earn/proposals', name: 'Proposals', phase: 7 },
  { path: '/earn/voting/p1', name: 'Voting', phase: 7 },
  { path: '/earn/forum', name: 'Forum', phase: 7 },
  
  // Phase 8: API & Integrations
  { path: '/earn/webhooks', name: 'Webhooks', phase: 8 },
  { path: '/earn/data-export', name: 'Data Export', phase: 8 },
  { path: '/earn/third-party-integrations', name: 'Integrations', phase: 8 },
  { path: '/earn/developer-console', name: 'Developer Console', phase: 8 },
];

export function RouteChecker() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tested, setTested] = useState<Set<string>>(new Set());
  const [currentPhase, setCurrentPhase] = useState<number | 'all'>('all');

  const filteredRoutes = currentPhase === 'all' 
    ? STAKING_ROUTES 
    : STAKING_ROUTES.filter(r => r.phase === currentPhase);

  const totalRoutes = STAKING_ROUTES.length;
  const testedCount = tested.size;
  const progress = (testedCount / totalRoutes) * 100;

  const handleVisit = (path: string) => {
    setTested(prev => new Set(prev).add(path));
    navigate(path);
  };

  const resetTests = () => {
    setTested(new Set());
  };

  return (
    <div className="min-h-screen p-5" style={{ background: c.bg }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 style={{ color: c.text1, fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            🧪 Staking Route Checker
          </h1>
          <p style={{ color: c.text2, fontSize: 14, marginBottom: 16 }}>
            Test all {totalRoutes} routes systematically. Click to visit each route.
          </p>
          
          {/* Progress */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: c.surface }}>
            <div className="flex items-center justify-between mb-2">
              <p style={{ color: c.text2, fontSize: 13 }}>Testing Progress</p>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                {testedCount} / {totalRoutes}
              </p>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
              <div 
                className="h-full transition-all duration-300"
                style={{ background: '#10B981', width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Phase Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setCurrentPhase('all')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
              style={{
                background: currentPhase === 'all' ? c.primary : c.surface2,
                color: currentPhase === 'all' ? '#FFF' : c.text2,
              }}>
              All ({STAKING_ROUTES.length})
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(phase => (
              <button
                key={phase}
                onClick={() => setCurrentPhase(phase)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
                style={{
                  background: currentPhase === phase ? c.primary : c.surface2,
                  color: currentPhase === phase ? '#FFF' : c.text2,
                }}>
                Phase {phase} ({STAKING_ROUTES.filter(r => r.phase === phase).length})
              </button>
            ))}
          </div>
        </div>

        {/* Route List */}
        <div className="space-y-2 mb-6">
          {filteredRoutes.map(route => {
            const isTested = tested.has(route.path);
            return (
              <button
                key={route.path}
                onClick={() => handleVisit(route.path)}
                className="w-full p-4 rounded-xl flex items-center justify-between text-left transition-all hover:scale-[1.01]"
                style={{ 
                  background: isTested ? 'rgba(16,185,129,0.08)' : c.surface,
                  border: isTested ? '1.5px solid rgba(16,185,129,0.3)' : `1px solid ${c.borderSolid}`,
                }}>
                <div className="flex items-center gap-3 flex-1">
                  {isTested ? (
                    <CheckCircle2 size={20} color="#10B981" className="shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full shrink-0" style={{ border: `2px solid ${c.borderSolid}` }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p style={{ 
                      color: c.text1, 
                      fontSize: 14, 
                      fontWeight: 700,
                      marginBottom: 2,
                    }}>
                      {route.name}
                    </p>
                    <p style={{ 
                      color: c.text3, 
                      fontSize: 11,
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {route.path}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-md text-xs shrink-0" 
                    style={{ background: c.surface2, color: c.text3 }}>
                    Phase {route.phase}
                  </span>
                  <ExternalLink size={16} color={c.text3} className="shrink-0" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={resetTests}
            className="flex-1 py-3 rounded-[14px] text-sm font-semibold"
            style={{ background: c.surface2, color: c.text1 }}>
            Reset Tests
          </button>
          {testedCount === totalRoutes && (
            <div className="flex-1 py-3 rounded-[14px] text-sm font-semibold text-center"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
              ✅ All Routes Tested!
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 rounded-2xl p-4" style={{ background: c.surface }}>
          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            Stats by Phase
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(phase => {
              const phaseRoutes = STAKING_ROUTES.filter(r => r.phase === phase);
              const phaseTested = phaseRoutes.filter(r => tested.has(r.path)).length;
              const phaseProgress = (phaseTested / phaseRoutes.length) * 100;
              
              return (
                <div key={phase} className="text-center p-2 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Phase {phase}</p>
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                    {phaseTested}/{phaseRoutes.length}
                  </p>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: c.bg }}>
                    <div className="h-full" style={{ background: '#10B981', width: `${phaseProgress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
