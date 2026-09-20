import React, { useState } from 'react';
import { FileText, Download, Globe, AlertTriangle, ExternalLink, Calculator } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';

interface Jurisdiction {
  id: string;
  name: string;
  flag: string;
  taxAuthority: string;
  treatment: string;
  rate: string;
  reportingForm: string;
  resources: { label: string; url: string }[];
}

const JURISDICTIONS: Jurisdiction[] = [
  {
    id: 'us',
    name: 'Hoa Kỳ (United States)',
    flag: '🇺🇸',
    taxAuthority: 'IRS (Internal Revenue Service)',
    treatment: 'Phần thưởng staking được coi là thu nhập thông thường (ordinary income) tại thời điểm nhận. Thuế suất: 10-37% tùy bậc thu nhập.',
    rate: '10-37% (Federal) + 0-13.3% (State)',
    reportingForm: '1040 Schedule 1 (Additional Income), Form 8949 (khi bán)',
    resources: [
      { label: 'IRS Notice 2014-21 (Crypto Guidance)', url: 'https://irs.gov/...' },
      { label: 'IRS FAQ - Virtual Currency', url: 'https://irs.gov/...' },
    ],
  },
  {
    id: 'uk',
    name: 'Vương quốc Anh (United Kingdom)',
    flag: '🇬🇧',
    taxAuthority: 'HMRC (HM Revenue & Customs)',
    treatment: 'Phần thưởng staking có thể là thu nhập hoặc capital gain tùy vào tình huống. Nếu là hoạt động trade thường xuyên → Income Tax. Nếu là đầu tư dài hạn → Capital Gains Tax.',
    rate: '20-45% (Income Tax) hoặc 10-20% (Capital Gains Tax)',
    reportingForm: 'Self Assessment Tax Return (SA100)',
    resources: [
      { label: 'HMRC Crypto Manual', url: 'https://gov.uk/hmrc-internal-manuals/...' },
      { label: 'Cryptoassets for Individuals', url: 'https://gov.uk/guidance/...' },
    ],
  },
  {
    id: 'ca',
    name: 'Canada',
    flag: '🇨🇦',
    taxAuthority: 'CRA (Canada Revenue Agency)',
    treatment: 'Phần thưởng staking là business income (50% taxable) hoặc capital gain (50% taxable) tùy vào mục đích sử dụng.',
    rate: '15-33% (Federal) + 5-25.75% (Provincial)',
    reportingForm: 'T1 General, Schedule 3 (Capital Gains)',
    resources: [
      { label: 'CRA Cryptocurrency Guide', url: 'https://canada.ca/en/revenue-agency/...' },
    ],
  },
  {
    id: 'au',
    name: 'Úc (Australia)',
    flag: '🇦🇺',
    taxAuthority: 'ATO (Australian Taxation Office)',
    treatment: 'Phần thưởng staking được coi là ordinary income tại thời điểm nhận. Khi bán → Capital Gains Tax (CGT) áp dụng.',
    rate: '19-45% (Income Tax) + 2% Medicare Levy',
    reportingForm: 'Individual Tax Return (ITR)',
    resources: [
      { label: 'ATO Crypto Tax Guide', url: 'https://ato.gov.au/...' },
    ],
  },
  {
    id: 'sg',
    name: 'Singapore',
    flag: '🇸🇬',
    taxAuthority: 'IRAS (Inland Revenue Authority of Singapore)',
    treatment: 'Phần thưởng staking CÓ THỂ không bị đánh thuế nếu là hoạt động đầu tư dài hạn. Nếu là trade thường xuyên → đánh thuế như income.',
    rate: '0-22% (nếu bị đánh thuế)',
    reportingForm: 'Form B / Form C (for companies)',
    resources: [
      { label: 'IRAS e-Tax Guide on Digital Tokens', url: 'https://iras.gov.sg/...' },
    ],
  },
  {
    id: 'other',
    name: 'Quốc gia khác',
    flag: '🌍',
    taxAuthority: 'Tùy theo quốc gia',
    treatment: 'Mỗi quốc gia có quy định khác nhau. Vui lòng tham khảo luật sư thuế địa phương.',
    rate: 'Khác nhau',
    reportingForm: 'Khác nhau',
    resources: [
      { label: 'Crypto Tax Guide (Global)', url: 'https://koinly.io/guides/' },
    ],
  },
];

