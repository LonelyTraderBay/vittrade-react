import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

const profiles = [
  { name: 'phone', prefix: '', width: 390, height: 844 },
  { name: 'web', prefix: '/w', width: 1440, height: 900 },
] as const;

type Motion = 'reduce' | 'no-preference';

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    );
  });
}

async function readStack(page: Page) {
  return page.locator('[data-sonner-toast]').evaluateAll((elements) =>
    elements.map((e) => {
      const css = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return {
        front: e.getAttribute('data-front') === 'true',
        expanded: e.getAttribute('data-expanded') === 'true',
        visible: e.getAttribute('data-visible') === 'true',
        z: Number(css.zIndex),
        nativeZ: Number(css.getPropertyValue('--z-index')),
        animation: css.animationName,
        transitionDuration: css.transitionDuration,
        transform: css.transform,
        rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right },
      };
    }),
  );
}

function newestIsAbove(rows: Awaited<ReturnType<typeof readStack>>) {
  const front = rows.find((r) => r.front);
  return !!front && rows.every((r) => r.front || front.z > r.z);
}

function expandedItemsDoNotOverlap(rows: Awaited<ReturnType<typeof readStack>>) {
  return rows.every((a, i) =>
    rows.every(
      (b, j) => i === j || a.rect.bottom <= b.rect.top + 0.5 || b.rect.bottom <= a.rect.top + 0.5,
    ),
  );
}

type AxeScan = Awaited<ReturnType<AxeBuilder['analyze']>>;
type GradientMeasurement = {
  target: string;
  resolved: boolean;
  minimumRatio: number;
  threshold: number;
  pixels: number;
  reason?: string;
  negativeControlDetected?: boolean;
  negativeMinimumRatio?: number;
  backgroundColor?: string;
  backgroundImage?: string;
};

