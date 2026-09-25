import { useContext } from 'react';
import { UIContext } from '../contexts/ui-context';

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside UIProvider');
  return ctx;
}
