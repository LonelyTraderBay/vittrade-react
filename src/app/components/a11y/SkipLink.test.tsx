import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('reveals the main-content link on keyboard focus and hides it again on blur', () => {
    renderWithProviders(
      <>
        <SkipLink />
        <main id="main-content">Main content</main>
      </>,
    );

    const link = screen.getByRole('link', { name: 'Bỏ qua đến nội dung chính' });
    expect(link).toHaveAttribute('href', '#main-content');
    expect(link).toHaveStyle({ left: '-10000px', position: 'absolute' });

    fireEvent.focus(link);
    expect(link).toHaveStyle({ left: '8px', position: 'fixed', top: '8px', zIndex: '9999' });
    expect(link).toHaveStyle({ padding: '12px 20px', color: '#FFFFFF' });

    fireEvent.blur(link);
    expect(link).toHaveStyle({ left: '-10000px', position: 'absolute', width: '1px' });
  });
});
