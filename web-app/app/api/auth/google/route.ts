import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const transcriptionId = req.nextUrl.searchParams.get("transcriptionId");
  const tab = req.nextUrl.searchParams.get("tab") ?? "raw";
  const title = req.nextUrl.searchParams.get("title") ?? "Transcript";

  const state = Buffer.from(JSON.stringify({ transcriptionId, tab, title })).toString("base64");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive.file",
    access_type: "online",
    state,
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
