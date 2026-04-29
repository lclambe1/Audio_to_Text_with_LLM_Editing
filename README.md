# Story Recorder App

A mobile/web app that records audio, transcribes it locally (no API fees), and saves transcripts to the cloud. Built with Flutter (frontend) and FastAPI + faster-whisper (backend).

---

## Architecture Overview

```
Audio_to_Text_with_LLM_Editing/
├── transcription_app/        # Flutter app (what the user sees)
│   └── lib/
│       ├── main.dart         # App entry point + theme
│       ├── models/           # Data shapes (Profile, Folder, Recording)
│       ├── screens/          # UI pages
│       └── services/         # Logic (recording, transcription, Supabase)
├── backend/                  # FastAPI server (transcription engine)
│   ├── main.py               # API endpoint
│   ├── requirements.txt      # Python dependencies
│   └── supabase_schema.sql   # Database setup
└── web-app/                  # Original Next.js web app (reference only)
```

---

## How to Run

### Step 1 — Supabase (one-time setup)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New query**, paste and run the contents of `backend/supabase_schema.sql`
3. Go to **Storage → New bucket**, create two public buckets:
   - `profiles`
   - `recordings`
4. Go to **Settings → API**, copy your **Project URL** and **anon/public key**
5. Paste them into `transcription_app/lib/main.dart` lines 6–7:
   ```dart
   const _supabaseUrl = 'https://your-project.supabase.co';
   const _supabaseAnonKey = 'your-anon-key';
   ```

### Step 2 — Backend (transcription server)

Open a terminal and run:
```bash
cd "path/to/Audio_to_Text_with_LLM_Editing/backend"
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Leave this terminal running. The first transcription will download the Whisper model (~150 MB).

### Step 3 — Flutter App

Open a second terminal:
```bash
cd "path/to/Audio_to_Text_with_LLM_Editing/transcription_app"
flutter pub get
flutter run -d chrome        # browser preview
flutter run                  # connected Android device
```

To see available devices: `flutter devices`

---

## Code Walkthrough

### `transcription_app/lib/main.dart`
The entry point. Does two things:
1. Initializes Supabase with your credentials
2. Sets the global theme (gray background `#E0E0E0`, red accent color) and launches `ProfilesScreen`

**To change the color scheme:** edit the `ThemeData` block — swap `Colors.red` for any color and change `0xFFE0E0E0` to a different hex background.

---

### Models (`lib/models/`)

Plain Dart classes that represent database rows. Each has:
- Fields matching the Supabase table columns
- A `fromJson()` factory that converts Supabase's response into a Dart object

| File | Maps to Supabase table | Key fields |
|------|----------------------|------------|
| `profile.dart` | `profiles` | name, photo_url |
| `folder.dart` | `folders` | name, profile_id |
| `recording.dart` | `recordings` | title, transcript, audio_url, folder_id |

**To add a field** (e.g. a `description` to folders): add it to the Supabase table via SQL, add it to the Dart class, and update `fromJson()` to read it.

---

### Services (`lib/services/`)

#### `audio_service.dart`
Handles the microphone. Uses the `record` package to:
- Request mic permission from the OS
- Start recording to a temp `.m4a` file at 16kHz mono (optimal for Whisper)
- Stop and return the file path

**To change audio quality:** edit the `RecordConfig` in `startRecording()`. Higher sample rates = better quality but larger files.

