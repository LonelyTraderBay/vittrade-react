import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
const repo='C:/Users/Joker-PC/Documents/Projects/vittrade-react';
const out=path.dirname(fileURLToPath(import.meta.url));
process.chdir(repo);
const require=createRequire(`${repo}/package.json`);const prettier=require('prettier');const ts=require('typescript');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const formatWarnings=fs.readFileSync(`${out}/format-check.log`,'utf8').split(/\r?\n/).filter(l=>/^\[warn\] (src|tests)\//.test(l)).map(l=>l.substring(7));
const formatDiagnostics=[];
for(const file of formatWarnings){const original=fs.readFileSync(file,'utf8');const normalized=original.replaceAll('\r\n','\n');const options=await prettier.resolveConfig(file);const formatted=await prettier.format(normalized,{...options,filepath:file});formatDiagnostics.push({path:file,onlyLineEndings:normalized===formatted});}
const graph=read(`${out}/dependencies.json`);
const test=f=>/\.(test|spec)\.[jt]sx?$/.test(f)||f.includes('/__tests__/')||f.startsWith('src/test/');
const layer=f=>f.split('/')[1];const edges={};const featureEdges=[];
for(const m of graph.modules.filter(m=>!test(m.source)))for(const d of m.dependencies.filter(d=>d.resolved.startsWith('src/')&&!test(d.resolved))){const a=layer(m.source),b=layer(d.resolved);if(a!==b){const k=`${a}->${b}`;edges[k]=(edges[k]??0)+1;}if(a==='features'&&b==='features'&&m.source.split('/')[2]!==d.resolved.split('/')[2])featureEdges.push({from:m.source,to:d.resolved,typeOnly:d.dependencyTypes.includes('type-only')});}
const assets=fs.readdirSync('dist/assets').filter(f=>f.endsWith('.js')).map(file=>{const bytes=fs.readFileSync(`dist/assets/${file}`);return {file,rawBytes:bytes.length,gzipBytes:gzipSync(bytes,{level:9}).length};});
const staticImports={};
for(const a of assets){const ast=ts.createSourceFile(a.file,fs.readFileSync(`dist/assets/${a.file}`,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);staticImports[a.file]=ast.statements.filter(s=>(ts.isImportDeclaration(s)||ts.isExportDeclaration(s))&&s.moduleSpecifier&&ts.isStringLiteral(s.moduleSpecifier)).map(s=>path.basename(s.moduleSpecifier.text)).filter(f=>assets.some(a=>a.file===f));}
const html=fs.readFileSync('dist/index.html','utf8');const entry=/script[^>]+src="[^"/]*\/?assets\/([^" ]+\.js)"/.exec(html)?.[1];
const visited=new Set();function visit(f){if(!f||visited.has(f))return;visited.add(f);for(const d of staticImports[f]??[])visit(d);}visit(entry);
const initial=assets.filter(a=>visited.has(a.file));
const sum=xs=>({rawBytes:xs.reduce((a,b)=>a+b.rawBytes,0),gzipBytes:xs.reduce((a,b)=>a+b.gzipBytes,0)});
const report={measuredAt:new Date().toISOString(),format:{warnings:formatDiagnostics.length,onlyLineEndingDifferences:formatDiagnostics.filter(d=>d.onlyLineEndings).length,otherDifferences:formatDiagnostics.filter(d=>!d.onlyLineEndings)},graph:{modules:graph.modules.length,dependencies:graph.summary.totalDependenciesCruised,rules:graph.summary.ruleSetUsed.forbidden.length,errors:graph.summary.error,warnings:graph.summary.warn,circularEdges:graph.modules.flatMap(m=>m.dependencies).filter(d=>d.circular).length,unresolvedEdges:graph.modules.flatMap(m=>m.dependencies).filter(d=>d.couldNotResolve).length,nonTestInterLayerEdges:edges,featureCrossImports:featureEdges},bundle:{jsChunks:assets.length,total:sum(assets),largestRaw:assets.toSorted((a,b)=>b.rawBytes-a.rawBytes).slice(0,8),largestGzip:assets.toSorted((a,b)=>b.gzipBytes-a.gzipBytes).slice(0,8),entry,staticInitialClosure:initial,staticInitialTotal:sum(initial),notes:'Gzip sizes are computed per file at level 9, not observed HTTP transfer. Static entry closure excludes route-selected dynamic imports and CSS.'},e2e:{browserProjects:1,configuredBrowser:'Chromium',testDefinitions:51,files:6,axeCalls:fs.readdirSync('tests/e2e').filter(f=>f.endsWith('.ts')).flatMap(f=>fs.readFileSync(`tests/e2e/${f}`,'utf8').match(/\.analyze\(/g)??[]).length}};
fs.writeFileSync(`${out}/supplement.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
