/**
 * Safe Lazy Load Utility
 * Creates a fallback placeholder for components that haven't been implemented yet
 */

import React from 'react';
import { PlaceholderPage } from '@/app/components/system/PlaceholderPage';

/**
 * Safely lazy loads a component with fallback
 * If the import fails, returns a placeholder component
 */
export function safeLazyLoad<P extends object = Record<string, never>>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  pageName: string,
  path: string,
): React.LazyExoticComponent<React.ComponentType<P>> {
  return React.lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.warn(`Failed to load ${pageName}, using placeholder`, error);
      // Return a placeholder component
      return {
        default: () => <PlaceholderPage pageName={pageName} path={path} />,
      };
    }
  });
}

/**
 * Creates a placeholder component for a page
 */
export function createPlaceholder(pageName: string, path: string) {
  const Component = () => <PlaceholderPage pageName={pageName} path={path} />;
  Component.displayName = `Placeholder_${pageName}`;
  return Component;
}
