import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidenceDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(evidenceDir, '../../../../../');
const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'vittrade-a05-prod-'));
const envDir = path.join(tempRoot, 'empty-env');
const outDir = path.join(tempRoot, 'dist');
const configPath = path.join(projectRoot, `.vite-a05-prod-${randomUUID()}.config.mjs`);
const buildLogPath = path.join(evidenceDir, 'production-build.log');
const mockGateLogPath = path.join(evidenceDir, 'production-mock-gate.log');
const bundleGateLogPath = path.join(evidenceDir, 'bundle-budget.log');
const measurementsPath = path.join(evidenceDir, 'production-bundle-measurements.json');
const markerReportPath = path.join(evidenceDir, 'production-marker-scan.json');

async function collectFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(entryPath)));
    else files.push(entryPath);
  }
  return files;
}

function runNode(script, args, cwd, env) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd,
    env,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  return {
    exitCode: result.status ?? 1,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
    error: result.error?.message,
  };
}

await mkdir(envDir);
const quote = (value) => JSON.stringify(value.replaceAll('\\', '/'));
const config = `import { mergeConfig } from 'vite';
import baseConfig from './vite.config.ts';

export default mergeConfig(baseConfig, {
  envDir: ${quote(envDir)},
  build: { outDir: ${quote(outDir)}, emptyOutDir: true },
});
`;

const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (key.startsWith('VITE_')) delete env[key];
}
Object.assign(env, {
  VITE_DATA_SOURCE: 'api',
  VITE_API_BASE_URL: 'https://api.example.invalid',
  VITE_WS_URL: 'wss://ws.example.invalid',
  VITE_ANALYTICS_ENABLED: 'false',
  VITE_DEVTOOLS_ENABLED: 'false',
});

let build;
let mockGate;
let bundleGate;
let markerReport;
let measurements;

