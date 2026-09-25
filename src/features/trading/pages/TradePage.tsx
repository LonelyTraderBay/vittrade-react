import { TradeTerminal } from '../components/TradeTerminal';

/**
 * Boundary của trang giao dịch thuộc feature trading.
 * TradeTerminal giữ phần UI tương tác lớn để route không chứa business logic.
 */
export function TradePage() {
  return <TradeTerminal />;
}
