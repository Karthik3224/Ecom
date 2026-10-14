import { spawn } from 'node:child_process';
import process from 'node:process';
const api = spawn(process.execPath, ['server/server.js'], { stdio:'inherit' });
const web = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio:'inherit' });
const stop = () => { api.kill();web.kill(); };
process.on('SIGINT',stop);process.on('SIGTERM',stop);web.on('exit',(code)=>{api.kill();process.exit(code ?? 0);});
 