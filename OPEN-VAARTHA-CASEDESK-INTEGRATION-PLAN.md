# Open Vaartha + CaseDesk Integration Plan

## Goal

Connect CaseDesk's private investigation workflow with Open Vaartha's public publishing platform while protecting sensitive citizen data and preserving final editorial control.

```text
ComplainBox
    |
    v
CaseDesk intake
    |
    v
Investigation and verification
    |
    v
Editorial approval
    |
    v
Open Vaartha draft
    |
    v
Open Vaartha publication
    |
    v
Published story linked back to CaseDesk
```

## Product Responsibilities

### CaseDesk owns

- Citizen submissions
- Source identity and contact details
- Evidence files
- Claims and verification
- Internal notes
- Tasks and deadlines
- Right-of-reply records
- Editorial preparation
- Audit history

### Open Vaartha owns

- Public articles
- Public videos and social content
- Authors and public profiles
- SEO metadata
- Publication status
- Public engagement
- Comments and audience analytics

### Data that must not leave CaseDesk automatically

- Anonymous source identity
- Phone numbers and email addresses
- Private evidence
- Internal notes
- Unverified claims
- Sensitive personal information
- Confidential legal or safety information

## Phase 1: Define Publishing States

Introduce an editorial publishing lifecycle in CaseDesk:

```text
DRAFT
  -> EDITOR_REVIEW
  -> APPROVED_FOR_EXPORT
  -> SENT_TO_OPEN_VAARTHA
  -> OPEN_VAARTHA_DRAFT
  -> PUBLISHED

OPEN_VAARTHA_DRAFT -> UPDATE_REQUIRED
PUBLISHED          -> ARCHIVED
```

Add a `PublishedStory` record, or an equivalent publishing relation, containing:

- `caseId`
- `provider`
- `externalStoryId`
- `externalDraftId`
- `publicUrl`
- `status`
- `lastSyncedAt`
- `publishedAt`
- `syncError`
- `createdBy`
- `updatedBy`

Keep this separate from the main `Content` record so additional publishing providers can be supported later.

## Phase 2: Define the Shared Content Contract

Create a versioned payload exchanged between CaseDesk and Open Vaartha.

```ts
{
  schemaVersion: "1",
  caseNumber: "CD-2026-00042",
  contentType: "ARTICLE",
  headline: "...",
  dek: "...",
  body: "...",
  language: "en",
  alternateVersions: [],
  location: {
    district: "...",
    town: "..."
  },
  categories: [],
  people: [],
  organizations: [],
  verifiedClaims: [],
  responseSummary: "...",
  evidenceSummary: [],
  seo: {
    title: "...",
    description: "...",
    slug: "..."
  },
  sourceCredit: {
    showPublicly: false
  }
}
```

The contract must contain only approved, publishable material. Private source fields should never be accepted by the integration endpoint.

## Phase 3: Build a Publishing Adapter

Use an adapter instead of coupling CaseDesk directly to Open Vaartha.

```text
CaseDesk editorial service
        |
        v
PublishingProvider interface
        |
        v
OpenVaarthaProvider
        |
        v
Open Vaartha API
```

The provider should support:

- Create draft
- Update draft
- Fetch draft status
- Receive publication status callbacks
- Save the public URL
- Retry failed requests
- Handle idempotency safely
- Log external IDs and responses

This abstraction allows future integrations with other publishing platforms.

## Phase 4: Open Vaartha Integration API

Open Vaartha should expose a protected integration API.

Suggested endpoints:

```text
POST   /api/integrations/casedesk/drafts
PUT    /api/integrations/casedesk/drafts/:id
GET    /api/integrations/casedesk/drafts/:id
POST   /api/integrations/casedesk/webhooks
```

### Authentication

For the first version, use a scoped API key per workspace.

Each API key should be:

- Workspace-scoped
- Permission-scoped
- Rotatable
- Revocable
- Audited
- Stored hashed where practical

OAuth 2.0 or shared SSO can be introduced later.

## Phase 5: CaseDesk Editorial UI

Add an Open Vaartha panel to the CaseDesk content studio.

### Initial actions

- Preview export
- Validate content
- Send as draft
- View external draft
- Refresh status
- Open published story
- Copy public URL

### Export validation

Block export when:

- Claims remain unverified
- Required right-of-reply work is incomplete
- Content safety checks fail
- Source publication consent is missing
- Required headline or body is empty
- Sensitive information is detected
- Evidence references are unresolved

## Phase 6: Open Vaartha Draft Workflow

When CaseDesk sends content:

