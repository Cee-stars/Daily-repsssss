/* DAILY REPS — 記録の置き場（Cloudflare Pages Functions + D1）
 *
 *   GET  /api/state              → {body, rev}
 *   PUT  /api/state  {body, rev} → {ok:true, rev}
 *                                  版が古ければ 409 {conflict:true, body, rev}
 *
 * 版（rev）で守るので、2台が同じ瞬間に書いても取りこぼさない。
 * 負けたほうは 409 で最新を受け取り、突き合わせてから出し直す。
 *
 * 鍵は Cloudflare 側の環境変数 REPS_KEY。ヘッダー x-reps-key で照合する。
 * リポジトリには入れない。
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "content-type,x-reps-key",
  "Access-Control-Max-Age": "86400"
};

const MAX = 1024 * 1024;        // 1MB。記録1件がこれを超えることはまずない

const json = (o, status) => new Response(JSON.stringify(o), {
  status: status || 200,
  headers: { "content-type": "application/json; charset=utf-8",
             "cache-control": "no-store", ...CORS }
});

/* 鍵の比較。合っている文字数で時間が変わらないようにする */
function sameKey(a, b){
  if(typeof a !== "string" || typeof b !== "string") return false;
  if(a.length !== b.length) return false;
  let d = 0;
  for(let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/* 表が無ければ作る。毎回は走らせず、失敗したときだけ呼ぶ */
async function ensure(db){
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS state (" +
    "  id INTEGER PRIMARY KEY," +
    "  body TEXT," +
    "  rev INTEGER NOT NULL DEFAULT 0," +
    "  updated INTEGER NOT NULL DEFAULT 0)"
  ).run();
  await db.prepare(
    "INSERT OR IGNORE INTO state (id, body, rev, updated) VALUES (1, NULL, 0, 0)"
  ).run();
}

/* 1回だけ作り直して、もう一度試す */
async function withTable(db, run){
  try{ return await run(); }
  catch(e){
    if(!/no such table/i.test(String(e && e.message))) throw e;
    await ensure(db);
    return await run();
  }
}

const row = db => db.prepare("SELECT body, rev FROM state WHERE id = 1").first();

export async function onRequest({ request, env }){
  if(request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  if(!env.DB)
    return json({ error: "D1 が DB という名前で割り当てられていません（Pages の Settings → Bindings）" }, 500);
  if(!env.REPS_KEY)
    return json({ error: "REPS_KEY が設定されていません（Pages の Settings → Variables and Secrets）" }, 500);

  if(!sameKey(request.headers.get("x-reps-key") || "", env.REPS_KEY))
    return json({ error: "鍵が違います" }, 401);

  try{
    if(request.method === "GET"){
      const r = await withTable(env.DB, () => row(env.DB));
      return json({ body: (r && r.body) || null, rev: (r && r.rev) || 0 });
    }

    if(request.method === "PUT"){
      let input = null;
      try{ input = await request.json(); }catch(e){}
      if(!input || typeof input.body !== "string")
        return json({ error: "body（文字列）が要ります" }, 400);
      if(input.body.length > MAX)
        return json({ error: "記録が大きすぎます" }, 413);

      const rev = Number(input.rev) || 0;
      const res = await withTable(env.DB, () => env.DB
        .prepare("UPDATE state SET body = ?, rev = rev + 1, updated = ? WHERE id = 1 AND rev = ?")
        .bind(input.body, Date.now(), rev)
        .run());

      if(!res.meta || !res.meta.changes){
        /* 誰かが先に書いた。こちらの版は古いので、最新をそのまま返す */
        const r = await row(env.DB);
        return json({ conflict: true, body: (r && r.body) || null, rev: (r && r.rev) || 0 }, 409);
      }
      return json({ ok: true, rev: rev + 1 });
    }

    return json({ error: "GET か PUT だけです" }, 405);

  }catch(e){
    return json({ error: "置き場でつまずきました: " + ((e && e.message) || "理由不明") }, 500);
  }
}
