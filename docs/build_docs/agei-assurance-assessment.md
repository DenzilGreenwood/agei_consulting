# AGEI Assurance Assessment
**CognitiveInsight.ai — Enterprise AI Governance & Cryptographic Assurance**

## Overview
This technical specification defines the structure, logic, and integration points for the CognitiveInsight.ai Assurance Profile Matchmaker. This self-assessment tool bridges the gap between high-level client interest and our core technical solutions, helping prospect stakeholders quickly identify their risk posture and routing them into the appropriate advisory phase.

## Structure of the Self-Assessment Tool
The assessment evaluates prospects across three critical vectors using 9 targeted questions.

### Vectors Evaluated
1. **System Autonomy & Execution Power**: Assesses the operational mode, authentication methods, and potential business impact of the AI agents.
2. **Data Sensitivity & Privacy Constraints**: Evaluates the type of data processed, the management of 'Shadow AI', and the ability to prove data boundaries.
3. **Regulatory, Legal, & Audit Exposure**: Identifies governance drivers, current audit evidence mechanisms, and downstream artifact defensibility.

### Scoring & Outcome Logic
Each question has 3 options, scoring 1, 2, or 3 points. Total score ranges from 9 to 27 points.
- **9–14 Points → Profile 1: Internal Evidence (Maturity: Developing)**
  - *Recommendation*: Phase 1: Discover & Assess ($15,000)
- **15–21 Points → Profile 2: Regulated Evidence (Maturity: Established)**
  - *Recommendation*: Phase 2: Design & Align ($45,000)
- **22–27 Points → Profile 3: Forensic Evidence (Maturity: Courtroom-Ready)**
  - *Recommendation*: Phase 3: Govern & Adopt ($95,000+)

## Implementation
The assessment logic and data are stored in a valid JSON schema located at `src/data/assessment.json`. A dedicated React component (`src/app/diagnostic/page.tsx`) renders this schema dynamically, handles state management for the user's answers, calculates the score, and renders the tailored outcome screen with strategic call-to-actions.
