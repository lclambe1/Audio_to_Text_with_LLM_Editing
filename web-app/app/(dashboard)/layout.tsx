import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 border-r flex flex-col p-4 gap-2 bg-gray-50 dark:bg-gray-900">
        <span className="font-bold text-brand-700 text-lg mb-4">AudioTranscribe</span>
        <Link
          href="/dashboard"
          className="px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-sm font-medium"
        >
          Dashboard
        </Link>
        <Link
          href="/dashboard/transcriptions"
          className="px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-sm font-medium"
        >
          Transcriptions
        </Link>
        <Link
          href="/dashboard/billing"
          className="px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-sm font-medium"
        >
          Billing
        </Link>
        <div className="mt-auto">
          <p className="text-xs text-gray-400 mb-2 truncate">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
