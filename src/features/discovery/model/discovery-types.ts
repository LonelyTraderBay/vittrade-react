export const discoveryTopicIds = [
  'crypto',
  'macro',
  'politics',
  'sports',
  'tech',
  'ai',
  'culture',
  'community',
] as const;

export type DiscoveryTopicId = (typeof discoveryTopicIds)[number];

export interface DiscoveryTopic {
  id: DiscoveryTopicId;
  label: string;
  color: string;
  description: string;
}

export interface DiscoveryPrediction {
  id: string;
  title: string;
  category: string;
  tags: string[];
  topOutcome: { label: string; chance: number; color: string };
  volume24h: number;
  participants: number;
  status: 'active' | 'resolved';
  isTrending?: boolean;
}

export interface DiscoveryArenaMode {
  id: string;
  title: string;
  description: string;
  tags: string[];
  cloneCount: number;
  activeChallenges: number;
  fairPlay: boolean;
  creator: { id: string; name: string; avatar: string };
}

export interface DiscoveryArenaRoom {
  id: string;
  title: string;
  modeId: string;
  format: string;
  slotsTotal: number;
  slotsFilled: number;
  entryPoints: number;
  status: 'waiting' | 'in_progress' | 'completed';
  creator: { name: string; avatar: string };
}

export interface DiscoveryCreator {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  trustScore: number;
  fairPlayBadge: boolean;
}

export interface DiscoveryTradingPair {
  id: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  volume24h: number;
  logoColor: string;
}

export interface DiscoverySearchResponse {
  query: string;
  predictions: DiscoveryPrediction[];
  arenaModes: DiscoveryArenaMode[];
  arenaRooms: DiscoveryArenaRoom[];
  creators: DiscoveryCreator[];
  tradingPairs: DiscoveryTradingPair[];
}

export interface DiscoveryTopicResponse {
  topic: DiscoveryTopic;
  stats: { events: number; rooms: number; modes: number; creators: number };
  predictions: DiscoveryPrediction[];
  arenaRooms: DiscoveryArenaRoom[];
  arenaModes: DiscoveryArenaMode[];
  creators: DiscoveryCreator[];
}
