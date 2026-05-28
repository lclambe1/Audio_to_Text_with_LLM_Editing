"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Transcription, SubjectProfile } from "@/types";
import { cn } from "@/lib/utils";
import TranscriptionPlayer from "./TranscriptionPlayer";
import SubjectProfilePicker from "@/components/profile/SubjectProfilePicker";

function downloadTxt(filename: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  a.download = `${filename}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  transcribing: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  editing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  error: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
};

type Tab = "raw" | "grammar" | "ai";

export default function TranscriptionCard({
  transcription: t,
  isPro = false,
}: {
  transcription: Transcription;
  isPro?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>(isPro ? "ai" : "grammar");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [subjectProfileId, setSubjectProfileId] = useState<string | null>(t.subject_profile_id);
  const [subject, setSubject] = useState<SubjectProfile | null | undefined>(t.subject_profiles);

  // Editable title
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(t.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.select();
  }, [editingTitle]);

  const commitTitle = async () => {
    setEditingTitle(false);
    const trimmed = titleValue.trim();
    if (!trimmed) { setTitleValue(t.title); return; }
    if (trimmed === t.title) return;
    await fetch(`/api/transcriptions/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed }),
    });
  };

  const handleDelete = async () => {
    setIsDeleted(true);
    const res = await fetch(`/api/transcriptions/${t.id}`, { method: "DELETE" });
    if (!res.ok) {
      setIsDeleted(false);
      setShowConfirm(false);
      return;
    }
    router.refresh();
  };

  if (isDeleted) return null;

  const text = tab === "raw" ? t.raw_text : tab === "grammar" ? t.grammar_text : t.ai_text;

  const handleProfileChange = async (id: string | null) => {
    setSubjectProfileId(id);
    // Optimistically clear subject until page refresh brings the joined data
    setSubject(null);
    await fetch(`/api/transcriptions/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_profile_id: id }),
    });
    router.refresh();
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50">
      {/* Header row — no full-row hover */}
      <div className="w-full flex items-center justify-between px-5 py-4">

        {/* Left: avatar picker + title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar — click to reassign profile */}
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <SubjectProfilePicker
              value={subjectProfileId}
              onChange={handleProfileChange}
              avatarOnly
            />
          </div>

          {/* Title area — click to expand */}
          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setOpen((o) => !o)}>
            {/* Double-click title to rename */}
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTitle();
                  if (e.key === "Escape") { setTitleValue(t.title); setEditingTitle(false); }
                }}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold border-b border-gray-400 outline-none bg-transparent w-full text-sm"
              />
            ) : (
              <p
                className="font-semibold truncate"
                onDoubleClick={(e) => { e.stopPropagation(); setEditingTitle(true); }}
                title="Double-click to rename"
              >
                {titleValue}
              </p>
            )}
            <p className="text-xs text-gray-400">
              {subject && <span className="mr-2">{subject.display_name} ·</span>}
              {new Date(t.created_at).toLocaleString()}
              {t.duration_seconds != null && (
                <span className="ml-2">· {Math.floor(t.duration_seconds / 60)}m {Math.round(t.duration_seconds % 60)}s</span>
              )}
            </p>
          </div>
        </div>

        {/* Right: status + delete */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span className={cn("text-xs px-2 py-1 rounded-full font-medium", STATUS_STYLES[t.status])}>
            {t.status}
          </span>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-gray-400 hover:text-red-500 transition p-1 rounded"
              title="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Delete?</span>
              <button onClick={handleDelete} className="text-xs text-red-500 font-semibold hover:underline">Yes</button>
              <button onClick={() => setShowConfirm(false)} className="text-xs text-gray-400 hover:underline">No</button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {open && t.status === "done" && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-4 flex flex-col gap-4">
          {t.word_timestamps && t.word_timestamps.length > 0 && (
            <TranscriptionPlayer
              transcriptionId={t.id}
              audioUrl={t.audio_url}
              words={t.word_timestamps}
              isPro={isPro}
            />
          )}

          <div className="flex gap-2">
            <button onClick={() => setTab("raw")} className={cn("text-xs px-3 py-1 rounded-full font-medium transition", tab === "raw" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600")}>Raw</button>
            <button onClick={() => setTab("grammar")} className={cn("text-xs px-3 py-1 rounded-full font-medium transition", tab === "grammar" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600")}>Grammar Fixed</button>
            {isPro ? (
              <button onClick={() => setTab("ai")} className={cn("text-xs px-3 py-1 rounded-full font-medium transition", tab === "ai" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600")}>AI Edited ✦</button>
            ) : (
              <span className="text-xs px-3 py-1 rounded-full bg-gray-50 text-gray-400 border border-dashed dark:bg-gray-800 dark:border-gray-600">AI Edited — Pro only</span>
            )}
          </div>

          <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">{text ?? "—"}</p>

          {/* Export actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-400 mr-1">Export:</span>

            {/* Download .txt */}
            <button
              onClick={() => downloadTxt(titleValue, text ?? "")}
              className="text-xs px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Download .txt
            </button>

            {/* Download audio */}
            <a
              href={t.audio_url}
              download={`${titleValue}.audio`}
              className="text-xs px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Download audio
            </a>

            {/* Save to Google Drive — Pro only */}
            {isPro ? (
              <a
                href={`/api/auth/google?transcriptionId=${t.id}&tab=${tab}&title=${encodeURIComponent(titleValue)}`}
                className="text-xs px-3 py-1 rounded-full border border-blue-400 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm6.405 17.4l-2.07-3.585H7.665L5.595 17.4H2.52L12 2.4l9.48 15H18.405zM9.735 11.4l2.265-3.923 2.265 3.923H9.735z"/>
                </svg>
                Save to Google Drive
              </a>
            ) : (
              <span className="text-xs px-3 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-400">
                Google Drive — Pro only
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
