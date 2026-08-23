#!/usr/bin/env python3
"""index.html から Artifact 用のページを作る。

Artifact は <!doctype>/<html>/<head>/<body> を自前で付けるので、
その外枠だけを外し、<title> と <style> と本文をそのまま並べ直す。
アプリのコードは 1 つ（index.html）のまま。

  python3 tools/build-artifact.py [出力先]      既定: build/daily-reps.artifact.html
"""
import io, os, re, sys

SRC = os.path.join(os.path.dirname(__file__), "..", "index.html")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(__file__), "..", "build", "daily-reps.artifact.html")

src = io.open(SRC, encoding="utf-8").read()

def pick(pattern, what):
    m = re.search(pattern, src, re.S)
    if not m:
        sys.exit("index.html から %s が見つかりません" % what)
    return m.group(1)

# Artifact のタイトルはアプリ名だけにする（｜より前）
title = pick(r"<title>(.*?)</title>", "<title>").split("｜")[0].strip()
style = pick(r"(<style>.*?</style>)", "<style>")
body  = pick(r"<body>(.*?)</body>", "<body>")

page = "<title>%s</title>\n%s\n%s" % (title, style, body.strip())

os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
io.open(OUT, "w", encoding="utf-8").write(page)
print("%s (%d bytes)" % (os.path.normpath(OUT), len(page)))
