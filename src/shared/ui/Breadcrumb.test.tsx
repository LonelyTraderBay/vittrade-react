import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './Breadcrumb';

describe('Breadcrumb primitives', () => {
  it('renders semantic navigation, list, current page and default separator', () => {
    render(
      <Breadcrumb minDepth={2} data-testid="breadcrumbs">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/markets">Markets</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator data-testid="default-separator" />
          <BreadcrumbItem>
            <BreadcrumbPage>BTC/USDT</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toHaveAttribute(
      'data-testid',
      'breadcrumbs',
    );
    expect(screen.getByRole('link', { name: 'Markets' })).toHaveAttribute('href', '/markets');
    expect(screen.getByRole('link', { name: 'BTC/USDT' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'BTC/USDT' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('default-separator')).toHaveAttribute(
      'data-slot',
      'breadcrumb-separator',
    );
    expect(screen.getByRole('list')).toHaveAttribute('data-slot', 'breadcrumb-list');
  });

  it('composes a child element when BreadcrumbLink uses asChild', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild className="custom-link">
              <a href="/watchlist" aria-label="Open watchlist">
                Watchlist
              </a>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    const link = screen.getByRole('link', { name: 'Open watchlist' });
    expect(link).toHaveAttribute('href', '/watchlist');
    expect(link).toHaveAttribute('data-slot', 'breadcrumb-link');
    expect(link).toHaveClass('custom-link');
  });

  it('renders custom separators, ellipsis and class overrides', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList className="custom-list">
          <BreadcrumbItem className="custom-item">Earlier pages</BreadcrumbItem>
          <BreadcrumbSeparator data-testid="custom-separator">
            <span>·</span>
          </BreadcrumbSeparator>
          <BreadcrumbEllipsis className="custom-ellipsis" />
        </BreadcrumbList>
      </Breadcrumb>,
    );

    expect(screen.getByRole('list')).toHaveClass('custom-list');
    expect(screen.getByText('Earlier pages').closest('li')).toHaveClass('custom-item');
    expect(screen.getByTestId('custom-separator')).toHaveTextContent('·');
    expect(screen.getByText('More')).toBeInTheDocument();
    expect(screen.getByText('More').parentElement).toHaveClass('custom-ellipsis');
  });
});
