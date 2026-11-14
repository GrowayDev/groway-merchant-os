#!/usr/bin/env python3
"""Fix Prisma schema corruption: literal '[m' sequences were globally deleted,
turning '[merchantId' into 'erchantId' in three contexts:
  1. @@index(erchant...])       -> @@index([merchant...])
  2. @@unique(erchant...])      -> @@unique([merchant...])
  3. fields: erchantX]          -> fields: [merchantX]
"""
import re

PATH = "prisma/schema.prisma"
s = open(PATH).read()

# Count true broken occurrences on raw text
paren_broken = re.findall(r"\(erchant\w*", s)
colon_broken = re.findall(r"fields:\s*erchant\w*", s)
print("paren-broken occurrences:", len(paren_broken))
print("colon-broken occurrences:", len(colon_broken))

# Show sample contexts
for m in re.finditer(r".{0,25}erchant\w*", s):
    frag = m.group(0)
    # only show ones where 'erchant' is NOT preceded by 'm' (i.e., broken)
    pre = s[max(0, m.start()):m.start() + 1]
    if not frag.startswith("m") and "(merchant" not in frag and " merchant" not in frag.lower():
        pass

# Fix 1 & 2: attribute lists missing the opening bracket: "(erchant" -> "([merchant"
fixed, n1 = re.subn(r"\((erchant\w*)", r"([\1", s)

# Fix 3: relation fields missing opening bracket: "fields: erchantX]" -> "fields: [merchantX]"
fixed, n2 = re.subn(r"(fields:\s*)(erchant\w*\])", r"\1[\2", fixed)

print("paren fixes applied:", n1)
print("colon fixes applied:", n2)

# Validate bracket balance per attribute
open_b, close_b = fixed.count("["), fixed.count("]")
print("brackets:", open_b, close_b)

open_p, close_p = fixed.count("("), fixed.count(")")
print("parens:", open_p, close_p)

# Validate: no remaining 'erchant' not preceded by 'm' or '['
remaining = [m.group(0) for m in re.finditer(r"(?<![m\[])erchant\w*", fixed)]
print("remaining broken:", len(remaining), remaining[:10])

# Prisma syntax sanity: every @relation( must have balanced brackets inside
bad_rels = [r for r in re.findall(r"@relation\(([^)]*)\)", fixed) if r.count("[") != r.count("]")]
bad_idx = [r for r in re.findall(r"@@(?:index|unique)\(([^)]*)\)", fixed) if r.count("[") != r.count("]")]
print("bad relations after fix:", len(bad_rels))
print("bad indexes after fix:", len(bad_idx))
for b in bad_rels[:5]:
    print("  REL:", b)
for b in bad_idx[:5]:
    print("  IDX:", b)

if n1 + n2 > 0:
    open(PATH, "w").write(fixed)
    print("SCHEMA FIXED AND SAVED")
else:
    print("NO CHANGES NEEDED")
