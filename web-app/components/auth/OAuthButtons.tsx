"use client";

import { createClient } from "@/lib/supabase/client";

type Provider = "google" | "facebook" ; //| "microsoft";

const providers: { id: Provider; label: string; icon: React.ReactNode }[] = [
  {
    id: "google",
    label: "Google",
    icon: (
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.931-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
    ),
  },
  // {
  //   id: "microsoft",
  //   label: "Microsoft",
  //   icon: (
  //     <svg width="18" height="18" viewBox="0 0 21 21">
  //       <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
  //       <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
  //       <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
  //       <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
  //     </svg>
  //   ),
  // },
];

export default function OAuthButtons({ mode }: { mode: "login" | "signup" }) {
  const supabase = createClient();

  async function handleOAuth(provider: Provider) {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        scopes: provider === "facebook" ? "email,public_profile" : undefined,
      },
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {providers.map((p) => (
        <button
          key={p.id}
          onClick={() => handleOAuth(p.id)}
          className="flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition w-full shadow-sm"
        >
          {p.icon}
          {mode === "login" ? "Continue" : "Sign up"} with {p.label}
        </button>
      ))}
    </div>
  );
}
