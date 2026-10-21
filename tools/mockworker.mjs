/* 本物の worker.js を、実物の SQLite の上で走らせる。
   静的ファイルが先・無いものだけ Worker、という Cloudflare の順番も真似る。 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import worker from "/home/user/Daily-repsssss/worker.js";

const db = new DatabaseSync(":memory:");
const DB = { prepare(sql){ let a=[]; const o={
  bind(...x){ a=x; return o; },
  run(){ const r=db.prepare(sql).run(...a); return Promise.resolve({meta:{changes:Number(r.changes)}}); },
  first(){ return Promise.resolve(db.prepare(sql).get(...a) ?? null); }
}; return o; } };
const env = { DB, REPS_KEY: process.env.REPS_KEY };

const ROOT="/home/user/Daily-repsssss";
const IGNORE = fs.readFileSync(ROOT+"/.assetsignore","utf8").split("\n")
  .map(s=>s.trim()).filter(s=>s && !s.startsWith("#"));
const blocked = p => IGNORE.some(i => i.endsWith("/") ? p.startsWith("/"+i) : p === "/"+i);
const TYPE={".html":"text/html; charset=utf-8",".js":"text/javascript",".json":"application/json",
  ".png":"image/png",".webp":"image/webp",".mp4":"video/mp4",".webm":"video/webm",
  ".webmanifest":"application/manifest+json"};

http.createServer(async (req,res)=>{
  const u=new URL(req.url,"http://127.0.0.1");
  let f = u.pathname==="/" ? "/index.html" : u.pathname;
  const abs = path.join(ROOT,f);
  // 1) 静的ファイルがあればそれを配る（Worker は呼ばれない）
  if(!blocked(f) && abs.startsWith(ROOT) && fs.existsSync(abs) && fs.statSync(abs).isFile()){
    res.writeHead(200,{ "content-type": TYPE[path.extname(abs)] || "application/octet-stream" });
    res.end(fs.readFileSync(abs)); return;
  }
  // 2) 無ければ Worker へ
  const chunks=[]; for await (const c of req) chunks.push(c);
  const request=new Request("http://127.0.0.1"+u.pathname,{
    method:req.method, headers:req.headers,
    body:(req.method==="GET"||req.method==="HEAD")?undefined:Buffer.concat(chunks)});
  const out=await worker.fetch(request, env, {});
  res.writeHead(out.status, Object.fromEntries(out.headers));
  res.end(Buffer.from(await out.arrayBuffer()));
}).listen(8112,"127.0.0.1",()=>console.log("worker mock on 8112"));
