/* 本物の functions/api/state.js を、実物の SQLite の上で動かす。
   D1 の prepare().bind().run()/.first() だけを真似る。 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { onRequest } from "../functions/api/state.js";

const db = new DatabaseSync(":memory:");
const DB = {
  prepare(sql){
    let args = [];
    const api = {
      bind(...a){ args = a; return api; },
      run(){
        const st = db.prepare(sql);
        const r = st.run(...args);
        return Promise.resolve({ meta: { changes: Number(r.changes) } });
      },
      first(){
        const st = db.prepare(sql);
        return Promise.resolve(st.get(...args) ?? null);
      }
    };
    return api;
  }
};
const env = { DB, REPS_KEY: process.env.REPS_KEY };

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const TYPE = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".json":"application/json",
               ".png":"image/png", ".webmanifest":"application/manifest+json" };

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://127.0.0.1");
  if (u.pathname === "/api/state") {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request("http://127.0.0.1" + u.pathname, {
      method: req.method, headers: req.headers,
      body: (req.method === "GET" || req.method === "HEAD") ? undefined : body
    });
    const out = await onRequest({ request, env });
    res.writeHead(out.status, Object.fromEntries(out.headers));
    res.end(Buffer.from(await out.arrayBuffer()));
    return;
  }
  let f = u.pathname === "/" ? "/index.html" : u.pathname;
  const abs = path.join(ROOT, f);
  if (!abs.startsWith(ROOT) || !fs.existsSync(abs)) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "content-type": TYPE[path.extname(abs)] || "application/octet-stream" });
  res.end(fs.readFileSync(abs));
}).listen(8111, "127.0.0.1", () => console.log("mock cloudflare on 8111"));
