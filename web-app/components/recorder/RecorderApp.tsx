"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "recording" | "processing" | "done" | "error";

function AnimatedWave({
  analyserRef,
  isRecording,
}: {
  analyserRef: React.RefObject<AnalyserNode | null>;
  isRecording: boolean;
}) {
  const [bars, setBars] = useState(() =>
    Array.from({ length: 40 }, (_, i) => 8 + Math.sin(i * 0.5) * 8)
  );
  const rafRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!isRecording) {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timeoutRef.current);
      setBars(Array.from({ length: 40 }, (_, i) => 8 + Math.sin(i * 0.5) * 8));
      return;
    }

    const analyser = analyserRef.current;
    if (analyser) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      const step = Math.floor(data.length / 40);
      const frame = () => {
        analyser.getByteFrequencyData(data);
        setBars(
          Array.from({ length: 40 }, (_, i) => {
            const val = data[Math.min(i * step, data.length - 1)] || 0;
            return 8 + (val / 255) * 48;
          })
        );
        rafRef.current = requestAnimationFrame(frame);
      };
      frame();
      return () => cancelAnimationFrame(rafRef.current);
    } else {
      const tick = () => {
        setBars(() => Array.from({ length: 40 }, () => 8 + Math.random() * 48));
        timeoutRef.current = setTimeout(tick, 80);
      };
      tick();
      return () => clearTimeout(timeoutRef.current);
    }
  }, [isRecording, analyserRef]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", height: "64px", width: "100%", padding: "0 8px" }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: "3px",
            borderRadius: "2px",
            background: isRecording ? `rgba(156,163,175,${0.5 + (h / 56) * 0.5})` : "#374151",
            height: `${h}px`,
            transition: isRecording ? "height 0.08s ease" : "height 0.5s ease",
          }}
        />
      ))}
    </div>
  );
}

function EditableName({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    setEditing(false);
    if (!value.trim()) onChange("New Recording");
  };

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { onChange(value); setEditing(false); } }}
        style={{
          background: "transparent",
          border: "none",
          borderBottom: "1px solid #6b7280",
          color: "#f3f4f6",
          fontSize: "15px",
          fontWeight: "600",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textAlign: "center",
          outline: "none",
          width: "160px",
          fontFamily: "inherit",
        }}
        maxLength={40}
      />
    );
  }

  return (
    <button
      onClick={() => !disabled && setEditing(true)}
      title="Click to rename"
      style={{
        background: "none",
        border: "none",
        cursor: disabled ? "default" : "text",
        color: "#f3f4f6",
        fontSize: "15px",
        fontWeight: "600",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        fontFamily: "inherit",
        maxWidth: "180px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        padding: 0,
      }}
    >
      {value}
    </button>
  );
}

