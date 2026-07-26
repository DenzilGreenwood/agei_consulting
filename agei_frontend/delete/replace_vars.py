import os
import re

directory = 'd:/Github/Architect-EV/AGEI_Consulting/agei_frontend/src'

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace pattern prefix-[var(--name)] -> prefix-name
            # Examples: bg-[var(--background)] -> bg-background
            new_content = re.sub(r'([a-zA-Z0-9-]+)-\[var\(--([a-zA-Z0-9-]+)\)\]', r'\1-\2', content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {path}")
