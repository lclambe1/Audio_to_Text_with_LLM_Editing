import { createClient } from "@/lib/supabase/server";
import RecorderApp from "@/components/recorder/RecorderApp";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user!.id)
    .single();

  const isPro = sub?.plan === "pro";

  return <RecorderApp isPro={isPro} />;
}
