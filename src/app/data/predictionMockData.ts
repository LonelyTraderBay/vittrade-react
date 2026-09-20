/**
 * ══════════════════════════════════════════════════════════
 *  Prediction Markets — Mock Data
 * ══════════════════════════════════════════════════════════
 *  Polymarket-style prediction market events with outcomes,
 *  volumes, probabilities, and metadata.
 */

export type PredictionOutcome = {
  label: string;
  chance: number; // 0-100
  color: string;
};

export type PredictionEvent = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  outcomes: PredictionOutcome[];
  volume24h: number;
  totalVolume: number;
  endDate: string; // ISO date
  liquidity: number;
  participants: number;
  status: 'active' | 'resolved';
  resolvedOutcome?: string;
  isNew?: boolean;
  isTrending?: boolean;
  change24h: number; // change in top outcome probability
  createdAt: string;
};

export const PREDICTION_CATEGORIES = [
  'Live Crypto',
  'Politics',
  'Sports',
  'Tech',
  'AI',
  'Finance',
  'Culture',
] as const;

export const PREDICTION_EVENTS: PredictionEvent[] = [
  {
    id: 'pred-1',
    title: 'Bitcoin reaches $150K before July 2026?',
    category: 'Live Crypto',
    tags: ['BTC', 'Price Target'],
    outcomes: [
      { label: 'Yes', chance: 34, color: '#10B981' },
      { label: 'No', chance: 66, color: '#EF4444' },
    ],
    volume24h: 2_450_000,
    totalVolume: 18_700_000,
    endDate: '2026-07-01T00:00:00Z',
    liquidity: 5_200_000,
    participants: 12_840,
    status: 'active',
    isTrending: true,
    change24h: 5.2,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'pred-2',
    title: 'Ethereum ETF approved in Q2 2026?',
    category: 'Live Crypto',
    tags: ['ETH', 'Regulation'],
    outcomes: [
      { label: 'Yes', chance: 72, color: '#10B981' },
      { label: 'No', chance: 28, color: '#EF4444' },
    ],
    volume24h: 1_830_000,
    totalVolume: 14_200_000,
    endDate: '2026-06-30T00:00:00Z',
    liquidity: 3_800_000,
    participants: 9_450,
    status: 'active',
    isTrending: true,
    change24h: 3.8,
    createdAt: '2026-01-20T00:00:00Z',
  },
  {
    id: 'pred-3',
    title: 'US Presidential approval rating above 50% by March?',
    category: 'Politics',
    tags: ['US', 'Approval'],
    outcomes: [
      { label: 'Yes', chance: 41, color: '#10B981' },
      { label: 'No', chance: 59, color: '#EF4444' },
    ],
    volume24h: 980_000,
    totalVolume: 8_100_000,
    endDate: '2026-03-31T00:00:00Z',
    liquidity: 2_100_000,
    participants: 6_320,
    status: 'active',
    change24h: -2.1,
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'pred-4',
    title: 'Champions League Winner 2026',
    category: 'Sports',
    tags: ['Football', 'UCL'],
    outcomes: [
      { label: 'Real Madrid', chance: 28, color: '#F59E0B' },
      { label: 'Man City', chance: 24, color: '#3B82F6' },
      { label: 'Bayern', chance: 18, color: '#EF4444' },
      { label: 'Other', chance: 30, color: '#8B5CF6' },
    ],
    volume24h: 1_250_000,
    totalVolume: 11_300_000,
    endDate: '2026-06-01T00:00:00Z',
    liquidity: 4_500_000,
    participants: 15_200,
    status: 'active',
    isTrending: true,
    change24h: 1.5,
    createdAt: '2025-12-01T00:00:00Z',
  },
  {
    id: 'pred-5',
    title: 'Apple releases AR glasses in 2026?',
    category: 'Tech',
    tags: ['Apple', 'AR/VR'],
    outcomes: [
      { label: 'Yes', chance: 55, color: '#10B981' },
      { label: 'No', chance: 45, color: '#EF4444' },
    ],
    volume24h: 720_000,
    totalVolume: 5_400_000,
    endDate: '2026-12-31T00:00:00Z',
    liquidity: 1_800_000,
    participants: 4_100,
    status: 'active',
    isNew: true,
    change24h: 8.3,
    createdAt: '2026-02-20T00:00:00Z',
  },
  {
    id: 'pred-6',
    title: 'GPT-5 released before June 2026?',
    category: 'AI',
    tags: ['OpenAI', 'LLM'],
    outcomes: [
      { label: 'Yes', chance: 68, color: '#10B981' },
      { label: 'No', chance: 32, color: '#EF4444' },
    ],
    volume24h: 1_560_000,
    totalVolume: 9_800_000,
    endDate: '2026-06-01T00:00:00Z',
    liquidity: 3_200_000,
    participants: 8_900,
    status: 'active',
    isTrending: true,
    change24h: -1.2,
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'pred-7',
    title: 'Fed cuts rates below 4% by Q3 2026?',
    category: 'Finance',
    tags: ['Fed', 'Interest Rate'],
    outcomes: [
      { label: 'Yes', chance: 47, color: '#10B981' },
      { label: 'No', chance: 53, color: '#EF4444' },
    ],
    volume24h: 890_000,
    totalVolume: 7_200_000,
    endDate: '2026-09-30T00:00:00Z',
    liquidity: 2_600_000,
    participants: 5_800,
    status: 'active',
    change24h: 2.4,
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'pred-8',
    title: 'Next Marvel movie grosses $1B worldwide?',
    category: 'Culture',
    tags: ['Marvel', 'Box Office'],
    outcomes: [
      { label: 'Yes', chance: 62, color: '#10B981' },
      { label: 'No', chance: 38, color: '#EF4444' },
    ],
    volume24h: 340_000,
    totalVolume: 2_800_000,
    endDate: '2026-08-01T00:00:00Z',
    liquidity: 950_000,
    participants: 3_200,
    status: 'active',
    change24h: 0.8,
    createdAt: '2026-02-10T00:00:00Z',
  },
  {
    id: 'pred-9',
    title: 'Solana price above $500 by March 2026?',
    category: 'Live Crypto',
    tags: ['SOL', 'Price Target'],
    outcomes: [
      { label: 'Yes', chance: 22, color: '#10B981' },
      { label: 'No', chance: 78, color: '#EF4444' },
    ],
    volume24h: 1_120_000,
    totalVolume: 6_500_000,
    endDate: '2026-03-31T00:00:00Z',
    liquidity: 2_900_000,
    participants: 7_600,
    status: 'active',
    change24h: -4.5,
    createdAt: '2026-01-25T00:00:00Z',
  },
  {
    id: 'pred-10',
    title: 'Tesla stock above $400 by mid-2026?',
    category: 'Finance',
    tags: ['TSLA', 'Stock'],
    outcomes: [
      { label: 'Yes', chance: 38, color: '#10B981' },
      { label: 'No', chance: 62, color: '#EF4444' },
    ],
    volume24h: 670_000,
    totalVolume: 4_300_000,
    endDate: '2026-06-30T00:00:00Z',
    liquidity: 1_500_000,
    participants: 4_800,
    status: 'active',
    isNew: true,
    change24h: 6.1,
    createdAt: '2026-02-22T00:00:00Z',
  },
  {
    id: 'pred-11',
    title: 'Will AI-generated movie win an Oscar by 2027?',
    category: 'AI',
    tags: ['AI', 'Entertainment'],
    outcomes: [
      { label: 'Yes', chance: 12, color: '#10B981' },
      { label: 'No', chance: 88, color: '#EF4444' },
    ],
    volume24h: 290_000,
    totalVolume: 1_900_000,
    endDate: '2027-03-01T00:00:00Z',
    liquidity: 680_000,
    participants: 2_100,
    status: 'active',
    change24h: 1.1,
    createdAt: '2026-02-18T00:00:00Z',
  },
  {
    id: 'pred-12',
    title: 'Crypto total market cap reaches $5T in 2026?',
    category: 'Live Crypto',
    tags: ['Market Cap', 'Bull Run'],
    outcomes: [
      { label: 'Yes', chance: 45, color: '#10B981' },
      { label: 'No', chance: 55, color: '#EF4444' },
    ],
    volume24h: 2_100_000,
    totalVolume: 15_600_000,
    endDate: '2026-12-31T00:00:00Z',
    liquidity: 4_800_000,
    participants: 11_200,
    status: 'active',
    isTrending: true,
    change24h: 3.2,
    createdAt: '2026-01-01T00:00:00Z',
  },
  // Resolved events
  {
    id: 'pred-r1',
    title: 'Bitcoin above $100K by Feb 2026?',
    category: 'Live Crypto',
    tags: ['BTC', 'Price'],
    outcomes: [
      { label: 'Yes', chance: 100, color: '#10B981' },
      { label: 'No', chance: 0, color: '#EF4444' },
    ],
    volume24h: 0,
    totalVolume: 22_000_000,
    endDate: '2026-02-01T00:00:00Z',
    liquidity: 0,
    participants: 18_500,
    status: 'resolved',
    resolvedOutcome: 'Yes',
    change24h: 0,
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'pred-r2',
    title: 'Super Bowl LX Winner: Kansas City?',
    category: 'Sports',
    tags: ['NFL', 'Super Bowl'],
    outcomes: [
      { label: 'Yes', chance: 0, color: '#10B981' },
      { label: 'No', chance: 100, color: '#EF4444' },
    ],
    volume24h: 0,
    totalVolume: 9_800_000,
    endDate: '2026-02-09T00:00:00Z',
    liquidity: 0,
    participants: 14_200,
    status: 'resolved',
    resolvedOutcome: 'No',
    change24h: 0,
    createdAt: '2025-09-01T00:00:00Z',
  },
];

