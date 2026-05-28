"use client";

import { useEffect, useState } from "react";

const MESSAGES: Record<string, { text: string; color: string }> = {
  saved_to_drive:      { text: "Saved to Google Drive!", color: "bg-green-500" },
  google_auth_failed:  { text: "Google sign-in failed. Please try again.", color: "bg-red-500" },
  google_token_failed: { text: "Could not get Google access. Please try again.", color: "bg-red-500" },
  drive_upload_failed: { text: "Upload to Google Drive failed. Please try again.", color: "bg-red-500" },
  not_found:           { text: "Transcription not found.", color: "bg-red-500" },
};

export default function DriveToast({ param }: { param: string | null }) {
  const [visible, setVisible] = useState(!!param);
  const msg = param ? MESSAGES[param] : null;

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible || !msg) return null;

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg flex items-center gap-3 ${msg.color}`}>
      {msg.text}
      <button onClick={() => setVisible(false)} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}
