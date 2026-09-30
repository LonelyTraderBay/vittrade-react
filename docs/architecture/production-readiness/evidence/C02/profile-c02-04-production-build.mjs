import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const args = process.argv.slice(2);
const getArgument = (name) => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};

const distDirectory = path.resolve(getArgument('--dist') ?? 'dist');
const reportPath = getArgument('--out');
if (!reportPath)
  throw new Error(
    'Usage: node profile-c02-04-production-build.mjs --dist <build-dir> --out <report.json>',
  );

const manifestPath = path.join(distDirectory, '.vite', 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const hash = (contents) => createHash('sha256').update(contents).digest('hex');

async function collectFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(absolutePath, relativePath)));
    else if (entry.isFile()) files.push(relativePath);
  }
  return files;
}

function measure(contents) {
  return {
    rawBytes: contents.byteLength,
    gzip9Bytes: gzipSync(contents, { level: 9 }).byteLength,
    brotliQuality11Bytes: brotliCompressSync(contents, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).byteLength,
  };
}

function collectStaticFiles(rootKey) {
  const visited = new Set();
  const files = new Set();
  const visit = (key) => {
    if (visited.has(key)) return;
    visited.add(key);
    const item = manifest[key];
    if (!item) throw new Error(`Manifest entry not found: ${key}`);
    if (item.file && /\.(?:js|css)$/.test(item.file)) files.add(item.file);
    for (const cssFile of item.css ?? []) files.add(cssFile);
    for (const importedKey of item.imports ?? []) visit(importedKey);
  };
  visit(rootKey);
  return [...files].sort();
}

async function measureFiles(files) {
  const totals = { rawBytes: 0, gzip9Bytes: 0, brotliQuality11Bytes: 0 };
  const measured = [];
  for (const file of files) {
    const contents = await readFile(path.join(distDirectory, file));
    const sizes = measure(contents);
    for (const key of Object.keys(totals)) totals[key] += sizes[key];
    measured.push({ file, ...sizes, sha256: hash(contents) });
  }
  return { totals, files: measured };
}

async function collectJavaScriptFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory())
      files.push(...(await collectJavaScriptFiles(absolutePath, relativePath)));
    else if (entry.name.endsWith('.js')) files.push(relativePath);
  }
  return files;
}

const shellEntryKey = 'index.html';
const shellFiles = await measureFiles(collectStaticFiles(shellEntryKey));
const journeys = [
  {
    name: 'Login form',
    route: '/w/auth/login',
    entryKey: 'src/features/auth/pages/WebLoginPage.tsx',
  },
  {
    name: 'Markets overview',
    route: '/w/markets/overview',
    entryKey: 'src/features/market/pages/MarketOverviewPage.tsx',
  },
  {
    name: 'Trading terminal',
    route: '/w/trade/btcusdt',
    entryKey: 'src/features/trading/pages/TradePage.tsx',
  },
  {
    name: 'Wallet overview',
    route: '/w/wallet',
    entryKey: 'src/features/wallet/pages/WalletOverviewContractPage.tsx',
  },
  {
    name: 'P2P order detail',
    route: '/w/p2p/order/p2p001',
    entryKey: 'src/features/p2p/pages/P2PEscrowDetailPage.tsx',
  },
  {
    name: 'DCA savings',
    route: '/w/earn/savings/dca',
    entryKey: 'src/features/dca/pages/SavingsDCAContractPage.tsx',
  },
];

const journeyProfiles = [];
for (const journey of journeys) {
  const routeFiles = collectStaticFiles(journey.entryKey);
  const fullFiles = [
    ...new Set([...shellFiles.files.map(({ file }) => file), ...routeFiles]),
  ].sort();
  const routeOnlyFiles = routeFiles.filter(
    (file) => !shellFiles.files.some((shellFile) => shellFile.file === file),
  );
  const [fullGraph, routeOnly] = await Promise.all([
    measureFiles(fullFiles),
    measureFiles(routeOnlyFiles),
  ]);
  journeyProfiles.push({
    ...journey,
    entryFile: manifest[journey.entryKey]?.file,
    fullGraph,
    additionalRouteFiles: routeOnly,
  });
}

const assetDirectory = path.join(distDirectory, 'assets');
const jsFiles = await collectJavaScriptFiles(assetDirectory, 'assets');
const jsAssets = [];
for (const file of jsFiles) {
  const contents = await readFile(path.join(distDirectory, file));
  jsAssets.push({ file, ...measure(contents), sha256: hash(contents) });
}
jsAssets.sort((left, right) => right.rawBytes - left.rawBytes);

