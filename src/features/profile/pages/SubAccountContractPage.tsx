import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useSubAccountsQuery } from '../model/profile-queries';

export function SubAccountContractPage() {
  const colors = useThemeColors();
  const query = useSubAccountsQuery();
  if (query.isPending)
    return (
      <PageLayout>
        <Header title="Tài khoản phụ" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải tài khoản phụ…</p>
        </PageContent>
      </PageLayout>
    );
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  const accounts = query.data.items;
  const balance = accounts.reduce((sum, account) => sum + account.balance, 0);
  return (
    <PageLayout>
      <Header title="Tài khoản phụ" subtitle="Tài khoản · Profile" back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <p style={{ color: colors.text2, fontSize: 12 }}>Tổng tài sản</p>
          <p style={{ color: colors.text1, fontSize: 26, fontWeight: 700 }}>
            ${balance.toLocaleString('en-US')}
          </p>
          <p style={{ color: colors.text3, fontSize: 11 }}>{accounts.length} tài khoản phụ</p>
        </TrCard>
        {accounts.map((account) => (
          <TrCard className="p-4" key={account.id}>
            <div className="flex justify-between">
              <div>
                <h2 style={{ color: colors.text1, fontWeight: 700 }}>{account.name}</h2>
                <p style={{ color: colors.text2, fontSize: 12 }}>
                  {account.email} · {account.type}
                </p>
              </div>
              <span
                style={{
                  color: account.status === 'active' ? colors.success : colors.warningText,
                  fontSize: 11,
                }}
              >
                {account.status}
              </span>
            </div>
            <div
              className="mt-3 grid grid-cols-3 gap-2"
              style={{ color: colors.text2, fontSize: 11 }}
            >
              <span>Balance ${account.balance.toLocaleString('en-US')}</span>
              <span>PnL ${account.pnl30d.toLocaleString('en-US')}</span>
              <span>{account.apiKeyCount} API key</span>
            </div>
          </TrCard>
        ))}
      </PageContent>
    </PageLayout>
  );
}
