"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { WordTimestamp } from "@/types";

interface Props {
  transcriptionId: string;
  audioUrl: string;
  words: WordTimestamp[];
  isPro: boolean;
}

export default function TranscriptionPlayer({ transcriptionId, audioUrl, words: initialWords, isPro }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [words, setWords] = useState(initialWords);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [hasEdits, setHasEdits] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const activeIdx = words.findIndex(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  // Scroll active word into view
  useEffect(() => {
    activeWordRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIdx]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
  };

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const startEdit = (idx: number) => {
    audioRef.current?.pause();
    setEditingIdx(idx);
    setEditValue(words[idx].word.trim());
  };

  const commitEdit = useCallback(() => {
    if (editingIdx === null) return;
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== words[editingIdx].word.trim()) {
      setWords((prev) => {
        const next = [...prev];
        // preserve leading/trailing space from original
        const orig = next[editingIdx].word;
        const leading = orig.startsWith(" ") ? " " : "";
        const trailing = orig.endsWith(" ") ? " " : "";
        next[editingIdx] = { ...next[editingIdx], word: `${leading}${trimmed}${trailing}` };
        return next;
      });
      setHasEdits(true);
    }
    setEditingIdx(null);
  }, [editingIdx, editValue, words]);

  const saveCorrections = async () => {
    setSaving(true);
    setSaveMsg("");
    const correctedText = words.map((w) => w.word).join("").trim();
    const res = await fetch(`/api/transcriptions/${transcriptionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word_timestamps: words, raw_text: correctedText }),
    });
    setSaving(false);
    setSaveMsg(res.ok ? "Saved!" : "Save failed.");
    if (res.ok) setHasEdits(false);
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{ background: "#111827", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={togglePlay}
          style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#ef4444", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><polygon points="5,3 19,12 5,21"/></svg>
          )}
        </button>

        {/* Scrubber */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          <div
            style={{ height: "4px", background: "#374151", borderRadius: "2px", cursor: "pointer", position: "relative" }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seekTo(((e.clientX - rect.left) / rect.width) * duration);
            }}
          >
            <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg,#ef4444,#f87171)", borderRadius: "2px", pointerEvents: "none" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#6b7280" }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Word display */}
      <div style={{ background: "#1f2937", borderRadius: "8px", padding: "12px", maxHeight: "180px", overflowY: "auto", lineHeight: "2", fontSize: "13px" }}>
        <p style={{ margin: 0, color: "#9ca3af", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
          {isPro ? "Click word to seek · Double-click to edit" : "Click word to seek"}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {words.map((w, i) => {
            const isActive = i === activeIdx;
            if (editingIdx === i) {
              return (
                <input
                  key={i}
                  value={editValue}
                  autoFocus
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingIdx(null);
                  }}
                  style={{
                    background: "#374151", border: "1px solid #ef4444", borderRadius: "3px",
                    color: "#f3f4f6", fontSize: "13px", padding: "0 4px",
                    width: `${Math.max(editValue.length, 3)}ch`, outline: "none",
                  }}
                />
              );
            }
            return (
              <span
                key={i}
                ref={isActive ? activeWordRef : null}
                onClick={() => seekTo(w.start)}
                onDoubleClick={() => isPro && startEdit(i)}
                style={{
                  background: isActive ? "#374151" : "transparent",
                  color: isActive ? "#f9fafb" : "#d1d5db",
                  borderRadius: "3px",
                  padding: "1px 2px",
                  cursor: "pointer",
                  transition: "background 0.1s",
                  userSelect: "none",
                  whiteSpace: "pre-wrap",
                }}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      </div>

      {/* Save bar */}
      {(hasEdits || saveMsg) && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {hasEdits && (
            <button
              onClick={saveCorrections}
              disabled={saving}
              style={{ background: "#10b981", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", padding: "6px 14px", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "Saving..." : "Save corrections"}
            </button>
          )}
          {saveMsg && <span style={{ fontSize: "12px", color: saveMsg === "Saved!" ? "#10b981" : "#ef4444" }}>{saveMsg}</span>}
        </div>
      )}

      {!isPro && (
        <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>
          ✦ Upgrade to Pro to edit individual words
        </p>
      )}
    </div>
  );
}
