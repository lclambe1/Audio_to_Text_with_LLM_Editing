import { createClient } from "@/lib/supabase/server";
import TranscriptionCard from "@/components/transcription/TranscriptionCard";
import type { Transcription } from "@/types";

export default async function TranscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: transcriptions } = await supabase
    .from("transcriptions")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">All Transcriptions</h1>
      {!transcriptions || transcriptions.length === 0 ? (
        <p className="text-gray-400">No transcriptions yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {(transcriptions as Transcription[]).map((t) => (
            <TranscriptionCard key={t.id} transcription={t} />
          ))}
        </div>
      )}
    </div>
  );
}
