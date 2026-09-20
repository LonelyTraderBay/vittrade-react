import React, { useState } from 'react';
import { Clock, AlertCircle, CheckCircle2, XCircle, Info, DollarSign } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';

interface WithdrawalTimeline {
  product: string;
  initiate: string;
  unbonding: string;
  receive: string;
  penalty?: string;
}

const WITHDRAWAL_TIMELINES: WithdrawalTimeline[] = [
  {
    product: 'Staking Linh hoạt',
    initiate: 'Bất kỳ lúc nào',
    unbonding: '1-3 ngày',
    receive: 'T+1 đến T+3',
    penalty: 'Không',
  },
  {
    product: 'Staking Cố định 30D',
    initiate: 'Sau ngày đến hạn',
    unbonding: 'Tức thì',
    receive: 'T+0 (ngay)',
    penalty: 'Rút sớm: Mất 100% phần thưởng',
  },
  {
    product: 'Staking Cố định 60D',
    initiate: 'Sau ngày đến hạn',
    unbonding: 'Tức thì',
    receive: 'T+0 (ngay)',
    penalty: 'Rút sớm <30 ngày: Mất 100% phần thưởng\nRút sớm >30 ngày: Mất 50% phần thưởng',
  },
  {
    product: 'Staking Cố định 90D+',
    initiate: 'Sau ngày đến hạn',
    unbonding: 'Tức thì',
    receive: 'T+0 (ngay)',
    penalty: 'Rút sớm <30 ngày: Mất 100% phần thưởng\nRút sớm >30 ngày: Mất 50% phần thưởng',
  },
  {
    product: 'DeFi Staking',
    initiate: 'Bất kỳ lúc nào',
    unbonding: '3-21 ngày (tùy pool)',
    receive: 'T+3 đến T+21',
    penalty: 'Phí rút pool: 0.5-2%',
  },
  {
    product: 'Liquid Staking',
    initiate: 'Bất kỳ lúc nào (swap stToken)',
    unbonding: '21-28 ngày (unstake trực tiếp)',
    receive: 'Tức thì (swap) hoặc T+21-28 (unstake)',
    penalty: 'Slippage: 0.1-1% (khi swap)',
  },
];

