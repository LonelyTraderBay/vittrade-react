import React from 'react';
import { Header as SharedHeader } from '@/shared/ui/layout/Header';
import { useUI } from '../../hooks/useUI';

/** Compatibility adapter for app-owned pages that still read notification state here. */
export function Header(props: React.ComponentProps<typeof SharedHeader>) {
  const { notifications } = useUI();
  return <SharedHeader {...props} notifications={props.notifications ?? notifications} />;
}

export { CountBadge } from '@/shared/ui/layout/Header';
