import { useContext } from 'react';
import { DCAContext } from './dca-context';

export function useDCA() {
  const context = useContext(DCAContext);
  if (!context) throw new Error('useDCA must be used within DCAProvider');
  return context;
}
