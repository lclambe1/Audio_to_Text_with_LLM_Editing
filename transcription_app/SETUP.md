# Setup

## 1. Supabase

1. Create a free project at supabase.com
2. Run `backend/supabase_schema.sql` in your Supabase SQL editor
3. Create two storage buckets (Dashboard → Storage → New bucket):
   - `profiles` (public)
   - `recordings` (public)
4. Copy your Project URL and anon key from Settings → API
5. Paste them into `lib/main.dart`:
   ```dart
   const _supabaseUrl = 'https://xxxx.supabase.co';
   const _supabaseAnonKey = 'your-anon-key';
   ```

## 2. Flutter app

```bash
cd transcription_app
flutter create --project-name transcription_app --platforms web,android .
flutter pub get
```

### Android permissions
Add to `android/app/src/main/AndroidManifest.xml` inside `<manifest>`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
```

### Run
```bash
flutter run -d chrome    # web preview
flutter run              # connected Android device/emulator
```

## 3. Backend (local transcription, no API fees)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

The `base` Whisper model (~150 MB) downloads automatically on first use.
Swap to `small` or `medium` in `main.py` for better accuracy.

## Stripe (future)
Stripe on mobile requires a backend webhook. The FastAPI backend is the right
place to add it — extend `backend/main.py` with Stripe endpoints when ready.
