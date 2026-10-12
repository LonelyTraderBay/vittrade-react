import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
const repo='C:/Users/Joker-PC/Documents/Projects/vittrade-react';
const out=path.dirname(fileURLToPath(import.meta.url));
process.chdir(repo);
const require=createRequire(`${repo}/package.json`);
const ts=require('typescript');
const yaml=require('yaml');
const {createCoverageMap}=require('istanbul-lib-coverage');
const json=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const lf=b=>Buffer.from(b.toString('utf8').replaceAll('\r\n','\n'));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
const src=walk('src').filter(f=>/\.(ts|tsx)$/.test(f));
const isTest=f=>/\.(test|spec)\.[cm]?[jt]sx?$/.test(f)||f.includes('/__tests__/');
const layer=f=>f.startsWith('src/features/')?`features/${f.split('/')[2]}`:f.split('/')[1];
const histogram=xs=>xs.reduce((a,x)=>(a[x]=(a[x]??0)+1,a),{});
const stats={};
const rows=[];
const constructs={anyKeywords:[],tsIgnore:[],tsExpectError:[],useStateCalls:[],useEffectCalls:[],fetchCalls:[],webSocketConstructions:[],storageReferences:[],telemetryConfigurations:[]};
for(const f of src){
 const text=fs.readFileSync(f,'utf8');const lines=text.split(/\r?\n/).length;const test=isTest(f);
 const key=layer(f);stats[key]??={sourceFiles:0,testFiles:0,sourceLines:0,testLines:0};
 stats[key][test?'testFiles':'sourceFiles']++;stats[key][test?'testLines':'sourceLines']+=lines;
 rows.push({path:f,lines,test,layer:key});
 if(test||f.startsWith('src/test/')||f.endsWith('.d.ts')) continue;
 const ast=ts.createSourceFile(f,text,ts.ScriptTarget.Latest,true,f.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 function add(kind,n){constructs[kind].push({path:f,line:ast.getLineAndCharacterOfPosition(n.getStart(ast)).line+1});}
 function visit(n){
  if(n.kind===ts.SyntaxKind.AnyKeyword)add('anyKeywords',n);
  if(ts.isCallExpression(n)){
   const name=n.expression.getText(ast);
   if(['useState','React.useState'].includes(name))add('useStateCalls',n);
   if(['useEffect','React.useEffect'].includes(name))add('useEffectCalls',n);
   if(['fetch','globalThis.fetch','window.fetch'].includes(name))add('fetchCalls',n);
   if(name==='configureTelemetry')add('telemetryConfigurations',n);
  }
  if(ts.isNewExpression(n)&&n.expression.getText(ast)==='WebSocket')add('webSocketConstructions',n);
  if(ts.isIdentifier(n)&&['localStorage','sessionStorage'].includes(n.text))add('storageReferences',n);
  ts.forEachChild(n,visit);
 }
 visit(ast);
 text.split(/\r?\n/).forEach((line,i)=>{if(/@ts-ignore\b/.test(line))constructs.tsIgnore.push({path:f,line:i+1});if(/@ts-expect-error\b/.test(line))constructs.tsExpectError.push({path:f,line:i+1});});
}
// Read-only diagnostic copy exposes the existing builder, with an explicit source root.
const generatorSource=fs.readFileSync(`${repo}/scripts/generate-architecture-inventory.mjs`,'utf8')
 .replace("import ts from 'typescript';",`import ts from '${pathToFileURL(require.resolve('typescript')).href}';`)
 .replace("const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');",`const repositoryRoot = ${JSON.stringify(repo)};`)
 .replace('if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {','if (false) {')
 + '\nexport {buildInventory};\n';
const {buildInventory,validateInventory}=await import(`data:text/javascript;base64,${Buffer.from(generatorSource).toString('base64')}`);
const inventory=await buildInventory();validateInventory(inventory);
const stored=fs.readFileSync('docs/architecture/page-inventory.json','utf8');
const generated=`${JSON.stringify(inventory,null,2)}\n`;
const tracking=json('docs/architecture/production-readiness/TRACKING.json');
const matrix=json('docs/architecture/production-readiness/evidence/A06/scenario-matrix-2026-09-28.json');
const aggregate=json('docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json');
const index=json('docs/architecture/production-readiness/evidence/C05/ui-acceptance-index-2026-09-29.json');
const steps=tracking.tasks.flatMap(t=>t.steps);
const sidecars=aggregate.scenarioEvidenceArtifacts.map(a=>{
 const raw=fs.readFileSync(a.path);const git=execFileSync('C:/Program Files/Git/cmd/git.exe',['show',`HEAD:${a.path}`]);const s=json(a.path);
 const sourceFiles=Object.entries(s.sourceHashes??{}).map(([f,expected])=>{if(!fs.existsSync(f))return {path:f,missing:true};const b=fs.readFileSync(f);return {path:f,rawMatches:sha(b)===expected,lfMatches:sha(lf(b))===expected};});
 return {id:a.id,path:a.path,manifestRawMatches:sha(raw)===a.sha256,manifestLfMatches:sha(lf(raw))===a.sha256,manifestGitBlobMatches:sha(git)===a.sha256,sourceFiles,allRawSourceMatches:sourceFiles.every(f=>f.rawMatches),allLfSourceMatches:sourceFiles.every(f=>f.rawMatches||f.lfMatches),baselineMatches:s.sourceHead===tracking.baseline.sourceHead};
});
const contracts=walk('contracts/openapi').filter(f=>f.endsWith('.yaml')).map(file=>{
 const c=yaml.parse(fs.readFileSync(file,'utf8'));
 const resolveParameter=p=>p?.$ref?.startsWith('#/')?p.$ref.substring(2).split('/').reduce((a,k)=>a?.[k],c):p;
 const operations=Object.entries(c.paths).flatMap(([p,methods])=>Object.entries(methods).filter(([m])=>['get','post','put','patch','delete','head','options'].includes(m)).map(([m,o])=>({path:p,method:m.toUpperCase(),id:o.operationId,responses:Object.keys(o.responses??{}),permissions:o['x-required-permissions']??[],permissionStatus:o['x-required-permissions-status']??null,idempotencyRequired:[...(methods.parameters??[]),...(o.parameters??[])].map(resolveParameter).some(p=>p?.name==='Idempotency-Key'&&p.required===true),idempotencyException:o['x-idempotency-exception-reason']??null})));
 return {file,domain:path.basename(file,'.yaml'),operations};
});
const coverageMap=createCoverageMap(json('coverage/coverage-final.json'));
const coverageByGroup={};
const uncovered=[];
for(const file of coverageMap.files()){
 const relative=file.replaceAll('\\','/').replace(`${repo}/`,''); const key=layer(relative);
 coverageByGroup[key]??=createCoverageMap({}); coverageByGroup[key].addFileCoverage(coverageMap.fileCoverageFor(file));
 const summary=coverageMap.fileCoverageFor(file).toSummary().toJSON();
 if(summary.lines.total>0&&(summary.lines.pct<80||summary.branches.pct<60))uncovered.push({path:relative,...summary});
}
const domains=contracts.map(c=>{
 const name=`features/${c.domain}`;const p=inventory.pages.filter(p=>p.owner===name); const scenarios=matrix.domains.find(d=>d.domain===c.domain)?.scenarios??[];
 return {domain:c.domain,...stats[name],pages:p.length,pageStatuses:histogram(p.map(p=>p.status)),maxModuleLines:Math.max(...rows.filter(r=>r.layer===name&&!r.test).map(r=>r.lines)),publicApi:fs.existsSync(`src/${name}/index.ts`),operations:c.operations.length,mutations:c.operations.filter(o=>!['GET','HEAD','OPTIONS'].includes(o.method)).length,draftPermissions:c.operations.filter(o=>o.permissionStatus==='draft_frontend').length,declared401:c.operations.filter(o=>o.responses.includes('401')).length,declared403:c.operations.filter(o=>o.responses.includes('403')).length,historicalScenarioCount:scenarios.length,historicalScenarioStatuses:histogram(scenarios.map(s=>s.executionStatus)),coverage:coverageByGroup[name]?.getCoverageSummary().toJSON()??null};
});
const report={measuredAt:new Date().toISOString(),sourceHead:execFileSync('C:/Program Files/Git/cmd/git.exe',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),node:process.version,scope:{sourceTsTsxFiles:src.length,tests:rows.filter(r=>r.test).length,nonTestTsTsxFiles:rows.filter(r=>!r.test).length,sourceLinesIncludingBlanks:rows.filter(r=>!r.test).reduce((a,r)=>a+r.lines,0)},layerStats:stats,domains,largestSourceModules:rows.filter(r=>!r.test).sort((a,b)=>b.lines-a.lines).slice(0,20),constructCounts:Object.fromEntries(Object.entries(constructs).map(([k,v])=>[k,v.length])),constructs,inventory:{summary:inventory.summary,storedByteEqual:stored===generated,storedLfEqual:stored.replaceAll('\r\n','\n')===generated,storedJsonEqual:JSON.stringify(JSON.parse(stored))===JSON.stringify(inventory),developmentOnlyDeclarations:inventory.routes.filter(r=>r.developmentOnly).length,directPendingDeclarations:inventory.routes.filter(r=>r.component==='IntegrationPendingPage').length,routeClassifications:histogram(tracking.routes.filter(r=>r.lifecycle!=='retired').map(r=>r.classification))},tracking:{tasks:histogram(tracking.tasks.map(t=>t.status)),steps:histogram(steps.map(s=>s.status)),milestones:tracking.milestones.map(m=>({id:m.id,status:m.status})),pageRecords:tracking.pages.length,activePages:tracking.pages.filter(p=>p.lifecycle!=='retired').length,operationApprovals:histogram(tracking.operations.map(o=>o.approval)),backendOwnersAssigned:tracking.operations.filter(o=>o.backendOwner).length,checkpoint:{activeStep:tracking.checkpoint.activeStep,nextAction:tracking.checkpoint.nextAction}},historicalMatrixSummary:matrix.summary,historicalUiIndexScope:index.scope,sidecars,sidecarSummary:{registered:sidecars.length,rawManifestMatches:sidecars.filter(s=>s.manifestRawMatches).length,lfManifestMatches:sidecars.filter(s=>s.manifestLfMatches).length,gitBlobManifestMatches:sidecars.filter(s=>s.manifestGitBlobMatches).length,allRawSourceMatches:sidecars.filter(s=>s.allRawSourceMatches).length,allLfSourceMatches:sidecars.filter(s=>s.allLfSourceMatches).length},contracts,coverage:{summary:coverageMap.getCoverageSummary().toJSON(),files:coverageMap.files().length,byLayer:Object.fromEntries(Object.entries(coverageByGroup).map(([k,v])=>[k,v.getCoverageSummary().toJSON()])),lowCoverageFiles:uncovered}};
fs.writeFileSync(`${out}/measurements.json`,JSON.stringify(report,null,2));
fs.writeFileSync(`${out}/generated-inventory.json`,generated);
console.log(JSON.stringify({scope:report.scope,inventory:report.inventory,tracking:report.tracking,sidecarSummary:report.sidecarSummary,coverage:report.coverage.summary,coverageFiles:report.coverage.files,constructCounts:report.constructCounts,domains:report.domains.map(d=>({domain:d.domain,sourceFiles:d.sourceFiles,testFiles:d.testFiles,pages:d.pages,operations:d.operations,mutations:d.mutations,draft:d.draftPermissions,lineCoverage:d.coverage?.lines.pct,branchCoverage:d.coverage?.branches.pct}))},null,2));