const buildInputs = await Promise.all([
  readFile(manifestPath),
  readFile(path.join(distDirectory, 'index.html')),
]);
const sourcePaths = [];
for (const directory of ['src', 'public']) {
  try {
    sourcePaths.push(
      ...(await collectFiles(directory)).map((file) => path.posix.join(directory, file)),
    );
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}
for (const file of [
  'index.html',
  'vite.config.ts',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'scripts/build.mjs',
]) {
  try {
    await stat(file);
    sourcePaths.push(file);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}
sourcePaths.sort();
const sourceFingerprint = createHash('sha256');
for (const file of sourcePaths) {
  sourceFingerprint
    .update(file)
    .update('\0')
    .update(await readFile(file))
    .update('\0');
}
const artifactFiles = await readdir(distDirectory, { withFileTypes: true });
const artifactNames = artifactFiles.map(({ name }) => name).sort();
const report = {
  schemaVersion: 1,
  capturedAt: new Date().toISOString(),
  sourceHead: process.env.C02_SOURCE_HEAD ?? 'not-recorded',
  branch: process.env.C02_SOURCE_BRANCH ?? 'not-recorded',
  build: {
    command: 'node scripts/build.mjs --outDir <isolated-temp-dir> --manifest',
    outputDirectory: '<isolated-temp-dir>',
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    sourceWorktree: 'dirty; sourceHead identifies HEAD but the build includes local modifications',
    sourceSnapshot: {
      algorithm:
        'SHA-256 over sorted relative file paths, NUL separators, and raw file bytes for src/, public/, index.html, vite.config.ts, package manifests, TypeScript configs, and scripts/build.mjs.',
      fileCount: sourcePaths.length,
      sha256: sourceFingerprint.digest('hex'),
      excludes: ['.env files and process environment values', 'generated output', 'node_modules'],
    },
    manifestSha256: hash(buildInputs[0]),
    htmlSha256: hash(buildInputs[1]),
    topLevelArtifacts: artifactNames,
    manifestEntries: Object.keys(manifest).length,
  },
  method: {
    raw: 'File byteLength.',
    gzip: 'Node gzipSync level 9 per file, matching scripts/check-bundle-budget.mjs.',
    brotli:
      'Node brotliCompressSync quality 11 per file; estimate only, no deployed server encoding was measured.',
    routeGraph:
      'Sum of manifest entry plus transitive static-import JS/CSS files for index.html and route entry; shared files counted once. Dynamic imports from the route entry are excluded.',
    limitations:
      'Build artifact/manifest estimate only. Does not measure HTML request timing, server headers/encoding, actual browser cache or transfer, parse/execute cost, runtime CWV, backend latency, or production RUM.',
  },
  existingChunkGate: {
    source: 'scripts/check-bundle-budget.mjs',
    maxRawBytesExclusive: 500000,
    maxGzipBytesExclusive: 250 * 1024,
    jsChunkCount: jsAssets.length,
    failures: jsAssets.filter((asset) => asset.rawBytes > 500000 || asset.gzip9Bytes > 250 * 1024),
  },
  totals: {
    javascript: jsAssets.reduce(
      (sum, asset) => {
        sum.rawBytes += asset.rawBytes;
        sum.gzip9Bytes += asset.gzip9Bytes;
        sum.brotliQuality11Bytes += asset.brotliQuality11Bytes;
        return sum;
      },
      { rawBytes: 0, gzip9Bytes: 0, brotliQuality11Bytes: 0 },
    ),
    css: await measureFiles(
      Object.keys(manifest)
        .flatMap((key) => manifest[key].css ?? [])
        .filter((file, index, all) => all.indexOf(file) === index),
    ),
    mockServiceWorker: await measureFiles(
      await stat(path.join(distDirectory, 'mockServiceWorker.js'))
        .then(() => ['mockServiceWorker.js'])
        .catch(() => []),
    ),
  },
  initialShellGraph: shellFiles,
  journeys: journeyProfiles,
  largestJavascriptChunks: jsAssets.slice(0, 20),
  javascriptAssets: jsAssets,
};

await writeFile(path.resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(
  JSON.stringify(
    {
      reportPath: path.resolve(reportPath),
      jsChunkCount: jsAssets.length,
      gateFailures: report.existingChunkGate.failures.length,
      javascriptTotals: report.totals.javascript,
      shellGraph: shellFiles.totals,
      journeySizes: journeyProfiles.map(({ name, fullGraph, additionalRouteFiles }) => ({
        name,
        routeGraph: fullGraph.totals,
        routeAddition: additionalRouteFiles.totals,
      })),
      largestChunks: jsAssets
        .slice(0, 10)
        .map(({ file, rawBytes, gzip9Bytes, brotliQuality11Bytes }) => ({
          file,
          rawBytes,
          gzip9Bytes,
          brotliQuality11Bytes,
        })),
    },
    null,
    2,
  ),
);
