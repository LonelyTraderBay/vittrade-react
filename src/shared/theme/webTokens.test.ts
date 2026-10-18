import { describe, expect, it } from 'vitest';
import { WEB_AVATAR_GRADIENT } from './webTokens';

function luminance(color: string) {
  const channels = color
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => parseInt(channel, 16) / 255);
  if (!channels || channels.length !== 3) throw new Error(`Unsupported hex color: ${color}`);

  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

describe('WEB_AVATAR_GRADIENT', () => {
  it('keeps white avatar initials at WCAG AA contrast across the gradient stops', () => {
    const stops = WEB_AVATAR_GRADIENT.match(/#[\da-f]{6}/gi) ?? [];
    const whiteLuminance = luminance('#ffffff');

    expect(stops).toHaveLength(2);
    for (const stop of stops) {
      const backgroundLuminance = luminance(stop);
      const ratio = (whiteLuminance + 0.05) / (backgroundLuminance + 0.05);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });
});
