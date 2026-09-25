import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUpRight,
  BarChart3,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useP2POrdersQuery } from '../model/p2p-order-queries';
import type { P2POrder, P2POrderStatus } from '../model/p2p-types';

const TABS = [
  { id: 'processing', label: 'Processing' },
  { id: 'completed', label: 'Completed' },
  { id: 'disputed', label: 'Disputed' },
] as const;

type TabId = (typeof TABS)[number]['id'];
type SortKey = 'date' | 'amount';

export function P2POrdersContractPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const shellPrefix = useRoutePrefix();
  const [tab, setTab] = useState<TabId>('processing');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const query = useP2POrdersQuery({ limit: 100 });

  const orders = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const filteredOrders = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return orders
      .filter((order) => matchesTab(order.status, tab))
      .filter(
        (order) =>
          !searchTerm ||
          order.id.toLowerCase().includes(searchTerm) ||
          order.orderNumber.toLowerCase().includes(searchTerm) ||
          order.merchant.toLowerCase().includes(searchTerm),
      )
      .sort((left, right) =>
        sortKey === 'amount'
          ? right.total - left.total
          : Date.parse(right.createdAt) - Date.parse(left.createdAt),
      );
  }, [orders, search, sortKey, tab]);

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="My P2P orders" subtitle="Escrow-backed order history" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Loading P2P orders API…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (query.isError || !query.data) {
    return (
      <PageLayout>
        <Header title="My P2P orders" subtitle="Escrow-backed order history" back />
        <PageContent>
          <ErrorState
            title="Unable to load P2P orders"
            message="The order contract is unavailable. Try again without losing the current route."
            actionLabel="Retry"
            onAction={() => void query.refetch()}
          />
        </PageContent>
      </PageLayout>
    );
  }

  const completedCount = orders.filter((order) => order.status === 'released').length;
  const disputedCount = orders.filter((order) => order.status === 'disputed').length;
  const completedVolume = orders
    .filter((order) => order.status === 'released')
    .reduce((total, order) => total + order.total, 0);

  return (
    <PageLayout>
      <Header
        title="My P2P orders"
        subtitle={`${query.data.total.toLocaleString('en-US')} orders · contract-backed`}
        back
        right={
          <button
            type="button"
            onClick={() => navigate(`${shellPrefix}/p2p/dashboard`)}
            aria-label="Open P2P dashboard"
            className="rounded-lg p-2"
            style={{ background: colors.surface2 }}
          >
            <BarChart3 size={16} color={colors.primary} />
          </button>
        }
      />
      <PageContent gap="default">
        <div className="grid grid-cols-3 gap-2">
          <Summary label="Total orders" value={orders.length.toString()} color={colors.text1} />
          <Summary label="Completed" value={completedCount.toString()} color="#10B981" />
          <Summary label="Completed volume" value={formatFiat(completedVolume)} color="#3B82F6" />
        </div>

        <TrCard className="p-3">
          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className="rounded-lg px-3 py-2 text-xs font-semibold"
                style={{
                  background: tab === item.id ? `${colors.primary}20` : colors.surface2,
                  color: tab === item.id ? colors.primary : colors.text3,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              aria-label="Search P2P orders"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, merchant or ID"
              className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: colors.surface2, color: colors.text1 }}
            />
            <button
              type="button"
              onClick={() => setSortKey((value) => (value === 'date' ? 'amount' : 'date'))}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold"
              style={{ background: colors.surface2, color: colors.text2 }}
            >
              <ArrowUpDown size={13} />
              {sortKey === 'date' ? 'Date' : 'Amount'}
            </button>
          </div>
        </TrCard>

        {filteredOrders.length === 0 ? (
          <TrCard className="p-8 text-center">
            <ShieldAlert size={30} color={colors.text3} className="mx-auto" />
            <p className="mt-3" style={{ color: colors.text2, fontWeight: 600 }}>
              No orders match the selected view.
            </p>
            <p className="mt-1 text-xs" style={{ color: colors.text3 }}>
              {tab === 'disputed'
                ? `${disputedCount} disputed orders recorded.`
                : 'Try another filter or search term.'}
            </p>
          </TrCard>
        ) : (
          <div className="grid gap-3">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => navigate(`${shellPrefix}/p2p/order/${order.id}`)}
              />
            ))}
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}

function OrderCard({ order, onClick }: { order: P2POrder; onClick: () => void }) {
  const colors = useThemeColors();
  const isBuy = order.type === 'buy';
  const status = orderStatus(order.status);
  const StatusIcon = status.icon;
  return (
    <TrCard as="button" onClick={onClick} className="w-full p-4 text-left" hover>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="rounded-md px-2 py-1 text-[10px] font-bold"
            style={{
              background: `${isBuy ? '#10B981' : '#EF4444'}20`,
              color: isBuy ? '#10B981' : '#EF4444',
            }}
          >
            {isBuy ? 'BUY' : 'SELL'}
          </span>
          <strong style={{ color: colors.text1, fontSize: 12 }}>#{order.orderNumber}</strong>
        </div>
        <span className="flex items-center gap-1 text-xs" style={{ color: status.color }}>
          <StatusIcon size={13} /> {status.label}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <Detail label="Asset" value={`${order.amount} ${order.asset}`} />
        <Detail label="Total" value={formatFiat(order.total, order.currency)} />
        <Detail label="Merchant" value={order.merchant} />
        <Detail label="Created" value={formatDate(order.createdAt)} />
      </div>
    </TrCard>
  );
}

function Summary({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-3 text-center">
      <strong style={{ color, fontSize: 16 }}>{value}</strong>
      <p style={{ color: colors.text3, fontSize: 10 }}>{label}</p>
    </TrCard>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <div className="min-w-0">
      <p style={{ color: colors.text3, fontSize: 10 }}>{label}</p>
      <p className="truncate" style={{ color: colors.text2, fontSize: 11, fontWeight: 600 }}>
        {value}
      </p>
    </div>
  );
}

function matchesTab(status: P2POrderStatus, tab: TabId) {
  if (tab === 'processing') return status === 'pending_payment' || status === 'paid';
  if (tab === 'completed')
    return status === 'released' || status === 'cancelled' || status === 'expired';
  return status === 'disputed';
}

function orderStatus(status: P2POrderStatus) {
  if (status === 'pending_payment')
    return { label: 'Pending payment', color: '#F59E0B', icon: Clock };
  if (status === 'paid') return { label: 'Paid', color: '#3B82F6', icon: ArrowUpRight };
  if (status === 'released') return { label: 'Released', color: '#10B981', icon: ArrowDownLeft };
  if (status === 'disputed') return { label: 'Disputed', color: '#EF4444', icon: ShieldAlert };
  return { label: status, color: '#8B95B3', icon: Clock };
}

function formatFiat(value: number, currency = 'VND') {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(
    new Date(value),
  );
}