export default function RecorderApp() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [seconds, setSeconds] = useState(0);
  const [transcriptText, setTranscriptText] = useState("Tap record to begin speaking...");
  const [menuOpen, setMenuOpen] = useState(false);
  const [recordingName, setRecordingName] = useState("New Recording");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const isRecording = status === "recording";

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const progressPercent = Math.min((seconds / 120) * 100, 100);

  const progressColor = {
    idle: "#4b5563",
    recording: "linear-gradient(90deg, #ef4444, #f87171)",
    processing: "linear-gradient(90deg, #f59e0b, #fbbf24)",
    done: "linear-gradient(90deg, #10b981, #34d399)",
    error: "#ef4444",
  }[status];

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();

      setStatus("recording");
      setSeconds(0);
      setTranscriptText("Recording in progress...");
    } catch {
      setStatus("error");
      setTranscriptText("Microphone access denied.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });

      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
      analyserRef.current = null;

      setStatus("processing");
      setTranscriptText("Transcribing and editing — this may take a minute...");

      const formData = new FormData();
      const filename = `${recordingName.replace(/\s+/g, "_")}.webm`;
      formData.append("audio", blob, filename);

      const res = await fetch("/api/transcribe", { method: "POST", body: formData });

      if (!res.ok) {
        const body = await res.json();
        setStatus("error");
        setTranscriptText(body.error ?? "Transcription failed.");
        return;
      }

      const { ai_text } = await res.json();
      setStatus("done");
      setTranscriptText(ai_text ?? "Transcription complete.");
      router.refresh();
    };

    recorder.stop();
  }, [router, recordingName]);

  const handleRecordButton = () => {
    if (status === "recording") {
      stopRecording();
    } else if (status === "idle" || status === "done" || status === "error") {
      startRecording();
    }
  };

  const handleNewRecording = () => {
    setSeconds(0);
    setStatus("idle");
    setTranscriptText("Tap record to begin speaking...");
    setRecordingName("New Recording");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', 'Courier New', monospace" }}>
      <div style={{ width: "360px", minHeight: "680px", background: "#111827", borderRadius: "40px", border: "2px solid #1f2937", boxShadow: "0 0 0 6px #0f172a, 0 32px 80px rgba(0,0,0,0.8)", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>

        {/* Status bar */}
        <div style={{ height: "28px", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
          <span style={{ color: "#6b7280", fontSize: "11px", letterSpacing: "0.05em" }}>AudioScribe</span>
          <span style={{ color: "#6b7280", fontSize: "11px" }}>▐▐▐ ▲</span>
        </div>

        {/* Top Bar */}
        <div style={{ height: "52px", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid #1f2937", position: "relative" }}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: "5px", padding: "4px" }}
          >
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: "22px", height: "2px", background: menuOpen ? "#ef4444" : "#9ca3af", borderRadius: "2px", transition: "background 0.2s" }} />
            ))}
          </button>

          <EditableName
            value={recordingName}
            onChange={setRecordingName}
            disabled={status === "recording" || status === "processing"}
          />

          <button
            onClick={handleNewRecording}
            style={{ background: "none", border: "1px solid #374151", borderRadius: "6px", color: "#9ca3af", fontSize: "18px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="New Recording"
          >+</button>
        </div>

        {/* Slide-out Menu */}
        {menuOpen && (
          <div style={{ position: "absolute", top: "80px", left: "0", width: "200px", background: "#1f2937", border: "1px solid #374151", borderRadius: "0 12px 12px 0", zIndex: 100, overflow: "hidden", boxShadow: "8px 4px 24px rgba(0,0,0,0.5)" }}>
            {[
              { icon: "📋", label: "Transcriptions", href: "/dashboard/transcriptions" },
              { icon: "💳", label: "Billing", href: "/dashboard/billing" },
            ].map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px", color: "#d1d5db", fontSize: "14px", letterSpacing: "0.05em", cursor: "pointer", borderBottom: "1px solid #374151", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#374151")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </a>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 20px 28px", gap: "20px" }}>

          {/* Waveform Area */}
          <div style={{ background: "#1f2937", borderRadius: "16px", padding: "16px 12px", border: "1px solid #374151", minHeight: "96px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
            {isRecording && (
              <div style={{ position: "absolute", top: "10px", right: "14px", width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", animation: "pulse 1s ease-in-out infinite" }} />
            )}
            <AnimatedWave analyserRef={analyserRef} isRecording={isRecording} />
          </div>

          {/* Timebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ height: "3px", background: "#374151", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPercent}%`, background: progressColor, borderRadius: "2px", transition: "width 1s linear" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280", fontSize: "11px", letterSpacing: "0.08em" }}>
              <span>{formatTime(seconds)}</span>
              <span>2:00</span>
            </div>
          </div>

          {/* Record Button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 0" }}>
            <button
              onClick={handleRecordButton}
              disabled={status === "processing"}
              style={{
                width: "72px", height: "72px", borderRadius: "50%",
                background: isRecording ? "#7f1d1d" : "linear-gradient(145deg, #ef4444, #dc2626)",
                border: "none", cursor: status === "processing" ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: isRecording ? "0 0 0 6px rgba(239,68,68,0.15), 0 0 24px rgba(239,68,68,0.4)" : "0 4px 20px rgba(239,68,68,0.4)",
                transition: "all 0.25s ease", outline: "4px solid #374151", outlineOffset: "3px",
                opacity: status === "processing" ? 0.5 : 1,
              }}
            >
              {isRecording ? (
                <div style={{ width: "22px", height: "22px", background: "#fca5a5", borderRadius: "3px" }} />
              ) : (
                <div style={{ width: "26px", height: "26px", background: "#fef2f2", borderRadius: "50%" }} />
              )}
            </button>
          </div>

          {/* Transcript Box */}
          <div style={{ background: "#1f2937", borderRadius: "14px", padding: "16px", border: `1px solid ${isRecording ? "#374151" : "#1f2937"}`, minHeight: "90px", display: "flex", flexDirection: "column", gap: "8px", transition: "border-color 0.3s" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "10px", letterSpacing: "0.15em", color: "#6b7280", textTransform: "uppercase" }}>
                  {status === "done" ? "Transcript" : "Live Transcript"}
                </span>
                {(isRecording || status === "processing") && (
                  <div style={{ width: "6px", height: "6px", background: "#10b981", borderRadius: "50%", animation: "pulse 1.2s ease-in-out infinite" }} />
                )}
              </div>
              {status === "done" && (
                <button
                  onClick={() => alert("Google Drive save coming soon for Pro users!")}
                  title="Save to Google Drive (Pro)"
                  style={{ background: "none", border: "1px solid #374151", borderRadius: "6px", cursor: "pointer", padding: "3px 8px", display: "flex", alignItems: "center", gap: "5px", color: "#6b7280", fontSize: "10px", letterSpacing: "0.05em" }}
                >
                  <svg width="12" height="12" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H.05c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                    <path d="M43.65 25 29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.4c-.8 1.4-1.2 2.95-1.2 4.5h27.45z" fill="#00ac47"/>
                    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.85l5.85 11.95z" fill="#ea4335"/>
                    <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                    <path d="M59.85 52.9H27.45L13.7 76.7c1.35.8 2.9 1.25 4.5 1.25h50.9c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                    <path d="M73.4 26.45 60.7 4.5C59.9 3.1 58.75 2 57.4 1.2L43.65 25l16.2 27.9H87.2c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                  </svg>
                  Drive
                </button>
              )}
            </div>
            <p style={{ color: status === "idle" ? "#4b5563" : "#d1d5db", fontSize: "13px", lineHeight: "1.6", margin: 0, letterSpacing: "0.02em", minHeight: "42px", maxHeight: "200px", overflowY: "auto", transition: "color 0.3s" }}>
              {transcriptText}
            </p>
          </div>
        </div>

        {/* Bottom Nav */}
        <div style={{ height: "52px", background: "#0f172a", borderTop: "1px solid #1f2937", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
          {[
            { icon: "🎙️", href: "/dashboard" },
            { icon: "📋", href: "/dashboard/transcriptions" },
            { icon: "💳", href: "/dashboard/billing" },
          ].map(({ icon, href }, i) => (
            <a key={i} href={href} style={{ fontSize: "20px", cursor: "pointer", opacity: i === 0 ? 1 : 0.4, padding: "8px 16px", textDecoration: "none" }}>
              {icon}
            </a>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
