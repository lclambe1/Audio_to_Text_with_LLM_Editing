export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: May 2026</p>

      <section className="space-y-8 text-gray-700 leading-relaxed">
        <div>
          <h2 className="font-semibold text-lg mb-2">What we collect</h2>
          <p>We collect your email address when you sign up, and audio recordings you choose to transcribe. Recordings are processed to generate transcriptions and are stored securely in your account.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">How we use your data</h2>
          <p>Your audio and transcriptions are used solely to provide the service to you. We do not sell, share, or use your data to train AI models.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">Third-party services</h2>
          <p>We use Supabase for authentication and storage. If you sign in with Google, Facebook, Apple, or Microsoft, those providers may collect data per their own privacy policies.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">Data retention</h2>
          <p>You can delete your recordings and transcriptions at any time. Deleting your account removes all associated data.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">Contact</h2>
          <p>Questions? Email us at <a href="mailto:leeclambert12@gmail.com" className="text-blue-600 hover:underline">leeclambert12@gmail.com</a></p>
        </div>
      </section>
    </main>
  );
}
