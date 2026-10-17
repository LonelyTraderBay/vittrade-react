export const MARKET_CATEGORIES = ['Tất cả', 'Layer 1', 'Layer 2', 'DeFi', 'Meme', 'AI'] as const;

export const MARKET_SORT_OPTIONS = [
  { id: 'default', label: 'Mặc định' },
  { id: 'price_desc', label: 'Giá cao → thấp' },
  { id: 'price_asc', label: 'Giá thấp → cao' },
  { id: 'change_desc', label: 'Tăng nhiều nhất' },
  { id: 'change_asc', label: 'Giảm nhiều nhất' },
  { id: 'volume_desc', label: 'Volume lớn nhất' },
] as const;