#### `transcription_service.dart`
Sends the audio file to your local FastAPI server and gets back text. Key detail:
- On Chrome/web it talks to `localhost:8000`
- On Android emulator it talks to `10.0.2.2:8000` (Android's way of saying "the Mac running the emulator")
- On a real Android device, change `10.0.2.2` to your Mac's local IP (find it in System Settings → Wi-Fi → Details)

**To point at a different server:** change `_baseUrl` in this file.

#### `supabase_service.dart`
All database and file storage operations. Organized into three sections:
- **Profiles** — create, list, update, delete
- **Folders** — create, list, delete (per profile)
- **Recordings** — save, list, delete (per folder); also uploads audio to Supabase Storage

**To add a new database operation:** add a method here following the same pattern — `_db.from('table_name').insert/select/update/delete`.

---

### Screens (`lib/screens/`)

The app has 4 screens that form a drill-down navigation:

```
ProfilesScreen → ProfileScreen → FolderScreen → RecordScreen
(list profiles)  (list folders)  (list recordings) (record + transcribe)
```

#### `profiles_screen.dart`
- Shows all profiles as cards with photo/avatar and name
- "+" FAB opens a dialog to enter a name and optionally pick a photo from the gallery
- Tap a profile → navigate to `ProfileScreen`
- Delete button removes profile and all its data (cascade delete in DB)

#### `profile_screen.dart`
- Header shows the profile photo (tap to change) and name
- Lists folders as cards with a yellow folder icon
- "+" FAB opens a dialog to name a new folder

#### `folder_screen.dart`
- Lists recordings in reverse-chronological order
- Each card shows title, date, and a 2-line transcript preview
- Tap a recording → slide-up sheet with the full transcript and a Copy button
- Mic FAB → navigate to `RecordScreen`

#### `record_screen.dart`
- The recording UI: large red mic button, status badge (Ready / Recording / Transcribing / Done)
- Tap mic → starts recording
- Tap stop → sends audio to FastAPI → displays transcript
- "Save" button → dialog to enter a title → saves to Supabase

**To change the button color:** find `color: Colors.red` in `record_screen.dart` and swap the color.

**To add LLM editing** (like the web app had): after getting the transcript back from `TranscriptionService`, make a second HTTP call to an API (OpenAI, Anthropic, etc.) before setting `_transcript`. Add a second status state like `_State.editing`.

---

### `backend/main.py`

A FastAPI server with a single endpoint: `POST /transcribe`

1. Receives an audio file upload
2. Saves it to a temp file
3. Runs faster-whisper on it
4. Returns `{ "text": "transcribed words here" }`
5. Deletes the temp file

**To change the Whisper model size** (accuracy vs speed tradeoff):
```python
# In main.py around line 20:
_model = WhisperModel("base", ...)    # fastest, least accurate (~150 MB)
_model = WhisperModel("small", ...)   # good balance (~500 MB)
_model = WhisperModel("medium", ...)  # slower, more accurate (~1.5 GB)
```

**To add a language hint** (speeds up transcription):
```python
segments, _ = model.transcribe(tmp_path, beam_size=5, language="en")
```

---

### `backend/supabase_schema.sql`

The database structure. Three tables with these relationships:
```
profiles
  └── folders  (a profile has many folders)
        └── recordings  (a folder has many recordings)
```

`on delete cascade` means deleting a profile automatically deletes all its folders and recordings.

---

## Common Changes

### Change the app name
Edit `title` in `main.dart` and the app bar titles in each screen.

### Add a notes field to recordings
1. In Supabase SQL editor: `alter table recordings add column notes text;`
2. Add `final String? notes;` to `recording.dart` and update `fromJson()`
3. Add a notes `TextField` to the save dialog in `record_screen.dart`
4. Pass `'notes': notes` in the `saveRecording()` insert in `supabase_service.dart`

### Run on a real Android phone
1. Enable Developer Options on your phone (tap Build Number 7 times in Settings → About)
2. Enable USB Debugging
3. Plug in via USB
4. Change `10.0.2.2` → your Mac's local IP in `transcription_service.dart`
5. Run `flutter run`

### Add Stripe subscriptions (future)
Stripe on mobile requires a server-side component. The plan:
1. Add Stripe endpoints to `backend/main.py` (create checkout session, handle webhook)
2. In Flutter, open a WebView or browser to the Stripe checkout URL
3. Listen for the webhook to confirm payment and update a `subscriptions` table in Supabase

---

## Dependencies Quick Reference

| Package | What it does |
|---------|-------------|
| `record` | Mic recording |
| `http` | HTTP calls to FastAPI |
| `path_provider` | Gets the temp folder path on device |
| `permission_handler` | Asks user for mic permission |
| `supabase_flutter` | Supabase database + storage client |
| `image_picker` | Opens photo gallery to pick profile picture |
| `cached_network_image` | Loads and caches profile photos from URL |
| `intl` | Date formatting (e.g. "April 28, 2026") |
| `faster-whisper` (Python) | Local speech-to-text, no API fees |
| `fastapi` (Python) | Web server framework |
| `uvicorn` (Python) | Runs the FastAPI server |
