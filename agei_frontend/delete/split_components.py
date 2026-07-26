import os

path = 'd:/Github/Architect-EV/AGEI_Consulting/agei_frontend/src/app/example/page.tsx'
out_dir = 'd:/Github/Architect-EV/AGEI_Consulting/agei_frontend/src/components/example'
os.makedirs(out_dir, exist_ok=True)

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

content = "".join(lines)

# Split into types, data, and components.
# This requires robust parsing. Since it's complex, I will just read the file, and create the new files manually using write_to_file calls by reading chunks if needed.

# Let's extract the types block
types_start = content.find('interface Message')
types_end = content.find('// =================================================------------------------\n// Initial Seed Data')
types_code = content[types_start:types_end]

with open(os.path.join(out_dir, 'types.ts'), 'w', encoding='utf-8') as f:
    f.write(types_code)

# Extract seed data
seed_start = content.find('const SEED_STEPS: Message[][] = [')
seed_end = content.find('export default function AGEIGovernedWorkspace()')
seed_code = "import { Message } from './types';\n\n" + content[seed_start:seed_end]

with open(os.path.join(out_dir, 'data.ts'), 'w', encoding='utf-8') as f:
    f.write(seed_code)

print('Types and data extracted.')
