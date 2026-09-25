export const SHARED_TOPICS = [
  { id: 'crypto', label: 'Crypto', color: '#F59E0B' },
  { id: 'macro', label: 'Macro', color: '#3B82F6' },
  { id: 'politics', label: 'Politics', color: '#EF4444' },
  { id: 'sports', label: 'Sports', color: '#10B981' },
  { id: 'tech', label: 'Tech', color: '#6366F1' },
  { id: 'ai', label: 'AI', color: '#8B5CF6' },
  { id: 'culture', label: 'Culture', color: '#EC4899' },
  { id: 'community', label: 'Community', color: '#14B8A6' },
] as const;

export type SharedTopicId = (typeof SHARED_TOPICS)[number]['id'];

export function mapCategoryToTopic(category: string): SharedTopicId | null {
  const map: Record<string, SharedTopicId> = {
    'Live Crypto': 'crypto',
    Crypto: 'crypto',
    Finance: 'macro',
    Macro: 'macro',
    Politics: 'politics',
    Sports: 'sports',
    Tech: 'tech',
    AI: 'ai',
    Culture: 'culture',
    Community: 'community',
  };
  return map[category] ?? null;
}

export function mapArenaTagToTopic(tag: string): SharedTopicId | null {
  const lower = tag.toLowerCase();
  for (const topic of SHARED_TOPICS) {
    if (lower === topic.id || lower.includes(topic.id)) return topic.id;
  }
  return null;
}