/** Resolve only axe's documented gradient limitation, without changing or hiding the real UI. */
async function resolveGradientContrast(page: Page, scan: AxeScan, info: TestInfo, prefix: string) {
  const measurements: GradientMeasurement[] = [];
  if (!scan.incomplete.length) {
    if (!scan.passes.find((r) => r.id === 'color-contrast')?.nodes.length)
      measurements.push({
        target: '(none)',
        resolved: false,
        minimumRatio: 0,
        threshold: 4.5,
        pixels: 0,
        reason: 'Contrast rule inspected no text node',
      });
    return measurements;
  }
  if (scan.incomplete.some((r) => !r.nodes.length))
    measurements.push({
      target: '(none)',
      resolved: false,
      minimumRatio: 0,
      threshold: 4.5,
      pixels: 0,
      reason: 'Empty incomplete report',
    });
  const calibration = await page.context().newPage();
  try {
    for (const issue of scan.incomplete)
      for (const node of issue.nodes) {
        const target = typeof node.target[0] === 'string' ? node.target[0] : '';
        const unresolved = (reason: string) =>
          measurements.push({
            target,
            resolved: false,
            minimumRatio: 0,
            threshold: 4.5,
            pixels: 0,
            reason,
          });
        if (
          issue.id !== 'color-contrast' ||
          node.target.length !== 1 ||
          !target ||
          !node.any.length ||
          node.any.some(
            (check) => check.id !== 'color-contrast' || check.data?.messageKey !== 'bgGradient',
          ) ||
          node.all.length ||
          node.none.length
        ) {
          unresolved('Unsupported axe incomplete result; manual resolution is still required');
          continue;
        }
        const data = await page.locator(target).evaluate((text) => {
          const toast = text.closest('[data-sonner-toast]');
          if (!toast) throw new Error('Contrast target is outside the toaster');
          const c = getComputedStyle(toast),
            f = getComputedStyle(text);
          const r = toast.getBoundingClientRect(),
            t = text.getBoundingClientRect();
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = c.backgroundColor;
          ctx.fillRect(0, 0, 1, 1);
          const baseAlpha = ctx.getImageData(0, 0, 1, 1).data[3];
          let opaqueAncestors = true;
          for (let e: Element | null = text; e; e = e.parentElement)
            if (Number(getComputedStyle(e).opacity) !== 1) opaqueAncestors = false;
          const size = parseFloat(f.fontSize),
            weight = parseFloat(f.fontWeight);
          const threshold = size >= 24 || (size >= 18.666667 && weight >= 700) ? 3 : 4.5;
          return {
            baseAlpha,
            opaqueAncestors,
            foreground: f.color,
            threshold,
            filter: c.filter,
            width: r.width,
            height: r.height,
            unscaled: Math.abs(r.width - parseFloat(c.width)) < 0.5,
            region: {
              left: t.left - r.left,
              top: t.top - r.top,
              right: t.right - r.left,
              bottom: t.bottom - r.top,
            },
            style: {
              backgroundColor: c.backgroundColor,
              backgroundImage: c.backgroundImage,
              backgroundOrigin: c.backgroundOrigin,
              backgroundClip: c.backgroundClip,
              backgroundSize: c.backgroundSize,
              backgroundPosition: c.backgroundPosition,
              backgroundRepeat: c.backgroundRepeat,
              backgroundAttachment: c.backgroundAttachment,
              borderTopWidth: c.borderTopWidth,
              borderRightWidth: c.borderRightWidth,
              borderBottomWidth: c.borderBottomWidth,
              borderLeftWidth: c.borderLeftWidth,
            },
          };
        });
        if (
          data.baseAlpha !== 255 ||
          !data.opaqueAncestors ||
          !data.unscaled ||
          data.filter !== 'none' ||
          !data.style.backgroundImage.startsWith('linear-gradient(') ||
          data.style.backgroundAttachment !== 'scroll'
        ) {
          unresolved(
            `Cannot resolve actual gradient: baseAlpha=${data.baseAlpha}, opaque=${data.opaqueAncestors}, filter=${data.filter}, unscaled=${data.unscaled}`,
          );
          continue;
        }
        // A separate swatch uses actual computed styles and the same browser renderer.
        // The product toast and its screenshots remain untouched; no masking or CSS override.
        await calibration.setContent('<div id="gradient-swatch"></div>');
        const swatch = calibration.locator('#gradient-swatch');
        await swatch.evaluate((e, value) => {
          document.body.style.margin = '0';
          Object.assign((e as HTMLElement).style, value.style, {
            width: `${value.width}px`,
            height: `${value.height}px`,
            boxSizing: 'border-box',
            borderStyle: 'solid',
            borderColor: 'transparent',
          });
        }, data);
        const png = await swatch.screenshot();
        await writeFile(info.outputPath(`${prefix}-gradient-${measurements.length}.png`), png);
        const result = await calibration.evaluate(
          async ({ encoded, foreground, backgroundColor, region, width, threshold }) => {
            const image = new Image();
            image.src = `data:image/png;base64,${encoded}`;
            await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(image, 0, 0);
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const colorCanvas = document.createElement('canvas');
            colorCanvas.width = colorCanvas.height = 1;
            const colorCtx = colorCanvas.getContext('2d')!;
            colorCtx.fillStyle = foreground;
            colorCtx.fillRect(0, 0, 1, 1);
            const fg = colorCtx.getImageData(0, 0, 1, 1).data;
            colorCtx.fillStyle = backgroundColor;
            colorCtx.fillRect(0, 0, 1, 1);
            const lowContrastControl = colorCtx.getImageData(0, 0, 1, 1).data;
            const luminance = (r: number, g: number, b: number) => {
              const linear = (n: number) => {
                const v = n / 255;
                return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
              };
              return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
            };
            const l = luminance(fg[0], fg[1], fg[2]),
              scale = canvas.width / width;
            const controlLuminance = luminance(
              lowContrastControl[0],
              lowContrastControl[1],
              lowContrastControl[2],
            );
            let negativeMinimumRatio = Infinity;
            let minimumRatio = Infinity,
              count = 0,
              opaque = fg[3] === 255;
            for (
              let y = Math.max(0, Math.floor(region.top * scale));
              y < Math.min(canvas.height, Math.ceil(region.bottom * scale));
              y++
            )
              for (
                let x = Math.max(0, Math.floor(region.left * scale));
                x < Math.min(canvas.width, Math.ceil(region.right * scale));
                x++
              ) {
                const i = (y * canvas.width + x) * 4,
                  background = luminance(pixels[i], pixels[i + 1], pixels[i + 2]);
                opaque = opaque && pixels[i + 3] === 255;
                minimumRatio = Math.min(
                  minimumRatio,
                  (Math.max(l, background) + 0.05) / (Math.min(l, background) + 0.05),
                );
                negativeMinimumRatio = Math.min(
                  negativeMinimumRatio,
                  (Math.max(controlLuminance, background) + 0.05) /
                    (Math.min(controlLuminance, background) + 0.05),
                );
                count++;
              }
            return {
              resolved: opaque && count > 0 && Number.isFinite(minimumRatio),
              minimumRatio,
              negativeMinimumRatio,
              negativeControlDetected: negativeMinimumRatio < threshold,
              pixels: count,
              threshold,
            };
          },
          {
            encoded: png.toString('base64'),
            foreground: data.foreground,
            backgroundColor: data.style.backgroundColor,
            region: data.region,
            width: data.width,
            threshold: data.threshold,
          },
        );
        measurements.push({
          target,
          ...result,
          backgroundColor: data.style.backgroundColor,
          backgroundImage: data.style.backgroundImage,
        });
      }
  } finally {
    await calibration.close();
  }
  return measurements;
}

