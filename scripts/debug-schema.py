#!/usr/bin/env python3
"""Debug: show exact bytes preceding each broken 'erchant' fragment."""
s = open("prisma/schema.prisma").read()
import re
from collections import Counter

prec = Counter()
samples = []
for m in re.finditer(r"erchant", s):
    i = m.start()
    prev = s[i - 1] if i > 0 else "^"
    prec[repr(prev)] += 1
    if len(samples) < 12 and prev not in ("m", "["):
        samples.append((i, repr(s[max(0, i - 30):i + 20])))

print("preceding chars:", dict(prec))
print()
for i, ctx in samples:
    print(i, ctx)
