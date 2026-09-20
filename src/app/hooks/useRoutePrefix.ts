import { useLocation } from 'react-router';

/**
 * Returns the route prefix based on current shell context.
 *
 *  Phone:   ''   (default, no prefix)
 *  Tablet:  '/t'
 *  Web:     '/w'
 *  Legacy:  '/r' (responsive)
 *
 * Use: navigate(`${prefix}/profile/kyc`)
 */
export function useRoutePrefix(): string {
  const location = useLocation();
  if (location.pathname.startsWith('/w/')) return '/w';
  if (location.pathname.startsWith('/t/')) return '/t';
  if (location.pathname.startsWith('/r/')) return '/r';
  return '';
}
