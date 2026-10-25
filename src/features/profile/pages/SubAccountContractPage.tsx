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
  const data = query.data;
  const accounts = data?.items ?? [];
  const balance = accounts.reduce((sum, account) => sum + account.balance, 0);
  return (
    <PageLayout>
      <Header title="Tài khoản phụ" subtitle="Tài khoản · Profile" back />
      <PageContent gap="default">
        <div
          role="region"
          aria-label="Danh sách tài khoản phụ"
          aria-busy={query.isFetching}
          className="flex min-w-0 flex-col gap-4"
        >
          {query.isPending ? (
            <p
              role="progressbar"
              aria-label="Đang tải tài khoản phụ…"
              style={{ color: colors.text2 }}
            >
              Đang tải tài khoản phụ…
            </p>
          ) : query.isError || !data ? (
            <div role="alert">
              <ErrorState onAction={() => void query.refetch()} />
            </div>
          ) : (
            <>
              <TrCard className="p-4" style={{ overflowWrap: 'anywhere' }}>
                <p style={{ color: colors.text2, fontSize: 12 }}>Tổng tài sản</p>
                <p style={{ color: colors.text1, fontSize: 26, fontWeight: 700 }}>
                  ${balance.toLocaleString('en-US')}
                </p>
                <p style={{ color: colors.text3, fontSize: 11 }}>{accounts.length} tài khoản phụ</p>
              </TrCard>
              {accounts.length === 0 ? (
                <p role="status" style={{ color: colors.text2, fontSize: 13 }}>
                  Chưa có tài khoản phụ nào.
                </p>
              ) : (
                accounts.map((account) => (
                  <TrCard
                    as="article"
                    className="min-w-0 p-4"
                    key={account.id}
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    <div className="flex flex-wrap justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 style={{ color: colors.text1, fontWeight: 700 }}>{account.name}</h2>
                        <p style={{ color: colors.text2, fontSize: 12 }}>
                          {account.email} · {account.type}
                        </p>
                      </div>
                      <span
                        style={{
                          color:
                            account.status === 'active' ? colors.successText : colors.warningText,
                          fontSize: 11,
                        }}
                      >
                        {account.status}
                      </span>
                    </div>
                    <div
                      className="mt-3 grid grid-cols-3 gap-2 [&>span]:min-w-0"
                      style={{ color: colors.text2, fontSize: 11 }}
                    >
                      <span>Balance ${account.balance.toLocaleString('en-US')}</span>
                      <span>PnL ${account.pnl30d.toLocaleString('en-US')}</span>
                      <span>{account.apiKeyCount} API key</span>
                    </div>
                  </TrCard>
                ))
              )}
            </>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
