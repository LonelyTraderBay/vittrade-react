import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SOURCE_ROOT = path.join(REPO_ROOT, 'src');
// Current parsed CSS contains 95 `[class*=...]` selector fragments across src.
const LEGACY_CLASS_SHAPE_SELECTOR_BASELINE = 95;

// Measured debt only; shrink this baseline in C06.14/C06.15 when consumers migrate.
const ALLOWED_LEGACY_TYPOGRAPHY_CONSUMERS = [
  'src/features/market/components/MarketItem.tsx',
  'src/features/market/pages/MarketListPage.tsx',
  'src/features/market/components/MarketListSections.tsx',
  'src/features/trading/components/OCOOrderForm.tsx',
];

const ALLOWED_CTA_COLOR_OVERRIDE_CONSUMERS = [
  'src/features/wallet/pages/WalletTransactionHistoryContractPage.tsx',
];

const ALLOWED_FIBONACCI_SPACING_CONSUMERS = [
  'src/app/components/onboarding/Coachmark.tsx',
  'src/features/p2p/pages/P2PFraudPreventionPage.tsx',
];

function collectSourceFiles(directory: string, extension: '.ts' | '.tsx' | '.css'): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') return [];
      return collectSourceFiles(filePath, extension);
    }
    if (!entry.isFile() || !filePath.endsWith(extension) || filePath.includes('.test.')) return [];
    return [filePath];
  });
}

function normalizedSourcePath(filePath: string) {
  return path.relative(REPO_ROOT, filePath).replaceAll(path.sep, '/');
}

function legacyTokenConsumers() {
  const typography: string[] = [];
  const fibonacciSpacing: string[] = [];
  const ctaOverrides: string[] = [];

  for (const filePath of [
    ...collectSourceFiles(SOURCE_ROOT, '.ts'),
    ...collectSourceFiles(SOURCE_ROOT, '.tsx'),
  ]) {
    const relativePath = normalizedSourcePath(filePath);
    if (relativePath.startsWith('src/dev/legacy/')) continue;

    const source = readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      filePath,
      source,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    const ctaNames = new Set<string>();
    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
        continue;
      const modulePath = statement.moduleSpecifier.text.replaceAll('\\', '/');
      if (
        modulePath.endsWith('/legacyTypography') ||
        modulePath === '@/shared/theme/legacyTypography'
      ) {
        typography.push(relativePath);
      }

      const bindings = statement.importClause?.namedBindings;
      if (modulePath.endsWith('/CTAButton') && bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          if ((element.propertyName ?? element.name).text === 'CTAButton')
            ctaNames.add(element.name.text);
        }
      }
      if (!modulePath.endsWith('/golden') || !bindings || !ts.isNamedImports(bindings)) continue;
      if (
        bindings.elements.some(
          (element) => (element.propertyName ?? element.name).text === 'φSpace',
        )
      ) {
        fibonacciSpacing.push(relativePath);
      }
    }

    const visit = (node: ts.Node) => {
      if (
        (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
        ctaNames.has(node.tagName.getText(sourceFile)) &&
        node.attributes.properties.some(
          (attribute) =>
            ts.isJsxAttribute(attribute) &&
            ['bg', 'textColor'].includes(attribute.name.getText(sourceFile)),
        )
      ) {
        ctaOverrides.push(relativePath);
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  return {
    ctaOverrides: ctaOverrides.sort(),
    typography: typography.sort(),
    fibonacciSpacing: fibonacciSpacing.sort(),
  };
}

function classShapeSelectorCount() {
  let count = 0;
  for (const filePath of collectSourceFiles(SOURCE_ROOT, '.css')) {
    const stylesheet = postcss.parse(readFileSync(filePath, 'utf8'), { from: filePath });
    stylesheet.walkRules((rule) => {
      count += rule.selector.match(/\[\s*class\s*[*^$~|]?=/g)?.length ?? 0;
    });
  }
  return count;
}

describe('design-system legacy guardrails', () => {
  it('does not add consumers of legacy typography or Fibonacci spacing tokens', () => {
    const consumers = legacyTokenConsumers();

    expect(consumers.typography).toEqual([...ALLOWED_LEGACY_TYPOGRAPHY_CONSUMERS].sort());
    expect(consumers.fibonacciSpacing).toEqual(ALLOWED_FIBONACCI_SPACING_CONSUMERS);
    expect(consumers.ctaOverrides).toEqual(ALLOWED_CTA_COLOR_OVERRIDE_CONSUMERS);
  });

  it('does not increase global CSS selectors that infer behavior from class shapes', () => {
    expect(classShapeSelectorCount()).toBeLessThanOrEqual(LEGACY_CLASS_SHAPE_SELECTOR_BASELINE);
  });
});
