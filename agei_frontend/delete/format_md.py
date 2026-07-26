import os

# 1. agei-governed-gemini-workspace.md
ws_path = r'd:\Github\Architect-EV\AGEI_Consulting\docs\build_docs\agei-governed-gemini-workspace.md'
with open(ws_path, 'r', encoding='utf-8') as f:
    ws_content = f.read()

if '```tsx' not in ws_content:
    ws_content = ws_content.replace('AI Governance Evidence Infrastructure (AGEI)', '# AI Governance Evidence Infrastructure (AGEI)\n\n## Governed Workspace & Interface Redesign (React Component)')
    ws_content = ws_content.replace('Governed Workspace & Interface Redesign (React Component)\n', '')
    
    code_start = ws_content.find("import React, { useState, useEffect } from 'react';")
    if code_start != -1:
        ws_content = ws_content[:code_start] + "```tsx\n" + ws_content[code_start:] + "\n```\n"
    
    with open(ws_path, 'w', encoding='utf-8') as f:
        f.write(ws_content)


# 2. agei-shadow-ai-discovery-engine.md
shadow_path = r'd:\Github\Architect-EV\AGEI_Consulting\docs\build_docs\agei-shadow-ai-discovery-engine.md'
with open(shadow_path, 'r', encoding='utf-8') as f:
    sh_content = f.read()

if '```python' not in sh_content:
    # Fix headers
    sh_content = sh_content.replace('AI Governance Evidence Infrastructure (AGEI)', '# AI Governance Evidence Infrastructure (AGEI)\n\n## Shadow AI Discovery & Governance Response Engine')
    sh_content = sh_content.replace('Shadow AI Discovery & Governance Response Engine\n', '')
    sh_content = sh_content.replace('Executive Summary: The Perimeter Problem', '### Executive Summary: The Perimeter Problem')
    sh_content = sh_content.replace('1. The Evidence-Led Discovery & Control Process', '### 1. The Evidence-Led Discovery & Control Process')
    sh_content = sh_content.replace('2. The Technical Blueprint (Python Engine)', '### 2. The Technical Blueprint (Python Engine)\n\n```python')
    
    # End python block before SQL
    sql_start = sh_content.find('3. Operational Simulation & SQL Receipt Generation')
    if sql_start != -1:
        sh_content = sh_content[:sql_start] + "```\n\n### 3. Operational Simulation & SQL Receipt Generation" + sh_content[sql_start+50:]
        
    # The python simulation block starts again?
    sim_start = sh_content.find('if __name__ == "__main__":')
    if sim_start != -1:
        sh_content = sh_content[:sim_start] + "```python\n" + sh_content[sim_start:]
        
    # End python sim block before SQL output
    sql_out_start = sh_content.find('4. Enterprise Deployment & Perimeter Verification')
    if sql_out_start != -1:
        sh_content = sh_content[:sql_out_start] + "```\n\n### 4. Enterprise Deployment & Perimeter Verification" + sh_content[sql_out_start+49:]

    # The verification block
    ver_start = sh_content.find('def verify_shadow_ai_receipt')
    if ver_start != -1:
        sh_content = sh_content[:ver_start] + "```python\n" + sh_content[ver_start:]
        
    ver_end = sh_content.find('This verification process ensures absolute non-repudiation')
    if ver_end != -1:
        sh_content = sh_content[:ver_end] + "```\n\n" + sh_content[ver_end:]
        
    with open(shadow_path, 'w', encoding='utf-8') as f:
        f.write(sh_content)

print("Markdown formatting applied.")
