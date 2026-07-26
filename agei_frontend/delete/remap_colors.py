import os
import re

path = 'd:/Github/Architect-EV/AGEI_Consulting/agei_frontend/src/app/example/page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Map colors
mappings = {
    r'cyan-\d{3}': 'primary',
    r'indigo-\d{3}': 'secondary',
    r'emerald-\d{3}': 'success',
    r'rose-\d{3}': 'destructive',
    r'amber-\d{3}': 'warning'
}

for pattern, replacement in mappings.items():
    content = re.sub(pattern, replacement, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Semantic colors remapped.")
