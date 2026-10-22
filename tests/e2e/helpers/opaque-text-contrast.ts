import { expect, type Locator, type Page } from '@playwright/test';

/** Resolve only plain text over an opaque surface; reject unsupported paint or occlusion. */
async function inspectOpaqueText(target: Locator) {
  return target.evaluate((element) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) throw Error('Canvas unavailable');
    const rgba = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    };
    const style = getComputedStyle(element);
    if (element.children.length || style.textShadow !== 'none')
      throw Error('Only direct, unshadowed text is supported');
    const foreground = rgba(style.color);
    if (foreground[3] !== 255) throw Error('Translucent foreground requires another model');
    let background: number[] | undefined;
    let surface: Element | undefined;
    const clipping: DOMRect[] = [];
    for (let node: Element | null = element; node; node = node.parentElement) {
      const css = getComputedStyle(node);
      if (css.opacity !== '1' || css.filter !== 'none' || css.mixBlendMode !== 'normal')
        throw Error('Unsupported group paint');
      if (!surface) {
        for (const pseudo of ['::before', '::after']) {
          const paint = getComputedStyle(node, pseudo);
          if (!['none', 'normal'].includes(paint.content) && paint.display !== 'none')
            throw Error('Pseudo paint requires another model');
        }
        if (css.overflowX !== 'visible' || css.overflowY !== 'visible')
          clipping.push(node.getBoundingClientRect());
        if (css.backgroundImage !== 'none' || css.backdropFilter !== 'none')
          throw Error('Nonuniform background requires another model');
        const color = rgba(css.backgroundColor);
        if (color[3] === 255) {
          background = color;
          surface = node;
        } else if (color[3] !== 0) throw Error('Translucent layer requires another model');
      }
    }
    if (!background || !surface) throw Error('No opaque surface');
    const range = document.createRange();
    range.selectNodeContents(element);
    const rects = [...range.getClientRects()].filter((rect) => rect.width && rect.height);
    if (!rects.length) throw Error('Empty text geometry');
    const owner = surface.getBoundingClientRect();
    let hitChecks = 0;
    for (const rect of rects) {
      if (
        clipping.some(
          (clip) =>
            rect.left < clip.left ||
            rect.right > clip.right ||
            rect.top < clip.top ||
            rect.bottom > clip.bottom,
        )
      )
        throw Error('Text is clipped');
      if (
        rect.left < Math.max(0, owner.left) ||
        rect.right > Math.min(innerWidth, owner.right) ||
        rect.top < Math.max(0, owner.top) ||
        rect.bottom > Math.min(innerHeight, owner.bottom)
      )
        throw Error('Text is outside its surface/viewport');
      for (const x of [0.05, 0.5, 0.95])
        for (const y of [0.1, 0.5, 0.9]) {
          const hit = document.elementFromPoint(rect.x + rect.width * x, rect.y + rect.height * y);
          if (hit !== element) throw Error('Text is obscured');
          hitChecks++;
        }
    }
    const luminance = (channels: number[]) => {
      const linear = channels.slice(0, 3).map((v) => {
        v /= 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const a = luminance(foreground),
      b = luminance(background);
    const threshold =
      parseFloat(style.fontSize) >= 24 ||
      (parseFloat(style.fontSize) >= 18.6667 && Number(style.fontWeight) >= 700)
        ? 3
        : 4.5;
    return {
      foreground,
      background,
      ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      threshold,
      hitChecks,
      textLines: rects.length,
    };
  });
}

export async function verifyOpaqueTextContrast(page: Page, target: Locator) {
  const measured = await inspectOpaqueText(target);
  expect(measured.ratio).toBeGreaterThanOrEqual(measured.threshold);
  // Calibrate the same browser measurement on an isolated, intentionally unreadable control.
  const calibration = await page.context().newPage();
  try {
    await calibration.setContent(
      '<p style="color:#808080;background:#808080">Contrast control</p>',
    );
    const negative = await inspectOpaqueText(calibration.locator('p'));
    expect(negative.ratio).toBe(1);
    expect(negative.ratio).toBeLessThan(negative.threshold);
    return { ...measured, negativeRatio: negative.ratio, negativeControlDetected: true };
  } finally {
    await calibration.close();
  }
}
