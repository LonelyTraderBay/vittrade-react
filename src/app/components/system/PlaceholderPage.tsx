interface PlaceholderPageProps {
  pageName: string;
  path: string;
}

export function PlaceholderPage({ pageName, path }: PlaceholderPageProps) {
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
}
