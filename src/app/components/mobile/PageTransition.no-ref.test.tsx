import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('motion/react', async () => {
  const ReactModule = await import('react');
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement(ReactModule.Fragment, null, children),
    motion: {
      div: ReactModule.forwardRef<
        HTMLDivElement,
        { children?: React.ReactNode; onAnimationComplete?: () => void }
      >(({ children, onAnimationComplete }, _ref) => {
        ReactModule.useEffect(() => onAnimationComplete?.(), [onAnimationComplete]);
        return ReactModule.createElement('div', null, children);
      }),
    },
  };
});

import { PageTransition } from './PageTransition';

describe('PageTransition without an attached motion element', () => {
  it('safely handles animation completion when the ref is not attached', () => {
    renderWithProviders(
      <PageTransition>
        <h1>Trade</h1>
      </PageTransition>,
    );

    expect(screen.getByRole('heading', { name: 'Trade' })).toBeVisible();
  });
});