/** Helper: format volume compactly */
export function fmtVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

/** Helper: time remaining label */
export function timeRemaining(endDate: string): string {
  const now = new Date('2026-02-27T12:00:00Z');
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return 'Ended';
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days > 30) {
    const months = Math.floor(days / 30);
    return `${months} tháng`;
  }
  if (days > 0) return `${days} ngày`;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  return `${hours}h`;
}

/* ═══════════════════════════════════════════════════════════
   PROBABILITY HISTORY — For detail page chart
   ═══════════════════════════════════════════════════════════ */

export type ProbabilityPoint = { date: string; yes: number; no: number; volume: number };

/** Generate realistic probability history for a given event */
export function generateProbabilityHistory(event: PredictionEvent): ProbabilityPoint[] {
  const points: ProbabilityPoint[] = [];
  const startChance = Math.max(10, Math.min(90, event.outcomes[0].chance - event.change24h * 5));
  const endChance = event.outcomes[0].chance;
  const days = 30;
  for (let i = 0; i <= days; i++) {
    const t = i / days;
    const base = startChance + (endChance - startChance) * t;
    const noise = (Math.sin(i * 1.7) * 6 + Math.cos(i * 2.3) * 4) * (1 - t * 0.3);
    const yes = Math.max(2, Math.min(98, Math.round(base + noise)));
    const d = new Date('2026-01-28T00:00:00Z');
    d.setDate(d.getDate() + i);
    points.push({
      date: d.toISOString().slice(5, 10),
      yes,
      no: 100 - yes,
      volume: Math.round(event.volume24h * (0.3 + Math.random() * 1.4)),
    });
  }
  return points;
}

