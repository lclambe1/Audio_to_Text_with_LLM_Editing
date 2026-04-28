import { createClient } from "@/lib/supabase/server";
import AudioUpload from "@/components/upload/AudioUpload";
import TranscriptionCard from "@/components/transcription/TranscriptionCard";
import type { Transcription } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: transcriptions } = await supabase
    .from("transcriptions")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">Upload Audio</h2>
        <AudioUpload />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Transcriptions</h2>
        {!transcriptions || transcriptions.length === 0 ? (
          <p className="text-gray-400">No transcriptions yet. Upload your first audio file above.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(transcriptions as Transcription[]).map((t) => (
              <TranscriptionCard key={t.id} transcription={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
