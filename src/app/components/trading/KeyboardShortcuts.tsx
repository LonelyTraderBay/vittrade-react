/**
 * ══════════════════════════════════════════════════════════════════
 *  KEYBOARD SHORTCUTS — Phase 3: Advanced Trading Tools
 * ══════════════════════════════════════════════════════════════════
 *  Pro Trader Speed Workflow
 *  - Global shortcuts for trading actions
 *  - Customizable key bindings
 *  - Visual shortcut hints
 *  - Training mode (learn shortcuts)
 *  - Shortcuts reference sheet
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Keyboard, Command, HelpCircle, Edit3, Check, X } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export interface ShortcutAction {
  id: string;
  category: 'Trading' | 'Navigation' | 'Orders' | 'View';
  label: string;
  description: string;
  defaultKey: string;
  customKey?: string;
  action: () => void;
}

interface KeyboardShortcutsProps {
  shortcuts: ShortcutAction[];
  enabled?: boolean;
  showHints?: boolean;
  onShortcutTriggered?: (actionId: string) => void;
}

/* ═══════════════════════════════════════════════════════════════
   DEFAULT SHORTCUTS
   ═══════════════════════════════════════════════════════════════ */

export const DEFAULT_SHORTCUTS: Omit<ShortcutAction, 'action'>[] = [
  // Trading
  { id: 'quick_buy', category: 'Trading', label: 'Quick Buy', description: 'Market buy at current price', defaultKey: 'F1' },
  { id: 'quick_sell', category: 'Trading', label: 'Quick Sell', description: 'Market sell at current price', defaultKey: 'F2' },
  { id: 'place_limit_buy', category: 'Trading', label: 'Limit Buy', description: 'Open limit buy form', defaultKey: 'B' },
  { id: 'place_limit_sell', category: 'Trading', label: 'Limit Sell', description: 'Open limit sell form', defaultKey: 'S' },
  { id: 'toggle_oco', category: 'Trading', label: 'OCO Order', description: 'Open OCO order form', defaultKey: 'O' },
  
  // Orders
  { id: 'cancel_all', category: 'Orders', label: 'Cancel All', description: 'Cancel all open orders', defaultKey: 'Escape' },
  { id: 'cancel_buys', category: 'Orders', label: 'Cancel Buys', description: 'Cancel all buy orders', defaultKey: 'Shift+B' },
  { id: 'cancel_sells', category: 'Orders', label: 'Cancel Sells', description: 'Cancel all sell orders', defaultKey: 'Shift+S' },
  { id: 'view_orders', category: 'Orders', label: 'View Orders', description: 'Show open orders list', defaultKey: 'L' },
  
  // Navigation
  { id: 'focus_price', category: 'Navigation', label: 'Focus Price', description: 'Focus on price input', defaultKey: 'P' },
  { id: 'focus_amount', category: 'Navigation', label: 'Focus Amount', description: 'Focus on amount input', defaultKey: 'A' },
  { id: 'toggle_chart', category: 'Navigation', label: 'Toggle Chart', description: 'Show/hide trading chart', defaultKey: 'C' },
  { id: 'toggle_orderbook', category: 'Navigation', label: 'Toggle Orderbook', description: 'Show/hide order book', defaultKey: 'D' },
  
  // View
  { id: 'increase_amount', category: 'View', label: 'Increase Amount', description: 'Increase order amount by 10%', defaultKey: 'ArrowUp' },
  { id: 'decrease_amount', category: 'View', label: 'Decrease Amount', description: 'Decrease order amount by 10%', defaultKey: 'ArrowDown' },
  { id: 'max_amount', category: 'View', label: 'Max Amount', description: 'Set amount to maximum available', defaultKey: 'M' },
  { id: 'help', category: 'View', label: 'Help', description: 'Show shortcuts reference', defaultKey: '?' },
];

/* ═══════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS HOOK
   ═══════════════════════════════════════════════════════════════ */

export function useKeyboardShortcuts(
  shortcuts: ShortcutAction[],
  enabled: boolean = true,
  onTriggered?: (actionId: string) => void
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Build key combo string
      let keyCombo = '';
      if (e.shiftKey) keyCombo += 'Shift+';
      if (e.ctrlKey) keyCombo += 'Ctrl+';
      if (e.altKey) keyCombo += 'Alt+';
      keyCombo += e.key;

      // Find matching shortcut
      const shortcut = shortcuts.find(s => 
        (s.customKey || s.defaultKey).toLowerCase() === keyCombo.toLowerCase()
      );

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
        onTriggered?.(shortcut.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled, onTriggered]);
}