/* ═══════════════════════════════════════════════════════════
   ORDER BOOK — For detail page
   ═══════════════════════════════════════════════════════════ */

export type OrderBookEntry = { price: number; shares: number; total: number };

export function generateOrderBook(chance: number): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  let bidTotal = 0;
  let askTotal = 0;
  for (let i = 0; i < 8; i++) {
    const bidPrice = Math.max(0.01, (chance / 100) - (i + 1) * 0.01 - Math.random() * 0.005);
    const bidShares = Math.round(500 + Math.random() * 4000);
    bidTotal += bidShares;
    bids.push({ price: Math.round(bidPrice * 100) / 100, shares: bidShares, total: bidTotal });

    const askPrice = Math.min(0.99, (chance / 100) + (i + 1) * 0.01 + Math.random() * 0.005);
    const askShares = Math.round(500 + Math.random() * 4000);
    askTotal += askShares;
    asks.push({ price: Math.round(askPrice * 100) / 100, shares: askShares, total: askTotal });
  }
  return { bids, asks };
}

/* ═══════════════════════════════════════════════════════════
   COMMENTS — For detail page community section
   ═══════════════════════════════════════════════════════════ */

export type PredictionComment = {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  position?: 'Yes' | 'No';
};

export const PREDICTION_COMMENTS: Record<string, PredictionComment[]> = {
  'pred-1': [
    { id: 'c1', user: 'CryptoWhale', avatar: '🐋', text: 'BTC has strong momentum. The halving effect is kicking in. $150K is very possible.', time: '2h ago', likes: 42, position: 'Yes' },
    { id: 'c2', user: 'BearishBob', avatar: '🐻', text: 'Too optimistic. Macro headwinds will cap the rally around $120K.', time: '5h ago', likes: 18, position: 'No' },
    { id: 'c3', user: 'DeFiDegen', avatar: '🦊', text: 'Bought more Yes shares at $0.32. Risk/reward is insane here.', time: '8h ago', likes: 31, position: 'Yes' },
    { id: 'c4', user: 'TechTrader', avatar: '📊', text: 'Volume spike suggests smart money is accumulating Yes positions.', time: '12h ago', likes: 27 },
    { id: 'c5', user: 'HODLer', avatar: '💎', text: 'Long term bullish. Just a matter of time.', time: '1d ago', likes: 15, position: 'Yes' },
  ],
  'pred-2': [
    { id: 'c6', user: 'RegWatch', avatar: '⚖️', text: 'SEC has been signaling approval. This is almost a done deal.', time: '3h ago', likes: 56, position: 'Yes' },
    { id: 'c7', user: 'ETHMaxi', avatar: '🔷', text: 'ETH ETF will unlock massive institutional demand.', time: '6h ago', likes: 33, position: 'Yes' },
    { id: 'c8', user: 'Skeptic99', avatar: '🤔', text: 'Regulatory delays are common. Don\'t count your chickens.', time: '14h ago', likes: 11, position: 'No' },
  ],
};

/** Get comments for an event (with fallback defaults) */
export function getEventComments(eventId: string): PredictionComment[] {
  if (PREDICTION_COMMENTS[eventId]) return PREDICTION_COMMENTS[eventId];
  return [
    { id: 'def1', user: 'Analyst_1', avatar: '📈', text: 'Interesting market. Watching closely for more data before taking a position.', time: '4h ago', likes: 8 },
    { id: 'def2', user: 'MarketMaker', avatar: '🏦', text: 'Liquidity is improving. Good time to enter.', time: '1d ago', likes: 12 },
    { id: 'def3', user: 'Predictor', avatar: '🎯', text: 'My model gives this a slightly higher probability than current market pricing.', time: '2d ago', likes: 5, position: 'Yes' },
  ];
}

/* ═══════════════════════════════════════════════════════════
   PORTFOLIO POSITIONS — For portfolio tracking
   ═══════════════════════════════════════════════════════════ */

export type PredictionPosition = {
  id: string;
  eventId: string;
  outcome: 'Yes' | 'No' | string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
  status: 'open' | 'won' | 'lost';
  purchasedAt: string;
};