1. Open Vaartha creates an unpublished draft.
2. Open Vaartha returns the draft ID.
3. The editor opens the draft in Open Vaartha.
4. The editor can rewrite, add media, modify SEO metadata, or reject it.
5. Open Vaartha sends status updates back to CaseDesk.

CaseDesk should not automatically publish content in the first release.

## Phase 7: Webhook and Status Synchronization

Open Vaartha should notify CaseDesk when a draft changes:

```text
DRAFT_CREATED
DRAFT_UPDATED
PUBLISHED
UNPUBLISHED
ARCHIVED
```

Webhook requirements:

- Signed payloads
- Timestamp validation
- Replay protection
- Idempotency keys
- Event IDs
- Retry policy
- Delivery logs

CaseDesk should also provide a manual `Refresh status` fallback.

## Phase 8: Public Story and Case Linking

After publication, save the Open Vaartha URL in CaseDesk.

Optional article credit:

> This investigation originated from a citizen report received through ComplainBox.

Optional public case route:

```text
/open-case/CD-2026-00042
```

The public page may show:

- General issue summary
- Investigation status
- Published stories
- Public updates
- Safe calls for additional information

The public page must not show:

- Source identity
- Internal notes
- Private evidence
- Staff assignments
- Unverified claims
- Sensitive locations

## Phase 9: Authentication Strategy

### Version 1: Separate authentication

- Open Vaartha login remains separate
- CaseDesk login remains separate
- Integration uses workspace-scoped credentials
- Setup is performed by an administrator

### Version 2: Shared identity

- Open Vaartha provides OAuth or SSO
- CaseDesk recognizes creator identity
- Workspace membership can be provisioned automatically
- Account deactivation can be centralized

Separate authentication is recommended initially. It reduces coupling between deployment, user management, and security models.

## Phase 10: Observability and Audit

Track every integration event:

- Exporting user
- Case ID
- Payload schema version
- External draft ID
- Request timestamp
- Response status
- Retry count
- Webhook event ID
- Publication status
- Error details

Add an integration health screen showing:

- API connection status
- Last successful sync
- Failed exports
- Pending webhooks
- Credential expiry
- Retry queue state

## Phase 11: Testing Strategy

### Unit tests

- Content transformation
- Sensitive field removal
- Payload validation
- Permission checks
- Idempotency handling
- Webhook signature validation

### Integration tests

- Create Open Vaartha draft
- Update draft
- Receive publication webhook
- Retry failed request
- Handle duplicate webhook
- Revoke credentials

### Security tests

- Cross-workspace export attempt
- Private source data export attempt
- Invalid API key
- Expired API key
- Forged webhook
- Replay webhook
- Unauthorized publication

### Manual acceptance test

1. Submit a citizen report.
2. Create a CaseDesk case.
3. Add evidence.
4. Verify claims.
5. Create content.
6. Run the safety check.
7. Export the draft.
8. Edit it in Open Vaartha.
9. Publish it.
10. Confirm the public URL returns to CaseDesk.

## Phase 12: Delivery Milestones

### Milestone 1: Editorial export foundation

- Publishing state model
- `PublishedStory` record
- Shared payload schema
- Export preview
- Manual API prototype

### Milestone 2: Open Vaartha draft creation

- Scoped credentials
- Create-draft endpoint
- CaseDesk `Send to Open Vaartha` action
- External draft ID storage
- Basic error handling

### Milestone 3: Status synchronization

- Webhook endpoint
- Signed events
- Draft status display
- Published URL synchronization
- Retry and idempotency

### Milestone 4: Editorial safeguards

- Export validation
- Sensitive-data filtering
- Approval permissions
- Audit logs
- Integration health screen

### Milestone 5: Public accountability loop

- Public case pages
- Article-to-case links
- Additional evidence submission
- Follow-up updates
- Related case discovery

## Recommended First Release

Build only:

- CaseDesk content export
- Open Vaartha draft creation
- Manual Open Vaartha publication
- Published URL synchronization
- Basic audit trail
- Strict data filtering
- Workspace-scoped API credentials

Do not include initially:

- Automatic publishing
- Shared database
- Full SSO
- Cross-platform analytics
- Public case tracking
- Automatic AI article generation
- Two-way editing synchronization

## Success Criteria

The first integration is successful when:

- An approved CaseDesk case can create an Open Vaartha draft.
- No private citizen data leaves CaseDesk.
- Open Vaartha editors retain final publication control.
- Published URLs synchronize back to the case.
- Failed requests can be retried safely.
- Every export is auditable.
- Multiple workspaces remain isolated.
- The integration can support additional publishing platforms later.

## Product Relationship

> CaseDesk discovers, organizes, and verifies the story. Open Vaartha edits, publishes, and reaches the public.
