/**
 * ══════════════════════════════════════════════════════════════
 *  ComplaintTrackingPage — Phase 4 Sprint 4 Day 5-6
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Track complaint status in real-time
 * - Timeline view of investigation progress
 * - Communication history
 * - Escalation options
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { Clock, CheckCircle, MessageSquare, FileText, AlertCircle, ChevronRight } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';

export function ComplaintTrackingPage() {
  const c = useThemeColors();
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();

  const timeline = [
    {
      date: '2026-02-15',
      status: 'Complaint Submitted',
      description: 'Your complaint has been received',
      completed: true,
    },
    {
      date: '2026-02-16',
      status: 'Acknowledgement Sent',
      description: 'We acknowledged your complaint within 5 business days',
      completed: true,
    },
    {
      date: '2026-02-20',
      status: 'Investigation Started',
      description: 'Our compliance team is investigating',
      completed: true,
    },
    {
      date: '2026-03-10',
      status: 'Under Review',
      description: 'Currently reviewing evidence and preparing response',
      completed: false,
      current: true,
    },
    {
      date: '2026-04-12',
      status: 'Final Response',
      description: 'Deadline for our final response',
      completed: false,
    },
  ];

  const daysRemaining = 34;

  return (
    <PageLayout>
      <Header title={`Complaint ${complaintId}`} back />

      <PageContent gap="relaxed">
        {/* Status Card */}
        <TrCard className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#F59E0B' + '15' }}>
              <Clock size={22} color="#F59E0B" />
            </div>

            <div className="flex-1">
              <p style={{ color: c.text3, fontSize: 10 }}>Status</p>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                Under Review
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-2.5" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 9 }}>Submitted</p>
              <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, marginTop: 1 }}>
                Feb 15, 2026
              </p>
            </div>

            <div className="rounded-lg p-2.5" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 9 }}>Response Due</p>
              <p style={{ color: c.text1, fontSize: 11, fontWeight: 600, marginTop: 1 }}>
                Apr 12, 2026
              </p>
            </div>
          </div>
        </TrCard>

        {/* Deadline Notice */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
          <AlertCircle size={16} color={c.warningText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.warningText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              {daysRemaining} Days Remaining
            </p>
            <p style={{ color: c.warningText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              We must provide a final response by April 12, 2026 (8 weeks from submission).
            </p>
          </div>
        </div>

        {/* Timeline */}
        <PageSection label="Investigation Timeline">
          <div className="space-y-3">
            {timeline.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: item.completed
                        ? '#10B981' + '15'
                        : item.current
                        ? '#F59E0B' + '15'
                        : c.surface2
                    }}>
                    {item.completed ? (
                      <CheckCircle size={16} color="#10B981" />
                    ) : item.current ? (
                      <Clock size={16} color="#F59E0B" />
                    ) : (
                      <div className="w-2 h-2 rounded-full" style={{ background: c.border }} />
                    )}
                  </div>
                  {idx < timeline.length - 1 && (
                    <div className="w-0.5 h-8 my-1" style={{
                      background: item.completed ? '#10B981' : c.border
                    }} />
                  )}
                </div>

                <div className="flex-1 pb-4">
                  <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                    {item.status}
                  </p>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4, marginTop: 1 }}>
                    {item.description}
                  </p>
                  <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </PageSection>

        {/* Actions */}
        <div className="space-y-3">
          <button
            className="w-full rounded-xl p-3 flex items-center justify-between transition-all"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-2.5">
              <MessageSquare size={16} color={c.primary} />
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                Add Information
              </span>
            </div>
            <ChevronRight size={16} color={c.text3} />
          </button>

          <button
            className="w-full rounded-xl p-3 flex items-center justify-between transition-all"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-2.5">
              <FileText size={16} color="#10B981" />
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                View Correspondence
              </span>
            </div>
            <ChevronRight size={16} color={c.text3} />
          </button>

          <button
            onClick={() => navigate(`${prefix}/trade/copy-trading/ombudsman-referral`)}
            className="w-full rounded-xl p-3 flex items-center justify-between transition-all"
            style={{ background: c.surface2, border: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} color="#F59E0B" />
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                Ombudsman Referral Info
              </span>
            </div>
            <ChevronRight size={16} color={c.text3} />
          </button>
        </div>
      </PageContent>
    </PageLayout>
  );
}
