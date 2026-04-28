"use client";

import { useState } from "react";
import type { Transcription } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-gray-500",
  transcribing: "bg-blue-100 text-blue-600",
  editing: "bg-yellow-100 text-yellow-700",
  done: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-600",
};

type Tab = "raw" | "grammar" | "ai";

export default function TranscriptionCard({ transcription: t }: { transcription: Transcription }) {
  const [tab, setTab] = useState<Tab>("ai");
  const [open, setOpen] = useState(false);

  const text = tab === "raw" ? t.raw_text : tab === "grammar" ? t.grammar_text : t.ai_text;

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left"
      >
        <div>
          <p className="font-semibold">{t.title}</p>
          <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</p>
        </div>
        <span className={cn("text-xs px-2 py-1 rounded-full font-medium", STATUS_STYLES[t.status])}>
          {t.status}
        </span>
      </button>

      {open && t.status === "done" && (
        <div className="border-t px-5 py-4">
          {/* Tab selector */}
          <div className="flex gap-2 mb-4">
            {(["raw", "grammar", "ai"] as Tab[]).map((tab_) => (
              <button
                key={tab_}
                onClick={() => setTab(tab_)}
                className={cn(
                  "text-xs px-3 py-1 rounded-full font-medium transition",
                  tab === tab_
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {tab_ === "raw" ? "Raw" : tab_ === "grammar" ? "Grammar Fixed" : "AI Edited"}
              </button>
            ))}
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-700">{text}</p>
        </div>
      )}
    </div>
  );
}
