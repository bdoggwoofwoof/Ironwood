"""Assemble app.html from the source files (Nov 10, 2026; replaces features.py + source.html).

index.src.html is the page. Lines like /*@include core.js*/ pull in a file (styles.css, boot.js, core.js), and core.js
pulls in each feature module the same way (/*@include meals.js*/ ...). Edit the files directly; there are no patch
steps any more. build.py then turns app.html into the published dist/ folder.

Text size follows the iPhone (Dynamic Type): every CSS font size N px is written as calc(N * var(--u)), where --u is 1px
at the default size (the scale itself is set in index.src.html). Write plain px in new code; this step converts it.
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
INC = re.compile(r'/\*@include ([A-Za-z0-9_.-]+)\*/')


def expand(text, seen=()):
    def one(m):
        name = m.group(1)
        if name in seen:
            sys.exit('include loop: ' + ' -> '.join(seen + (name,)))
        body = open(os.path.join(HERE, name), encoding='utf8').read()
        if body.endswith('\n'):
            body = body[:-1]
        return expand(body, seen + (name,))
    return INC.sub(one, text)


src = expand(open(os.path.join(HERE, 'index.src.html'), encoding='utf8').read())
n = 0
def _fs(m):
    global n; n += 1
    return 'font-size:calc(' + m.group(1) + ' * var(--u))'
src = re.sub(r'(?<!html\{)font-size:\s*([0-9]+(?:\.[0-9]+)?)px', _fs, src)  # the root html size stays 17px
for need in ['function applyDisplay', 'function showToast', '/* ---------- APP ---------- */']:
    if need not in src:
        sys.exit('missing ' + need)
if INC.search(src):
    sys.exit('unexpanded include: ' + INC.search(src).group(0))
open(os.path.join(HERE, 'app.html'), 'w', encoding='utf8').write(src)
print('app.html written', len(src.encode()) // 1024, 'KB;', n, 'new px font sizes made scalable')
