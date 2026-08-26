# DAILY REPS

英語トレーニングの記録アプリ。1ファイル（`index.html`）で動きます。

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

[トークン](https://github.com/settings/tokens/new?scopes=gist)は scope `gist` だけで作ります。

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
