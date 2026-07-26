import os

base_dir = 'd:/Github/Architect-EV/AGEI_Consulting/agei_frontend/src/components/example'

# Sidebar.tsx fixes
sidebar_path = os.path.join(base_dir, 'Sidebar.tsx')
with open(sidebar_path, 'r', encoding='utf-8') as f:
    sidebar = f.read()

sidebar = sidebar.replace('text-white">CognitiveInsight</h1>', 'text-foreground">CognitiveInsight</h1>')
# Fix the buttons for Interactive Scenarios
# Active state: 'bg-primary text-primary-foreground shadow-md border-primary'
# Inactive state: 'bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground'
sidebar = sidebar.replace("'bg-muted border-primary/80 text-white shadow-md'", "'bg-primary text-primary-foreground shadow-md border-primary'")
sidebar = sidebar.replace("'border-border bg-muted text-muted-foreground hover:border-border hover:text-foreground'", "'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'")

# Profile buttons
sidebar = sidebar.replace('text-white shadow', 'text-primary-foreground shadow')

with open(sidebar_path, 'w', encoding='utf-8') as f:
    f.write(sidebar)

# ChatStream.tsx fixes
chat_path = os.path.join(base_dir, 'ChatStream.tsx')
with open(chat_path, 'r', encoding='utf-8') as f:
    chat = f.read()

chat = chat.replace('text-white', 'text-primary-foreground')
# Message containers contrast
# User message: bg-muted -> bg-card
# Assistant message: bg-muted -> bg-muted (differentiation)
chat = chat.replace("? 'bg-muted border-border hover:border-border'\n                    : 'bg-muted border-border'", "? 'bg-card border-border shadow-sm'\n                    : 'bg-muted border-border'")

with open(chat_path, 'w', encoding='utf-8') as f:
    f.write(chat)

# EvidenceInspector.tsx fixes
insp_path = os.path.join(base_dir, 'EvidenceInspector.tsx')
with open(insp_path, 'r', encoding='utf-8') as f:
    insp = f.read()

insp = insp.replace('text-white', 'text-foreground')

with open(insp_path, 'w', encoding='utf-8') as f:
    f.write(insp)

print("Colors and contrast fixed.")
