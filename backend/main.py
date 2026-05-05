import tempfile
import os
import httpx
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

app = FastAPI(title="Local Transcription API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

_model: WhisperModel | None = None

def get_model() -> WhisperModel:
    global _model
    if _model is None:
        # Swap "medium" for "large-v3" for best accuracy (slower)
        _model = WhisperModel("medium", device="cpu", compute_type="int8")
    return _model


async def ollama(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.post(f"{OLLAMA_URL}/api/generate", json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
        })
        res.raise_for_status()
        return res.json()["response"].strip()


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        segments, _ = get_model().transcribe(tmp_path, beam_size=5)
        raw_text = " ".join(seg.text.strip() for seg in segments)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)

    grammar_text = raw_text
    ai_text = raw_text

    try:
        grammar_text = await ollama(
            f"Correct the grammar, spelling, and punctuation in this text. "
            f"Keep word changes minimal. Return only the corrected text, no comments.\n\n{raw_text}"
        )
        ai_text = await ollama(
            f"You are a clarity and editing assistant. Improve grammar, punctuation, and flow "
            f"while keeping the original tone and word choices. Make it sound professional. "
            f"Return only the corrected version, no commentary.\n\nInput: {grammar_text}"
        )
    except Exception:
        # Ollama unavailable — return raw transcription for all fields
        pass

    return {"raw_text": raw_text, "grammar_text": grammar_text, "ai_text": ai_text}
