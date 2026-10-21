import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

/** Native CSS calibration of uniform button text over its real background and press overlay. */
export async function measureButtonPaint(
  page: Page,
  button: Locator,
  info: TestInfo,
  name: string,
) {
  const data = await button.evaluate((element) => {
    const c = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const ancestors = [];
    for (let node: Element | null = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      ancestors.push({
        opacity: style.opacity,
        blend: style.mixBlendMode,
        filter: node === element ? 'none' : style.filter,
      });
    }
    const textRects = [];
    let uniformText = true;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent?.trim()) continue;
      uniformText &&= getComputedStyle(node.parentElement!).color === c.color;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        textRects.push({ x: r.x - rect.x, y: r.y - rect.y, width: r.width, height: r.height });
      }
    }
    const pseudo = getComputedStyle(element, '::after');
    return {
      width: rect.width,
      height: rect.height,
      foreground: c.color,
      fontSize: c.fontSize,
      fontWeight: c.fontWeight,
      filter: c.filter,
      ancestors,
      textRects,
      uniformText,
      style: {
        width: c.width,
        height: c.height,
        boxSizing: c.boxSizing,
        backgroundColor: c.backgroundColor,
        backgroundImage: c.backgroundImage,
        backgroundOrigin: c.backgroundOrigin,
        backgroundClip: c.backgroundClip,
        backgroundSize: c.backgroundSize,
        backgroundPosition: c.backgroundPosition,
        backgroundRepeat: c.backgroundRepeat,
        borderRadius: c.borderRadius,
        borderWidth: c.borderWidth,
        borderStyle: c.borderStyle,
        borderColor: 'transparent',
        transform: c.transform,
        transformOrigin: c.transformOrigin,
        overflow: c.overflow,
        filter: c.filter,
        position: 'relative',
      },
      overlay:
        pseudo.content !== 'none' && pseudo.display !== 'none' && Number(pseudo.opacity) > 0
          ? {
              position: pseudo.position,
              top: pseudo.top,
              left: pseudo.left,
              width: pseudo.width,
              height: pseudo.height,
              transform: pseudo.transform,
              transformOrigin: pseudo.transformOrigin,
              borderRadius: pseudo.borderRadius,
              backgroundColor: pseudo.backgroundColor,
              backgroundImage: pseudo.backgroundImage,
              opacity: pseudo.opacity,
            }
          : null,
    };
  });
  expect(
    data.ancestors.every((s) => s.opacity === '1' && s.blend === 'normal' && s.filter === 'none'),
  ).toBe(true);
  expect(data.uniformText).toBe(true);
  expect(data.textRects.length).toBeGreaterThan(0);
  expect(data.filter).toMatch(/^(none|brightness\([\d.]+\))$/);
  const calibration = await page.context().newPage();
  try {
    await calibration.setViewportSize({
      width: Math.ceil(parseFloat(data.style.width)) + 96,
      height: Math.ceil(parseFloat(data.style.height)) + 96,
    });
    await calibration.setContent('<div id="swatch"></div>');
    const swatch = calibration.locator('#swatch');
    await swatch.evaluate((element, value) => {
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
      document.body.style.margin = '32px';
      Object.assign((element as HTMLElement).style, value.style);
      if (value.overlay) {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, value.overlay);
        element.append(overlay);
      }
    }, data);
    const background = await swatch.screenshot({ omitBackground: true });
    await swatch.evaluate((element, color) => {
      (element as HTMLElement).style.backgroundImage = 'none';
      (element as HTMLElement).style.backgroundColor = color;
    }, data.foreground);
    const foreground = await swatch.screenshot({ omitBackground: true });
    await writeFile(info.outputPath(`${name}-background.png`), background);
    await writeFile(info.outputPath(`${name}-foreground.png`), foreground);
    const pixels = await calibration.evaluate(
      async (input) => {
        const decode = async (encoded: string) => {
          const image = new Image();
          image.src = `data:image/png;base64,${encoded}`;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d')!;
          context.drawImage(image, 0, 0);
          return {
            width: canvas.width,
            height: canvas.height,
            data: context.getImageData(0, 0, canvas.width, canvas.height).data,
          };
        };
        const bg = await decode(input.background),
          fg = await decode(input.foreground);
        if (bg.width !== fg.width || bg.height !== fg.height)
          throw new Error('Calibration bounds changed');
        const luminance = (r: number, g: number, b: number) => {
          const linear = (value: number) => {
            value /= 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
        };
        let minimumRatio = Infinity,
          opaquePixels = 0,
          textOpaque = true,
          textPixels = 0;
        for (let i = 0; i < bg.data.length; i += 4) {
          if (bg.data[i + 3] !== 255 || fg.data[i + 3] !== 255) continue;
          const a = luminance(bg.data[i], bg.data[i + 1], bg.data[i + 2]);
          const b = luminance(fg.data[i], fg.data[i + 1], fg.data[i + 2]);
          minimumRatio = Math.min(minimumRatio, (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05));
          opaquePixels++;
        }
        const scaleX = bg.width / input.width,
          scaleY = bg.height / input.height;
        for (const r of input.textRects) {
          if (
            r.x < -1 ||
            r.y < -1 ||
            r.x + r.width > input.width + 1 ||
            r.y + r.height > input.height + 1
          )
            textOpaque = false;
          for (
            let y = Math.max(0, Math.floor(r.y * scaleY));
            y < Math.min(bg.height, Math.ceil((r.y + r.height) * scaleY));
            y++
          ) {
            for (
              let x = Math.max(0, Math.floor(r.x * scaleX));
              x < Math.min(bg.width, Math.ceil((r.x + r.width) * scaleX));
              x++
            ) {
              const i = (y * bg.width + x) * 4;
              textOpaque &&= bg.data[i + 3] === 255 && fg.data[i + 3] === 255;
              textPixels++;
            }
          }
        }
        return { minimumRatio, opaquePixels, textOpaque, textPixels };
      },
      {
        background: background.toString('base64'),
        foreground: foreground.toString('base64'),
        width: data.width,
        height: data.height,
        textRects: data.textRects,
      },
    );
    expect(pixels.opaquePixels).toBeGreaterThan(0);
    expect(pixels.textPixels).toBeGreaterThan(0);
    expect(pixels.textOpaque).toBe(true);
    return { ...data, ...pixels };
  } finally {
    await calibration.close();
  }
}
