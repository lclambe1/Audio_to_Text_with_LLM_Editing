export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: May 2026</p>

      <section className="space-y-8 text-gray-700 leading-relaxed">
        <div>
          <h2 className="font-semibold text-lg mb-2">Acceptance</h2>
          <p>By using AudioScribe you agree to these terms. If you do not agree, do not use the service.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">Use of the service</h2>
          <p>You may use AudioScribe to record and transcribe audio for lawful purposes only. You are responsible for the content you record and must have the right to record any audio you submit.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">Your content</h2>
          <p>You retain ownership of all recordings and transcriptions you create. You grant us a limited license to process your audio solely for the purpose of generating your transcription.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">Accounts</h2>
          <p>You are responsible for keeping your account credentials secure. We reserve the right to suspend accounts that violate these terms.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">Limitation of liability</h2>
          <p>AudioScribe is provided "as is." We are not liable for any damages arising from use of the service, including transcription errors.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">Contact</h2>
          <p>Questions? Email us at <a href="mailto:leeclambert12@gmail.com" className="text-blue-600 hover:underline">leeclambert12@gmail.com</a></p>
        </div>
      </section>
    </main>
  );
}
