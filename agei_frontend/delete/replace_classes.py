import os
import re

directory = 'd:/Github/Architect-EV/AGEI_Consulting/agei_frontend/src'

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace text-accent with text-primary
            new_content = re.sub(r'\btext-accent\b', 'text-primary', content)
            
            # Replace bg-accent text-background with bg-primary text-primary-foreground
            new_content = re.sub(r'\bbg-accent\b\s+\btext-background\b', 'bg-primary text-primary-foreground', new_content)
            
            # If the user used text-background in isolation for buttons that were just bg-accent, handle that
            new_content = re.sub(r'bg-accent\b(?! text-background)', 'bg-primary text-primary-foreground', new_content)

            # Cleanup double text-primary-foreground if it existed
            new_content = re.sub(r'bg-primary text-primary-foreground text-background', 'bg-primary text-primary-foreground', new_content)

            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {path}")
