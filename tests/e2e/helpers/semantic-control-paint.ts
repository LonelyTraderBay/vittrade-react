import type { Locator } from '@playwright/test';

/** Nominal text contrast over actual computed plain-color layers; unsupported paint fails. */
export async function paint(control: Locator) {
  return control.evaluate((root) => {
    const element = root as HTMLElement;
    const text = element.querySelector('p') ?? element.querySelector('span') ?? element;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    const rgba = (color: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    };
    const layers: number[][] = [];
    let opaque = false;
    for (let node: Element | null = text; node; node = node.parentElement) {
      const s = getComputedStyle(node);
      if (Number(s.opacity) !== 1 || s.filter !== 'none' || s.mixBlendMode !== 'normal')
        return { supported: false, reason: 'Unsupported gradient/opacity/filter/blend', ratio: 0 };
      // Group opacity/filter still applies above an opaque surface.
      if (opaque) continue;
      if (s.backgroundImage !== 'none')
        return { supported: false, reason: 'Unsupported background gradient', ratio: 0 };
      for (const pseudo of ['::before', '::after']) {
        const p = getComputedStyle(node, pseudo);
        if (
          p.content !== 'none' &&
          p.content !== 'normal' &&
          p.display !== 'none' &&
          (p.backgroundImage !== 'none' || rgba(p.backgroundColor)[3] > 0)
        )
          return { supported: false, reason: 'Unsupported pseudo paint', ratio: 0 };
      }
      const layer = rgba(s.backgroundColor);
      layers.push(layer);
      if (layer[3] === 255) {
        opaque = true;
      }
    }
    if (!opaque) return { supported: false, reason: 'No opaque background', ratio: 0 };
    let background = [0, 0, 0];
    for (const layer of layers.reverse())
      background = background.map((v, i) => (layer[i] * layer[3]) / 255 + v * (1 - layer[3] / 255));
    const foreground = rgba(getComputedStyle(text).color);
    if (foreground[3] !== 255) return { supported: false, reason: 'Translucent text', ratio: 0 };
    const luminance = (rgb: number[]) =>
      rgb
        .slice(0, 3)
        .map((v) => v / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);
    const a = luminance(foreground),
      b = luminance(background);
    const s = getComputedStyle(element),
      r = element.getBoundingClientRect(),
      tr = text.getBoundingClientRect();
    return {
      supported: true,
      reason: '',
      ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      foreground,
      background,
      nominalAlpha: rgba(s.backgroundColor)[3],
      computedBackground: s.backgroundColor,
      transitionDuration: s.transitionDuration,
      transitionProperty: s.transitionProperty,
      borderAlpha: rgba(s.borderTopColor)[3],
      borderStyle: s.borderTopStyle,
      borderWidth: s.borderTopWidth,
      fontSize: getComputedStyle(text).fontSize,
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
      focusVisible: element.matches(':focus-visible'),
      pressed: element.getAttribute('aria-pressed'),
      height: r.height,
      width: r.width,
      textWithin:
        tr.left >= r.left && tr.right <= r.right && tr.top >= r.top && tr.bottom <= r.bottom,
      hits: [0.1, 0.5, 0.9].map((f) => {
        const h = document.elementFromPoint(r.x + r.width * f, r.y + r.height / 2);
        return h === element || Boolean(h && element.contains(h));
      }),
    };
  });
}
