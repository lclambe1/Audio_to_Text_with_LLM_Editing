import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AudioTranscribe",
  description: "Transcribe and refine your audio with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
