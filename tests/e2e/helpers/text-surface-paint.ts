import type { Page, Locator, TestInfo } from '@playwright/test';

/** Native ancestor surfaces and nominal foreground in direct-text ROIs.
 * Rejects unsupported group effects; not a whole-page WCAG or glyph-overlap oracle. */
export async function measureNativeTextSurface(
  page: Page,
  target: Locator,
  name: string,
  info: TestInfo,
) {
  const data = await target.evaluate((element) => {
    const surface = element.closest('[data-slot="tr-card"]');
    if (!surface) throw Error('No surface owner');
    const root = surface.getBoundingClientRect(),
      style = getComputedStyle(element),
      layers = [],
      ancestors = [];
    let opacity = 1;
    for (let node: Element | null = element; node; node = node.parentElement) {
      const s = getComputedStyle(node),
        r = node.getBoundingClientRect();
      if (s.filter !== 'none' || s.mixBlendMode !== 'normal' || s.transform !== 'none')
        throw Error('Unsupported effect');
      if (node !== element && s.opacity !== '1')
        throw Error('Ancestor group opacity requires separate model');
      opacity *= Number(s.opacity);
      ancestors.push({
        tag: node.tagName,
        opacity: s.opacity,
        background: s.backgroundColor,
        image: s.backgroundImage,
      });
      if (s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.backgroundImage !== 'none') {
        const keys = [
          'width',
          'height',
          'boxSizing',
          'backgroundColor',
          'backgroundImage',
          'backgroundSize',
          'backgroundPosition',
          'backgroundRepeat',
          'backgroundOrigin',
          'backgroundClip',
          'borderTopWidth',
          'borderRightWidth',
          'borderBottomWidth',
          'borderLeftWidth',
          'borderStyle',
          'borderColor',
          'borderRadius',
          'paddingTop',
          'paddingRight',
          'paddingBottom',
          'paddingLeft',
        ] as const;
        layers.push({
          x: r.x - root.x,
          y: r.y - root.y,
          css: Object.fromEntries(keys.map((k) => [k, s[k]])),
        });
      }
      if (node === surface) break;
    }
    const rects = [];
    for (const n of element.childNodes) {
      if (n.nodeType !== Node.TEXT_NODE || !n.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects())
        if (r.width && r.height)
          rects.push({ x: r.x - root.x, y: r.y - root.y, width: r.width, height: r.height });
    }
    if (!rects.length) throw Error('No direct text ROI');
    return {
      width: root.width,
      height: root.height,
      foreground: style.color,
      foregroundOpacity: opacity,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      text: element.textContent?.trim() || '',
      rects,
      layers: layers.reverse(),
      ancestors,
    };
  });
  const calibration = await page.context().newPage();
  try {
    await calibration.setViewportSize({
      width: Math.ceil(data.width) + 64,
      height: Math.ceil(data.height) + 64,
    });
    await calibration.setContent('<div id="scene"></div>');
    const scene = calibration.locator('#scene');
    await scene.evaluate((element, d) => {
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
      document.body.style.margin = '32px';
      Object.assign(element.style, {
        position: 'relative',
        width: d.width + 'px',
        height: d.height + 'px',
      });
      for (const layer of d.layers) {
        const node = document.createElement('div');
        Object.assign(node.style, layer.css, {
          position: 'absolute',
          left: layer.x + 'px',
          top: layer.y + 'px',
        });
        element.append(node);
      }
    }, data);
    const bg = await scene.screenshot({ omitBackground: true });
    await scene.evaluate((element, d) => {
      for (const r of d.rects) {
        const node = document.createElement('div');
        Object.assign(node.style, {
          position: 'absolute',
          left: r.x + 'px',
          top: r.y + 'px',
          width: r.width + 'px',
          height: r.height + 'px',
          backgroundColor: d.foreground,
          opacity: String(d.foregroundOpacity),
        });
        element.append(node);
      }
    }, data);
    const fg = await scene.screenshot({ omitBackground: true });
    await info.attach(name + '-background', { body: bg, contentType: 'image/png' });
    await info.attach(name + '-foreground', { body: fg, contentType: 'image/png' });
    const measured = await calibration.evaluate(
      async (input) => {
        const decode = async (p: string) => {
          const im = new Image();
          im.src = 'data:image/png;base64,' + p;
          await im.decode();
          const c = document.createElement('canvas');
          c.width = im.naturalWidth;
          c.height = im.naturalHeight;
          const x = c.getContext('2d');
          if (!x) throw Error('Canvas unavailable');
          x.drawImage(im, 0, 0);
          return {
            width: c.width,
            height: c.height,
            pixels: x.getImageData(0, 0, c.width, c.height).data,
          };
        };
        const bg = await decode(input.bg),
          fg = await decode(input.fg);
        if (bg.width !== fg.width || bg.height !== fg.height) throw Error('Size drift');
        const luminance = (r: number, g: number, b: number) => {
          const linear = (v: number) => {
            v /= 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
        };
        let minimumRatio = Infinity,
          count = 0;
        for (const r of input.rects)
          for (let y = Math.ceil(r.y); y < Math.floor(r.y + r.height); y++)
            for (let x = Math.ceil(r.x); x < Math.floor(r.x + r.width); x++) {
              const i = (y * bg.width + x) * 4;
              if (bg.pixels[i + 3] !== 255 || fg.pixels[i + 3] !== 255)
                throw Error('TextROI transparency/out-of-scene');
              const a = luminance(bg.pixels[i], bg.pixels[i + 1], bg.pixels[i + 2]),
                b = luminance(fg.pixels[i], fg.pixels[i + 1], fg.pixels[i + 2]);
              minimumRatio = Math.min(
                minimumRatio,
                (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
              );
              count++;
            }
        if (!count) throw Error('Empty text sample');
        return { minimumRatio, opaquePixelPositions: count };
      },
      { bg: bg.toString('base64'), fg: fg.toString('base64'), rects: data.rects },
    );
    const threshold =
      parseFloat(data.fontSize) >= 24 ||
      (parseFloat(data.fontSize) >= 18.6667 && Number(data.fontWeight) >= 700)
        ? 3
        : 4.5;
    return {
      name,
      ...data,
      ...measured,
      threshold,
      scope:
        'Native ancestor background stack plus nominal text carpet in actual direct-text ROIs; excludes sibling/SVG overlap, pseudo effects, glyph antialias and full WCAG certification.',
    };
  } finally {
    await calibration.close();
  }
}
