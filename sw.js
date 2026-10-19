// DAILY REPS — オフライン用のキャッシュ
const CACHE = "dailyreps-v30";
const FILES = ["./", "./index.html", "./manifest.webmanifest",
               "./icon-180.png", "./icon-192.png", "./icon.png",
               "./nushi.webp", "./nushi.png", "./boom.webp", "./fire.webp", "./flame.webp"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // 同期の通信（GitHub API）は素通しする。キャッシュすると古い記録を掴む
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin) return;
  // 記録のやりとり（Cloudflare の置き場）はキャッシュしない。古い記録を掴む
  if (u.pathname.startsWith("/api/")) return;
  // 動画は素通し。範囲つきの取り寄せをキャッシュに通すと、端末によって再生が壊れる
  if (/\.(mp4|webm|mov|m4v)$/i.test(u.pathname)) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