/* ═══════════════════════════════════════════════════════════════
   SHORTCUTS REFERENCE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function ShortcutsReference({
  shortcuts,
  onClose,
}: {
  shortcuts: ShortcutAction[];
  onClose?: () => void;
}) {
  const c = useThemeColors();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customKeys, setCustomKeys] = useState<Record<string, string>>({});

  const categories = ['Trading', 'Orders', 'Navigation', 'View'] as const;

  const handleSaveCustomKey = (id: string, newKey: string) => {
    setCustomKeys(prev => ({ ...prev, [id]: newKey }));
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Keyboard size={20} color="#3B82F6" />
          <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
            Keyboard Shortcuts
          </span>
        </div>
        {onClose && (
          <button onClick={onClose}>
            <X size={20} color={c.text3} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: `1px solid rgba(59,130,246,0.2)` }}>
        <p style={{ fontSize: FONT_SCALE.xs, color: c.text2, lineHeight: 1.6 }}>
          <strong style={{ color: '#3B82F6' }}>Pro tip:</strong> Master these shortcuts to trade 3x faster.
          Click any shortcut to customize the key binding.
        </p>
      </div>

      {/* Shortcuts by Category */}
      {categories.map(category => {
        const categoryShortcuts = shortcuts.filter(s => s.category === category);
        if (categoryShortcuts.length === 0) return null;

        return (
          <div key={category}>
            <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 8 }}>
              {category}
            </p>
            <TrCard className="p-0 overflow-hidden">
              {categoryShortcuts.map((shortcut, i) => {
                const isEditing = editingId === shortcut.id;
                const displayKey = customKeys[shortcut.id] || shortcut.customKey || shortcut.defaultKey;

                return (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between px-3 py-3"
                    style={{
                      borderBottom: i < categoryShortcuts.length - 1 ? `1px solid ${c.divider}` : 'none',
                    }}
                  >
                    <div className="flex-1">
                      <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text1, marginBottom: 2 }}>
                        {shortcut.label}
                      </p>
                      <p style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                        {shortcut.description}
                      </p>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Press key..."
                          onKeyDown={(e) => {
                            e.preventDefault();
                            let key = '';
                            if (e.shiftKey) key += 'Shift+';
                            if (e.ctrlKey) key += 'Ctrl+';
                            if (e.altKey) key += 'Alt+';
                            key += e.key;
                            handleSaveCustomKey(shortcut.id, key);
                          }}
                          className="px-2 py-1 rounded"
                          style={{
                            fontSize: FONT_SCALE.xs,
                            fontWeight: FONT_WEIGHT.bold,
                            color: c.text1,
                            background: c.surface2,
                            border: `1px solid ${c.borderSolid}`,
                            width: 80,
                          }}
                        />
                        <button onClick={() => setEditingId(null)}>
                          <X size={16} color={c.text3} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingId(shortcut.id)}
                        className="px-3 py-1.5 rounded-lg flex items-center gap-1"
                        style={{
                          fontSize: FONT_SCALE.xs,
                          fontWeight: FONT_WEIGHT.bold,
                          color: '#3B82F6',
                          background: 'rgba(59,130,246,0.12)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {displayKey}
                        <Edit3 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </TrCard>
          </div>
        );
      })}

      {/* Training Mode Info */}
      <TrCard className="p-4">
        <div className="flex items-start gap-3">
          <HelpCircle size={18} color="#F59E0B" className="shrink-0 mt-1" />
          <div className="flex-1">
            <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 4 }}>
              Learning Tips
            </p>
            <ul style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.6, paddingLeft: 16 }}>
              <li>Start with F1/F2 for quick buy/sell</li>
              <li>ESC to cancel all orders in emergency</li>
              <li>B/S for limit orders when you need precision</li>
              <li>Practice 10 minutes daily to build muscle memory</li>
            </ul>
          </div>
        </div>
      </TrCard>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full px-4 py-3 rounded-xl min-h-12"
          style={{
            fontSize: FONT_SCALE.sm,
            fontWeight: FONT_WEIGHT.bold,
            color: '#fff',
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
          }}
        >
          Got It
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHORTCUT HINT COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function ShortcutHint({
  shortcut,
  position = 'top',
}: {
  shortcut: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const c = useThemeColors();

  return (
    <div
      className="px-1.5 py-0.5 rounded"
      style={{
        fontSize: FONT_SCALE.micro,
        fontWeight: FONT_WEIGHT.bold,
        color: c.text3,
        background: 'rgba(100,116,139,0.12)',
        fontFamily: 'monospace',
        border: `1px solid rgba(100,116,139,0.2)`,
      }}
    >
      {shortcut}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHORTCUT TOAST NOTIFICATION
   ═══════════════════════════════════════════════════════════════ */

export function ShortcutToast({
  action,
  onDismiss,
}: {
  action: string;
  onDismiss: () => void;
}) {
  const c = useThemeColors();

  useEffect(() => {
    const timer = setTimeout(onDismiss, 2000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg"
      style={{
        background: c.surface,
        border: `1px solid ${c.borderSolid}`,
        animation: 'slideInRight 0.2s ease-out',
      }}
    >
      <Check size={16} color="#10B981" />
      <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
        {action}
      </span>
    </div>
  );
}
