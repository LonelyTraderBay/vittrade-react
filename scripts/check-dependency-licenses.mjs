import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const policyPath = path.join(root, 'license-policy.json');
const nodeModulesPath = path.join(root, 'node_modules');

const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
const allowedSpdx = new Set(policy.allowedSpdx);
const allowedNonSpdxPatterns = policy.allowedNonSpdxPatterns.map((pattern) => new RegExp(pattern));
const packages = new Map();

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return undefined;
  }
}

function getLicense(manifest) {
  if (typeof manifest.license === 'string') return manifest.license.trim();
  if (Array.isArray(manifest.licenses)) {
    return manifest.licenses
      .map((license) => (typeof license === 'string' ? license : license?.type))
      .filter(Boolean)
      .join(' OR ')
      .trim();
  }
  return '';
}

function isAllowedLicense(license) {
  if (!license) return false;
  if (allowedNonSpdxPatterns.some((pattern) => pattern.test(license))) return true;

  // Hỗ trợ biểu thức SPDX đơn giản dạng AND/OR và ngoặc mà package phổ biến sử dụng.
  const identifiers = license
    .replace(/[()]/g, '')
    .split(/\s+(?:AND|OR)\s+/)
    .map((identifier) => identifier.trim())
    .filter(Boolean);

  return identifiers.length > 0 && identifiers.every((identifier) => allowedSpdx.has(identifier));
}

function inspectPackage(packagePath) {
  const manifestPath = path.join(packagePath, 'package.json');
  const manifest = readJson(manifestPath);
  if (!manifest?.name) return;

  const key = `${manifest.name}@${manifest.version ?? 'unknown'}:${packagePath}`;
  if (packages.has(key)) return;

  const license = getLicense(manifest);
  packages.set(key, {
    name: manifest.name,
    version: manifest.version ?? 'unknown',
    license,
    path: path.relative(root, packagePath),
  });

  scanNodeModules(path.join(packagePath, 'node_modules'));
}

function scanNodeModules(directory) {
  if (!fs.existsSync(directory)) return;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === '.bin') continue;
    const entryPath = path.join(directory, entry.name);

    if (entry.name.startsWith('@')) {
      for (const scopedPackage of fs.readdirSync(entryPath, { withFileTypes: true })) {
        if (scopedPackage.isDirectory()) {
          inspectPackage(path.join(entryPath, scopedPackage.name));
        }
      }
      continue;
    }

    inspectPackage(entryPath);
  }
}

scanNodeModules(nodeModulesPath);

const violations = [...packages.values()].filter((dependency) => !isAllowedLicense(dependency.license));
if (violations.length > 0) {
  console.error('Dependency license gate failed:');
  for (const dependency of violations) {
    console.error(
      `- ${dependency.name}@${dependency.version}: ${dependency.license || 'missing'} (${dependency.path})`,
    );
  }
  process.exit(1);
}

console.log(`Dependency license gate passed: ${packages.size} packages reviewed.`);
