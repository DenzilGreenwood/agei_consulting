import os

path = 'd:/Github/Architect-EV/AGEI_Consulting/agei_frontend/src/components/ShadowAIDashboard.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace colors
replacements = {
    'bg-gray-900': 'bg-card',
    'bg-gray-950': 'bg-muted',
    'border-gray-800': 'border-border',
    'border-gray-700': 'border-primary/50',
    'text-white': 'text-foreground',
    'text-gray-400': 'text-muted-foreground',
    'text-gray-500': 'text-muted-foreground',
    'text-purple-500': 'text-primary',
    'text-red-400': 'text-destructive',
    'text-red-500': 'text-destructive',
    'bg-red-500/10': 'bg-destructive/10',
    'border-red-500/20': 'border-destructive/20',
    'hover:bg-red-500/20': 'hover:bg-destructive/20',
    'text-amber-400': 'text-warning',
    'text-amber-500': 'text-warning',
    'bg-amber-500/10': 'bg-warning/10',
    'border-amber-500/20': 'border-warning/20',
    'hover:bg-amber-500/20': 'hover:bg-warning/20',
    'text-blue-400': 'text-info',
    'text-blue-500': 'text-info',
    'bg-blue-500/10': 'bg-info/10',
    'border-blue-500/20': 'border-info/20',
    'hover:bg-blue-500/20': 'hover:bg-info/20',
}

for old, new_ in replacements.items():
    content = content.replace(old, new_)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Dashboard colors remapped.")
