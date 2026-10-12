# DAILY REPS

英語トレーニングの記録アプリ。1ファイル（`index.html`）で動きます。

## 置き場は3つから選べます

| 開き方 | 保存先 | 設定 |
|---|---|---|
| **Cloudflare Pages**（おすすめ） | D1 の1行 | 鍵を1本入れるだけ |
| ホーム画面アプリ／ブラウザ | シークレット Gist の `daily-reps.json` | トークンと Gist ID |
| Claude の Artifact | Artifact 自身の `data/state.json` | 不要 |
| 設定しない | その端末の中だけ | — |

鍵があれば Cloudflare を使い、無ければ Gist に落ちます。どちらの場合も、
まず端末内に保存してから送るので、通信がなくても記録は消えません。

## Cloudflare に置く（無料）

GitHub のトークンを端末に持たせずに済みます。鍵はこのアプリ専用で、
漏れてもこのアプリの記録しか触れません。

### 一度だけの用意

1. **Pages を作る** — Cloudflare → Workers & Pages → Create → Pages →
   Connect to Git → このリポジトリ → Save and Deploy
   （ビルドコマンドは空、出力先はルートのまま）
2. **D1 を作る** — Storage & Databases → D1 → Create database（名前は何でも）
3. **表を作る** — その D1 のコンソールに `schema.sql` の中身を貼って実行
4. **割り当てる** — Pages の Settings → Bindings → Add → D1 database →
   **変数名は `DB`**（この名前でないと動きません）→ 作った D1 を選ぶ
5. **鍵を入れる** — Pages の Settings → Variables and Secrets → Add →
   種類を **Secret**、名前を **`REPS_KEY`**、値は長いランダム文字列
6. **置き直す** — Deployments → 最新の … → Retry deployment
   （4と5は、入れたあとに作り直さないと反映されません）
7. **アプリ側** — `*.pages.dev` を開く → 同期チップ → 鍵を貼る →
   「つながるか調べる」→「この鍵でつなぐ」

鍵はリポジトリに入れません。端末の `localStorage` にだけ残ります。

### やりとりの決まり

```
GET  /api/state              → {body, rev}
PUT  /api/state  {body, rev} → {ok:true, rev}
                               版が古ければ 409 {conflict:true, body, rev}
```

記録を書くたびに**版（rev）が1つ増えます**。送った版が置き場の版と違えば
409 が返るので、受け取った最新と突き合わせてから出し直します。
Gist と違って「読んでから書くまでの間に割り込まれる」隙がありません。

実装は `functions/api/state.js` の1ファイル、表は `schema.sql` の1つだけです。

### 無料枠

1日あたり Workers 10万リクエスト、D1 の書き込み10万行・読み込み500万行、
保存5GB。このアプリは1日あたり読み800・書き40ほどなので、桁が3つ足りません。
上限に達しても課金されず、リクエストが失敗するだけです。

### うまくいかないとき

同期チップ →「つながるか調べる」。返ってきた番号で切り分けられます。

| | 意味 | すること |
|---|---|---|
| 401 | 鍵が違う | `REPS_KEY` と、アプリに入れた鍵を揃える |
| 404 | `/api/state` が無い | `functions/` が Pages に入っているか見る |
| 500 | 割り当て漏れ | D1 が `DB` という名前で割り当たっているか見る |
| 届かない | 場所が違う | `*.pages.dev` から開いているか見る |

## 自動同期

ヘッダーの同期チップをタップすると設定できます。記録の置き場所は開き方で変わります。

| 開き方 | 保存先 | 設定 |
|---|---|---|
| ホーム画面アプリ／ブラウザ | シークレット Gist の `daily-reps.json` | 端末ごとに1回。**つなぐリンク**を貼るのが最短 |
| Claude の Artifact | Artifact 自身の `data/state.json` | 不要 |
| 設定しない | その端末の中だけ | — |

どの場合も、まず端末内に保存してから送るので、通信がなくても記録は消えません。

### 端末ごとの設定

瞬間英作文（`sunkan-333`）・My Dictionary（`dictionary-22`）と同じ作りです。
1枚のシークレット Gist に、アプリごとに別ファイルを置いて同居します。

| アプリ | Gist の中のファイル |
|---|---|
| 瞬間英作文 | `sunkan-data.json` / `sunkan-inbox.json` |
| My Dictionary | `mydict-data.json` |
| DAILY REPS | `daily-reps.json` |

書き込みは自分のファイルだけを名指しするので、ほかのアプリのぶんは踏みません。

