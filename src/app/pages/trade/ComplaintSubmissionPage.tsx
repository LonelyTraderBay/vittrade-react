/**
 * ══════════════════════════════════════════════════════════════
 *  ComplaintSubmissionPage — Phase 4 Sprint 4 Day 3-4
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Form to submit a formal complaint
 * - Structured data collection
 * - Evidence upload
 * - Regulatory acknowledgement
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { MessageSquare, Upload, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';

export function ComplaintSubmissionPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const CATEGORIES = [
    'Trade Execution',
    'Account Management',
    'Payments & Withdrawals',
    'Customer Service',
    'Fees & Charges',
    'Other',
  ];

  const canSubmit = category && subject.length > 10 && description.length > 50 && acceptTerms;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // Navigate to tracking page with confirmation
    navigate(`${prefix}/trade/copy-trading/complaint-tracking/COMP-2026-NEW`);
  };

  return (
    <PageLayout variant="flush">
      <Header title="Submit Complaint" subtitle="FCA Regulated Process" back />

      <PageContent gap="relaxed" grow>
        {/* Info Notice */}
        <div className="rounded-2xl p-3 flex gap-2.5" style={{ background: c.infoBg, border: `1px solid ${c.infoBorder}` }}>
          <Info size={16} color={c.infoText} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.infoText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
              Complaint Process
            </p>
            <p style={{ color: c.infoText, fontSize: 10, lineHeight: 1.4, opacity: 0.9 }}>
              We'll acknowledge your complaint within 5 business days and provide a final response within 8 weeks.
            </p>
          </div>
        </div>

        {/* Form */}
        <PageSection label="Complaint Details">
          <div className="space-y-4">
            {/* Category */}
            <div>
              <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 8 }}>
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-12 px-3 rounded-xl outline-none"
                style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.border}` }}>
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 8 }}>
                Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your complaint"
                className="w-full h-12 px-3 rounded-xl outline-none"
                style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.border}` }}
              />
              <p style={{ color: c.text3, fontSize: 9, marginTop: 4 }}>
                {subject.length}/100 characters (min 10)
              </p>
            </div>

            {/* Description */}
            <div>
              <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 8 }}>
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide full details of your complaint, including dates, amounts, and any relevant information"
                rows={6}
                className="w-full p-3 rounded-xl outline-none resize-none"
                style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.border}` }}
              />
              <p style={{ color: c.text3, fontSize: 9, marginTop: 4 }}>
                {description.length}/2000 characters (min 50)
              </p>
            </div>

            {/* Evidence Upload */}
            <TrCard className="p-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: c.surface2 }}>
                  <Upload size={20} color={c.text3} />
                </div>
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                  Upload Evidence (Optional)
                </p>
                <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                  Screenshots, emails, or other supporting documents
                </p>
                <button
                  className="mt-3 px-4 py-2 rounded-lg text-xs"
                  style={{ background: c.surface2, color: c.text1, fontWeight: 600 }}>
                  Choose Files
                </button>
              </div>
            </TrCard>
          </div>
        </PageSection>

        {/* Terms */}
        <TrCard className="p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5"
            />
            <div>
              <p style={{ color: c.text1, fontSize: 11, lineHeight: 1.5 }}>
                I confirm that the information provided is accurate and I understand:
              </p>
              <ul style={{ color: c.text3, fontSize: 10, lineHeight: 1.5, marginTop: 2, paddingLeft: 16 }}>
                <li>• We will respond within 8 weeks</li>
                <li>• I can refer to the Financial Ombudsman if not satisfied</li>
                <li>• My complaint will be investigated fairly</li>
              </ul>
            </div>
          </label>
        </TrCard>
      </PageContent>

      <StickyFooter>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full rounded-[14px] h-[48px] flex items-center justify-center gap-2 transition-all"
          style={{
            background: canSubmit ? c.primary : c.surface2,
            color: canSubmit ? '#fff' : c.text3,
            fontWeight: 600,
            fontSize: 14,
            opacity: canSubmit ? 1 : 0.5,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}>
          <MessageSquare size={18} />
          <span>Submit Complaint</span>
        </button>
      </StickyFooter>
    </PageLayout>
  );
}
