import { fireEvent, screen } from '@testing-library/react';
import { Search } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the icon, supporting text, and an actionable call to action', () => {
    const onCta = vi.fn();

    renderWithProviders(
      <EmptyState
        icon={Search}
        title="No results"
        subtitle="Try a different search"
        ctaLabel="Clear filters"
        onCta={onCta}
      />,
    );

    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Try a different search')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onCta).toHaveBeenCalledOnce();
  });

  it('uses the emoji instead of the icon and omits optional content when absent', () => {
    renderWithProviders(<EmptyState icon={Search} title="Nothing here" emoji="📭" />);

    expect(screen.getByText('📭')).toBeInTheDocument();
    expect(screen.queryByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Try a different search')).not.toBeInTheDocument();
  });

  it('requires both a label and callback before showing the call to action', () => {
    renderWithProviders(<EmptyState icon={Search} title="No action" ctaLabel="Continue" />);

    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
  });
});
