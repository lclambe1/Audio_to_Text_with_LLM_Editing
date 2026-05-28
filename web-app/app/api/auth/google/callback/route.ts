import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const REDIRECT_BASE = process.env.NEXT_PUBLIC_APP_URL + "/dashboard/transcriptions";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${REDIRECT_BASE}?error=google_auth_failed`);
  }

  let transcriptionId: string, tab: string, title: string;
  try {
    ({ transcriptionId, tab, title } = JSON.parse(Buffer.from(state, "base64").toString()));
  } catch {
    return NextResponse.redirect(`${REDIRECT_BASE}?error=invalid_state`);
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  const { access_token } = await tokenRes.json();
  if (!access_token) {
    return NextResponse.redirect(`${REDIRECT_BASE}?error=google_token_failed`);
  }

  // Verify user session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);

  // Fetch the transcription (scoped to this user)
  const { data: tx } = await createAdminClient()
    .from("transcriptions")
    .select("title, raw_text, grammar_text, ai_text")
    .eq("id", transcriptionId)
    .eq("user_id", user.id)
    .single();

  if (!tx) return NextResponse.redirect(`${REDIRECT_BASE}?error=not_found`);

  const text =
    tab === "grammar" ? tx.grammar_text :
    tab === "ai"      ? tx.ai_text :
                        tx.raw_text;

  // Upload to Google Drive as a .txt file
  const metadata = JSON.stringify({ name: `${title}.txt`, mimeType: "text/plain" });
  const body = new FormData();
  body.append("metadata", new Blob([metadata], { type: "application/json" }));
  body.append("file",     new Blob([text ?? ""], { type: "text/plain" }));

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    { method: "POST", headers: { Authorization: `Bearer ${access_token}` }, body }
  );

  if (!uploadRes.ok) {
    return NextResponse.redirect(`${REDIRECT_BASE}?error=drive_upload_failed`);
  }

  return NextResponse.redirect(`${REDIRECT_BASE}?success=saved_to_drive`);
}
