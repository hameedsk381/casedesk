# CaseDesk Citizen Story Portal (Standalone App)

A completely separate, public-facing, unauthenticated citizen story and whistleblower submission application for CaseDesk.

---

## 🌟 Key Architecture & Threat Model

- **Air-Gapped from Internal Newsroom**: This application contains zero database credentials, zero journalist user session tokens, and zero internal dossiers.
- **Story-First, Empathetic Flow**: Designed specifically for rural and urban citizens, whistleblowers, and victims of civic neglect.
- **Bilingual (Telugu & English)**: Native support for Telugu script (`ప్రజా ఫిర్యాదుల పోర్టల్`) with instant language switching.
- **Audio & Media First**: Citizens can record voice dispatches directly in their browser without typing.
- **Transparent 5-Stage Milestone Tracker**: Automatically delivers a tracking code formatted as `CD-IN-YYYY-XXXXX`.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start the dev server on Port 3001
npm run dev
```

The portal runs on `http://localhost:3001`.

### Branded Creator Slugs
- Default desk portal: `http://localhost:3001/`
- Branded creator portal: `http://localhost:3001/janata-investigation-desk`

---

## ⚙️ Environment Variables

Create `.env.local`:

```env
# URL where CaseDesk backend is running
NEXT_PUBLIC_CASEDESK_API_URL=http://localhost:3000

# Default workspace/creator slug
NEXT_PUBLIC_DEFAULT_SLUG=janata-investigation-desk
```

---

## 🔄 API Ingestion Contract

Submissions are transmitted via HTTP POST to:
`POST ${NEXT_PUBLIC_CASEDESK_API_URL}/api/submit/${slug}`

Supported payloads:
- `application/json`
- `multipart/form-data` (with voice audio recordings and file attachments)

The CaseDesk backend automatically runs AI Triage, flags sensitive personal data (Aadhaar, UPI, medical records), checks for duplicates against active cases, and drops the dispatch directly into the creator's **Intelligent Intake Inbox** (`/app/inbox`).
