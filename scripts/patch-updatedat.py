#!/usr/bin/env python3
"""Inject `updatedAt: new Date(),` into every prisma create/createMany data block
in master-seed.ts that doesn't already set it."""
import re

P = 'scripts/master-seed.ts'
lines = open(P).readlines()
out = []
i = 0
injected = 0
while i < len(lines):
    line = lines[i]
    out.append(line)
    m = re.match(r'^(\s*)data:\s*\{\s*$', line)
    if m:
        indent = m.group(1)
        base = len(indent) - len(indent.lstrip())
        # find matching close of this data block: line that is indent + '},'
        j = i + 1
        depth = 1
        has_updated = False
        body_start = j
        while j < len(lines) and depth > 0:
            l = lines[j]
            depth += l.count('{') - l.count('}')
            if 'updatedAt' in l:
                has_updated = True
            if depth == 0:
                break
            j += 1
        if not has_updated:
            # insert before closing line j (indent + '},')
            out.append(' ' * (base + 2) + 'updatedAt: new Date(),\n')
            injected += 1
        # skip copying body lines (already appended up to i only); we need to copy lines i+1..j next
        for k in range(i + 1, j + 1):
            out.append(lines[k])
        i = j
    i += 1

open(P, 'w').writelines(out)
print(f'injected updatedAt into {injected} data blocks')
