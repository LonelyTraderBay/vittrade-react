import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkDesignSystemDiff,
  createDesignSystemBaseline,
  findNewFindings,
  scanColorCandidates,
  scanPageContentMargins,
} from './check-design-system-diff.mjs';

const temporaryRoots = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function createGitFixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vittrade-design-system-diff-'));
  temporaryRoots.push(root);
  mkdirSync(path.join(root, 'src/features/example'), { recursive: true });
  const file = path.join(root, 'src/features/example/Page.tsx');
  writeFileSync(file, '<div style={{ color: "var(--text)" }} />\n');
  execFileSync('git', ['init', '--quiet'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Design system guard test'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'design-system-guard@example.test'], { cwd: root });
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: root });
  execFileSync('git', ['add', '--all'], { cwd: root });
  execFileSync('git', ['commit', '--quiet', '-m', 'baseline'], { cwd: root });
  const baselineSha = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  return { root, baselineSha, file };
}

describe('Design system commit-differential guard', () => {
  it('detects literal JSX colors in styles, semantic color props, and arbitrary utility classes', () => {
    const source = `
      const Example = () => <>
        <div style={{ color: '#F59E0B', background: 'rgb(12 34 56)', padding: 16 }} />
        <span style={{ color: 'rebeccapurple' }} />
        <PageSection accentColor="#3B82F6" />
        <span className={cn('text-[#ef4444]', active && 'bg-[oklch(0.6 0.2 30)]')} />
        <span className="text-red-500 bg-slate-50" />
      </>;
    `;

    const findings = scanColorCandidates('src/features/example/Example.tsx', source);
    expect(findings.map(({ kind, property }) => `${kind}:${property}`)).toEqual([
      'inline-style-color:color',
      'inline-style-color:background',
      'inline-style-color:color',
      'color-prop-literal:accentColor',
      'arbitrary-color-class:text',
      'arbitrary-color-class:bg',
      'named-color-utility:text',
      'named-color-utility:bg',
    ]);
  });

  it('ignores dynamic values, CSS variable references, and non-color utilities', () => {
    const source = `
      const Example = ({ color, gap }) => (
        <div
          style={{ color, backgroundColor: 'var(--surface)', padding: gap }}
          className={\`text-[\${color}] gap-4\`}
        />
      );
    `;

    expect(scanColorCandidates('src/features/example/Example.tsx', source)).toEqual([]);
  });

  it('detects direct PageContent margins and same-file component-root margins', () => {
    const source = `
      function Hero() {
        return <section className="my-4">Hero</section>;
      }
      function Example() {
        return (
          <PageContent>
            <>
              <div className="md:mt-[22px]"><p className="mb-8">Nested</p></div>
              <div style={{ marginTop: 12 }}>Inline spacing</div>
              <aside className="-mx-2" style={{ marginInlineStart: 6 }}>Horizontal offset</aside>
            </>
            <Hero />
          </PageContent>
        );
      }
    `;

    const findings = scanPageContentMargins('src/features/example/Example.tsx', source);
    expect(findings.map(({ kind, property, value }) => `${kind}:${property}:${value}`)).toEqual([
      'page-content-direct-child-margin:className:mt-[22px]',
      'page-content-direct-child-margin:marginTop:12',
      'page-content-direct-child-margin:className:-mx-2',
      'page-content-direct-child-margin:marginInlineStart:6',
      'page-content-local-component-root-margin:className:my-4',
    ]);
  });

  it('preserves flex auto spacing, zero margins, nested child spacing, and semantic gap classes', () => {
    const source = `
      function Example() {
        return (
          <PageContent className="gap-4">
            <div className="mt-auto mt-0 -mb-0 mx-0"><p className="mb-4">Nested</p></div>
            <div style={{ marginTop: 0, marginBottom: 'auto' }} />
          </PageContent>
        );
      }
    `;

    expect(scanPageContentMargins('src/features/example/Example.tsx', source)).toEqual([]);
  });

  it('fails only for per-file finding increases and allows an unchanged or reduced baseline', () => {
    const baseline = `<div style={{ color: '#fff' }} className="text-[#123]" />`;
    const unchanged = `<div style={{ color: '#fff' }} className="text-[#123]" />`;
    const reduced = `<div style={{ color: 'var(--text)' }} className="text-primary" />`;
    const increased = `<div style={{ color: '#fff' }} className="text-[#123] bg-[#456]" />`;

    expect(findNewFindings('src/features/example/Example.tsx', baseline, unchanged)).toEqual([]);
    expect(findNewFindings('src/features/example/Example.tsx', baseline, reduced)).toEqual([]);
    expect(findNewFindings('src/features/example/Example.tsx', baseline, increased)).toHaveLength(
      1,
    );
    expect(findNewFindings('src/features/example/NewPage.tsx', '', baseline)).toHaveLength(2);
  });

  it('checks modified, new, and imported child components against the measured baseline', () => {
    const { root, baselineSha, file } = createGitFixture();
    const baseline = createDesignSystemBaseline({ root, sourceHead: baselineSha });
    writeFileSync(
      file,
      'import { SharedRow } from "./Shared";\n<PageContent><div style={{ color: "#ef4444" }} className="mt-4" /><SharedRow /></PageContent>\n',
    );
    writeFileSync(
      path.join(root, 'src/features/example/Shared.tsx'),
      'export function SharedRow() { return <section className="mt-6" />; }\n',
    );
    writeFileSync(
      path.join(root, 'src/features/example/NewPage.tsx'),
      '<div className="text-[#123456]" />\n',
    );

    const result = checkDesignSystemDiff({ root, baseline });
    expect(result.passed).toBe(false);
    expect(result.filesScanned).toBe(3);
    expect(result.baselineSourceHead).toBe(baselineSha);
    expect(result.findings.map(({ kind }) => kind)).toEqual([
      'arbitrary-color-class',
      'inline-style-color',
      'page-content-direct-child-margin',
      'page-content-imported-component-root-margin',
    ]);
    expect(result.findings.map(({ kind, file }) => `${kind}:${file}`)).toEqual([
      'arbitrary-color-class:src/features/example/NewPage.tsx',
      'inline-style-color:src/features/example/Page.tsx',
      'page-content-direct-child-margin:src/features/example/Page.tsx',
      'page-content-imported-component-root-margin:src/features/example/Shared.tsx',
    ]);
  });

  it('does not add candidates from dependency source outside the first-party src scope', () => {
    const { root, baselineSha, file } = createGitFixture();
    const baseline = createDesignSystemBaseline({ root, sourceHead: baselineSha });
    mkdirSync(path.join(root, 'node_modules/vendor'), { recursive: true });
    writeFileSync(
      file,
      'import { VendorRow } from "../../../node_modules/vendor/ThirdParty";\n<PageContent><VendorRow /></PageContent>\n',
    );
    writeFileSync(
      path.join(root, 'node_modules/vendor/ThirdParty.tsx'),
      'export function VendorRow() { return <section className="mt-6" />; }\n',
    );

    const result = checkDesignSystemDiff({ root, baseline });
    expect(result.passed).toBe(true);
    expect(result.filesScanned).toBe(1);
    expect(result.findings).toEqual([]);
  });

  it('passes the checked-in UI source against the pinned C06.10 baseline', () => {
    const result = checkDesignSystemDiff();
    expect(result.passed, JSON.stringify(result.findings, null, 2)).toBe(true);
    expect(result.findings).toEqual([]);
  });
});
