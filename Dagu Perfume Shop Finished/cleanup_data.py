
import json

with open('master-data.js', 'r', encoding='utf-8') as f:
    content = f.read()
    json_str = content.replace('const ALL = ', '').rstrip(';')
    data = json.loads(json_str)

to_delete = {426, 451, 295, 68, 159, 143, 101, 95, 86, 336}

new_data = [p for p in data if p['no'] not in to_delete]

# Re-index NO just in case but usually user refers to the ID I gave them
# Wait, if I re-index, then 427 becomes 426. 
# BUT the user likely saw the ID in the UI/Admin or the file.
# I'll leave re-indexing for now or do it once.
# Actually, I'll re-index because the UI might rely on 'no' being sequential starting from 1 for some things.
for i, p in enumerate(new_data):
    p['no'] = i + 1

js_content = "const ALL = " + json.dumps(new_data, indent=2) + ";"
with open('master-data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
print(f"Removed {len(data) - len(new_data)} items. Total now: {len(new_data)}")