**いちばん楽な入れ方**は「つなぐリンク」です。
瞬間英作文の ⚙ →「つなぐリンクをコピー」で作ったものを、
このアプリの同期チップ →「つなぐリンクを貼り付ける」に貼って「貼り付けたリンクでつなぐ」。
トークンと Gist ID がそのまま入るので、iPhone でトークンを打ち込まずに済みます。
リンクの形は3つのアプリで共通です。

```
<ページの URL>#pair=base64url({"t": トークン, "g": Gist ID})
```

`#pair=` 付きの URL で開いた場合も、その場で受け取ってアドレスから消します。

**Gist ID は入れなくても構いません。** トークンだけで「同期を始める」を押すと、
アプリがアカウントの Gist を見て置き場を決めます。

1. `daily-reps.json` がある Gist（＝前に使っていた置き場）
2. `sunkan-data.json` / `mydict-data.json` がある Gist（＝瞬間英作文と同居）
3. どちらも無ければ、シークレット Gist を新しく作る

起動時は 1 と 2 を探すだけで、**作りません**。同じトークンの端末が同時に立ち上がると
置き場が2つできて記録が分かれるためです。作るのは「同期を始める」を押したときだけです。

[トークン](https://github.com/settings/tokens/new?scopes=gist)は scope `gist` で作ります。
**classic（`ghp_` で始まるもの）が必要です。** fine-grained（`github_pat_`）は Gist API に対応していません。

うまくいかないときは、同期チップ →「つながるか調べる」。
トークンの種類・GitHub に届いたか・置き場が見えるかを順に確かめて、失敗した理由をそのまま出します。

### GitHub への通信で気をつけること

リクエストに載せるヘッダーは **`Authorization: token …` と `Accept: application/vnd.github+json` の2つだけ**
（書き込みのときは `Content-Type` も）。`X-GitHub-Api-Version` のような追加のヘッダーを足すと、
ブラウザが事前確認（プリフライト）を挟み、許可されていなければ**送信前に失敗**します。
瞬間英作文の `sync.js` も同じ2つだけです。テスト（`headers` の確認）でこれを見張っています。

トークンと Gist ID はその端末の `localStorage` にだけ残り、リポジトリには入りません。

| 鍵 | 中身 |
|---|---|
| `dailyreps:sync:token` | トークン |
| `dailyreps:sync:gistId` | Gist ID |
| `dailyreps:sync:auto` | 自動同期の入切（`0` で手動だけ） |
| `dailyreps:sync:last` | 最後に揃えた時刻 |
| `dailyreps:sync:error` | 最後に失敗した理由（黙って止まらないため） |

### 突き合わせの決まり

- 読み込みは、開いたとき・アプリに戻ったとき・1分ごと
- 書き出しは約2秒のまとめ書き（連打しても1回）。Gist は上書きしかできないので、**書く直前にもう一度読んで突き合わせて**から書く
- 食い違いは **チェック1つ単位**で新しいほうを残す（`meta.marks[日付][タスク]` に切り替えた時刻を持つ）。
  そのため、2台が同じ日に別々のタスクをチェックしても両方残る
- 「この日のチェックを消す」は `meta.cleared[日付]` に時刻を置き、それより古いチェックを消す
- タスク一覧は最後に編集したほうを採用

記録の形は `index.html` の `normalize` / `mergeState` / `serialize` が全てです。
古い形（日ごとに1つの時刻を持つ v3、`meta` のない v2）も読めます。
v5 でタスクに `dayType`（`lesson` / `off` / `both`）が加わりました。
持っていない記録は `normalize` が `both` に寄せるので、古い記録もそのまま読めます。
v6 でタスクに `note`（名前の下に出す一行メモ）が加わりました。同じく `normalize` が空文字で補います。

### `data` ブランチについて

一時期このリポジトリの `data` ブランチに記録を置いていました。いまは使っていません。
Gist での同期が確認できたら消して構いません。

### 前の設定からの引き継ぎ

`dailyreps.token.v2` / `dailyreps.gist.v1` に入っていた設定は、起動時に新しい鍵へ移して古いほうを消します。

## Artifact 用ページを作り直す

`index.html` を直したら、次を実行して出てきたファイルを公開します。

```sh
python3 tools/build-artifact.py
# → build/daily-reps.artifact.html
```

Artifact は `<html>`／`<head>`／`<body>` を自前で付けるため、その外枠だけを外したページを作ります。
アプリのコードは `index.html` の1本のままです。