for (const mode of ['light', 'dark'] as const) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    for (const profile of profiles) {
      test(`Toast stack ${profile.name} ${mode} ${motion} @ui-mock`, async ({ page }, info) => {
        await page.emulateMedia({ reducedMotion: motion });
        // The real Web theme control changes ThemeProvider; Root keeps it when navigating to Phone.
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/w/p2p/my-ads');
        await page.getByTestId('auth-email').fill('developer@vittrade.local');
        await page.getByTestId('auth-password').fill('Preview-123!');
        await page.getByTestId('auth-submit').click();
        await expect(
          page.getByRole('heading', { name: 'Quảng cáo của tôi', exact: true }),
        ).toBeVisible();
        if (mode === 'dark') await page.getByTitle('Chế độ tối', { exact: true }).click();
        await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${mode}\\b`));
        await page.setViewportSize({ width: profile.width, height: profile.height });
        const target = `${profile.prefix}/p2p/my-ads`;
        await page.evaluate(
          async ({ url, moduleUrl }) => {
            const { router } = await import(moduleUrl);
            await router.navigate(url);
          },
          { url: target, moduleUrl: '/src/app/router/index.ts' },
        );
        await expect.poll(() => new URL(page.url()).pathname).toBe(target);
        await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${mode}\\b`));
        await expect(
          page.getByRole('heading', { name: 'Quảng cáo của tôi', exact: true }),
        ).toBeVisible();

        const source = await (await page.request.get('/src/shared/ui/ThemedToaster.tsx')).text();
        const moduleUrl = source.match(/from ["']([^"']*sonner\.js[^"']*)["']/)?.[1];
        expect(moduleUrl).toBeTruthy();
        const toasts = page.locator('[data-sonner-toast]');
        const dismiss = () =>
          page.evaluate(async (url) => {
            const { toast } = await import(url);
            toast.dismiss();
          }, moduleUrl!);
        await dismiss();
        await expect(toasts).toHaveCount(0);
        let writes = 0;
        page.on('request', (r) => {
          if (
            ['POST', 'PATCH', 'DELETE'].includes(r.method()) &&
            new URL(r.url()).pathname.includes('/p2p/')
          )
            writes++;
        });
        await page.evaluate(async (url) => {
          const { toast } = await import(url);
          toast.success('C06: thành công', { id: 'c06-success', duration: 60000 });
          toast.warning('C06: cần kiểm tra', { id: 'c06-warning', duration: 60000 });
          toast.error('C06: có lỗi', { id: 'c06-error', duration: 60000 });
        }, moduleUrl!);
        await expect(toasts).toHaveCount(3);
        await expect
          .poll(() =>
            toasts.evaluateAll((es) => es.every((e) => e.getAttribute('data-mounted') === 'true')),
          )
          .toBe(true);
        await settle(page);
        const collapsed = await readStack(page);
        expect
          .soft(newestIsAbove(collapsed), 'Newest toast must paint above older siblings')
          .toBe(true);
        if (motion === 'reduce')
          expect
            .soft(
              collapsed.every((r) =>
                r.transitionDuration.split(',').every((duration) => {
                  const seconds =
                    parseFloat(duration) / (duration.trim().endsWith('ms') ? 1000 : 1);
                  return Number.isFinite(seconds) && seconds >= 0 && seconds <= 0.00001;
                }),
              ),
              'Reduced motion transition duration must follow the existing 0.01ms reset',
            )
            .toBe(true);
        if (motion === 'reduce')
          expect
            .soft(
              collapsed.every((r) => r.animation === 'none'),
              'Reduced motion must not run entry animation',
            )
            .toBe(true);
        await page.screenshot({ path: info.outputPath('toast-collapsed.png'), fullPage: true });

        // Real pointer movement reaches whichever toast is currently painted on top.
        const r = await toasts.first().boundingBox();
        expect(r).toBeTruthy();
        await page.mouse.move(r!.x + r!.width / 2, r!.y + r!.height / 2);
        await expect
          .poll(() =>
            toasts.evaluateAll((es) => es.every((e) => e.getAttribute('data-expanded') === 'true')),
          )
          .toBe(true);
        await settle(page);
        const expanded = await readStack(page);
        expect
          .soft(
            expandedItemsDoNotOverlap(expanded),
            'Expanded toast messages must occupy separate rows',
          )
          .toBe(true);
        const scan = await new AxeBuilder({ page })
          .include('[data-sonner-toaster]')
          .withRules(['color-contrast'])
          .analyze();
        expect.soft(scan.violations).toEqual([]);
        const gradientMeasurements = await resolveGradientContrast(page, scan, info, 'expanded');
        expect
          .soft(
            gradientMeasurements.every(
              (r) => r.resolved && r.minimumRatio >= r.threshold && r.negativeControlDetected,
            ),
            'Every gradient incomplete node needs rendered contrast evidence',
          )
          .toBe(true);
        await page.screenshot({ path: info.outputPath('toast-expanded.png'), fullPage: true });
        await page.mouse.move(4, profile.height - 4);

        const trigger = page.getByRole('button', { name: 'Delete myad001', exact: true });
        await trigger.press('Enter');
        const dialog = page.getByRole('dialog', { name: 'Xóa quảng cáo?', exact: true });
        await expect(dialog).toBeVisible();
        await page.evaluate(async (url) => {
          const { toast } = await import(url);
          toast('C06: trạng thái mới', { id: 'c06-modal-status', duration: 60000 });
        }, moduleUrl!);
        await expect(toasts).toHaveCount(4);
        await expect
          .poll(() =>
            toasts.evaluateAll((es) => es.every((e) => e.getAttribute('data-mounted') === 'true')),
          )
          .toBe(true);
        await settle(page);
        const modal = await readStack(page);
        expect
          .soft(
            newestIsAbove(modal),
            'Newest status must remain above old toasts while a modal is open',
          )
          .toBe(true);
        expect
          .soft(
            await page
              .locator('[data-sonner-toaster]')
              .evaluate((e) => !e.closest('[aria-hidden="true"], [inert]')),
          )
          .toBe(true);
        const modalScan = await new AxeBuilder({ page })
          .include('[data-sonner-toast][data-front="true"]')
          .withRules(['color-contrast'])
          .analyze();
        expect.soft(modalScan.violations).toEqual([]);
        const modalGradientMeasurements = await resolveGradientContrast(
          page,
          modalScan,
          info,
          'modal',
        );
        expect
          .soft(
            modalGradientMeasurements.every(
              (r) => r.resolved && r.minimumRatio >= r.threshold && r.negativeControlDetected,
            ),
            'Modal toast gradients need rendered contrast evidence',
          )
          .toBe(true);
        let focusChecks = 0;
        for (const key of ['Tab', 'Shift+Tab'])
          for (let i = 0; i < 8; i++) {
            await page.keyboard.press(key);
            expect(await dialog.evaluate((e) => e.contains(document.activeElement))).toBe(true);
            focusChecks++;
          }
        await page.screenshot({ path: info.outputPath('toast-with-modal.png'), fullPage: true });
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
        expect(writes).toBe(0);
        await dismiss();
        await expect(toasts).toHaveCount(0);
        await page.evaluate(async (url) => {
          const { toast } = await import(url);
          toast.error('C06: thông báo đơn', { id: 'c06-single', duration: 60000 });
        }, moduleUrl!);
        await expect(toasts).toHaveCount(1);
        await settle(page);
        const single = await readStack(page);
        await page.screenshot({
          path: info.outputPath('toast-single-control.png'),
          fullPage: true,
        });
        const observation = {
          profile,
          mode,
          motion: motion as Motion,
          collapsed,
          expanded,
          modal,
          single,
          focusChecks,
          writes,
          gradientMeasurements,
          modalGradientMeasurements,
          modalContrast: {
            violations: modalScan.violations.length,
            incomplete: modalScan.incomplete.length,
          },
          contrast: { violations: scan.violations.length, incomplete: scan.incomplete.length },
          themeMethod:
            'Actual WebCommandBar control before Root-preserving navigation; no manual HTML class or storage override',
          scope:
            'Two representative shells, two actual ThemeProvider modes and two reduced-motion settings. UI-only synthetic Sonner calls; no P2P mutations, backend outcome or whole-product certification.',
        };
        await writeFile(info.outputPath('toast-stack.json'), JSON.stringify(observation, null, 2));
        console.log('C06_TOAST_STACK', JSON.stringify(observation));
      });
    }
  }
}