export const PREDICTION_POSITIONS: PredictionPosition[] = [
  {
    id: 'pos-1',
    eventId: 'pred-1',
    outcome: 'Yes',
    shares: 500,
    avgPrice: 0.28,
    currentPrice: 0.34,
    investedAmount: 140,
    currentValue: 170,
    pnl: 30,
    pnlPct: 21.43,
    status: 'open',
    purchasedAt: '2026-02-10T00:00:00Z',
  },
  {
    id: 'pos-2',
    eventId: 'pred-2',
    outcome: 'Yes',
    shares: 300,
    avgPrice: 0.65,
    currentPrice: 0.72,
    investedAmount: 195,
    currentValue: 216,
    pnl: 21,
    pnlPct: 10.77,
    status: 'open',
    purchasedAt: '2026-02-05T00:00:00Z',
  },
  {
    id: 'pos-3',
    eventId: 'pred-6',
    outcome: 'No',
    shares: 200,
    avgPrice: 0.38,
    currentPrice: 0.32,
    investedAmount: 76,
    currentValue: 64,
    pnl: -12,
    pnlPct: -15.79,
    status: 'open',
    purchasedAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 'pos-4',
    eventId: 'pred-5',
    outcome: 'Yes',
    shares: 400,
    avgPrice: 0.42,
    currentPrice: 0.55,
    investedAmount: 168,
    currentValue: 220,
    pnl: 52,
    pnlPct: 30.95,
    status: 'open',
    purchasedAt: '2026-02-22T00:00:00Z',
  },
  {
    id: 'pos-5',
    eventId: 'pred-r1',
    outcome: 'Yes',
    shares: 1000,
    avgPrice: 0.55,
    currentPrice: 1.00,
    investedAmount: 550,
    currentValue: 1000,
    pnl: 450,
    pnlPct: 81.82,
    status: 'won',
    purchasedAt: '2025-08-01T00:00:00Z',
  },
  {
    id: 'pos-6',
    eventId: 'pred-r2',
    outcome: 'Yes',
    shares: 250,
    avgPrice: 0.45,
    currentPrice: 0,
    investedAmount: 112.5,
    currentValue: 0,
    pnl: -112.5,
    pnlPct: -100,
    status: 'lost',
    purchasedAt: '2025-11-01T00:00:00Z',
  },
  {
    id: 'pos-7',
    eventId: 'pred-9',
    outcome: 'No',
    shares: 150,
    avgPrice: 0.70,
    currentPrice: 0.78,
    investedAmount: 105,
    currentValue: 117,
    pnl: 12,
    pnlPct: 11.43,
    status: 'open',
    purchasedAt: '2026-02-01T00:00:00Z',
  },
];

/* ═══════════════════════════════════════════════════════════
   ACTIVITY FEED — Buy/sell events for detail page
   ═══════════════════════════════════════════════════════════ */

export type PredictionActivity = {
  id: string;
  user: string;
  avatar: string;
  action: 'bought' | 'sold';
  outcome: string;
  shares: number;
  price: number;
  time: string;
};

export function getEventActivity(eventId: string): PredictionActivity[] {
  const seed = eventId.charCodeAt(eventId.length - 1);
  const users = [
    { user: 'whale_42', avatar: '🐋' },
    { user: 'defi_king', avatar: '👑' },
    { user: 'alpha_seeker', avatar: '🔍' },
    { user: 'macro_trader', avatar: '📊' },
    { user: 'moon_boy', avatar: '🚀' },
    { user: 'hedge_fund', avatar: '🏦' },
    { user: 'quant_dev', avatar: '🤖' },
    { user: 'risk_mgr', avatar: '🛡️' },
    { user: 'degen_99', avatar: '🦊' },
    { user: 'smart_money', avatar: '💰' },
  ];
  const times = ['1m ago', '3m ago', '7m ago', '12m ago', '18m ago', '25m ago', '32m ago', '45m ago', '1h ago', '2h ago', '3h ago', '5h ago'];
  return Array.from({ length: 12 }, (_, i) => {
    const u = users[(seed + i) % users.length];
    const isBuy = (seed + i) % 3 !== 0;
    return {
      id: `act-${eventId}-${i}`,
      user: u.user,
      avatar: u.avatar,
      action: isBuy ? 'bought' : 'sold',
      outcome: isBuy ? 'Yes' : 'No',
      shares: Math.round(50 + ((seed * (i + 1) * 37) % 950)),
      price: Math.round((30 + ((seed * (i + 1) * 13) % 60)) / 100 * 100) / 100,
      time: times[i],
    };
  });
}

/* ═══════════════════════════════════════════════════════════
   TOP HOLDERS — Leaderboard for detail page
   ═══════════════════════════════════════════════════════════ */

export type TopHolder = {
  rank: number;
  user: string;
  avatar: string;
  shares: number;
  outcome: string;
  pnl: number;
};

export function getTopHolders(eventId: string): TopHolder[] {
  const seed = eventId.charCodeAt(eventId.length - 1);
  const holders = [
    { user: 'MegaWhale', avatar: '🐋' },
    { user: 'InstitutionX', avatar: '🏛️' },
    { user: 'AlphaFund', avatar: '💼' },
    { user: 'DeFiVault', avatar: '🔐' },
    { user: 'SmartBeta', avatar: '🧠' },
    { user: 'DegenDAO', avatar: '🎰' },
    { user: 'RiskParity', avatar: '⚖️' },
    { user: 'YieldFarm', avatar: '🌾' },
  ];
  return holders.map((h, i) => ({
    rank: i + 1,
    user: h.user,
    avatar: h.avatar,
    shares: Math.round(10000 - i * 800 - ((seed * (i + 1)) % 500)),
    outcome: (seed + i) % 3 === 0 ? 'No' : 'Yes',
    pnl: Math.round((2500 - i * 400 + ((seed * i) % 300)) * ((seed + i) % 4 === 0 ? -1 : 1)),
  }));
}

/* ═══════════════════════════════════════════════════════════
   RULES — Resolution rules for detail page
   ═══════════════════════════════════════════════════════════ */

