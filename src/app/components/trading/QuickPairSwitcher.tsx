/**
 * ══════════════════════════════════════════════════════════════════
 *  QUICK PAIR SWITCHER — Sprint 2B: Inline Pair Search Overlay
 * ══════════════════════════════════════════════════════════════════
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Star, TrendingUp, TrendingDown, X } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { CRYPTO_PAIRS, type CryptoPair } from '../../data/mockData';
import { fmtPrice, fmtPct, fmtCompact } from '../../data/formatNumber';
import { BottomSheetV2 } from '../ui/BottomSheetV2';

interface QuickPairSwitcherProps {
  open: boolean;
  onClose: () => void;
  currentPairId: string;
  onSelect: (pairId: string) => void;
}

const CATEGORIES = ['Tất cả', 'Yêu thích', 'Layer 1', 'DeFi', 'Meme', 'AI'];

export function QuickPairSwitcher({ open, onClose, currentPairId, onSelect }: QuickPairSwitcherProps) {
  const c = useThemeColors();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const filtered = useMemo(() => {
    let list = [...CRYPTO_PAIRS];

    if (category === 'Yêu thích') {
      list = list.filter(p => p.isFavorite);
    } else if (category !== 'Tất cả') {
      list = list.filter(p => p.category === category);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        p.symbol.toLowerCase().includes(q) ||
        p.baseAsset.toLowerCase().includes(q)
      );
    }

    return list;
  }, [query, category]);

  return (
    <BottomSheetV2
      open={open}
      onClose={onClose}
      title="Chọn cặp giao dịch"
      maxHeight="80vh"
    >
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl px-3"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, height: 44 }}>
          <Search size={16} color={c.text3} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm BTC, ETH, SOL..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: c.text1, fontSize: 14, flex: 1,
            }}
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X size={14} color={c.text3} />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0"
              style={{
                background: category === cat ? c.chipActiveBg : c.surface2,
                color: category === cat ? c.chipActiveText : c.text2,
                border: `1px solid ${category === cat ? c.chipActiveBorder : c.borderSolid}`,
                fontSize: 12, fontWeight: category === cat ? 700 : 500,
              }}
            >
              {cat === 'Yêu thích' && <Star size={10} className="inline mr-1" />}
              {cat}
            </button>
          ))}
        </div>

        {/* Pair list */}
        <div className="flex flex-col" style={{ maxHeight: '45vh', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p style={{ color: c.text3, fontSize: 13 }}>Không tìm thấy cặp giao dịch</p>
            </div>
          ) : (
            filtered.map(pair => {
              const isActive = pair.id === currentPairId;
              const isPos = pair.change24h >= 0;
              return (
                <button
                  key={pair.id}
                  onClick={() => { onSelect(pair.id); onClose(); }}
                  className="flex items-center justify-between px-3 py-3 rounded-xl transition-all"
                  style={{
                    background: isActive ? `${c.primary}0D` : 'transparent',
                    borderBottom: `1px solid ${c.divider}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: pair.logoColor + '22' }}>
                      <span style={{ color: pair.logoColor, fontSize: 10, fontWeight: 700 }}>
                        {pair.baseAsset.slice(0, 3)}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{pair.symbol}</span>
                        {pair.isFavorite && <Star size={10} color="#F59E0B" fill="#F59E0B" />}
                      </div>
                      <span style={{ color: c.text3, fontSize: 11 }}>
                        Vol {fmtCompact(pair.volume24h, { prefix: '$' })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p style={{
                      color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace',
                    }}>
                      {fmtPrice(pair.price)}
                    </p>
                    <p style={{
                      color: isPos ? '#10B981' : '#EF4444',
                      fontSize: 11, fontFamily: 'monospace',
                    }}>
                      {fmtPct(pair.change24h)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </BottomSheetV2>
  );
}
