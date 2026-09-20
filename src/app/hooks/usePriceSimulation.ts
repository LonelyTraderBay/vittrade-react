import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePriceSimulationOptions {
  /** Initial price */
  initialPrice: number;
  /** Update interval in ms (default 2000) */
  interval?: number;
  /** Max percentage change per tick (default 0.001 = 0.1%) */
  volatility?: number;
  /** Bias toward positive moves (default 0.495, slightly negative) */
  bias?: number;
  /** Enable/disable simulation (default true) */
  enabled?: boolean;
}

interface PriceSimulationResult {
  price: number;
  prevPrice: number;
  /** 'up' | 'down' | null — flashes for 600ms on change */
  flash: 'up' | 'down' | null;
  /** Percentage change from initial price */
  changePercent: number;
  /** Reset to initial price */
  reset: () => void;
}

/**
 * usePriceSimulation — Simulates live price updates for demo/prototype
 *
 * Usage:
 * ```tsx
 * const { price, flash } = usePriceSimulation({ initialPrice: 67543.21 });
 * ```
 */
export function usePriceSimulation({
  initialPrice,
  interval = 2000,
  volatility = 0.001,
  bias = 0.495,
  enabled = true,
}: UsePriceSimulationOptions): PriceSimulationResult {
  const [price, setPrice] = useState(initialPrice);
  const [prevPrice, setPrevPrice] = useState(initialPrice);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const flashTimeout = useRef<ReturnType<typeof setTimeout>>();
  const initialRef = useRef(initialPrice);

  const reset = useCallback(() => {
    setPrice(initialRef.current);
    setPrevPrice(initialRef.current);
    setFlash(null);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => {
      setPrice(prev => {
        const delta = (Math.random() - bias) * prev * volatility;
        const next = parseFloat((prev + delta).toFixed(2));

        setPrevPrice(prev);
        setFlash(next > prev ? 'up' : 'down');

        if (flashTimeout.current) clearTimeout(flashTimeout.current);
        flashTimeout.current = setTimeout(() => setFlash(null), 600);

        return next;
      });
    }, interval);

    return () => {
      clearInterval(id);
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
    };
  }, [enabled, interval, volatility, bias]);

  const changePercent = ((price - initialRef.current) / initialRef.current) * 100;

  return { price, prevPrice, flash, changePercent, reset };
}
