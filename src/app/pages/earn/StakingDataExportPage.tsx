import React from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { toast } from 'sonner';

const EXPORT_TYPES = [
  { name: 'All Transactions', desc: 'Complete transaction history (CSV)', icon: FileText },
  { name: 'Rewards Report', desc: 'Daily rewards breakdown (CSV)', icon: Calendar },
  { name: 'Tax Report', desc: 'Annual tax summary (PDF)', icon: FileText },
  { name: 'Portfolio Snapshot', desc: 'Current positions (JSON)', icon: FileText },
];

export function StakingDataExportPage() {
  const c = useThemeColors();

  return (
    <PageLayout>
      <Header title="Data Export" back />

      <PageContent>
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            Export Your Data
          </p>
          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
            Download complete records for accounting, tax reporting, or personal analysis. All exports are encrypted.
          </p>
        </div>

        <PageSection label="Quick Exports">
          <div className="grid grid-cols-2 gap-3">
            {EXPORT_TYPES.map((type, idx) => (
              <TrCard key={idx} hover className="p-3" onClick={() => toast.success(`Exporting ${type.name}...`)}>
                <type.icon size={20} color={c.text3} className="mb-2" />
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                  {type.name}
                </p>
                <p style={{ color: c.text3, fontSize: 10 }}>{type.desc}</p>
              </TrCard>
            ))}
          </div>
        </PageSection>

        <PageSection label="Custom Export">
          <TrCard className="p-4">
            <div className="space-y-3">
              <div>
                <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" className="p-2 rounded-lg text-sm" style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }} />
                  <input type="date" className="p-2 rounded-lg text-sm" style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }} />
                </div>
              </div>
              <div>
                <label style={{ color: c.text2, fontSize: 12, marginBottom: 6, display: 'block' }}>Format</label>
                <select className="w-full p-2 rounded-lg text-sm" style={{ background: c.surface2, color: c.text1, border: `1px solid ${c.borderSolid}` }}>
                  <option>CSV</option>
                  <option>JSON</option>
                  <option>PDF</option>
                </select>
              </div>
              <button className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ background: c.primary, color: '#FFF' }}>
                Export Custom Range
              </button>
            </div>
          </TrCard>
        </PageSection>

        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Exports are generated on-demand and available for download for 7 days. Large exports may take up to 5 minutes to process.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
