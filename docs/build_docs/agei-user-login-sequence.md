# AGEI User Login & Session Initialization Sequence
**Technical Specification & Schema Integration Flow**
**Document Version:** 1.0.0
**Target Architecture:** Supabase / Next.js / PostgreSQL (60-table AGEI database schema)

## 1. Executive Summary
In a standard web application, "logging in" is a simple operational task of verifying credentials and issuing a JSON Web Token (JWT). However, for an AI Governance Evidence Infrastructure (AGEI) platform, a user login is a critical security and audit transition [92, 93].

The identity of the auditor, executive, or MLOps engineer must be cryptographically bound to every subsequent action they perform—such as signing a policy, reviewing a human-in-the-loop (HITL) queue, or exporting an Audit Pack [147].

This document defines the 6-Step Cryptographically Verifiable Login & Session Initialization Sequence for the CognitiveInsight consultancy platform (AGEI Platform). It details exactly how standard Supabase/OAuth authentication transitions into a zero-trust, privacy-preserving cryptographic session, mapping every state transition directly to your database tables [249, 252].

## 2. Core Architectural Sequence Diagram
```text
 +-------------+          +----------------+          +--------------------+          +----------------+          +------------------------+
 | User Browser|          | Next.js Server |          | Supabase Auth / DB |          |  Platform KMS  |          | Evidence Vault (WORM)  |
 +-------------+          +----------------+          +--------------------+          +----------------+          +------------------------+
        |                         |                             |                             |                                |
        | 1. Submit Credentials   |                             |                             |                                |
        |------------------------>|                             |                             |                                |
        |                         | 2. Authenticate User        |                             |                                |
        |                         |---------------------------->|                             |                                |
        |                         |                             |                             |                                |
        |                         | 3. Query Principal & Org    |                             |                                |
        |                         |<----------------------------|                             |                                |
        |                         |    (Verify active member)   |                             |                                |
        |                         |                             |                             |                                |
        |                         | 4. Fetch Active Data Notice |                             |                                |
        |                         |---------------------------->|                             |                                |
        |                         |<----------------------------|                             |                                |
        |                         |                             |                             |                                |
        |     [ IF Acknowledgment Required ]                    |                             |                                |
        | 5. Show Consent Screen  |                             |                             |                                |
        |<------------------------|                             |                             |                                |
        | 6. Sign Agreement       |                             |                             |                                |
        |------------------------>|                             |                             |                                |
        |                         | 7. Create user_data_notices |                             |                                |
        |                         |---------------------------->|                             |                                |
        |                         |                             |                             |                                |
        |                         | 8. Resolve Key Material     |                             |                                |
        |                         |---------------------------->|                             |                                |
        |                         |<----------------------------|                             |                                |
        |                         |                             |                             |                                |
        |                         | 9. Decrypt Envelope Key     |                             |                                |
        |                         |---------------------------------------------------------->|                                |
        |                         |<----------------------------------------------------------|                                |
        |                         |                             |                             |                                |
        |                         | 10. Write Audit Event       |                             |                                |
        |                         |---------------------------->|                             |                                |
        |                         |                             |                             |                                |
        |                         | 11. Emit Signed Login Receipt                             |                                |
        |                         |------------------------------------------------------------------------------------------->|
        |                         |                                                                                            |
        | 12. Session Established |                                                                                            |
        |<------------------------|                                                                                            |
```

## 3. Step-by-Step Execution Protocol

### Step 1: Authentication & JWT Issuance (Supabase Auth)
The user (e.g., Elena Rostova, Chief Risk Officer or Marcus Vance, CISO) initiates login at the public portal using enterprise Single Sign-On (SSO) or password-based multi-factor authentication (MFA) [17, 36].

*   The frontend client transmits credentials to Supabase Auth.
*   Supabase Auth validates credentials, creates an active session in `auth.users`, and returns an access JWT to the client.
*   The client attaches this JWT as a bearer token in subsequent headers to the Next.js server.

### Step 2: Identity Context Matching (Principals Resolution)
Standard auth tells the system who the user is in the database system, but the AGEI stack must resolve them as a first-class governed Principal [2, 252].

*   Next.js extracts the `auth_user_id` from the decoded JWT.
*   The system executes a query against `public.principals` to resolve the corresponding record [2]:
```sql
SELECT id, principal_type, email, public_key_fingerprint, public_key_pem, is_active, is_verified
FROM public.principals
WHERE auth_user_id = $1 AND is_active = true;
```
*   **Invariant Check:** The system verifies that the principal is verified and active (`is_active = true`) [2]. If the principal record does not exist or is inactive, access is aborted, and a security exception is triggered in `public.authorization_audit_events` [81].

### Step 3: Multi-Tenant & Preference Context Resolution
A principal can belong to multiple enterprise organizations. AGEI Platform must determine the correct organizational tenant boundary to enforce Row-Level Security (RLS) [250, 256].

*   Resolve the principal’s default organization preferences [80]:
```sql
SELECT default_organization_id, theme, timezone, locale
FROM public.principal_preferences
WHERE principal_id = $1;
```
*   Query active organizational membership and role-based permissions [2]:
```sql
SELECT organization_id, role, permissions
FROM public.organization_members
WHERE principal_id = $1 AND is_active = true;
```
*   If the principal has membership in multiple organizations, they are prompted on screen to select their active tenant. The select action writes a state change [70]:
    *   **Table:** `public.account_event_log`
    *   **Event Type:** `organization_selected`
    *   **Metadata:** `{"organization_id": "<selected-uuid>"}`