export type EventRules = {
  description: string;
  resolutionSource: string;
  endDate: string;
  rules: string[];
};

export function getEventRules(event: PredictionEvent): EventRules {
  return {
    description: `This market will resolve to "Yes" if ${event.title.replace('?', '').toLowerCase()} before the end date. Otherwise, it resolves to "No".`,
    resolutionSource: event.category === 'Live Crypto' ? 'CoinGecko & CoinMarketCap (average)' :
      event.category === 'Politics' ? 'Official government data / Reuters' :
      event.category === 'Sports' ? 'Official league results' :
      event.category === 'Finance' ? 'Federal Reserve / Bloomberg' :
      event.category === 'AI' ? 'Official company announcements' :
      event.category === 'Tech' ? 'Official product launches / press releases' :
      'Multiple verified sources',
    endDate: event.endDate,
    rules: [
      'Resolution is based on publicly verifiable information from the specified source.',
      'If the outcome is ambiguous, the market operator will consult multiple sources.',
      'Markets may be voided if the underlying event is cancelled or fundamentally altered.',
      'All times are in UTC. The market closes at 23:59:59 UTC on the end date.',
      'Shares of the winning outcome pay out $1.00. Losing shares pay $0.00.',
    ],
  };
}

/* ═══════════════════════════════════════════════════════════
   OPEN ORDERS — For portfolio page
   ═══════════════════════════════════════════════════════════ */

export type PredictionOpenOrder = {
  id: string;
  eventId: string;
  outcome: string;
  side: 'buy' | 'sell';
  orderType: 'limit';
  price: number;
  shares: number;
  filled: number;
  total: number;
  createdAt: string;
};

export const PREDICTION_OPEN_ORDERS: PredictionOpenOrder[] = [
  { id: 'oo-1', eventId: 'pred-1', outcome: 'Yes', side: 'buy', orderType: 'limit', price: 0.30, shares: 200, filled: 0, total: 60, createdAt: '2026-02-27T08:00:00Z' },
  { id: 'oo-2', eventId: 'pred-2', outcome: 'No', side: 'buy', orderType: 'limit', price: 0.25, shares: 150, filled: 50, total: 37.5, createdAt: '2026-02-26T15:30:00Z' },
  { id: 'oo-3', eventId: 'pred-7', outcome: 'Yes', side: 'sell', orderType: 'limit', price: 0.55, shares: 100, filled: 0, total: 55, createdAt: '2026-02-27T10:00:00Z' },
];

/* ═══════════════════════════════════════════════════════════
   DAILY REWARDS — For rewards page
   ═══════════════════════════════════════════════════════════ */

export type PredictionReward = {
  id: string;
  eventId: string;
  category: string;
  maxSpread: number;
  minShares: number;
  dailyReward: number;
  earningsPct: number;
  priceChange24h: number;
  isFavorite?: boolean;
};

export const PREDICTION_REWARDS: PredictionReward[] = [
  { id: 'rw-1', eventId: 'pred-1', category: 'Live Crypto', maxSpread: 0.03, minShares: 100, dailyReward: 45, earningsPct: 12.5, priceChange24h: 5.2 },
  { id: 'rw-2', eventId: 'pred-2', category: 'Live Crypto', maxSpread: 0.02, minShares: 50, dailyReward: 32, earningsPct: 8.3, priceChange24h: 3.8 },
  { id: 'rw-3', eventId: 'pred-4', category: 'Sports', maxSpread: 0.04, minShares: 75, dailyReward: 28, earningsPct: 6.1, priceChange24h: 1.5 },
  { id: 'rw-4', eventId: 'pred-6', category: 'AI', maxSpread: 0.02, minShares: 80, dailyReward: 55, earningsPct: 15.2, priceChange24h: -1.2 },
  { id: 'rw-5', eventId: 'pred-3', category: 'Politics', maxSpread: 0.05, minShares: 60, dailyReward: 22, earningsPct: 5.8, priceChange24h: -2.1 },
  { id: 'rw-6', eventId: 'pred-5', category: 'Tech', maxSpread: 0.03, minShares: 40, dailyReward: 38, earningsPct: 10.4, priceChange24h: 8.3 },
  { id: 'rw-7', eventId: 'pred-7', category: 'Finance', maxSpread: 0.04, minShares: 90, dailyReward: 41, earningsPct: 9.7, priceChange24h: 2.4 },
  { id: 'rw-8', eventId: 'pred-12', category: 'Live Crypto', maxSpread: 0.03, minShares: 120, dailyReward: 62, earningsPct: 18.1, priceChange24h: 3.2 },
  { id: 'rw-9', eventId: 'pred-8', category: 'Culture', maxSpread: 0.06, minShares: 30, dailyReward: 15, earningsPct: 4.2, priceChange24h: 0.8 },
  { id: 'rw-10', eventId: 'pred-10', category: 'Finance', maxSpread: 0.04, minShares: 50, dailyReward: 35, earningsPct: 11.0, priceChange24h: 6.1 },
];

/* ═══════════════════════════════════════════════════════════
   LEADERBOARD — For leaderboard page
   ═══════════════════════════════════════════════════════════ */

export type LeaderboardTrader = {
  rank: number;
  user: string;
  avatar: string;
  pnl: number;
  pnlPct: number;
  volume: number;
  trades: number;
  winRate: number;
  biggestWin?: number;
  biggestWinMarket?: string;
};

