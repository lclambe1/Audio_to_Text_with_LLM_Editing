"use client";

import { useState } from "react";
import type { Transcription, SubjectProfile } from "@/types";
import TranscriptionCard from "./TranscriptionCard";

interface Props {
  profile: SubjectProfile | null; // null = unassigned
  transcriptions: Transcription[];
  isPro: boolean;
  defaultOpen?: boolean;
}

export default function ProfileFolder({ profile, transcriptions, isPro, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const count = transcriptions.length;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Folder header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left"
      >
        {/* Avatar / icon */}
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm"
          />
        ) : profile ? (
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0 ring-2 ring-white shadow-sm">
            {profile.display_name[0].toUpperCase()}
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <path d="M3 7h18M3 12h18M3 17h18"/>
            </svg>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-800">
            {profile?.display_name ?? "Unassigned"}
          </p>
          <p className="text-xs text-gray-400">
            {count} recording{count !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Chevron */}
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#9ca3af" strokeWidth="2"
          style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Recordings list */}
      {open && (
        <div className="divide-y divide-gray-100">
          {transcriptions.map((t) => (
            <TranscriptionCard key={t.id} transcription={t} isPro={isPro} />
          ))}
        </div>
      )}
    </div>
  );
}
