import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WebAuthBrandPanel } from './WebAuthBrandPanel';

function relativeLuminance(color: string) {
  const channels = color
    .match(/[\d.]+/g)
    ?.slice(0, 3)
    .map(Number);
  if (!channels || channels.length !== 3) throw new Error(`Unsupported computed color: ${color}`);

  const [red, green, blue] = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

describe('WebAuthBrandPanel', () => {
  it('keeps each trust avatar initial at readable text contrast', () => {
    const { container } = render(<WebAuthBrandPanel />);
    const avatars = container.querySelectorAll<HTMLDivElement>('.flex.-space-x-2 > div');

    expect(avatars).toHaveLength(4);
    for (const avatar of avatars) {
      const style = getComputedStyle(avatar);
      expect(contrastRatio(style.color, style.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps feature descriptions readable on the dark brand panel', () => {
    const { getByText } = render(<WebAuthBrandPanel />);

    expect(getByText('Hơn 300+ cặp giao dịch với phí cạnh tranh')).toHaveStyle({
      color: 'rgba(255, 255, 255, 0.65)',
    });
  });
});