export const LEADERBOARD_DATA: Record<string, LeaderboardTrader[]> = {
  today: [
    { rank: 1, user: 'CryptoKing', avatar: '👑', pnl: 4520, pnlPct: 42.3, volume: 28000, trades: 18, winRate: 78, biggestWin: 2100, biggestWinMarket: 'Bitcoin reaches $150K' },
    { rank: 2, user: 'WhaleAlpha', avatar: '🐋', pnl: 3180, pnlPct: 31.5, volume: 45000, trades: 32, winRate: 72, biggestWin: 1800, biggestWinMarket: 'ETH ETF approved' },
    { rank: 3, user: 'DeFiSage', avatar: '🧙', pnl: 2740, pnlPct: 28.1, volume: 19000, trades: 14, winRate: 86, biggestWin: 1500, biggestWinMarket: 'GPT-5 released' },
    { rank: 4, user: 'AlgoTrader', avatar: '🤖', pnl: 2100, pnlPct: 22.8, volume: 35000, trades: 45, winRate: 64, biggestWin: 900, biggestWinMarket: 'Fed cuts rates' },
    { rank: 5, user: 'MoonShot', avatar: '🚀', pnl: 1850, pnlPct: 19.4, volume: 22000, trades: 21, winRate: 71 },
    { rank: 6, user: 'RiskMaster', avatar: '🛡️', pnl: 1420, pnlPct: 15.2, volume: 18000, trades: 12, winRate: 83 },
    { rank: 7, user: 'QuantDev', avatar: '📊', pnl: 1180, pnlPct: 12.6, volume: 31000, trades: 28, winRate: 68 },
    { rank: 8, user: 'SmartBeta', avatar: '🧠', pnl: 980, pnlPct: 10.1, volume: 15000, trades: 9, winRate: 78 },
    { rank: 9, user: 'YieldFarm', avatar: '🌾', pnl: 750, pnlPct: 8.3, volume: 12000, trades: 16, winRate: 63 },
    { rank: 10, user: 'DegenDAO', avatar: '🎰', pnl: 620, pnlPct: 6.8, volume: 8500, trades: 22, winRate: 55 },
  ],
  weekly: [
    { rank: 1, user: 'WhaleAlpha', avatar: '🐋', pnl: 18200, pnlPct: 85.4, volume: 210000, trades: 142, winRate: 74, biggestWin: 5200, biggestWinMarket: 'Bitcoin reaches $150K' },
    { rank: 2, user: 'CryptoKing', avatar: '👑', pnl: 15600, pnlPct: 72.1, volume: 185000, trades: 98, winRate: 79, biggestWin: 4800, biggestWinMarket: 'Crypto $5T market cap' },
    { rank: 3, user: 'AlgoTrader', avatar: '🤖', pnl: 12800, pnlPct: 58.3, volume: 320000, trades: 280, winRate: 66, biggestWin: 3500, biggestWinMarket: 'ETH ETF approved' },
    { rank: 4, user: 'DeFiSage', avatar: '🧙', pnl: 10400, pnlPct: 49.2, volume: 125000, trades: 85, winRate: 82, biggestWin: 4200, biggestWinMarket: 'Apple AR glasses' },
    { rank: 5, user: 'RiskMaster', avatar: '🛡️', pnl: 8900, pnlPct: 41.5, volume: 95000, trades: 62, winRate: 85 },
    { rank: 6, user: 'QuantDev', avatar: '📊', pnl: 7200, pnlPct: 33.8, volume: 180000, trades: 156, winRate: 70 },
    { rank: 7, user: 'MoonShot', avatar: '🚀', pnl: 5800, pnlPct: 26.4, volume: 72000, trades: 48, winRate: 73 },
    { rank: 8, user: 'SmartBeta', avatar: '🧠', pnl: 4500, pnlPct: 21.2, volume: 58000, trades: 34, winRate: 76 },
    { rank: 9, user: 'YieldFarm', avatar: '🌾', pnl: 3200, pnlPct: 15.6, volume: 42000, trades: 28, winRate: 68 },
    { rank: 10, user: 'DegenDAO', avatar: '🎰', pnl: 2100, pnlPct: 10.3, volume: 65000, trades: 88, winRate: 52 },
  ],
  monthly: [
    { rank: 1, user: 'WhaleAlpha', avatar: '🐋', pnl: 68500, pnlPct: 142.3, volume: 850000, trades: 520, winRate: 76, biggestWin: 12000, biggestWinMarket: 'Bitcoin above $100K' },
    { rank: 2, user: 'AlgoTrader', avatar: '🤖', pnl: 52400, pnlPct: 108.5, volume: 1200000, trades: 980, winRate: 68, biggestWin: 8500, biggestWinMarket: 'Bitcoin reaches $150K' },
    { rank: 3, user: 'CryptoKing', avatar: '👑', pnl: 44200, pnlPct: 95.1, volume: 620000, trades: 380, winRate: 81, biggestWin: 9200, biggestWinMarket: 'Crypto $5T market cap' },
    { rank: 4, user: 'DeFiSage', avatar: '🧙', pnl: 38100, pnlPct: 82.4, volume: 480000, trades: 290, winRate: 84, biggestWin: 7800, biggestWinMarket: 'ETH ETF approved' },
    { rank: 5, user: 'RiskMaster', avatar: '🛡️', pnl: 31200, pnlPct: 68.5, volume: 350000, trades: 210, winRate: 87 },
    { rank: 6, user: 'QuantDev', avatar: '📊', pnl: 25800, pnlPct: 55.2, volume: 720000, trades: 580, winRate: 71 },
    { rank: 7, user: 'SmartBeta', avatar: '🧠', pnl: 19500, pnlPct: 42.8, volume: 220000, trades: 145, winRate: 78 },
    { rank: 8, user: 'MoonShot', avatar: '🚀', pnl: 14800, pnlPct: 33.6, volume: 280000, trades: 190, winRate: 72 },
    { rank: 9, user: 'YieldFarm', avatar: '🌾', pnl: 11200, pnlPct: 25.1, volume: 165000, trades: 120, winRate: 70 },
    { rank: 10, user: 'DegenDAO', avatar: '🎰', pnl: 8400, pnlPct: 18.9, volume: 310000, trades: 420, winRate: 54 },
  ],
  all: [
    { rank: 1, user: 'WhaleAlpha', avatar: '🐋', pnl: 245000, pnlPct: 412.5, volume: 3200000, trades: 2100, winRate: 75, biggestWin: 45000, biggestWinMarket: 'Bitcoin above $100K' },
    { rank: 2, user: 'AlgoTrader', avatar: '🤖', pnl: 198000, pnlPct: 325.8, volume: 5800000, trades: 4500, winRate: 67, biggestWin: 32000, biggestWinMarket: 'ETH ETF approved' },
    { rank: 3, user: 'CryptoKing', avatar: '👑', pnl: 172000, pnlPct: 285.4, volume: 2100000, trades: 1450, winRate: 80, biggestWin: 28000, biggestWinMarket: 'Crypto $5T market cap' },
    { rank: 4, user: 'DeFiSage', avatar: '🧙', pnl: 145000, pnlPct: 242.1, volume: 1800000, trades: 1100, winRate: 83, biggestWin: 25000, biggestWinMarket: 'Apple AR glasses' },
    { rank: 5, user: 'RiskMaster', avatar: '🛡️', pnl: 118000, pnlPct: 198.3, volume: 1350000, trades: 850, winRate: 86 },
    { rank: 6, user: 'QuantDev', avatar: '📊', pnl: 95000, pnlPct: 162.5, volume: 2800000, trades: 2200, winRate: 70 },
    { rank: 7, user: 'SmartBeta', avatar: '🧠', pnl: 72000, pnlPct: 128.4, volume: 890000, trades: 580, winRate: 77 },
    { rank: 8, user: 'MoonShot', avatar: '🚀', pnl: 58000, pnlPct: 105.2, volume: 1100000, trades: 720, winRate: 71 },
    { rank: 9, user: 'YieldFarm', avatar: '🌾', pnl: 42000, pnlPct: 78.6, volume: 650000, trades: 480, winRate: 69 },
    { rank: 10, user: 'DegenDAO', avatar: '🎰', pnl: 31000, pnlPct: 55.8, volume: 1500000, trades: 1800, winRate: 53 },
  ],
};

