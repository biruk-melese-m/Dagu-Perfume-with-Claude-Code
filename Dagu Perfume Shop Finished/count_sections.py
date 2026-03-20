
import json
import re

with open('master-data.js', 'r', encoding='utf-8') as f:
    content = f.read()
    # Remove "const ALL = " and the trailing ";"
    json_str = content.replace('const ALL = ', '').rstrip(';')
    data = json.loads(json_str)

counts = {}
for p in data:
    sec = p['sec']
    counts[sec] = counts.get(sec, 0) + 1

print(json.dumps(counts, indent=2))
print(f"Total: {len(data)}")
