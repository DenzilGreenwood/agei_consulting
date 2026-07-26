import os
import re

path = 'd:/Github/Architect-EV/AGEI_Consulting/agei_frontend/src/app/example/page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Backgrounds
content = re.sub(r'bg-\[\#0b0f19\]', 'bg-background', content)
content = re.sub(r'bg-\[\#0c101f\]', 'bg-background', content)
content = re.sub(r'bg-\[\#0f1524\]', 'bg-card', content)
content = re.sub(r'bg-\[\#131a30\]', 'bg-muted', content)
content = re.sub(r'bg-slate-950/?\d*', 'bg-muted', content)
content = re.sub(r'bg-slate-900/?\d*', 'bg-muted', content)
content = re.sub(r'bg-slate-800/?\d*', 'bg-muted', content)
content = re.sub(r'bg-slate-700/?\d*', 'bg-muted', content)

# Text Colors
content = re.sub(r'text-slate-100', 'text-foreground', content)
content = re.sub(r'text-slate-200', 'text-foreground', content)
content = re.sub(r'text-slate-300', 'text-foreground', content)
# We might want to keep some text-white for gradient buttons, but let's carefully replace standard text-white where applicable.
# Let's just do text-slate-400/500/600/700 -> text-muted-foreground
content = re.sub(r'text-slate-400', 'text-muted-foreground', content)
content = re.sub(r'text-slate-500', 'text-muted-foreground', content)
content = re.sub(r'text-slate-600', 'text-muted-foreground', content)
content = re.sub(r'text-slate-700', 'text-muted-foreground', content)

# Borders
content = re.sub(r'border-slate-800/?\d*', 'border-border', content)
content = re.sub(r'border-slate-700/?\d*', 'border-border', content)
content = re.sub(r'border-slate-600/?\d*', 'border-border', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Colors updated.')
