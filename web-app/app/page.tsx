import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-5xl font-bold mb-4 text-brand-700">AudioTranscribe</h1>
      <p className="text-xl text-gray-600 max-w-xl mb-8">
        Upload any audio recording. Get back a clean, AI-edited transcript in seconds.
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="px-6 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition"
        >
          Get Started Free
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 border border-gray-300 dark:border-gray-500 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Log In
        </Link>
      </div>

      <section className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full text-left">
        {[
          {
            title: "Upload Audio",
            body: "Drop any .mp3, .m4a, .wav, .webm or other audio file.",
          },
          {
            title: "AI Transcription",
            body: "Convert speech to text with high accuracy.",
          },
          {
            title: "AI Editing",
            body: "Allow AI to be your personal editor; fix grammar and polish flow!",
          },
        ].map((f) => (
          <div key={f.title} className="p-6 border rounded-xl">
            <h3 className="font-bold text-lg mb-2">{f.title}</h3>
            <p className="text-gray-500">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
