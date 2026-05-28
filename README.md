# Audio to Text — Story Recorder App

A web app that records audio, transcribes it locally (no API fees), and saves transcripts to the cloud. Built with Next.js (frontend) and FastAPI + faster-whisper (backend).

---

## Architecture

```
Audio_to_Text_with_LLM_Editing/
├── web-app/        # Next.js 15 frontend (React, TypeScript, Tailwind, Supabase, Stripe)
└── backend/        # FastAPI transcription server (faster-whisper + optional Ollama editing)
```

**How it works:** The web app sends audio to your local FastAPI backend, which runs Whisper offline for transcription (no OpenAI API costs). Optionally, the transcript is passed through a local Ollama LLM for grammar correction before being returned.

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+
- **Supabase** account (free tier works) — [supabase.com](https://supabase.com)
- **Stripe** account (optional, for billing) — [stripe.com](https://stripe.com)
- **Ollama** (optional, for AI editing) — [ollama.com](https://ollama.com)

---

## Step 1 — Supabase Setup (one-time)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New query**, paste and run `web-app/supabase/migrations/001_initial.sql`
3. Go to **Storage → New bucket**, create two public buckets:
   - `profiles`
   - `recordings`
4. Go to **Settings → API** and note your **Project URL**, **anon/public key**, and **service_role key**

---

## Step 2 — Environment Variables

Create `web-app/.env.local` with the following values:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Backend transcription server (required)
BACKEND_URL=http://localhost:8000

# App URL (required)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google Drive (optional — Pro users only)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Stripe (optional — only needed for billing features)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_...
```

---

## Step 3 — Backend (Transcription Server)

Open a terminal and run:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Leave this terminal running. The **first transcription will download the Whisper model (~500 MB)** — this is a one-time download.

**Optional — AI editing with Ollama:**

Install [Ollama](https://ollama.com), then pull a model and start it:

```bash
ollama pull llama3.2
ollama serve
```

The backend will automatically use Ollama at `http://localhost:11434` with `llama3.2` by default. Override with environment variables:

```bash
OLLAMA_URL=http://localhost:11434 OLLAMA_MODEL=llama3.2 uvicorn main:app --host 0.0.0.0 --port 8000
```

**To change the Whisper model size** (accuracy vs. speed tradeoff), edit `backend/main.py`:

```python
_model = WhisperModel("base", ...)    # fastest, ~150 MB
_model = WhisperModel("small", ...)   # balanced, ~500 MB (default)
_model = WhisperModel("medium", ...)  # most accurate, ~1.5 GB
```

---

## Step 4 — Web App (Frontend)

Open a second terminal and run:

```bash
cd web-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running in Production

```bash
# Build the web app
cd web-app
npm run build
npm run start

# Run the backend (same as dev)
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Deploy to Vercel

```bash
cd web-app
npx vercel
```

Set all env vars in the Vercel dashboard under **Settings → Environment Variables**, and update `NEXT_PUBLIC_APP_URL` to your Vercel URL. Note: you still need to run the backend server somewhere accessible (e.g. a VPS or local machine with a tunnel).

---

## iOS (Capacitor) — after Vercel deploy

**Requires:** Xcode (Mac App Store) and an Apple Developer account.

```bash
cd web-app
npx cap add ios
# Update capacitor.config.ts with your Vercel URL
npm run cap:sync
npm run cap:ios   # Opens Xcode — run on simulator or device
```

---

## Android (Capacitor) — after Vercel deploy

**Requires:** [Android Studio](https://developer.android.com/studio) installed.

1. Update `web-app/capacitor.config.ts` with your Vercel URL:
   ```ts
   server: { url: "https://your-app.vercel.app" }
   ```

2. Add Android and open in Android Studio:
   ```bash
   cd web-app
   npx cap add android
   npm run cap:sync
   npx cap open android
   ```

3. In Android Studio: select a device/emulator and press **Run**.

**To build a release APK:**
- In Android Studio: **Build → Generate Signed App Bundle / APK**
- Follow the signing wizard to create a keystore if you don't have one
- Upload the `.aab` to the Google Play Console, or distribute the `.apk` directly

**Microphone permission** is required — add this to `android/app/src/main/AndroidManifest.xml` if not already present:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

---

## Stripe Webhooks (local dev)

```bash
npx stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret printed to the terminal into `STRIPE_WEBHOOK_SECRET` in `.env.local`.

---

## Dependencies Quick Reference

| Package | What it does |
|---------|-------------|
| Next.js 15 | React framework (frontend + API routes) |
| Supabase | PostgreSQL database, auth, and file storage |
| Tailwind CSS | Utility-first styling |
| Capacitor | iOS mobile wrapper |
| Stripe | Subscription billing |
| FastAPI | Python web server for transcription endpoint |
| faster-whisper | Local offline speech-to-text (no API fees) |
| Ollama | Local LLM for grammar correction / AI editing |
