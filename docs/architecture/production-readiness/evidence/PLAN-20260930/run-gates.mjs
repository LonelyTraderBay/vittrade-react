import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const repo='C:/Users/Joker-PC/Documents/Projects/vittrade-react';
const out=path.dirname(fileURLToPath(import.meta.url));
const group=process.argv[2];
const groups={
  static:['typecheck','lint:check','format:check','architecture:check','architecture:inventory:check','page-size:check','contracts:check','security:check','env:check','production-mock-imports:check','production-routes:check','licenses:check'],
  coverage:['test:coverage -- --reporter=dot'],
  artifact:['build','production-mocks:check','bundle:check']
};
const records=[];
const env={...process.env};
for(const key of Object.keys(env)) if(key.toLowerCase()==='path') delete env[key];
env.PATH=`C:/Windows/System32;C:/Program Files/Git/cmd;${path.dirname(process.execPath)};${repo}/node_modules/.bin`;
for(const command of groups[group]??[]){
  const id=command.split(' ')[0].replaceAll(':','-');
  const log=path.join(out,`${id}.log`);
  if(fs.existsSync(log)) fs.copyFileSync(log,path.join(out,`${id}-previous.log`));
  const fd=fs.openSync(log,'w');
  const startedAt=new Date().toISOString();
  process.stdout.write(`START ${command}\n`);
  const r=spawnSync(process.execPath,[path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),'run',...command.split(' ')],{cwd:repo,env,stdio:['ignore',fd,fd]});
  fs.closeSync(fd);
  const record={command:`npm.cmd run ${command}`,startedAt,endedAt:new Date().toISOString(),exitCode:r.status,error:r.error?.message??null,log,node:process.version};
  records.push(record);
  fs.writeFileSync(path.join(out,`${group}-results.json`),JSON.stringify(records,null,2));
  process.stdout.write(`END ${command} exit=${r.status} ${(Date.parse(record.endedAt)-Date.parse(startedAt))/1000}s\n`);
}
