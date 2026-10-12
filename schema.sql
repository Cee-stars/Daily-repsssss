-- DAILY REPS の置き場。記録は1行だけ。
-- Cloudflare の D1 コンソールに貼って一度実行する（Function 側でも必要なら自動で作る）。
CREATE TABLE IF NOT EXISTS state (
  id      INTEGER PRIMARY KEY,
  body    TEXT,                               -- 記録そのもの（JSON の文字列）
  rev     INTEGER NOT NULL DEFAULT 0,         -- 版。書くたびに1つ増える
  updated INTEGER NOT NULL DEFAULT 0          -- 最後に書いた時刻
);
INSERT OR IGNORE INTO state (id, body, rev, updated) VALUES (1, NULL, 0, 0);