export function StakingWithdrawalPolicyPage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'timeline' | 'penalties' | 'emergency'>('timeline');
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState({ principal: '', earned: '', days: '' });

  const calculatePenalty = () => {
    const principal = parseFloat(calcInput.principal || '0');
    const earned = parseFloat(calcInput.earned || '0');
    const days = parseFloat(calcInput.days || '0');
    
    if (days < 30) {
      return { penalty: earned, remaining: 0, rate: 100 };
    } else {
      return { penalty: earned * 0.5, remaining: earned * 0.5, rate: 50 };
    }
  };

  const penalty = calculatePenalty();

  return (
    <PageLayout>
      <Header title="Chính sách Rút tiền" back />

      <BottomSheetV2
        open={showCalculator}
        onClose={() => setShowCalculator(false)}
        title="Tính phí rút sớm">
        <div className="flex flex-col gap-4">
          <div>
            <label style={{ color: c.text2, fontSize: 13, display: 'block', marginBottom: 6 }}>
              Số lượng gốc (Principal)
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="1000"
              value={calcInput.principal}
              onChange={e => setCalcInput({ ...calcInput, principal: e.target.value })}
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
              Phần thưởng đã tích lũy
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="50"
              value={calcInput.earned}
              onChange={e => setCalcInput({ ...calcInput, earned: e.target.value })}
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
              Số ngày đã stake
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="45"
              value={calcInput.days}
              onChange={e => setCalcInput({ ...calcInput, days: e.target.value })}
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

          {calcInput.principal && calcInput.earned && calcInput.days && (
            <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
              <p style={{ color: c.text2, fontSize: 12, marginBottom: 8 }}>Kết quả:</p>
              <BottomSheetRow
                label="Phí rút sớm"
                value={`-${penalty.penalty.toFixed(2)} (${penalty.rate}%)`}
                valueColor="#EF4444"
              />
              <BottomSheetRow
                label="Phần thưởng còn lại"
                value={`+${penalty.remaining.toFixed(2)}`}
                valueColor="#10B981"
              />
              <BottomSheetRow
                label="Số lượng nhận về"
                value={`${(parseFloat(calcInput.principal) + penalty.remaining).toFixed(2)}`}
                highlight
              />
            </div>
          )}

          <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              ⚠️ Đây là ước tính. Phí thực tế có thể khác nhau tùy vào chính sách cụ thể của sản phẩm. Vui lòng kiểm tra trước khi rút.
            </p>
          </div>
        </div>
      </BottomSheetV2>

      <PageContent>
        {/* Info Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <Info size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Về Chính sách Rút tiền
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Mỗi sản phẩm staking có quy trình rút tiền khác nhau. Vui lòng đọc kỹ để hiểu thời gian xử lý và phí rút sớm (nếu có).
              </p>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <TabBar
          tabs={[
            { id: 'timeline', label: 'Timeline' },
            { id: 'penalties', label: 'Phí rút sớm' },
            { id: 'emergency', label: 'Rút khẩn cấp' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {tab === 'timeline' && (
          <>
            <PageSection label="Quy trình Rút tiền">
              <TrCard className="p-4">
                <div className="flex flex-col gap-4">
                  {[
                    { step: 1, title: 'Yêu cầu rút', desc: 'Bạn bấm nút "Unstake" hoặc "Rút tiền" trên ứng dụng', icon: DollarSign, color: '#3B82F6' },
                    { step: 2, title: 'Xác nhận', desc: 'Xác nhận email/SMS/2FA để đảm bảo an toàn', icon: CheckCircle2, color: '#10B981' },
                    { step: 3, title: 'Unbonding period', desc: 'Chờ thời gian mở khóa (1-21 ngày tùy sản phẩm)', icon: Clock, color: '#F59E0B' },
                    { step: 4, title: 'Nhận tiền', desc: 'Tài sản được chuyển về ví giao dịch (Spot Wallet)', icon: CheckCircle2, color: '#10B981' },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.step} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${item.color}22`, border: `1.5px solid ${item.color}44` }}>
                          <Icon size={18} color={item.color} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                              style={{ background: `${item.color}22`, color: item.color }}>
                              Bước {item.step}
                            </span>
                            <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{item.title}</span>
                          </div>
                          <p style={{ color: c.text2, fontSize: 12 }}>{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="Timeline theo Sản phẩm">
              {WITHDRAWAL_TIMELINES.map(timeline => (
                <TrCard key={timeline.product} className="p-4">
                  <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                    {timeline.product}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p style={{ color: c.text3, fontSize: 11 }}>Có thể rút</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{timeline.initiate}</p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 11 }}>Unbonding</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{timeline.unbonding}</p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 11 }}>Nhận tiền</p>
                      <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{timeline.receive}</p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 11 }}>Phí rút sớm</p>
                      <p style={{ color: timeline.penalty === 'Không' ? '#10B981' : '#F59E0B', fontSize: 13, fontWeight: 600 }}>
                        {timeline.penalty}
                      </p>
                    </div>
                  </div>
                </TrCard>
              ))}
            </PageSection>

            <TrCard className="p-4">
              <div className="flex gap-2">
                <AlertCircle size={16} color={c.text3} className="shrink-0 mt-0.5" />
                <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                  <strong>Lưu ý:</strong> Unbonding period là thời gian bắt buộc do mạng blockchain quy định, không phải do nền tảng. Chúng tôi không thể rút ngắn thời gian này.
                </p>
              </div>
            </TrCard>
          </>
        )}

        {tab === 'penalties' && (
          <>
            <PageSection label="Phí rút sớm">
              <TrCard className="p-4">
                <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
                  Nếu bạn rút tài sản khỏi sản phẩm <strong>Staking Cố định</strong> trước kỳ hạn đến hạn (maturity date), bạn sẽ bị tính phí rút sớm (early withdrawal penalty).
                </p>
                <div className="rounded-xl p-4" style={{ background: c.surface2 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle size={18} color="#EF4444" />
                    <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                      Công thức Phí rút sớm:
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 700 }}>•</span>
                      <span style={{ color: c.text2, fontSize: 13 }}>
                        Rút sớm trong <strong>30 ngày đầu</strong>: Mất <strong className="text-[#EF4444]">100%</strong> phần thưởng đã tích lũy
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span style={{ color: '#F59E0B', fontSize: 13, fontWeight: 700 }}>•</span>
                      <span style={{ color: c.text2, fontSize: 13 }}>
                        Rút sớm <strong>sau 30 ngày</strong>: Mất <strong className="text-[#F59E0B]">50%</strong> phần thưởng đã tích lũy
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>•</span>
                      <span style={{ color: c.text2, fontSize: 13 }}>
                        Rút <strong>đúng hạn hoặc sau hạn</strong>: <strong className="text-[#10B981]">Không phí</strong>, nhận đủ 100% phần thưởng
                      </span>
                    </div>
                  </div>
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="Ví dụ Tính toán">
              <TrCard className="p-4">
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                  Tình huống 1: Rút sớm sau 20 ngày
                </p>
                <div className="rounded-xl p-3 mb-3" style={{ background: c.surface2 }}>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: c.text3, fontSize: 12 }}>Số lượng gốc:</span>
                    <span style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>1,000 USDT</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: c.text3, fontSize: 12 }}>Phần thưởng tích lũy:</span>
                    <span style={{ color: '#10B981', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>+10.5 USDT</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: c.text3, fontSize: 12 }}>Đã stake:</span>
                    <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>20/90 ngày</span>
                  </div>
                  <div className="h-px my-2" style={{ background: c.divider }} />
                  <div className="flex justify-between mb-2">
                    <span style={{ color: '#EF4444', fontSize: 12 }}>Phí rút sớm (100%):</span>
                    <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>-10.5 USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Nhận về:</span>
                    <span style={{ color: c.text1, fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>1,000 USDT</span>
                  </div>
                </div>
              </TrCard>

              <TrCard className="p-4">
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                  Tình huống 2: Rút sớm sau 45 ngày
                </p>
                <div className="rounded-xl p-3 mb-3" style={{ background: c.surface2 }}>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: c.text3, fontSize: 12 }}>Số lượng gốc:</span>
                    <span style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>1,000 USDT</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: c.text3, fontSize: 12 }}>Phần thưởng tích lũy:</span>
                    <span style={{ color: '#10B981', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>+22.5 USDT</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: c.text3, fontSize: 12 }}>Đã stake:</span>
                    <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>45/90 ngày</span>
                  </div>
                  <div className="h-px my-2" style={{ background: c.divider }} />
                  <div className="flex justify-between mb-2">
                    <span style={{ color: '#F59E0B', fontSize: 12 }}>Phí rút sớm (50%):</span>
                    <span style={{ color: '#F59E0B', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>-11.25 USDT</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: '#10B981', fontSize: 12 }}>Phần thưởng còn lại:</span>
                    <span style={{ color: '#10B981', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>+11.25 USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Nhận về:</span>
                    <span style={{ color: c.text1, fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>1,011.25 USDT</span>
                  </div>
                </div>
              </TrCard>
            </PageSection>

            <button
              onClick={() => setShowCalculator(true)}
              className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ background: c.primary, color: '#FFF' }}>
              <DollarSign size={18} />
              Tính phí rút sớm của tôi
            </button>

            <TrCard className="p-4">
              <div className="flex gap-2">
                <Info size={16} color={c.text3} className="shrink-0 mt-0.5" />
                <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                  <strong>Quan trọng:</strong> Số lượng gốc (principal) không bị ảnh hưởng. Chỉ phần thưởng staking bị phạt. Bạn luôn nhận lại 100% số tiền gốc đã stake.
                </p>
              </div>
            </TrCard>
          </>
        )}

        {tab === 'emergency' && (
          <>
            <PageSection label="Rút tiền Khẩn cấp">
              <TrCard className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1.5px solid rgba(239,68,68,0.3)' }}>
                    <AlertCircle size={24} color="#EF4444" />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                      Khi nào cần rút khẩn cấp?
                    </p>
                    <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                      Rút khẩn cấp chỉ nên dùng khi bạn thực sự cần tiền gấp và không thể chờ unbonding period tiêu chuẩn.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    'Y tế khẩn cấp (bệnh viện, tai nạn)',
                    'Thiên tai, thảm họa',
                    'Mất việc đột ngột, cần tiền sinh hoạt',
                    'Tình huống pháp lý nghiêm trọng',
                  ].map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#EF4444' }} />
                      <span style={{ color: c.text2, fontSize: 12 }}>{reason}</span>
                    </div>
                  ))}
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="Quy trình Rút khẩn cấp">
              <TrCard className="p-4">
                <div className="flex flex-col gap-4">
                  {[
                    { step: 1, text: 'Liên hệ Support 24/7 qua Live Chat hoặc Hotline', time: 'Ngay lập tức' },
                    { step: 2, text: 'Cung cấp lý do rút khẩn cấp + chứng minh (nếu cần)', time: '< 1 giờ' },
                    { step: 3, text: 'Team Support xem xét và phê duyệt', time: '1-4 giờ' },
                    { step: 4, text: 'Xác nhận phí rút khẩn cấp (10-20% phần thưởng)', time: '< 30 phút' },
                    { step: 5, text: 'Nhận tiền về ví giao dịch', time: '1-6 giờ' },
                  ].map(item => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                        style={{ background: '#3B82F622', color: '#3B82F6', border: '1.5px solid #3B82F644' }}>
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{item.text}</p>
                        <p style={{ color: c.text3, fontSize: 11 }}>⏱️ {item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TrCard>
            </PageSection>

            <PageSection label="Phí Rút khẩn cấp">
              <TrCard className="p-4">
                <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
                  Phí rút khẩn cấp cao hơn phí rút sớm thông thường vì cần xử lý ưu tiên và bỏ qua unbonding period.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { product: 'Flexible Staking', fee: '5% phần thưởng' },
                    { product: 'Fixed Staking <30 ngày', fee: '100% phần thưởng + 5% gốc' },
                    { product: 'Fixed Staking >30 ngày', fee: '50% phần thưởng + 3% gốc' },
                    { product: 'DeFi Staking', fee: '10% phần thưởng + phí pool' },
                  ].map(item => (
                    <div key={item.product} className="rounded-xl p-3" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>{item.product}</p>
                      <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 700 }}>{item.fee}</p>
                    </div>
                  ))}
                </div>
              </TrCard>
            </PageSection>

            <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex gap-2">
                <AlertCircle size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                    ⚠️ Lưu ý quan trọng
                  </p>
                  <ul style={{ color: c.text2, fontSize: 12, lineHeight: 1.7, paddingLeft: 16 }}>
                    <li>Rút khẩn cấp KHÔNG được đảm bảo phê duyệt. Team Support có quyền từ chối nếu lý do không hợp lệ.</li>
                    <li>Phí rút khẩn cấp KHÔNG được hoàn lại trong mọi trường hợp.</li>
                    <li>Bạn chỉ được yêu cầu rút khẩn cấp tối đa 2 lần/năm.</li>
                    <li>Lạm dụng tính năng này có thể dẫn đến hạn chế tài khoản.</li>
                  </ul>
                </div>
              </div>
            </div>

            <TrCard className="p-4">
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                Liên hệ Support:
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: 12 }}>Live Chat:</span>
                  <span style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>support.platform.com/chat</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: 12 }}>Hotline 24/7:</span>
                  <span style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>+1-800-XXX-XXXX</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: 12 }}>Email:</span>
                  <span style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>emergency@platform.com</span>
                </div>
              </div>
            </TrCard>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}
