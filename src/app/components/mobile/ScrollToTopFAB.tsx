import React from 'react';
import { ChevronUp } from 'lucide-react';

interface ScrollToTopFABProps {
  visible: boolean;
  onClick: () => void;
}

/**
 * Enterprise Fintech — Scroll-to-Top FAB
 * Hiện khi scroll > 300px, ẩn khi ở top
 * Positioned trên BottomNav (bottom: 96px)
 */
export function ScrollToTopFAB({ visible, onClick }: ScrollToTopFABProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Cuộn lên đầu trang"
      className="fixed z-30 flex items-center justify-center rounded-full shadow-lg"
      style={{
        width: 40,
        height: 40,
        right: 16,
        bottom: 96,
        background: 'rgba(59,130,246,0.9)',
        border: '1px solid rgba(59,130,246,0.4)',
        boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
        backdropFilter: 'blur(12px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.6) translateY(20px)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <ChevronUp size={20} color="#fff" strokeWidth={2.5} />
    </button>
  );
}
