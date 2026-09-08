# Interview Assistant — AI Hiring Platform

Speech-to-speech AI interviews for company hiring. Candidates upload their resume; every question is tailored to their specific experience — not generic templates.

## How It Works

```
Company (HR)                         Candidate
     │                                    │
     ├─ Create job posting                │
     ├─ Get shareable link ──────────────► Opens link
     │                                    ├─ Uploads resume (PDF/DOCX/TXT)
     │                                    ├─ Voice interview (resume-based Qs)
     │                                    └─ Thank you + evaluation generated
     └─ Reviews hiring evaluation report ◄── Transcript + scores + recommendation
```

## Features

- **Resume-driven questions** — AI reads the resume and asks about specific projects, skills, and companies
- **Speech-to-speech interviews** — natural voice conversation via OpenAI Realtime API
- **Company portal** — create positions, generate candidate links
- **Hiring evaluation** — scores, resume verification, hire/no-hire recommendation
- **Multiple interview types** — behavioral, technical, system design, mixed

## Prerequisites

- Node.js 18+
- OpenAI API key with Realtime API access
- Microphone + headphones (for candidates)

## Setup

```bash
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY=sk-... to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### For Companies (HR / Hiring Managers)

1. Go to **Company Portal** (`/company`)
2. Create a position with company name, role, and job description
3. Copy the generated candidate link
4. Send the link to applicants

### For Candidates

1. Open the link from the company
2. Enter name and email
3. **Upload resume** (required — PDF, DOCX, or TXT)
4. Begin the voice interview
5. Receive confirmation when complete

## API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/parse-resume` | Extract and analyze resume text |
| `POST /api/session` | Create OpenAI Realtime session |
| `POST /api/feedback` | Generate hiring evaluation report |

## Tech Stack

- Next.js 15, TypeScript, Tailwind CSS 4
- OpenAI Realtime API (WebRTC speech-to-speech)
- unpdf + mammoth (resume parsing)
- Zustand (state management)

## License

MIT