export function StakingTaxGuidePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<'overview' | 'jurisdictions' | 'calculator'>('overview');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('us');
  const [taxCalc, setTaxCalc] = useState({ rewards: '', rate: '' });

  const calcTax = () => {
    const rewards = parseFloat(taxCalc.rewards || '0');
    const rate = parseFloat(taxCalc.rate || '0');
    return {
      taxOwed: rewards * (rate / 100),
      afterTax: rewards * (1 - rate / 100),
    };
  };

  const tax = calcTax();

  return (
    <PageLayout>
      <Header title="Hướng dẫn Thuế" back />

      <PageContent>
        {/* Disclaimer Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
          <div className="flex gap-3">
            <AlertTriangle size={20} color="#EF4444" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                ⚠️ Tuyên bố quan trọng
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Chúng tôi <strong>KHÔNG phải</strong> là cố vấn thuế hoặc kế toán. Thông tin dưới đây chỉ mang tính chất tham khảo. Vui lòng tham khảo ý kiến chuyên gia thuế địa phương trước khi khai báo thuế.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'overview', label: 'Tổng quan' },
            { id: 'jurisdictions', label: 'Theo quốc gia' },
            { id: 'calculator', label: 'Máy tính' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {tab === 'overview' && (
          <>
            <PageSection label="Tại sao phải khai báo thuế?">
              <TrCard className="p-4">
                <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
                  Phần thưởng staking được coi là <strong>thu nhập</strong> tại hầu hết các quốc gia. Khi bạn nhận phần thưởng, bạn phải khai báo và nộp thuế theo quy định pháp luật.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      title: 'Khi nhận phần thưởng',
                      desc: 'Phần thưởng được tính là thu nhập (income) tại thời điểm nhận, dựa trên giá thị trường (fair market value) tại thời điểm đó.',
                      example: 'Ví dụ: Bạn nhận 0.1 ETH phần thưởng khi giá ETH = $2,000 → Thu nhập = $200',
                    },
                    {
                      title: 'Khi bán phần thưởng',
                      desc: 'Khi bạn bán phần thưởng, có thể phát sinh thuế lãi vốn (capital gains tax) nếu giá tăng so với khi nhận.',
                      example: 'Ví dụ: Bạn nhận 0.1 ETH ($200), sau 6 tháng bán với giá $2,500 → Lãi vốn = $50 → Phải nộp thuế CGT',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="rounded-xl p-3" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                        {item.title}
                      </p>
                      <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6, marginBottom: 6 }}>
                        {item.desc}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11, fontStyle: 'italic' }}>
                        {item.example}
                      </p>
                    </div>
                  ))}
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="Tóm tắt Quy định">
              <TrCard className="p-4">
                <div className="space-y-3">
                  {[
                    { emoji: '🇺🇸', country: 'Hoa Kỳ', treatment: 'Ordinary Income (10-37%)', cgt: 'Có (0-20%)' },
                    { emoji: '🇬🇧', country: 'Vương quốc Anh', treatment: 'Income Tax (20-45%)', cgt: 'Có (10-20%)' },
                    { emoji: '🇨🇦', country: 'Canada', treatment: '50% Taxable (15-33%)', cgt: 'Có (50% taxable)' },
                    { emoji: '🇦🇺', country: 'Úc', treatment: 'Ordinary Income (19-45%)', cgt: 'Có (discount 50%)' },
                    { emoji: '🇸🇬', country: 'Singapore', treatment: 'Có thể miễn thuế', cgt: 'Không' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span style={{ fontSize: 24 }}>{item.emoji}</span>
                      <div className="flex-1">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{item.country}</p>
                        <p style={{ color: c.text3, fontSize: 11 }}>
                          {item.treatment} • CGT: {item.cgt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="Công cụ hỗ trợ">
              <TrCard className="p-4">
                <div className="space-y-3">
                  <button
                    onClick={() => navigate(`${prefix}/earn/history`)}
                    className="w-full flex items-center justify-between p-3 rounded-xl"
                    style={{ background: c.surface2 }}>
                    <div className="flex items-center gap-3">
                      <FileText size={20} color={c.text1} />
                      <div className="text-left">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Lịch sử Staking</p>
                        <p style={{ color: c.text3, fontSize: 11 }}>Xem tất cả giao dịch staking</p>
                      </div>
                    </div>
                    <ExternalLink size={16} color={c.text3} />
                  </button>

                  <button
                    onClick={() => navigate(`${prefix}/tax-reports`)}
                    className="w-full flex items-center justify-between p-3 rounded-xl"
                    style={{ background: c.surface2 }}>
                    <div className="flex items-center gap-3">
                      <Download size={20} color={c.text1} />
                      <div className="text-left">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Báo cáo Thuế</p>
                        <p style={{ color: c.text3, fontSize: 11 }}>Xuất CSV/PDF cho khai thuế</p>
                      </div>
                    </div>
                    <ExternalLink size={16} color={c.text3} />
                  </button>
                </div>
              </TrCard>
            </PageSection>
          </>
        )}

        {tab === 'jurisdictions' && (
          <>
            {/* Jurisdiction Selector */}
            <div className="flex flex-wrap gap-2">
              {JURISDICTIONS.map(j => (
                <button
                  key={j.id}
                  onClick={() => setSelectedJurisdiction(j.id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  style={{
                    background: selectedJurisdiction === j.id ? c.chipActiveBg : c.chipBg,
                    color: selectedJurisdiction === j.id ? c.chipActiveText : c.chipText,
                    border: `1px solid ${selectedJurisdiction === j.id ? c.chipActiveBorder : c.chipBorder}`,
                  }}>
                  <span>{j.flag}</span>
                  <span>{j.name.split('(')[0].trim()}</span>
                </button>
              ))}
            </div>

            {/* Selected Jurisdiction Detail */}
            {(() => {
              const jurisdiction = JURISDICTIONS.find(j => j.id === selectedJurisdiction);
              if (!jurisdiction) return null;
              return (
                <>
                  <TrCard className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span style={{ fontSize: 36 }}>{jurisdiction.flag}</span>
                      <div>
                        <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{jurisdiction.name}</p>
                        <p style={{ color: c.text3, fontSize: 12 }}>{jurisdiction.taxAuthority}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>Cách xử lý thuế:</p>
                        <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6 }}>
                          {jurisdiction.treatment}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                          <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Thuế suất</p>
                          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{jurisdiction.rate}</p>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                          <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Biểu mẫu</p>
                          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{jurisdiction.reportingForm}</p>
                        </div>
                      </div>
                    </div>
                  </TrCard>

                  <PageSection label="Tài liệu tham khảo">
                    <TrCard className="p-4">
                      <div className="space-y-2">
                        {jurisdiction.resources.map((res, idx) => (
                          <a
                            key={idx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl"
                            style={{ background: c.surface2 }}>
                            <div className="flex items-center gap-2">
                              <Globe size={16} color="#3B82F6" />
                              <span style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600 }}>{res.label}</span>
                            </div>
                            <ExternalLink size={14} color="#3B82F6" />
                          </a>
                        ))}
                      </div>
                    </TrCard>
                  </PageSection>

                  <TrCard className="p-4">
                    <div className="flex gap-2">
                      <AlertTriangle size={16} color={c.text3} className="shrink-0 mt-0.5" />
                      <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                        Thông tin trên chỉ mang tính chất tổng quan. Quy định thuế có thể thay đổi. Vui lòng tham khảo chuyên gia thuế hoặc truy cập website cơ quan thuế chính thức.
                      </p>
                    </div>
                  </TrCard>
                </>
              );
            })()}
          </>
        )}

        {tab === 'calculator' && (
          <>
            <TrCard className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
                  <Calculator size={24} color="#3B82F6" />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>Máy tính Thuế</p>
                  <p style={{ color: c.text3, fontSize: 12 }}>Ước tính thuế phải nộp</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Tổng phần thưởng staking (USD)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="1000"
                    value={taxCalc.rewards}
                    onChange={e => setTaxCalc({ ...taxCalc, rewards: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl outline-none"
                    style={{
                      background: c.surface2,
                      border: `1px solid ${c.borderSolid}`,
                      color: c.text1,
                      fontSize: 15,
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Thuế suất của bạn (%)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="30"
                    value={taxCalc.rate}
                    onChange={e => setTaxCalc({ ...taxCalc, rate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl outline-none"
                    style={{
                      background: c.surface2,
                      border: `1px solid ${c.borderSolid}`,
                      color: c.text1,
                      fontSize: 15,
                      fontFamily: 'monospace',
                    }}
                  />
                  <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>
                    Ví dụ: Hoa Kỳ 10-37%, Anh 20-45%, Canada 15-33%
                  </p>
                </div>

                {taxCalc.rewards && taxCalc.rate && (
                  <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text2, fontSize: 12, marginBottom: 12 }}>Kết quả:</p>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span style={{ color: c.text3, fontSize: 13 }}>Tổng phần thưởng:</span>
                        <span style={{ color: c.text1, fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>
                          ${parseFloat(taxCalc.rewards).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: c.text3, fontSize: 13 }}>Thuế phải nộp ({taxCalc.rate}%):</span>
                        <span style={{ color: '#EF4444', fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>
                          -${tax.taxOwed.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="h-px" style={{ background: c.divider }} />
                      <div className="flex justify-between">
                        <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Sau thuế:</span>
                        <span style={{ color: '#10B981', fontSize: 17, fontWeight: 800, fontFamily: 'monospace' }}>
                          ${tax.afterTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TrCard>

            <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                ⚠️ Đây chỉ là ước tính đơn giản. Thuế thực tế có thể khác do: thu nhập khác, khấu trừ, miễn giảm, thuế địa phương. Tham khảo kế toán viên để tính chính xác.
              </p>
            </div>

            <PageSection label="Câu hỏi thường gặp">
              {[
                {
                  q: 'Tôi có phải nộp thuế nếu chưa bán phần thưởng?',
                  a: 'Có. Tại hầu hết quốc gia, phần thưởng staking là thu nhập chịu thuế ngay khi nhận, bất kể bạn có bán hay không.',
                },
                {
                  q: 'Làm sao biết giá thị trường tại thời điểm nhận?',
                  a: 'Nền tảng cung cấp lịch sử giao dịch có ghi giá USD tại thời điểm nhận phần thưởng. Bạn có thể xuất CSV/PDF để khai thuế.',
                },
                {
                  q: 'Nếu tôi không khai báo thì sao?',
                  a: 'Trốn thuế là vi phạm pháp luật. Bạn có thể bị phạt, lãi suất, hoặc thậm chí truy tố hình sự. Vui lòng khai báo đầy đủ.',
                },
                {
                  q: 'Có công cụ nào giúp khai thuế tự động?',
                  a: 'Có. Bạn có thể dùng các dịch vụ như Koinly, CoinTracker, TaxBit để import giao dịch và tạo báo cáo thuế tự động.',
                },
              ].map((item, idx) => (
                <TrCard key={idx} className="p-4">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    {item.q}
                  </p>
                  <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                    {item.a}
                  </p>
                </TrCard>
              ))}
            </PageSection>
          </>
        )}

        {/* Footer Disclaimer */}
        <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
            Nền tảng KHÔNG cung cấp tư vấn thuế, kế toán, hoặc pháp lý. Thông tin trên đây chỉ mang tính chất giáo dục. Vui lòng tham khảo chuyên gia thuế có giấy phép tại quốc gia của bạn trước khi khai báo thuế. Chúng tôi không chịu trách nhiệm cho bất kỳ sai sót nào trong khai báo thuế của bạn.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
