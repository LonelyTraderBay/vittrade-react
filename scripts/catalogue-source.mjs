import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceContentHash } from './source-content.mjs';

// Bind reviewed working-tree bytes without creating commits or Git objects.
const root = fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const trackingPath = path.join(root, 'docs/architecture/production-readiness/TRACKING.json');
const args = process.argv.slice(2);
if (args[0] !== '--evidence' || !args[1] || args.length < 3)
  throw new Error('Use --evidence <existing-evidence-id> <repository-relative-file> [...files].');
const evidenceId = args[1];
const tracking = JSON.parse(fs.readFileSync(trackingPath, 'utf8'));
if (!tracking.evidence.some((item) => item.id === evidenceId))
  throw new Error('Unknown evidence ID: ' + evidenceId);
const records = new Map(tracking.files.map((file) => [file.path, file]));
const reviewed = [...new Set(args.slice(2))].map((input) => {
  if (path.isAbsolute(input)) throw new Error('Expected a repository-relative file: ' + input);
  const absolute = path.resolve(root, input);
  const relative = path.relative(root, absolute);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative))
    throw new Error('File is outside the repository: ' + input);
  const file = relative.split(path.sep).join('/');
  if (absolute === trackingPath)
    throw new Error('TRACKING uses the checker-current-file audit basis.');
  let ancestor = root;
  for (const segment of relative.split(path.sep)) {
    ancestor = path.join(ancestor, segment);
    if (fs.lstatSync(ancestor).isSymbolicLink()) throw new Error('Refusing linked path: ' + file);
  }
  if (!fs.statSync(absolute).isFile()) throw new Error('Expected a regular file: ' + file);
  const record = records.get(file);
  if (!record || record.lifecycle !== 'active')
    throw new Error('Map this active file to its task/step before cataloguing: ' + file);
  const allowGitTextLf =
    record.executionScope?.role === 'protected_instruction' &&
    tracking.executionPlan?.protectedPaths?.includes(file);
  const normalization = allowGitTextLf ? 'git-text-lf' : undefined;
  return {
    file,
    record,
    normalization,
    sha256: sourceContentHash(fs.readFileSync(absolute), { normalization, allowGitTextLf }),
  };
});
const updated = [];
const now = new Date().toISOString();
for (const { file, record, sha256, normalization } of reviewed) {
  if (
    record.cataloguedContentSha256 === sha256 &&
    record.cataloguedContentNormalization === normalization &&
    !record.cataloguedSourceHead &&
    !record.cataloguedSha256 &&
    record.evidenceIds.includes(evidenceId)
  )
    continue;
  const previous = record.cataloguedContentSha256
    ? {
        contentSha256: record.cataloguedContentSha256,
        ...(record.cataloguedContentNormalization
          ? { normalization: record.cataloguedContentNormalization }
          : {}),
      }
    : record.cataloguedSourceHead && record.cataloguedSha256
      ? { sourceHead: record.cataloguedSourceHead, sha256: record.cataloguedSha256 }
      : null;
  if (
    previous &&
    (record.cataloguedContentSha256 !== sha256 ||
      record.cataloguedContentNormalization !== normalization)
  ) {
    record.cataloguedSourceHistory ??= [];
    record.cataloguedSourceHistory.push({
      ...previous,
      supersededAt: now,
      evidenceId,
      reason: 'Preserve the previous catalogue binding before recording reviewed content bytes.',
    });
  }
  record.cataloguedSourceHead = null;
  record.cataloguedSha256 = null;
  record.cataloguedContentSha256 = sha256;
  if (normalization) record.cataloguedContentNormalization = normalization;
  else delete record.cataloguedContentNormalization;
  record.cataloguedAt = now;
  if (!record.evidenceIds.includes(evidenceId)) record.evidenceIds.push(evidenceId);
  updated.push(file);
}
if (updated.length) fs.writeFileSync(trackingPath, JSON.stringify(tracking, null, 2) + '\n');
console.log(JSON.stringify({ updated, unchanged: reviewed.length - updated.length }, null, 2));
