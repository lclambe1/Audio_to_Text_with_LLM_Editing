import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ACCEPTED_TYPES = [
  "audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav",
  "audio/webm", "audio/ogg", "audio/flac", "audio/aac",
];

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("audio") as File | null;
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
      title: file.name.replace(/\.[^.]+$/, ""),
      audio_url: publicUrl,
      status: "transcribing",
    })
    .select()
    .single();

  if (insertError || !row) {
    return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
  }

  try {
    const backendForm = new FormData();
    backendForm.append("audio", new Blob([buffer], { type: file.type }), file.name);

    const backendRes = await fetch(`${BACKEND_URL}/transcribe`, {
      method: "POST",
      body: backendForm,
    });

    if (!backendRes.ok) {
      throw new Error(await backendRes.text());
    }

    const { raw_text, grammar_text, ai_text } = await backendRes.json();

    await supabase.from("transcriptions").update({
      raw_text,
      grammar_text,
      ai_text,
      status: "done",
    }).eq("id", row.id);

    return NextResponse.json({ id: row.id, status: "done", ai_text });
  } catch (err) {
    await supabase.from("transcriptions").update({ status: "error" }).eq("id", row.id);
    console.error("Pipeline error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
