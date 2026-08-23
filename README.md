# DAILY REPS

英語トレーニングの記録アプリ。1ファイル（`index.html`）で動きます。

## 自動同期

ヘッダーの同期チップをタップすると設定できます。記録の置き場所は開き方で変わります。

| 開き方 | 保存先 | 設定 |
|---|---|---|
| ホーム画面アプリ／ブラウザ | このリポジトリの `data` ブランチの `state.json` | 端末ごとに GitHub トークンを1回入れる |
| Claude の Artifact | Artifact 自身の `data/state.json` | 不要 |
| 同期を設定しない | その端末の中だけ | — |

どの場合も、まず端末内に保存してから送るので、通信がなくても記録は消えません。

### 端末ごとの設定（ホーム画面アプリ）

1. [GitHub のトークン作成ページ](https://github.com/settings/personal-access-tokens/new)を開く
2. Repository access: **Only select repositories** → `Daily-repsssss`
3. Permissions: Repository permissions → **Contents** を **Read and write**
4. できたトークンを、アプリの同期チップ →「この端末で同期を始める」に貼る

トークンはその端末の `localStorage` にだけ残り、リポジトリには入りません。
期限が切れたらチップが「同期の設定が必要」になるので、新しいトークンを貼り直してください。

### 記録は `data` ブランチに置いています

`main` に書くと保存のたびに GitHub Pages が再ビルドされ、1時間あたりのビルド上限に当たります。
そのため記録だけ `data` ブランチに分けています。リポジトリは公開なので、記録も公開されます。

### 突き合わせの決まり

- 読み込みは、開いたとき・アプリに戻ったとき・1分ごと
- 書き出しは約2秒のまとめ書き（連打しても1回）
- 端末どうしで食い違ったら **日付ごとに新しいほうを採用**（同時刻ならチェックを合体）
- タスク一覧は最後に編集したほうを採用
- 別の端末が先に書いていたら、読み直して突き合わせてから送り直す

## Artifact 用ページを作り直す

`index.html` を直したら、次を実行して出てきたファイルを公開します。

```sh
python3 tools/build-artifact.py
# → build/daily-reps.artifact.html
```

Artifact は `<html>`／`<head>`／`<body>` を自前で付けるため、その外枠だけを外したページを作ります。
アプリのコードは `index.html` の1本のままです。
