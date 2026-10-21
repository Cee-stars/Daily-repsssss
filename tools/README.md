# 手元で確かめるための道具

ここは配信されません（`.assetsignore` が `tools/` を外しています）。

## モックサーバー

本物の `functions/api/state.js` を、Node 組み込みの SQLite の上で走らせます。
D1 の `prepare().bind().run()/.first()` だけを真似ています。

| | ポート | ちがい |
|---|---|---|
| `mockcf.mjs` | 8111 | `/api/state` を先に分岐するだけ。手軽 |
| `mockworker.mjs` | 8112 | `worker.js` を通し、`.assetsignore` も見る。**本番に近い**。画像と動画の型も返す |

```sh
cd /path/to/Daily-repsssss
REPS_KEY=x node tools/mockcf.mjs        # → http://127.0.0.1:8111/
REPS_KEY=x node tools/mockworker.mjs    # → http://127.0.0.1:8112/
```

鍵は環境変数 `REPS_KEY` から読みます。記録はメモリ上なので、止めると消えます。

**curl で叩くときは `--noproxy 127.0.0.1` を付けてください。** 付けないとプロキシに吸われて 403 になります。

```sh
curl -s --noproxy 127.0.0.1 -H 'x-reps-key: x' http://127.0.0.1:8111/api/state
```

### `mockcf.mjs` の限界

- `.assetsignore` を見ないので、`wrangler.toml` なども 200 で返ります
- `.webp` `.mp4` `.webm` の型を返さないので、**演出の画像と動画は正しく出ません**
- `run_worker_first` の順序は再現していません

演出まで見たいときは `mockworker.mjs`（8112）を使ってください。

## 2秒ドリル（Cee-stars/section）

あちらは静的ファイルだけなので、置くだけで動きます。

```sh
cd /path/to/section && python3 -m http.server 8222
```

ただし `not_found_handling` は再現されないので、無い道は 404 になります（本番は `index.html` が返ります）。