/* ═══════════════════════════════════════════════════════════
   GLOBAL ACTIVITY — For global activity feed page
   ═══════════════════════════════════════════════════════════ */

export type GlobalActivity = {
  id: string;
  user: string;
  avatar: string;
  action: 'bought' | 'sold';
  outcome: string;
  eventId: string;
  price: number;
  amount: number;
  shares: number;
  timestamp: string;
};

export function generateGlobalActivity(): GlobalActivity[] {
  const users = [
    { user: 'whale_42', avatar: '🐋' }, { user: 'defi_king', avatar: '👑' },
    { user: 'alpha_seeker', avatar: '🔍' }, { user: 'macro_trader', avatar: '📊' },
    { user: 'moon_boy', avatar: '🚀' }, { user: 'hedge_fund', avatar: '🏦' },
    { user: 'quant_dev', avatar: '🤖' }, { user: 'risk_mgr', avatar: '🛡️' },
    { user: 'degen_99', avatar: '🦊' }, { user: 'smart_money', avatar: '💰' },
    { user: 'arb_bot', avatar: '⚡' }, { user: 'yield_max', avatar: '🌾' },
    { user: 'bull_run', avatar: '🐂' }, { user: 'bear_trap', avatar: '🐻' },
    { user: 'long_term', avatar: '💎' },
  ];
  const activeEvents = PREDICTION_EVENTS.filter(e => e.status === 'active');
  const times = [
    'Just now', '12s ago', '28s ago', '45s ago', '1m ago', '1m ago', '2m ago', '3m ago',
    '4m ago', '5m ago', '7m ago', '8m ago', '10m ago', '12m ago', '15m ago',
    '18m ago', '22m ago', '25m ago', '30m ago', '35m ago', '42m ago', '48m ago',
    '55m ago', '1h ago', '1h ago', '2h ago', '2h ago', '3h ago', '4h ago', '5h ago',
  ];

  return Array.from({ length: 30 }, (_, i) => {
    const u = users[i % users.length];
    const ev = activeEvents[i % activeEvents.length];
    const isBuy = i % 3 !== 0;
    const price = Math.round((20 + (i * 7 + 13) % 70) / 100 * 100) / 100;
    const shares = Math.round(50 + ((i * 37 + 17) % 1500));
    return {
      id: `ga-${i}`,
      user: u.user,
      avatar: u.avatar,
      action: isBuy ? 'bought' : 'sold',
      outcome: isBuy ? 'Yes' : 'No',
      eventId: ev.id,
      price,
      amount: Math.round(price * shares * 100) / 100,
      shares,
      timestamp: times[i] ?? `${Math.floor(i / 2)}h ago`,
    };
  });
}

