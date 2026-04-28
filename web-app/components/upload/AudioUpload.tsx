"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const ACCEPTED = ".mp3,.m4a,.wav,.webm,.ogg,.flac,.aac,.mp4";

export default function AudioUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError(null);
      setStatus("idle");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.append("audio", file);

    setStatus("processing");
    const res = await fetch("/api/transcribe", { method: "POST", body: formData });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Upload failed");
      setStatus("error");
      return;
    }

    setStatus("done");
    router.refresh();
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center gap-4"
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleFileChange}
        className="hidden"
        id="audio-input"
      />
      <label
        htmlFor="audio-input"
        className="cursor-pointer px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
      >
        {file ? file.name : "Choose audio file"}
      </label>

      {status === "idle" && !file && (
        <p className="text-xs text-gray-400">MP3, M4A, WAV, WEBM, OGG, FLAC, AAC supported</p>
      )}
      {status === "processing" && (
        <p className="text-sm text-brand-600 animate-pulse">Transcribing and editing — this may take a minute...</p>
      )}
      {status === "done" && (
        <p className="text-sm text-green-600">Done! See your transcription below.</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <button
        type="submit"
        disabled={!file || status === "processing" || status === "uploading"}
        className="px-6 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-40 transition"
      >
        {status === "processing" ? "Processing..." : "Transcribe"}
      </button>
    </form>
  );
}
