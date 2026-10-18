import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ts = createRequire(path.join(repositoryRoot, 'package.json'))('typescript');

export const DESIGN_SYSTEM_GUARD_BASELINE_FILE = 'scripts/design-system-guard-baseline.json';

const COLOR_STYLE_PROPERTIES = new Set([
  'accentColor',
  'background',
  'backgroundColor',
  'borderColor',
  'caretColor',
  'columnRuleColor',
  'color',
  'fill',
  'outlineColor',
  'stopColor',
  'stroke',
  'textDecorationColor',
]);
const COLOR_PROP_ATTRIBUTES = new Set([
  'accentColor',
  'backgroundColor',
  'borderColor',
  'color',
  'fill',
  'stroke',
  'stopColor',
]);
const COLOR_LITERAL =
  /#[\da-f]{3,8}(?![\da-f])|\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix)\s*\(/i;
const ARBITRARY_COLOR_CLASS =
  /\b(?:text|bg|border|outline|ring|fill|stroke|from|via|to)-\[\s*(?:#(?:[\da-f]{3,8})(?![\da-f])|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix)\s*\([^)]*\))[^\]]*\]/gi;
const NAMED_COLOR_UTILITY =
  /\b(?:text|bg|border|outline|ring|fill|stroke|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white|transparent|current|inherit)(?:-(?:50|100|200|300|400|500|600|700|800|900|950))?(?:\/\d+(?:\.\d+)?)?/gi;
const CSS_COLOR_NAMES = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgrey darkgreen darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray grey green greenyellow honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgrey lightgreen lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen transparent`.split(
    /\s+/,
  ),
);
const MARGIN_STYLE_PROPERTIES = new Set([
  'margin',
  'marginBlock',
  'marginBlockEnd',
  'marginBlockStart',
  'marginBottom',
  'marginInline',
  'marginInlineEnd',
  'marginInlineStart',
  'marginLeft',
  'marginRight',
  'marginTop',
]);
const SOURCE_ROOT = 'src';

function normalizePath(value) {
  return value.split(path.sep).join('/');
}

function git(root, args, options = {}) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    ...options,
  });
}

function getStaticStringSegments(node, sourceFile) {
  const values = [];
  const visit = (current) => {
    if (ts.isStringLiteralLike(current)) {
      values.push({
        value: current.text,
        line: sourceFile.getLineAndCharacterOfPosition(current.getStart(sourceFile)).line + 1,
      });
      return;
    }
    if (ts.isTemplateExpression(current)) {
      values.push({
        value: current.head.text,
        line: sourceFile.getLineAndCharacterOfPosition(current.getStart(sourceFile)).line + 1,
      });
      for (const span of current.templateSpans) {
        values.push({
          value: span.literal.text,
          line:
            sourceFile.getLineAndCharacterOfPosition(span.literal.getStart(sourceFile)).line + 1,
        });
      }
      return;
    }
    ts.forEachChild(current, visit);
  };
  if (node) visit(node);
  return values;
}

function getJsxAttributes(element, sourceFile) {
  const attributes = ts.isJsxElement(element)
    ? element.openingElement.attributes
    : element.attributes;
  return attributes.properties.filter(ts.isJsxAttribute).map((attribute) => ({
    name: attribute.name.getText(sourceFile),
    node: attribute,
  }));
}

function getPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text;
  return null;
}

function addFinding(findings, file, line, kind, property, value) {
  const normalizedValue = String(value).trim().toLowerCase();
  const fingerprint = `${kind}|${property}|${normalizedValue}`;
  findings.push({ file, line, kind, property, value: String(value).trim(), fingerprint });
}

function isColorLiteral(value) {
  return COLOR_LITERAL.test(value) || CSS_COLOR_NAMES.has(value.trim().toLowerCase());
}

export function scanColorCandidates(filePath, source) {
  const file = normalizePath(filePath);
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const findings = [];

  const visit = (node) => {
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sourceFile);
      const initializer = node.initializer;
      if (
        name === 'style' &&
        initializer &&
        ts.isJsxExpression(initializer) &&
        initializer.expression &&
        ts.isObjectLiteralExpression(initializer.expression)
      ) {
        for (const property of initializer.expression.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const key = getPropertyName(property.name);
          const value = property.initializer;
          if (
            !key ||
            !COLOR_STYLE_PROPERTIES.has(key) ||
            !ts.isStringLiteralLike(value) ||
            !isColorLiteral(value.text)
          )
            continue;
          const line =
            sourceFile.getLineAndCharacterOfPosition(value.getStart(sourceFile)).line + 1;
          addFinding(findings, file, line, 'inline-style-color', key, value.text);
        }
      }

      if (name === 'className' && initializer) {
        for (const segment of getStaticStringSegments(
          ts.isJsxExpression(initializer) ? initializer.expression : initializer,
          sourceFile,
        )) {
          for (const match of segment.value.matchAll(ARBITRARY_COLOR_CLASS)) {
            addFinding(
              findings,
              file,
              segment.line,
              'arbitrary-color-class',
              match[0].slice(0, match[0].indexOf('-[')),
              match[0],
            );
          }
          for (const match of segment.value.matchAll(NAMED_COLOR_UTILITY)) {
            const utility = match[0].slice(0, match[0].indexOf('-'));
            addFinding(findings, file, segment.line, 'named-color-utility', utility, match[0]);
          }
        }
      }

      if (COLOR_PROP_ATTRIBUTES.has(name) && initializer) {
        const literalNodes = ts.isJsxExpression(initializer) ? initializer.expression : initializer;
        for (const segment of getStaticStringSegments(literalNodes, sourceFile)) {
          if (!isColorLiteral(segment.value)) continue;
          addFinding(findings, file, segment.line, 'color-prop-literal', name, segment.value);
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return findings;
}

function getClassTokens(expression, sourceFile) {
  return getStaticStringSegments(expression, sourceFile).flatMap(({ value, line }) =>
    value
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => ({ token, line })),
  );
}

function getMarginUtility(token) {
  let depth = 0;
  let lastVariantSeparator = -1;
  for (let index = 0; index < token.length; index += 1) {
    if (token[index] === '[') depth += 1;
    else if (token[index] === ']') depth = Math.max(0, depth - 1);
    else if (token[index] === ':' && depth === 0) lastVariantSeparator = index;
  }
  const utility = token
    .slice(lastVariantSeparator + 1)
    .replace(/^!/, '')
    .replace(/!$/, '');
  const unsignedUtility = utility.startsWith('-') ? utility.slice(1) : utility;
  const match = unsignedUtility.match(/^m(?:[tblrxyse])?-(\d+(?:\.\d+)?(?:\/\d+)?|px|\[[^\]]+\])$/);
  if (!match) return null;
  const value = match[1].replace(/^\[|\]$/g, '');
  if (/^0+(?:\.0+)?(?:px|rem|em|%|vh|vw)?$/.test(value)) return null;
  return utility;
}

function hasNonZeroStaticMargin(value) {
  const trimmed = String(value).trim().toLowerCase();
  if (!trimmed || /\b(?:auto|var|calc|min|max|clamp)\s*\(/.test(trimmed)) return false;
  const parts = trimmed.split(/\s+/);
  if (
    parts.every((part) => /^(?:0+(?:\.0+)?(?:px|rem|em|%|vh|vw)?)$/.test(part) || part === 'auto')
  )
    return false;
  return parts.some(
    (part) => /(?:\d|\])/.test(part) && !/^0+(?:\.0+)?(?:px|rem|em|%|vh|vw)?$/.test(part),
  );
}

function getPageContentNames(sourceFile) {
  const names = new Set(['PageContent']);
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause?.namedBindings) continue;
    const bindings = statement.importClause.namedBindings;
    if (!ts.isNamedImports(bindings)) continue;
    for (const specifier of bindings.elements) {
      if (specifier.propertyName?.text === 'PageContent' || specifier.name.text === 'PageContent')
        names.add(specifier.name.text);
    }
  }
  return names;
}

function getTagIdentifier(node, sourceFile) {
  if (ts.isJsxElement(node)) {
    const tag = node.openingElement.tagName;
    return ts.isIdentifier(tag) ? tag.text : tag.getText(sourceFile);
  }
  if (ts.isJsxSelfClosingElement(node)) {
    const tag = node.tagName;
    return ts.isIdentifier(tag) ? tag.text : tag.getText(sourceFile);
  }
  return null;
}

function getRootElements(expression) {
  if (!expression) return [];
  if (
    ts.isParenthesizedExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isTypeAssertionExpression(expression)
  )
    return getRootElements(expression.expression);
  if (ts.isJsxElement(expression) || ts.isJsxSelfClosingElement(expression)) return [expression];
  if (ts.isJsxFragment(expression))
    return expression.children.flatMap((child) => getRootElements(child));
  if (ts.isJsxExpression(expression)) return getRootElements(expression.expression);
  if (ts.isConditionalExpression(expression))
    return [...getRootElements(expression.whenTrue), ...getRootElements(expression.whenFalse)];
  if (ts.isArrayLiteralExpression(expression))
    return expression.elements.flatMap((element) => getRootElements(element));
  if (ts.isBinaryExpression(expression)) {
    const operator = expression.operatorToken.kind;
    if (
      [
        ts.SyntaxKind.AmpersandAmpersandToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.QuestionQuestionToken,
      ].includes(operator)
    )
      return [...getRootElements(expression.left), ...getRootElements(expression.right)];
  }
  if (ts.isCallExpression(expression)) {
    return expression.arguments.flatMap((argument) => {
      if (!ts.isArrowFunction(argument) && !ts.isFunctionExpression(argument)) return [];
      if (!ts.isBlock(argument.body)) return getRootElements(argument.body);
      return collectReturnRoots(argument.body);
    });
  }
  return [];
}

function collectReturnRoots(body) {
  const roots = [];
  const visit = (node) => {
    if (
      node !== body &&
      (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node))
    )
      return;
    if (ts.isReturnStatement(node)) {
      roots.push(...getRootElements(node.expression));
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(body);
  return roots;
}

function getLocalComponentRoots(sourceFile) {
  const components = new Map();
  const add = (name, body) => {
    if (!/^[A-Z]/.test(name)) return;
    const roots = ts.isBlock(body) ? collectReturnRoots(body) : getRootElements(body);
    if (roots.length > 0) components.set(name, roots);
  };

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && statement.body) {
      add(statement.name.text, statement.body);
      continue;
    }
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      const initializer = declaration.initializer;
      if (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
        add(declaration.name.text, initializer.body);
    }
  }
  return components;
}

function getComponentRootsFromExpression(expression, checker, visited = new Set()) {
  if (!expression) return [];
  if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) {
    return ts.isBlock(expression.body)
      ? collectReturnRoots(expression.body)
      : getRootElements(expression.body);
  }
  if (ts.isCallExpression(expression)) {
    return expression.arguments.flatMap((argument) =>
      getComponentRootsFromExpression(argument, checker, visited),
    );
  }
  if (!ts.isIdentifier(expression) && !ts.isPropertyAccessExpression(expression)) return [];
  let symbol = checker.getSymbolAtLocation(expression);
  if (!symbol) return [];
  try {
    if (symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
  } catch {
    return [];
  }
  const roots = [];
  for (const declaration of symbol.declarations ?? []) {
    if (visited.has(declaration)) continue;
    const nextVisited = new Set(visited).add(declaration);
    if (ts.isFunctionDeclaration(declaration) && declaration.body) {
      roots.push(...collectReturnRoots(declaration.body));
    } else if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
      roots.push(...getComponentRootsFromExpression(declaration.initializer, checker, nextVisited));
    } else if (ts.isClassDeclaration(declaration)) {
      for (const member of declaration.members) {
        if (
          ts.isMethodDeclaration(member) &&
          member.body &&
          getPropertyName(member.name) === 'render'
        )
          roots.push(...collectReturnRoots(member.body));
      }
    }
  }
  return roots;
}

function createProgram(root, files) {
  const configPath = path.join(root, 'tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const options = config.error
    ? {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        target: ts.ScriptTarget.ESNext,
      }
    : ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
  return ts.createProgram({
    rootNames: files.map((file) => path.resolve(root, file)),
    options,
  });
}

function findMarginsOnElement(element, sourceFile, file, origin, findings) {
  const attributes = getJsxAttributes(element, sourceFile);
  for (const attribute of attributes) {
    if (attribute.name === 'className' && attribute.node.initializer) {
      const expression = ts.isJsxExpression(attribute.node.initializer)
        ? attribute.node.initializer.expression
        : attribute.node.initializer;
      for (const { token, line } of getClassTokens(expression, sourceFile)) {
        const utility = getMarginUtility(token);
        if (utility)
          addFinding(findings, file, line, `page-content-${origin}-margin`, 'className', utility);
      }
    }
    if (
      attribute.name === 'style' &&
      attribute.node.initializer &&
      ts.isJsxExpression(attribute.node.initializer) &&
      attribute.node.initializer.expression &&
      ts.isObjectLiteralExpression(attribute.node.initializer.expression)
    ) {
      for (const property of attribute.node.initializer.expression.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const key = getPropertyName(property.name);
        if (!key || !MARGIN_STYLE_PROPERTIES.has(key)) continue;
        const value = property.initializer;
        let staticValue = null;
        if (ts.isNumericLiteral(value)) staticValue = value.text;
        else if (ts.isStringLiteralLike(value)) staticValue = value.text;
        if (staticValue === null || !hasNonZeroStaticMargin(staticValue)) continue;
        const line = sourceFile.getLineAndCharacterOfPosition(value.getStart(sourceFile)).line + 1;
        addFinding(findings, file, line, `page-content-${origin}-margin`, key, staticValue);
      }
    }
  }
}

export function scanPageContentMargins(
  filePath,
  source,
  { checker = null, parsedSourceFile = null, rootPath = repositoryRoot } = {},
) {
  const file = normalizePath(filePath);
  const sourceFile =
    parsedSourceFile ??
    ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const pageContentNames = getPageContentNames(sourceFile);
  const localComponents = getLocalComponentRoots(sourceFile);
  const findings = [];

  const inspectRoot = (root, origin, visited = new Set()) => {
    if (!ts.isJsxElement(root) && !ts.isJsxSelfClosingElement(root)) return;
    const rootSourceFile = root.getSourceFile() ?? sourceFile;
    const rootFile = normalizePath(path.relative(rootPath, rootSourceFile.fileName));
    if (!rootFile.startsWith(`${SOURCE_ROOT}/`)) return;
    findMarginsOnElement(root, rootSourceFile, rootFile, origin, findings);
    const tagName = getTagIdentifier(root, rootSourceFile);
    if (!tagName || visited.has(tagName)) return;
    const componentRoots =
      localComponents.get(tagName) ??
      (checker
        ? getComponentRootsFromExpression(
            ts.isJsxElement(root) ? root.openingElement.tagName : root.tagName,
            checker,
          )
        : []);
    if (componentRoots.length === 0) return;
    const nextVisited = new Set(visited).add(tagName);
    const componentOrigin = localComponents.has(tagName)
      ? 'local-component-root'
      : 'imported-component-root';
    for (const componentRoot of componentRoots)
      inspectRoot(componentRoot, componentOrigin, nextVisited);
  };

  const visit = (node) => {
    if (ts.isJsxElement(node) && pageContentNames.has(getTagIdentifier(node, sourceFile))) {
      for (const child of node.children) {
        for (const root of getRootElements(child)) inspectRoot(root, 'direct-child');
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return findings;
}

export function scanDesignSystemSource(filePath, source) {
  return [...scanColorCandidates(filePath, source), ...scanPageContentMargins(filePath, source)];
}

function fingerprintCounts(findings) {
  const counts = new Map();
  for (const finding of findings)
    counts.set(finding.fingerprint, (counts.get(finding.fingerprint) ?? 0) + 1);
  return counts;
}

export function findNewFindings(file, baselineSource, currentSource) {
  const previous = fingerprintCounts(scanDesignSystemSource(file, baselineSource));
  const current = scanDesignSystemSource(file, currentSource);
  const seen = new Map();
  const introduced = [];
  for (const finding of current) {
    const count = (seen.get(finding.fingerprint) ?? 0) + 1;
    seen.set(finding.fingerprint, count);
    if (count > (previous.get(finding.fingerprint) ?? 0)) introduced.push(finding);
  }
  return introduced;
}

export function collectUiSourceFiles(root = repositoryRoot) {
  const sourceRoot = path.join(root, SOURCE_ROOT);
  const files = [];
  const visit = (directory) => {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (['__tests__', '__generated__', 'generated'].includes(entry.name)) continue;
        visit(absolute);
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.tsx') &&
        !/(?:\.test|\.spec)\.tsx$/.test(entry.name)
      ) {
        files.push(normalizePath(path.relative(root, absolute)));
      }
    }
  };
  visit(sourceRoot);
  return files.sort();
}

export function createDesignSystemBaseline({ root = repositoryRoot, sourceHead }) {
  if (!/^[a-f0-9]{40}$/.test(sourceHead ?? ''))
    throw new Error('A 40-character measured sourceHead is required for the baseline.');
  const candidatesByFile = new Map();
  const addFindings = (findings) => {
    for (const finding of findings) {
      const fileFindings = candidatesByFile.get(finding.file) ?? [];
      fileFindings.push(finding);
      candidatesByFile.set(finding.file, fileFindings);
    }
  };
  const files = collectUiSourceFiles(root);
  const program = createProgram(root, files);
  const checker = program.getTypeChecker();
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const colors = scanColorCandidates(file, source);
    const parsedSourceFile = program.getSourceFile(path.resolve(root, file));
    const spacing = scanPageContentMargins(file, source, {
      checker,
      parsedSourceFile,
      rootPath: root,
    });
    addFindings([...colors, ...spacing]);
  }
  const candidates = {};
  const totals = { color: 0, spacing: 0 };
  const filesWithCandidates = { color: 0, spacing: 0 };
  for (const [file, fileFindings] of candidatesByFile) {
    const colors = fileFindings.filter((finding) =>
      [
        'inline-style-color',
        'color-prop-literal',
        'arbitrary-color-class',
        'named-color-utility',
      ].includes(finding.kind),
    );
    const spacing = fileFindings.filter((finding) => finding.kind.startsWith('page-content-'));
    totals.color += colors.length;
    totals.spacing += spacing.length;
    if (colors.length > 0) filesWithCandidates.color += 1;
    if (spacing.length > 0) filesWithCandidates.spacing += 1;
    const counts = fingerprintCounts(fileFindings);
    if (counts.size > 0)
      candidates[file] = Object.fromEntries([...counts].sort(([a], [b]) => a.localeCompare(b)));
  }
  return {
    schemaVersion: 1,
    sourceHead,
    scope:
      'First-party src/**/*.tsx, excluding tests and generated source; static JSX color candidates and PageContent external-margin candidates.',
    metrics: {
      filesScanned: files.length,
      colorCandidates: totals.color,
      colorFilesWithCandidates: filesWithCandidates.color,
      pageContentMarginCandidates: totals.spacing,
      pageContentMarginFilesWithCandidates: filesWithCandidates.spacing,
    },
    candidates,
  };
}

function validateBaseline(baseline) {
  if (baseline?.schemaVersion !== 1 || !/^[a-f0-9]{40}$/.test(baseline.sourceHead ?? ''))
    throw new Error('The design-system baseline manifest is missing or invalid.');
  if (
    !baseline.candidates ||
    typeof baseline.candidates !== 'object' ||
    Array.isArray(baseline.candidates)
  )
    throw new Error('The design-system baseline manifest has no candidate map.');
}

export function checkDesignSystemDiff({ root = repositoryRoot, baseline = null } = {}) {
  const baselineManifest =
    baseline ??
    JSON.parse(fs.readFileSync(path.join(root, DESIGN_SYSTEM_GUARD_BASELINE_FILE), 'utf8'));
  validateBaseline(baselineManifest);
  const headSha = git(root, ['rev-parse', 'HEAD']).trim();
  const checkedFiles = collectUiSourceFiles(root);
  const program = createProgram(root, checkedFiles);
  const checker = program.getTypeChecker();
  const findingsByFile = new Map();
  const addFindings = (newFindings) => {
    for (const finding of newFindings) {
      const fileFindings = findingsByFile.get(finding.file) ?? [];
      fileFindings.push(finding);
      findingsByFile.set(finding.file, fileFindings);
    }
  };
  for (const file of checkedFiles) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const parsedSourceFile = program.getSourceFile(path.resolve(root, file));
    addFindings([
      ...scanColorCandidates(file, source),
      ...scanPageContentMargins(file, source, { checker, parsedSourceFile, rootPath: root }),
    ]);
  }
  const findings = [];
  let colorCandidates = 0;
  let pageContentMarginCandidates = 0;
  for (const [file, current] of findingsByFile) {
    colorCandidates += current.filter((item) =>
      [
        'inline-style-color',
        'color-prop-literal',
        'arbitrary-color-class',
        'named-color-utility',
      ].includes(item.kind),
    ).length;
    pageContentMarginCandidates += current.filter((item) =>
      item.kind.startsWith('page-content-'),
    ).length;
    const previousCounts = new Map(Object.entries(baselineManifest.candidates[file] ?? {}));
    const seen = new Map();
    for (const finding of current) {
      const count = (seen.get(finding.fingerprint) ?? 0) + 1;
      seen.set(finding.fingerprint, count);
      if (count > Number(previousCounts.get(finding.fingerprint) ?? 0)) findings.push(finding);
    }
  }
  return {
    baselineSourceHead: baselineManifest.sourceHead,
    headSha,
    filesScanned: checkedFiles.length,
    colorCandidates,
    pageContentMarginCandidates,
    findings,
    passed: findings.length === 0,
  };
}

export function measureDesignSystemSource(root = repositoryRoot) {
  const files = collectUiSourceFiles(root);
  const program = createProgram(root, files);
  const checker = program.getTypeChecker();
  let colors = 0;
  let spacing = 0;
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    colors += scanColorCandidates(file, source).length;
    spacing += scanPageContentMargins(file, source, {
      checker,
      parsedSourceFile: program.getSourceFile(path.resolve(root, file)),
      rootPath: root,
    }).length;
  }
  return {
    filesScanned: files.length,
    colorCandidates: colors,
    pageContentMarginCandidates: spacing,
  };
}
