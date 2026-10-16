import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageContent, PageSection } from './layout/PageContent';
import { RefreshableSkeletonList, RefreshTimestamp } from './RefreshableSkeletonList';

describe('layout and refresh feedback', () => {
  it('shows the refresh result alongside an empty list after a completed refresh', () => {
    render(
      <RefreshableSkeletonList
        isLoading={false}
        isEmpty
        emptyState={<p>No records</p>}
        lastRefreshedLabel="just now"
        refreshCount={2}
      >
        <p>Records</p>
      </RefreshableSkeletonList>,
    );
    expect(screen.getByText('No records')).toBeInTheDocument();
    expect(screen.getByText('Cập nhật lần cuối: just now')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.queryByText('Records')).not.toBeInTheDocument();
  });
  it('uses density presets unless explicitly overridden, including full-bleed content', () => {
    const { rerender } = render(
      <PageContent density="compact" fullBleed>
        <span>Content</span>
      </PageContent>,
    );
    expect(screen.getByText('Content').parentElement).toHaveClass('pt-2');
    expect(screen.getByText('Content').parentElement).not.toHaveClass('px-5');
    expect(screen.getByText('Content').parentElement).toHaveStyle({ gap: '8px' });
    rerender(
      <PageContent density="compact" padding="relaxed" gap={24}>
        <span>Content</span>
      </PageContent>,
    );
    expect(screen.getByText('Content').parentElement).toHaveClass('pt-4');
    expect(screen.getByText('Content').parentElement).toHaveStyle({
      paddingInline: 'var(--tr-page-inline-gutter, 20px)',
    });
    expect(screen.getByText('Content').parentElement).toHaveStyle({ gap: '24px' });
  });

  it('uses an explicit section gap without inventing a heading', () => {
    render(
      <PageSection gap={18}>
        <span>Section content</span>
      </PageSection>,
    );
    expect(screen.getByText('Section content').parentElement).toHaveStyle({ gap: '18px' });
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('keeps empty feedback without a timestamp and falls back to children without an empty state', () => {
    const { rerender } = render(
      <RefreshableSkeletonList isLoading={false} isEmpty emptyState={<p>No records</p>}>
        <p>Records</p>
      </RefreshableSkeletonList>,
    );
    expect(screen.getByText('No records')).toBeInTheDocument();
    expect(screen.queryByText('Records')).not.toBeInTheDocument();
    rerender(
      <RefreshableSkeletonList isLoading={false} isEmpty>
        <p>Records</p>
      </RefreshableSkeletonList>,
    );
    expect(screen.getByText('Records')).toBeInTheDocument();
  });

  it('hides an absent refresh label and does not show a zero refresh count', () => {
    const { container, rerender } = render(<RefreshTimestamp label="" />);
    expect(container).toBeEmptyDOMElement();
    rerender(<RefreshTimestamp label="just now" count={0} />);
    expect(screen.getByText('Cập nhật lần cuối: just now')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
