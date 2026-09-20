/**
 * Safe Lazy Load Utility
 * Creates a fallback placeholder for components that haven't been implemented yet
 */

import React from 'react';

interface PlaceholderPageProps {
  pageName: string;
  path: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ pageName, path }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-6xl">🚧</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">{pageName}</h1>
        <p className="mb-4 text-sm text-gray-600">
          This page is documented and planned but not yet implemented.
        </p>
        <div className="mb-6 rounded bg-gray-100 p-3">
          <code className="text-xs text-gray-700">{path}</code>
        </div>
        <p className="text-xs text-gray-500">
          This feature is part of our roadmap and will be available in a future release.
        </p>
      </div>
    </div>
  );
};

/**
 * Safely lazy loads a component with fallback
 * If the import fails, returns a placeholder component
 */
export function safeLazyLoad(
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  pageName: string,
  path: string
): React.LazyExoticComponent<React.ComponentType<any>> {
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