/* ═══════════════════════════════════════════════════════════
   07C — Order Receipts (Prediction Markets Hardening)
   ═══════════════════════════════════════════════════════════ */

export type PredictionOrderStatus = 'submitted' | 'accepted' | 'partially_filled' | 'filled' | 'canceled' | 'rejected';

export interface PredictionOrderReceipt {
  id: string;
  eventId: string;
  eventTitle: string;
  outcome: string;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  shares: number;
  filledShares: number;
  price: number;
  avgPrice: number;
  total: number;
  fee: number;
  status: PredictionOrderStatus;
  createdAt: string;
  updatedAt: string;
  timeline: { label: string; date: string; done: boolean }[];
}

export const PREDICTION_ORDER_STATUS_CONFIG: Record<PredictionOrderStatus, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Đã gửi', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  accepted: { label: 'Đã tiếp nhận', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  partially_filled: { label: 'Khớp một phần', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  filled: { label: 'Đã khớp', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  canceled: { label: 'Đã hủy', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  rejected: { label: 'Từ chối', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

export const PREDICTION_ORDER_RECEIPTS: PredictionOrderReceipt[] = [
  { id: 'po-1', eventId: 'pred-1', eventTitle: 'BTC > $100K by March 2026?', outcome: 'Yes', side: 'buy', orderType: 'limit', shares: 200, filledShares: 0, price: 0.30, avgPrice: 0, total: 60, fee: 1.20, status: 'submitted', createdAt: '27/02 08:00', updatedAt: '27/02 08:00', timeline: [{ label: 'Lệnh đã gửi', date: '27/02 08:00', done: true }, { label: 'Tiếp nhận', date: '', done: false }, { label: 'Khớp lệnh', date: '', done: false }] },
  { id: 'po-2', eventId: 'pred-2', eventTitle: 'ETH Flips BTC Market Cap in 2026?', outcome: 'No', side: 'buy', orderType: 'limit', shares: 150, filledShares: 50, price: 0.25, avgPrice: 0.24, total: 37.5, fee: 0.75, status: 'partially_filled', createdAt: '26/02 15:30', updatedAt: '26/02 18:45', timeline: [{ label: 'Lệnh đã gửi', date: '26/02 15:30', done: true }, { label: 'Tiếp nhận', date: '26/02 15:30', done: true }, { label: 'Khớp một phần (50/150)', date: '26/02 18:45', done: true }, { label: 'Chờ khớp thêm', date: '', done: false }] },
  { id: 'po-3', eventId: 'pred-7', eventTitle: 'Fed Rate Cut in March FOMC?', outcome: 'Yes', side: 'sell', orderType: 'limit', shares: 100, filledShares: 0, price: 0.55, avgPrice: 0, total: 55, fee: 1.10, status: 'submitted', createdAt: '27/02 10:00', updatedAt: '27/02 10:00', timeline: [{ label: 'Lệnh đã gửi', date: '27/02 10:00', done: true }, { label: 'Tiếp nhận', date: '', done: false }, { label: 'Khớp lệnh', date: '', done: false }] },
  { id: 'po-4', eventId: 'pred-1', eventTitle: 'BTC > $100K by March 2026?', outcome: 'Yes', side: 'buy', orderType: 'market', shares: 300, filledShares: 300, price: 0.42, avgPrice: 0.42, total: 126, fee: 2.52, status: 'filled', createdAt: '25/02 14:00', updatedAt: '25/02 14:01', timeline: [{ label: 'Lệnh đã gửi', date: '25/02 14:00', done: true }, { label: 'Tiếp nhận', date: '25/02 14:00', done: true }, { label: 'Đã khớp toàn bộ', date: '25/02 14:01', done: true }] },
  { id: 'po-5', eventId: 'pred-5', eventTitle: 'Apple Vision Pro 2 Released Q1 2026?', outcome: 'No', side: 'buy', orderType: 'market', shares: 100, filledShares: 100, price: 0.65, avgPrice: 0.64, total: 65, fee: 1.30, status: 'filled', createdAt: '24/02 09:30', updatedAt: '24/02 09:31', timeline: [{ label: 'Lệnh đã gửi', date: '24/02 09:30', done: true }, { label: 'Tiếp nhận', date: '24/02 09:30', done: true }, { label: 'Đã khớp toàn bộ', date: '24/02 09:31', done: true }] },
  { id: 'po-6', eventId: 'pred-3', eventTitle: 'Democrats Win Senate Majority in 2026?', outcome: 'Yes', side: 'buy', orderType: 'limit', shares: 80, filledShares: 0, price: 0.48, avgPrice: 0, total: 38.4, fee: 0.77, status: 'canceled', createdAt: '23/02 12:00', updatedAt: '24/02 08:00', timeline: [{ label: 'Lệnh đã gửi', date: '23/02 12:00', done: true }, { label: 'Tiếp nhận', date: '23/02 12:01', done: true }, { label: 'Đã hủy bởi bạn', date: '24/02 08:00', done: true }] },
];

export function getPredictionOrderById(id: string): PredictionOrderReceipt | undefined {
  return PREDICTION_ORDER_RECEIPTS.find(o => o.id === id);
}