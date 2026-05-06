import { createClient } from "@/lib/supabase/server";
import ProfileFolder from "@/components/transcription/ProfileFolder";
import type { Transcription, SubjectProfile } from "@/types";

export default async function TranscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: transcriptions }, { data: sub }] = await Promise.all([
    supabase
      .from("transcriptions")
      .select("*, subject_profiles(*)")
      .eq("user_id", user!.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user!.id)
      .single(),
  ]);

  const isPro = sub?.plan === "pro";
  const rows = (transcriptions ?? []) as Transcription[];

  if (rows.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Transcriptions</h1>
        <p className="text-gray-400">No transcriptions yet. Head to the recorder to get started.</p>
      </div>
    );
  }

  // Group by subject profile
  const profileMap = new Map<string | null, { profile: SubjectProfile | null; items: Transcription[] }>();

  for (const t of rows) {
    const key = t.subject_profile_id ?? null;
    if (!profileMap.has(key)) {
      profileMap.set(key, {
        profile: (t.subject_profiles as SubjectProfile | null) ?? null,
        items: [],
      });
    }
    profileMap.get(key)!.items.push(t);
  }

  // Sort: named profiles alphabetically first, then unassigned last
  const groups = [...profileMap.entries()].sort(([aKey, aVal], [bKey, bVal]) => {
    if (aKey === null) return 1;
    if (bKey === null) return -1;
    return (aVal.profile?.display_name ?? "").localeCompare(bVal.profile?.display_name ?? "");
  });

  const hasMultipleGroups = groups.length > 1;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Transcriptions</h1>

      {hasMultipleGroups ? (
        // Folder view — one collapsible section per profile
        <div className="flex flex-col gap-4">
          {groups.map(([key, { profile, items }]) => (
            <ProfileFolder
              key={key ?? "unassigned"}
              profile={profile}
              transcriptions={items}
              isPro={isPro}
              defaultOpen={groups.length === 1}
            />
          ))}
        </div>
      ) : (
        // Single group — show as one open folder
        <ProfileFolder
          key={groups[0]?.[0] ?? "all"}
          profile={groups[0]?.[1]?.profile ?? null}
          transcriptions={rows}
          isPro={isPro}
          defaultOpen
        />
      )}
    </div>
  );
}
