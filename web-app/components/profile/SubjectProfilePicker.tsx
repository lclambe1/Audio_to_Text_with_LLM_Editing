"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SubjectProfile } from "@/types";

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  avatarOnly?: boolean; // compact mode: just shows avatar, no label
}

export default function SubjectProfilePicker({ value, onChange, disabled, avatarOnly }: Props) {
  const [profiles, setProfiles] = useState<SubjectProfile[]>([]);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = profiles.find((p) => p.id === value) ?? null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setProfiles(data));
  }, []);

  const createProfile = async () => {
    if (!newName.trim()) return;
    setUploading(true);

    let avatar_url: string | null = null;

    if (avatarFile) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const path = `${user!.id}/${Date.now()}-${avatarFile.name}`;
      const { error } = await supabase.storage.from("avatars").upload(path, avatarFile);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = publicUrl;
      }
    }

    const res = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: newName.trim(), avatar_url }),
    });

    if (res.ok) {
      const profile = await res.json();
      setProfiles((p) => [...p, profile].sort((a, b) => a.display_name.localeCompare(b.display_name)));
      onChange(profile.id);
      setNewName("");
      setAvatarFile(null);
      setAdding(false);
      setOpen(false);
    }
    setUploading(false);
  };

  const deleteProfile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch("/api/profiles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setProfiles((p) => p.filter((x) => x.id !== id));
    if (value === id) onChange(null);
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {avatarOnly ? (
        // Compact mode: just the avatar circle, click to reassign
        <button
          onClick={() => !disabled && setOpen((o) => !o)}
          title={selected ? `Assigned to ${selected.display_name} — click to change` : "Assign to someone"}
          style={{ background: "none", border: "none", padding: 0, cursor: disabled ? "default" : "pointer" }}
        >
          {selected?.avatar_url ? (
            <img src={selected.avatar_url} alt={selected.display_name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", display: "block" }} />
          ) : selected ? (
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: "#4f46e5" }}>
              {selected.display_name[0].toUpperCase()}
            </div>
          ) : (
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f3f4f6", border: "1.5px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            </div>
          )}
        </button>
      ) : (
        // Full mode: label button
        <button
          onClick={() => !disabled && setOpen((o) => !o)}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", padding: "6px 10px", cursor: disabled ? "default" : "pointer", color: "#d1d5db", fontSize: "12px", width: "100%" }}
        >
          {selected ? (
            <>
              {selected.avatar_url && <img src={selected.avatar_url} alt="" style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }} />}
              <span>{selected.display_name}</span>
            </>
          ) : (
            <span style={{ color: "#6b7280" }}>+ Who is being recorded?</span>
          )}
        </button>
      )}

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: "180px", ...(avatarOnly ? {} : { right: 0 }), background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", zIndex: 50, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
          {/* None option */}
          <div
            onClick={() => { onChange(null); setOpen(false); }}
            style={{ padding: "10px 12px", cursor: "pointer", color: "#9ca3af", fontSize: "12px", borderBottom: "1px solid #374151" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#374151")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            No subject
          </div>

          {profiles.map((p) => (
            <div
              key={p.id}
              onClick={() => { onChange(p.id); setOpen(false); }}
              style={{ padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #374151" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#374151")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {p.avatar_url
                ? <img src={p.avatar_url} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
                : <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#374151", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#9ca3af" }}>{p.display_name[0].toUpperCase()}</div>
              }
              <span style={{ flex: 1, color: "#d1d5db", fontSize: "13px" }}>{p.display_name}</span>
              <button
                onClick={(e) => deleteProfile(p.id, e)}
                style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "14px", padding: "0 4px" }}
              >×</button>
            </div>
          ))}

          {/* Add new */}
          {adding ? (
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <input
                autoFocus
                placeholder="Name (e.g. Grandpa)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createProfile()}
                style={{ background: "#111827", border: "1px solid #374151", borderRadius: "6px", color: "#f3f4f6", fontSize: "13px", padding: "6px 8px", outline: "none" }}
              />
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
              <button onClick={() => fileRef.current?.click()} style={{ background: "none", border: "1px dashed #374151", borderRadius: "6px", color: "#9ca3af", fontSize: "11px", padding: "5px", cursor: "pointer" }}>
                {avatarFile ? avatarFile.name : "📷 Add photo (optional)"}
              </button>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={createProfile} disabled={uploading} style={{ flex: 1, background: "#ef4444", border: "none", borderRadius: "6px", color: "#fff", fontSize: "12px", padding: "6px", cursor: "pointer" }}>
                  {uploading ? "Saving..." : "Save"}
                </button>
                <button onClick={() => { setAdding(false); setNewName(""); setAvatarFile(null); }} style={{ flex: 1, background: "#374151", border: "none", borderRadius: "6px", color: "#9ca3af", fontSize: "12px", padding: "6px", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setAdding(true)}
              style={{ padding: "10px 12px", cursor: "pointer", color: "#6b7280", fontSize: "12px" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#374151")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              + New person
            </div>
          )}
        </div>
      )}
    </div>
  );
}
