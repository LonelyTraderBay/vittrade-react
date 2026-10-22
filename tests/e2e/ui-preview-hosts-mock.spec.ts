import { expect, test, type Locator, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

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

async function inspect(page: Page, target: Locator) {
  return target.evaluate((element) => {
    const warning = document.querySelector('[aria-label="Mock data warning"]')!;
    const rect = (node: Element) => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
    };
    const w = rect(warning),
      t = rect(element);
    const overlap = w.x < t.right && w.right > t.x && w.y < t.bottom && w.bottom > t.y;
    // Compare the first divergent stacking contexts, retaining the chain for review.
    const chain = (node: Element) => {
      const result: { node: Element; z: number; tag: string }[] = [];
      for (let p: Element | null = node; p; p = p.parentElement) {
        const s = getComputedStyle(p);
        const positioned = s.position !== 'static' && s.zIndex !== 'auto';
        const flexItem =
          s.zIndex !== 'auto' &&
          p.parentElement &&
          /flex|grid/.test(getComputedStyle(p.parentElement).display);
        if (
          !p.parentElement ||
          positioned ||
          flexItem ||
          s.position === 'fixed' ||
          s.position === 'sticky' ||
          Number(s.opacity) < 1 ||
          s.transform !== 'none' ||
          s.filter !== 'none' ||
          s.backdropFilter !== 'none' ||
          s.isolation === 'isolate'
        )
          result.unshift({
            node: p,
            z: s.zIndex === 'auto' ? 0 : Number(s.zIndex),
            tag: `${p.tagName}#${p.id}.${p.className}`,
          });
      }
      return result;
    };
    const wc = chain(warning),
      tc = chain(element);
    let i = 0;
    while (i < wc.length && i < tc.length && wc[i].node === tc[i].node) i++;
    const a = wc[i],
      b = tc[i];
    const targetPaintsAbove = Boolean(
      a &&
      b &&
      (b.z > a.z ||
        (b.z === a.z && a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING)),
    );
    const r = element.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return {
      warning: w,
      target: t,
      overlap,
      targetPaintsAbove,
      pointerHits: Boolean(hit && (hit === element || element.contains(hit))),
      warningChain: wc.map(({ z, tag }) => ({ z, tag })),
      targetChain: tc.map(({ z, tag }) => ({ z, tag })),
    };
  });
}

for (const mode of ['light', 'dark'] as const) {
  for (const prefix of ['', '/t', '/w', '/r']) {
    test(`Auth preview host ${prefix || 'phone'} ${mode} @ui-mock`, async ({ page }, info) => {
      await page.setViewportSize({ width: 568, height: 320 });
      await page.goto(`${prefix}/auth/login`);
      await expect(page.getByTestId('auth-email')).toBeVisible();
      await page.locator('html').evaluate((html, mode) => {
        html.classList.toggle('dark', mode === 'dark');
        html.classList.toggle('light', mode === 'light');
      }, mode);
      await settle(page);
      const warning = page.getByRole('status', { name: 'Mock data warning' });
      const box = await warning.boundingBox();
      await page.screenshot({ path: info.outputPath('auth-host.png'), animations: 'disabled' });
      await writeFile(info.outputPath('auth-host.json'), JSON.stringify({ prefix, mode, box }));
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(320);
      await page.getByTestId('auth-email').fill('draft@vittrade.local');
      await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
      const panel = page.getByRole('region', { name: 'Công cụ xem trước' });
      await expect(panel).toBeInViewport({ ratio: 1 });
      const panelSizes = [];
      for (const viewport of [
        { width: 390, height: 568 },
        { width: 568, height: 320 },
      ]) {
        await page.setViewportSize(viewport);
        await expect(panel).toBeInViewport({ ratio: 1 });
        panelSizes.push({ viewport, bounds: await panel.boundingBox() });
        await expect(page.getByTestId('auth-email')).toHaveValue('draft@vittrade.local');
      }
      await writeFile(
        info.outputPath('auth-host.json'),
        JSON.stringify({ prefix, mode, box, panelSizes, draft: 'preserved' }),
      );
      await page.getByRole('button', { name: 'Thu gọn', exact: true }).click();
      await expect(page.getByTestId('auth-email')).toHaveValue('draft@vittrade.local');
      await expect(warning).toHaveCount(1);
    });
  }

  for (const prefix of ['', '/w']) {
    for (const kind of ['p2p', 'earn', 'dca'] as const) {
      test(`Short modal preview layering ${kind} ${prefix || 'phone'} ${mode} @ui-mock`, async ({
        page,
      }, info) => {
        await page.setViewportSize({ width: prefix ? 1440 : 568, height: 320 });
        let writes = 0;
        page.on('request', (request) => {
          if (request.method() === 'POST' && /\/(p2p|earn|dca)\//.test(request.url())) writes++;
        });
        const path = `${prefix}${kind === 'p2p' ? '/p2p/my-ads' : kind === 'earn' ? '/earn/savings' : '/dca'}`;
        await page.goto(path);
        await page
          .getByTestId('auth-email')
          .fill(`${kind === 'dca' ? 'dca' : 'developer'}@vittrade.local`);
        await page.getByTestId('auth-password').fill('Preview-123!');
        await page.getByTestId('auth-submit').click();
        await expect.poll(() => new URL(page.url()).pathname).toBe(path);
        await expect(
          page.getByRole('heading', {
            name:
              kind === 'p2p'
                ? 'Quảng cáo của tôi'
                : kind === 'earn'
                  ? 'Tiết kiệm'
                  : 'Mua tự động (DCA)',
            exact: true,
          }),
        ).toBeVisible();
        await page.locator('html').evaluate((html, mode) => {
          html.classList.toggle('dark', mode === 'dark');
          html.classList.toggle('light', mode === 'light');
        }, mode);
        const observations = [];
        let trigger: Locator;
        if (kind === 'p2p')
          trigger = page.getByRole('button', { name: 'Delete myad001', exact: true });
        else if (kind === 'earn') {
          await page.getByRole('tab', { name: 'Sản phẩm', exact: true }).click();
          trigger = page.getByRole('button').filter({ hasText: 'APY' }).first();
        } else trigger = page.getByRole('button', { name: 'Tạo kế hoạch mới', exact: true });
        await trigger.scrollIntoViewIfNeeded();
        await trigger.click();
        const dialog = page.getByRole('dialog', {
          name:
            kind === 'p2p'
              ? 'Xóa quảng cáo?'
              : kind === 'earn'
                ? 'Đăng ký sản phẩm'
                : 'Tạo Kế Hoạch DCA Mới',
          exact: true,
        });
        await expect(dialog).toBeVisible();
        await settle(page);
        const close = dialog.getByRole('button', {
          name: kind === 'p2p' ? 'Hủy' : 'Đóng',
          exact: true,
        });
        const content = dialog.locator('h3').first();
        const measurements = {
          kind,
          close: await inspect(page, close),
          title: await inspect(page, content),
        };
        observations.push(measurements);
        await page.screenshot({
          path: info.outputPath(`${kind}-layer.png`),
          animations: 'disabled',
        });
        await writeFile(
          info.outputPath('modal-layer.json'),
          JSON.stringify({ prefix, mode, observations, writes }, null, 2),
        );
        expect(measurements.close.pointerHits).toBe(true);
        for (const measurement of [measurements.close, measurements.title])
          expect(!measurement.overlap || measurement.targetPaintsAbove).toBe(true);
        await close.click();
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
        expect(writes).toBe(0);
      });
    }
  }
}
