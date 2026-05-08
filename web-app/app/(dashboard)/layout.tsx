import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import ThemeToggle from "@/components/theme/ThemeToggle";

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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 border-r flex flex-col p-4 gap-2 bg-gray-50 dark:bg-gray-900 shrink-0">
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
        <div className="mt-auto flex flex-col gap-1">
          <ThemeToggle />
          <p className="text-xs text-gray-400 px-3 truncate">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto min-w-0">{children}</main>
    </div>
  );
}
