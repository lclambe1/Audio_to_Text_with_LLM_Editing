import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeBuffer } from "@/lib/openai/transcribe";
import { correctGrammar, aiEdit } from "@/lib/openai/edit";

const ACCEPTED_TYPES = [
  "audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav",
  "audio/webm", "audio/ogg", "audio/flac", "audio/aac",
];

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

  // Upload raw audio to Supabase Storage
  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = `${user.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("audio")
    .upload(storagePath, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from("audio").getPublicUrl(storagePath);

  // Insert transcription row with pending status
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

  // Run the pipeline (Whisper → grammar → AI edit)
  try {
    const rawText = await transcribeBuffer(buffer, file.name);

    await supabase.from("transcriptions").update({ raw_text: rawText, status: "editing" }).eq("id", row.id);

    const grammarText = await correctGrammar(rawText);
    const aiText = await aiEdit(grammarText);

    await supabase.from("transcriptions").update({
      grammar_text: grammarText,
      ai_text: aiText,
      status: "done",
    }).eq("id", row.id);

    return NextResponse.json({ id: row.id, status: "done" });
  } catch (err) {
    await supabase.from("transcriptions").update({ status: "error" }).eq("id", row.id);
    console.error("Pipeline error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
