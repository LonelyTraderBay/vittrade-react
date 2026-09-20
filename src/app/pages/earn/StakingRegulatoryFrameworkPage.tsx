import React, { useState } from 'react';
import { Shield, MapPin, FileText, AlertCircle, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';

interface License {
  jurisdiction: string;
  regulator: string;
  licenseNumber: string;
  status: 'active' | 'pending' | 'expired';
  issuedDate: string;
  expiryDate?: string;
  scope: string[];
  website: string;
}

interface ProtectionScheme {
  jurisdiction: string;
  scheme: string;
  coverage: string;
  description: string;
  eligibility: string;
}

const LICENSES: License[] = [
  {
    jurisdiction: 'United States',
    regulator: 'FinCEN (Financial Crimes Enforcement Network)',
    licenseNumber: 'MSB-31000198765432',
    status: 'active',
    issuedDate: '2023-01-15',
    scope: ['Money Services Business', 'Virtual Currency Exchange'],
    website: 'fincen.gov',
  },
  {
    jurisdiction: 'United Kingdom',
    regulator: 'Financial Conduct Authority (FCA)',
    licenseNumber: 'FRN: 928619',
    status: 'active',
    issuedDate: '2022-09-20',
    scope: ['Cryptoasset Exchange', 'Custodian Wallet Provider'],
    website: 'fca.org.uk',
  },
  {
    jurisdiction: 'European Union',
    regulator: 'Central Bank of Ireland',
    licenseNumber: 'C193305',
    status: 'active',
    issuedDate: '2023-03-10',
    scope: ['MiFID II Investment Firm', 'Payment Institution'],
    website: 'centralbank.ie',
  },
  {
    jurisdiction: 'Singapore',
    regulator: 'Monetary Authority of Singapore (MAS)',
    licenseNumber: 'DPT-000123-2023',
    status: 'active',
    issuedDate: '2023-06-01',
    scope: ['Digital Payment Token Service Provider'],
    website: 'mas.gov.sg',
  },
  {
    jurisdiction: 'Hong Kong',
    regulator: 'Securities and Futures Commission (SFC)',
    licenseNumber: 'Type 1 & 7: BQR123',
    status: 'pending',
    issuedDate: '2024-01-10',
    scope: ['Virtual Asset Trading Platform'],
    website: 'sfc.hk',
  },
];

const PROTECTION_SCHEMES: ProtectionScheme[] = [
  {
    jurisdiction: 'United Kingdom',
    scheme: 'Financial Services Compensation Scheme (FSCS)',
    coverage: '£85,000 per person',
    description: 'Protects eligible customers if authorized firm fails',
    eligibility: 'UK retail customers holding fiat currency',
  },
  {
    jurisdiction: 'European Union',
    scheme: 'Deposit Guarantee Scheme (DGS)',
    coverage: '€100,000 per person',
    description: 'EU-wide protection for eligible deposits',
    eligibility: 'EU residents with eligible deposits',
  },
  {
    jurisdiction: 'United States',
    scheme: 'FDIC Insurance (via partner banks)',
    coverage: '$250,000 per depositor',
    description: 'Protection for USD deposits held at partner banks',
    eligibility: 'US customers with fiat balances at partner banks',
  },
];

export function StakingRegulatoryFrameworkPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'licenses' | 'protection' | 'complaints'>('licenses');
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  return (
    <PageLayout>
      <Header title="Regulatory Framework" back />

      {/* License Detail Bottom Sheet */}
      <BottomSheetV2
        open={!!selectedLicense}
        onClose={() => setSelectedLicense(null)}
        title={selectedLicense?.jurisdiction || ''}>
        {selectedLicense && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
              <div className="flex items-center justify-between mb-3">
                <p style={{ color: c.text3, fontSize: 12 }}>Regulator</p>
                <span
                  className="px-2 py-1 rounded-lg text-xs font-bold"
                  style={{
                    background: selectedLicense.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: selectedLicense.status === 'active' ? '#10B981' : '#F59E0B',
                  }}>
                  {selectedLicense.status.toUpperCase()}
                </span>
              </div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                {selectedLicense.regulator}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: 12 }}>License Number:</span>
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                    {selectedLicense.licenseNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: 12 }}>Issued Date:</span>
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                    {new Date(selectedLicense.issuedDate).toLocaleDateString('en-GB')}
                  </span>
                </div>
                {selectedLicense.expiryDate && (
                  <div className="flex justify-between">
                    <span style={{ color: c.text3, fontSize: 12 }}>Expiry Date:</span>
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                      {new Date(selectedLicense.expiryDate).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p style={{ color: c.text2, fontSize: 13, marginBottom: 8 }}>Authorized Scope</p>
              <div className="flex flex-col gap-2">
                {selectedLicense.scope.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 size={16} color="#10B981" className="shrink-0 mt-0.5" />
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <a
              href={`https://${selectedLicense.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: c.surface2, color: '#3B82F6' }}>
              Verify on {selectedLicense.regulator.split(' ')[0]} website
              <ExternalLink size={16} />
            </a>
          </div>
        )}
      </BottomSheetV2>

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.2)' }}>
          <div className="flex gap-3">
            <Shield size={20} color="#10B981" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Regulated & Compliant
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                We operate under licenses from leading global regulators. Your funds are protected by investor protection schemes where eligible.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'licenses', label: 'Licenses' },
            { id: 'protection', label: 'Protection' },
            { id: 'complaints', label: 'Complaints' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {tab === 'licenses' && (
          <>
            <PageSection label="Global Regulatory Licenses">
              <div className="flex flex-col gap-3">
                {LICENSES.map(license => (
                  <TrCard
                    key={license.licenseNumber}
                    hover
                    className="p-4"
                    onClick={() => setSelectedLicense(license)}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.3)' }}>
                        <MapPin size={20} color="#10B981" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                            {license.jurisdiction}
                          </p>
                          <span
                            className="px-2 py-0.5 rounded-md text-xs font-bold"
                            style={{
                              background: license.status === 'active' ? 'rgba(16,185,129,0.15)' :
                                         license.status === 'pending' ? 'rgba(245,158,11,0.15)' :
                                         'rgba(239,68,68,0.15)',
                              color: license.status === 'active' ? '#10B981' :
                                     license.status === 'pending' ? '#F59E0B' : '#EF4444',
                            }}>
                            {license.status === 'active' ? 'Active' :
                             license.status === 'pending' ? 'Pending' : 'Expired'}
                          </span>
                        </div>
                        <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>
                          {license.regulator}
                        </p>
                        <p style={{ color: c.text3, fontSize: 11, fontFamily: 'monospace' }}>
                          {license.licenseNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {license.scope.slice(0, 2).map((scope, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-lg text-xs"
                          style={{ background: c.surface2, color: c.text2 }}>
                          {scope}
                        </span>
                      ))}
                      {license.scope.length > 2 && (
                        <span
                          className="px-2 py-1 rounded-lg text-xs"
                          style={{ background: c.surface2, color: c.text3 }}>
                          +{license.scope.length - 2} more
                        </span>
                      )}
                    </div>
                  </TrCard>
                ))}
              </div>
            </PageSection>

            <div className="rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                💡 All licenses are verified and up-to-date. Click any license to view full details and verify directly with the regulator.
              </p>
            </div>
          </>
        )}

        {tab === 'protection' && (
          <>
            <PageSection label="Investor Protection Schemes">
              <div className="flex flex-col gap-3">
                {PROTECTION_SCHEMES.map((scheme, idx) => (
                  <TrCard key={idx} className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
                        <Shield size={20} color="#3B82F6" />
                      </div>
                      <div className="flex-1">
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                          {scheme.jurisdiction}
                        </p>
                        <p style={{ color: c.text3, fontSize: 12 }}>
                          {scheme.scheme}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>
                          {scheme.coverage}
                        </p>
                        <p style={{ color: c.text3, fontSize: 10 }}>Max Coverage</p>
                      </div>
                    </div>

                    <div className="rounded-xl p-3 mb-3" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                        {scheme.description}
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <AlertCircle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
                      <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                        <strong>Eligibility:</strong> {scheme.eligibility}
                      </p>
                    </div>
                  </TrCard>
                ))}
              </div>
            </PageSection>

            <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex gap-2">
                <AlertCircle size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  <strong>Important:</strong> Cryptocurrency holdings are NOT covered by traditional deposit insurance. Only fiat balances held at partner banks are eligible for FDIC/FSCS/DGS protection. Staking rewards are subject to smart contract and validator risks.
                </p>
              </div>
            </div>
          </>
        )}

        {tab === 'complaints' && (
          <>
            <PageSection label="Complaint Handling Process">
              <TrCard className="p-4">
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                  How to File a Complaint
                </p>

                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      title: 'Contact Customer Support',
                      desc: 'Submit your complaint via Live Chat, Email, or Support Ticket. Response within 24 hours.',
                      action: 'support@platform.com',
                    },
                    {
                      step: 2,
                      title: 'Escalate to Compliance Team',
                      desc: 'If not resolved within 7 days, escalate to our Compliance Officer.',
                      action: 'compliance@platform.com',
                    },
                    {
                      step: 3,
                      title: 'External Dispute Resolution',
                      desc: 'If unresolved after 8 weeks, you may refer to the Financial Ombudsman Service (UK/EU) or relevant authority.',
                      action: 'financial-ombudsman.org.uk',
                    },
                  ].map(item => (
                    <div key={item.step} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: c.primary, color: '#FFF', fontSize: 14, fontWeight: 700 }}>
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                          {item.title}
                        </p>
                        <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5, marginBottom: 4 }}>
                          {item.desc}
                        </p>
                        <a
                          href={`mailto:${item.action}`}
                          className="text-xs font-semibold"
                          style={{ color: '#3B82F6' }}>
                          {item.action}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="Regulatory Authority Contacts">
              <TrCard className="p-4">
                <div className="space-y-3">
                  {[
                    { name: 'UK Financial Conduct Authority', email: 'consumer.queries@fca.org.uk', phone: '+44 800 111 6768' },
                    { name: 'US FinCEN', email: 'frc@fincen.gov', phone: '+1 800-949-2732' },
                    { name: 'EU Financial Ombudsman', email: 'enquiries@financialombudsman.ie', phone: '+353 1 567 7000' },
                  ].map((contact, idx) => (
                    <div key={idx} className="pb-3 border-b last:border-b-0" style={{ borderColor: c.borderSolid }}>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                        {contact.name}
                      </p>
                      <div className="flex flex-col gap-1">
                        <a href={`mailto:${contact.email}`} style={{ color: '#3B82F6', fontSize: 11 }}>
                          {contact.email}
                        </a>
                        <a href={`tel:${contact.phone}`} style={{ color: c.text3, fontSize: 11 }}>
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </TrCard>
            </PageSection>
          </>
        )}

        {/* Footer Info */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            This information is accurate as of March 2026. Regulatory status may change. For the most current information, please contact our Compliance Team or verify directly with the respective regulators.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
