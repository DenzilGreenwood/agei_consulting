import os

path = 'd:/Github/Architect-EV/AGEI_Consulting/agei_frontend/src/components/example/EvidenceInspector.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('{isInspectorOpen && (', '')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed EvidenceInspector")