### Step 4: Governance & Privacy Notice Consent Gate
Under global privacy compliance frameworks (like EU AI Act and GDPR), users must acknowledge how their data and interactions are processed and recorded within the evidence perimeter [92, 420].

*   The server fetches the latest active privacy notice version from the organization's policy metadata [71, 72].
*   The server queries to check if this principal has previously acknowledged this exact version [71, 72]:
```sql
SELECT id FROM public.user_data_notices
WHERE user_id = $1 AND notice_version = $2;
```
*   **If NO record exists:**
    *   The user is redirected to a blocking modal/screen displaying the full privacy notice.
    *   Upon checking the agreement box and clicking "Accept," the system logs a `privacy_notice_acknowledged` event to `public.account_event_log` [70] and writes an immutable record to `public.user_data_notices` linking to the transaction receipt [72].

### Step 5: Cryptographic Envelope Key Resolution (Envelope Decryption)
AGEI Platform uses a Dual Hash Model and envelope encryption to encrypt sensitive payload histories (like raw audit logs or agent prompt payload context) [11, 515]. This allows cryptographic erasure (GDPR Article 17 compliance) by simply deleting the subject's decryption key while leaving receipt hashes intact [11, 72].

*   The system fetches the principal’s personal encryption key metadata [72]:
```sql
SELECT id, encrypted_key_material, key_iv, key_auth_tag, key_algorithm, key_status
FROM public.subject_encryption_keys
WHERE user_id = $1 AND key_scope = 'user' AND key_status = 'active';
```
*   The server requests the platform's Key Management Service (KMS) or HSM provider to decrypt the master `encrypted_key_material` using standard AES-256-GCM [72].
*   The decrypted symmetric key is held strictly in the transient memory of the isolated server-side session. This key is used on the fly to decrypt any `public.receipt_encrypted_content` associated with that user's view [72].

### Step 6: Verifiable Event Commitment & Receipt Generation
In the "Proof, Not Logs" paradigm, logging in is itself a governed event that must be anchored into the immutable evidence graph [93, 249].

*   **Audit Log Write:** Write a record to `public.account_event_log` [69, 70]:
```sql
INSERT INTO public.account_event_log (organization_id, principal_id, auth_user_id, event_type, event_status, ip_hash, user_agent_hash, metadata)
VALUES ($1, $2, $3, 'login', 'recorded', $4, $5, $6);
```
*   **Canonical JSON Payload Creation:** Generate a standardized receipt payload following RFC 8785 [515]:
```json
{
  "event": "user_login",
  "principal_id": "usr_9a38f420...",
  "organization_id": "org_712ab890...",
  "timestamp_utc": "2026-07-24T13:55:00Z",
  "notice_version_acknowledged": "2026-04-18"
}
```
*   **Receipt Sealing:** Hash the canonical JSON with SHA-256 and sign it using the organization's private Ed25519 signing key [3, 6, 7].
*   **Vault Write:** Insert the sealed proof into `public.receipts` [6, 7]:
    *   **Column `receipt_type`:** `login_receipt` [5]
    *   **Column `content_hash`:** `sha256:7f83b12ce...` [6]
    *   **Column `signature`:** `<Ed25519-signature-string>` [7]
    *   **Column `signing_key_id`:** `<active-signing-key-uuid>` [7]

## 4. Supabase Database Schema Tracing Map
To implement this sequence seamlessly, your backend code will interact directly with these specific database tables:

| Database Table | Field Used | Purpose in Flow |
| :--- | :--- | :--- |
| `public.principals` | `id`, `auth_user_id`, `principal_type`, `is_active` | Maps Supabase Auth UUID to the custom GRC principal identifier [2]. |
| `public.principal_preferences` | `default_organization_id` | Determines which tenant schema is loaded first by default [80]. |
| `public.organization_members` | `organization_id`, `role`, `permissions` | Verifies tenant authorization and fetches user role (e.g., Auditor vs Operator) [2]. |
| `public.account_event_log` | `event_type`, `event_status`, `metadata` | Tracks login operations and organization selections as auditable events [69, 70]. |
| `public.user_data_notices` | `notice_version`, `acknowledged_at`, `receipt_id` | Proves consent compliance, locking access until notices are agreed [71, 72]. |
| `public.subject_encryption_keys` | `encrypted_key_material`, `key_status` | Retrieves envelope key material to permit on-the-fly decryption of sensitive metadata [72]. |
| `public.receipts` | `receipt_payload`, `content_hash`, `signature`, `signing_key_id` | Stores the cryptographically sealed, immutable login event receipt in the vault [5, 6, 7]. |
| `public.authorization_audit_events` | `event_type`, `decision`, `reason_code` | Logs any failed or anomalous login attempts as security events [81]. |

## 5. Security & Invariant Rules for Developers
Engineers building the AGEI Platform application must enforce these hard constraints in code:

*   **RLS is Mandatory:** No API endpoint should query any table without passing the active `organization_id` (retrieved from `public.organization_members` during Step 3) to enforce strict multi-tenant Row-Level Security [253, 256].
*   **Deny-by-Default Consent Gate:** If the query in Step 4 returns no matching notice version, the API gateway MUST block all read/write routing and only allow requests to the `user_data_notices` creation endpoint.
*   **Decryption Key Isolation:** Symmetric decryption keys retrieved in Step 5 must never be stored in persistent browser storage (like localStorage) or cookie files. They must exist purely in transient memory on the secure server.
*   **Tamper-Evident Signatures:** The login receipt generated in Step 6 must be canonicalized using RFC 8785 Canonical JSON rules before signing [515]. This ensures that any change in user agent, timestamp, or tenant ID will immediately break signature verification [486, 492].
