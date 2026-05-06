import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ACCEPTED_TYPES = [
  "audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav",
  "audio/webm", "audio/ogg", "audio/flac", "audio/aac",
];

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";
const FREE_MAX_RECORDINGS = 5;
const FREE_MAX_DURATION_SECONDS = 600; // 10 minutes

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Determine plan
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();
  const isPro = sub?.plan === "pro";

  // Free tier: check recording count
  if (!isPro) {
    const { count } = await supabase
      .from("transcriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if ((count ?? 0) >= FREE_MAX_RECORDINGS) {
      return NextResponse.json(
        { error: `Free plan limit reached (${FREE_MAX_RECORDINGS} recordings). Delete one or upgrade to Pro.` },
        { status: 403 }
      );
    }
  }

  const formData = await req.formData();
  const file = formData.get("audio") as File | null;
  const subjectProfileId = formData.get("subject_profile_id") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = `${user.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("audio")
    .upload(storagePath, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from("audio").getPublicUrl(storagePath);

  const { data: row, error: insertError } = await supabase
    .from("transcriptions")
    .insert({
      user_id: user.id,
      title: file.name.replace(/\.[^.]+$/, "").replace(/_/g, " "),
      audio_url: publicUrl,
      status: "transcribing",
      subject_profile_id: subjectProfileId || null,
    })
    .select()
    .single();

  if (insertError || !row) {
    return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
  }

  try {
    const backendForm = new FormData();
    backendForm.append("audio", new Blob([buffer], { type: file.type }), file.name);

    const params = new URLSearchParams({
      ai_edit: isPro ? "true" : "false",
      ...(isPro ? {} : { max_duration: String(FREE_MAX_DURATION_SECONDS) }),
    });

    const backendRes = await fetch(`${BACKEND_URL}/transcribe?${params}`, {
      method: "POST",
      body: backendForm,
    });

    if (!backendRes.ok) {
      const err = await backendRes.json();
      await supabase.from("transcriptions").update({ status: "error" }).eq("id", row.id);
      return NextResponse.json({ error: err.detail ?? "Processing failed" }, { status: backendRes.status });
    }

    const { raw_text, grammar_text, ai_text, duration, word_timestamps } = await backendRes.json();

    await supabase.from("transcriptions").update({
      raw_text,
      grammar_text,
      ai_text: isPro ? ai_text : null,
      duration_seconds: duration,
      word_timestamps,
      status: "done",
    }).eq("id", row.id);

    return NextResponse.json({ id: row.id, status: "done", ai_text: isPro ? ai_text : grammar_text });
  } catch (err) {
    await supabase.from("transcriptions").update({ status: "error" }).eq("id", row.id);
    console.error("Pipeline error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
