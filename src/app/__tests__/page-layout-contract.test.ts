import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const INVENTORY_PATH = path.join(REPO_ROOT, 'docs/architecture/page-inventory.json');

/**
 * Inventory pages whose rendering owner intentionally is not the page module.
 * Keep each exception tied to the component that owns its layout contract.
 */
const LAYOUT_EXCEPTIONS: Record<string, string> = {
  'src/app/pages/dca/DCAPage.tsx': 'App adapter; DCAMainPage owns PullToRefresh and page content.',
  'src/app/pages/p2p/P2PHomePage.tsx':
    'App adapter; P2PMarketplacePage and P2PMarketplaceSections own the marketplace layout.',
  'src/app/pages/wallet/AssetDetailPage.tsx':
    'App adapter; WalletAssetDetailPage owns the shared page layout.',
  'src/dev/legacy/responsive/ShellTemplatePage.tsx':
    'Developer-only legacy shell preview with its own responsive template contract.',
  'src/features/auth/pages/Web2FASetupPage.tsx':
    'Web authentication shell; WebAuthFormShell owns the form layout.',
  'src/features/auth/pages/WebAccountLockedPage.tsx':
    'Web authentication shell; WebAuthFormShell owns the form layout.',
  'src/features/auth/pages/WebAuthSuccessPage.tsx':
    'Web authentication shell; WebAuthFormShell owns the form layout.',
  'src/features/auth/pages/WebLoginPage.tsx':
    'Web authentication shell; WebAuthFormShell owns the form layout.',
  'src/features/auth/pages/WebOTPPage.tsx':
    'Web authentication shell; WebAuthFormShell owns the form layout.',
  'src/features/auth/pages/WebRegisterPage.tsx':
    'Web authentication shell; WebAuthFormShell owns the form layout.',
  'src/features/auth/pages/WebSessionExpiredPage.tsx':
    'Web authentication shell; WebAuthFormShell owns the form layout.',
  'src/features/dca/pages/DCAMainPage.tsx':
    'PullToRefresh owns the root gesture boundary; PageContent owns the inner sections.',
  'src/features/p2p/pages/P2P2FASettingsPage.tsx':
    'P2P2FASettingsView owns PageContent inside the page-level PageLayout.',
  'src/features/p2p/pages/P2PMarketplacePage.tsx':
    'PullToRefresh owns the root gesture boundary; P2PMarketplaceSections owns PageContent.',
  'src/features/trading/pages/OrdersHistoryPage.tsx':
    'PageLayout owns the shell; tabs, filters and table rows have distinct edge-to-edge gutters.',
  'src/features/trading/pages/TradePage.tsx':
    'Route adapter; TradeTerminal owns responsive and immersive trade layout.',
  'src/features/wallet/pages/WebWithdrawalWhitelistPage.tsx':
    'Web route adapter; AddressBookPage owns the page layout.',
};

interface PageInventoryEntry {
  path: string;
}

function pageLayoutUsage(filePath: string) {
  const source = readFileSync(path.join(REPO_ROOT, filePath), 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const used = new Set<string>();

  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const name = node.tagName.getText(sourceFile);
      if (name === 'PageLayout' || name === 'PageContent') used.add(name);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return {
    hasPageLayout: used.has('PageLayout'),
    hasPageContent: used.has('PageContent'),
  };
}

describe('frontend page layout contract', () => {
  const inventory = JSON.parse(readFileSync(INVENTORY_PATH, 'utf8')) as {
    pages: PageInventoryEntry[];
  };
  const inventoryPaths = new Set(inventory.pages.map((page) => page.path));

  it('uses shared page primitives or a documented layout owner for every inventoried page', () => {
    const uncovered = inventory.pages.flatMap(({ path: filePath }) => {
      const usage = pageLayoutUsage(filePath);
      if (usage.hasPageLayout && usage.hasPageContent) return [];
      if (LAYOUT_EXCEPTIONS[filePath]) return [];
      return [filePath];
    });

    expect(uncovered).toEqual([]);
  });

  it('keeps layout exceptions current and tied to a concrete owner', () => {
    const staleExceptions = Object.entries(LAYOUT_EXCEPTIONS).flatMap(([filePath, reason]) => {
      const usage = inventoryPaths.has(filePath) ? pageLayoutUsage(filePath) : undefined;
      if (!usage || (usage.hasPageLayout && usage.hasPageContent) || !reason.trim())
        return [filePath];
      return [];
    });

    expect(staleExceptions).toEqual([]);
  });
});
