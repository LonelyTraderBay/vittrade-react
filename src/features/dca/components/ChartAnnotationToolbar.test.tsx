import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChartAnnotationToolbar } from './ChartAnnotationToolbar';

describe('ChartAnnotationToolbar', () => {
  it('uses the default pen width indicator when the selected width is unsupported', () => {
    const { container } = render(
      <ChartAnnotationToolbar
        tool="pen"
        setTool={vi.fn()}
        color="#ffffff"
        setColor={vi.fn()}
        penWidth={999}
        setPenWidth={vi.fn()}
        annotations={[]}
        selectedIndex={null}
        canvasSnapPoints={[]}
        onClose={vi.fn()}
        handleUndo={vi.fn()}
        handleDuplicate={vi.fn()}
        handleDeleteSelected={vi.fn()}
        handleClear={vi.fn()}
      />,
    );

    expect(container.querySelector('div.absolute.bg-white')).toHaveStyle({
      width: '5px',
      height: '5px',
    });
  });
});