try {
  await writeFile(configPath, config, 'utf8');
  build = runNode(
    path.join(projectRoot, 'scripts/build.mjs'),
    ['--config', configPath],
    projectRoot,
    env,
  );
  await writeFile(buildLogPath, `${build.output}\nexitCode=${build.exitCode}\n`, 'utf8');
  if (build.error) throw new Error(`Build process failed to start: ${build.error}`);
  if (build.exitCode !== 0)
    throw new Error(`Production build exited ${build.exitCode}. See production-build.log.`);

  mockGate = runNode(
    path.join(projectRoot, 'scripts/check-production-mocks.mjs'),
    [],
    tempRoot,
    env,
  );
  bundleGate = runNode(
    path.join(projectRoot, 'scripts/check-bundle-budget.mjs'),
    [],
    tempRoot,
    env,
  );
  await writeFile(mockGateLogPath, `${mockGate.output}\nexitCode=${mockGate.exitCode}\n`, 'utf8');
  await writeFile(
    bundleGateLogPath,
    `${bundleGate.output}\nexitCode=${bundleGate.exitCode}\n`,
    'utf8',
  );

  const files = await collectFiles(outDir);
  const jsFiles = files.filter((file) => /\.m?js$/i.test(file));
  const chunks = await Promise.all(
    jsFiles.map(async (file) => {
      const bytes = await readFile(file);
      return {
        file: path.relative(outDir, file).replaceAll('\\', '/'),
        rawBytes: bytes.byteLength,
        gzipBytes: gzipSync(bytes, { level: 9 }).byteLength,
      };
    }),
  );
  const assetJavaScriptChunks = chunks.filter(
    (chunk) => chunk.file.startsWith('assets/') && chunk.file.endsWith('.js'),
  );
  const forbiddenMarkers = [
    'Preview-123!',
    'developer@vittrade.local',
    'mfa@vittrade.local',
    'locked@vittrade.local',
    'demo@vittrade.vn',
    'wrong@test.com',
    'device@test.com',
    'Trải nghiệm Demo',
    'Đăng nhập Demo',
    'Demo flows:',
    'DỮ LIỆU MÔ PHỎNG',
    'msw/browser',
    'setupWorker',
  ];
  const markerFindings = [];
  for (const file of jsFiles) {
    const contents = await readFile(file, 'utf8');
    for (const marker of forbiddenMarkers) {
      if (contents.includes(marker)) {
        markerFindings.push({ file: path.relative(outDir, file).replaceAll('\\', '/'), marker });
      }
    }
  }
  const workerAssets = files
    .filter((file) => path.basename(file) === 'mockServiceWorker.js')
    .map((file) => ({ file: path.relative(outDir, file).replaceAll('\\', '/'), bytes: 0 }));
  const developmentControlChunkFiles = files
    .filter((file) => /(?:^|[/\\])PreviewControls(?:-[^/\\]+)?\.m?js$/i.test(file))
    .map((file) => path.relative(outDir, file).replaceAll('\\', '/'));
  for (const worker of workerAssets) {
    worker.bytes = (await readFile(path.join(outDir, worker.file))).byteLength;
  }
  markerReport = {
    checkedJavaScriptFiles: jsFiles.length,
    checkedMarkers: forbiddenMarkers,
    findings: markerFindings,
    copiedMockWorkerAssets: workerAssets,
    developmentControlChunkFiles,
  };
  await writeFile(markerReportPath, `${JSON.stringify(markerReport, null, 2)}\n`, 'utf8');

  measurements = {
    observedAt: new Date().toISOString(),
    sourceHead: spawnSync('git', ['rev-parse', 'HEAD'], {
      cwd: projectRoot,
      encoding: 'utf8',
    }).stdout.trim(),
    node: process.version,
    vite: JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8')).devDependencies
      .vite,
    dataSource: 'api',
    apiBase: 'https://api.example.invalid',
    dotenvDirectory: envDir,
    outputDirectory: outDir,
    outputPreservedInTemp: true,
    buildExitCode: build.exitCode,
    productionMockGate: { exitCode: mockGate.exitCode, output: mockGate.output.trim() },
    bundleBudgetGate: { exitCode: bundleGate.exitCode, output: bundleGate.output.trim() },
    allOutputFiles: files.length,
    allOutputBytes: (
      await Promise.all(files.map(async (file) => (await readFile(file)).byteLength))
    ).reduce((sum, bytes) => sum + bytes, 0),
    scriptFiles: chunks.sort((a, b) => b.rawBytes - a.rawBytes),
    totalScriptRawBytes: chunks.reduce((sum, chunk) => sum + chunk.rawBytes, 0),
    sumOfPerScriptGzipBytes: chunks.reduce((sum, chunk) => sum + chunk.gzipBytes, 0),
    assetJavaScriptChunkCount: assetJavaScriptChunks.length,
    assetJavaScriptRawBytes: assetJavaScriptChunks.reduce((sum, chunk) => sum + chunk.rawBytes, 0),
    assetJavaScriptSumOfPerChunkGzipBytes: assetJavaScriptChunks.reduce(
      (sum, chunk) => sum + chunk.gzipBytes,
      0,
    ),
    markerScanFindings: markerFindings,
    copiedMockWorkerAssets: workerAssets,
    developmentControlChunkFiles,
  };
  await writeFile(measurementsPath, `${JSON.stringify(measurements, null, 2)}\n`, 'utf8');

  console.log(`Isolated production output: ${outDir}`);
  console.log(
    `Build: ${build.exitCode}; production mock gate: ${mockGate.exitCode}; bundle budget gate: ${bundleGate.exitCode}`,
  );
  console.log(
    `Production scripts scanned: ${chunks.length}; asset JS chunks: ${measurements.assetJavaScriptChunkCount}; asset JS raw total: ${measurements.assetJavaScriptRawBytes} bytes; sum gzip: ${measurements.assetJavaScriptSumOfPerChunkGzipBytes} bytes`,
  );
  console.log(
    `Production marker findings: ${markerFindings.length}; copied mock worker assets: ${workerAssets.length}; preview chunks: ${developmentControlChunkFiles.length}`,
  );
  if (
    markerFindings.length > 0 ||
    developmentControlChunkFiles.length > 0 ||
    mockGate.exitCode !== 0 ||
    bundleGate.exitCode !== 0
  ) {
    process.exitCode = 1;
  }
} finally {
  const resolvedRoot = path.resolve(projectRoot);
  const resolvedConfig = path.resolve(configPath);
  if (
    path.dirname(resolvedConfig) === resolvedRoot &&
    path.basename(resolvedConfig).startsWith('.vite-a05-prod-')
  ) {
    await rm(resolvedConfig, { force: true });
  }
}
