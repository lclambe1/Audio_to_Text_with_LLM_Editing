export default function DataDeletionPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Data Deletion Request</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: May 2026</p>

      <section className="space-y-6 text-gray-700 leading-relaxed">
        <p>
          If you signed in to AudioScribe using Facebook and would like your data
          deleted, you have two options:
        </p>

        <div>
          <h2 className="font-semibold text-lg mb-2">Option 1 — Delete from within the app</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>Log in to AudioScribe</li>
            <li>Go to Account settings</li>
            <li>Click <strong>Delete my account and all data</strong></li>
          </ol>
          <p className="mt-2 text-sm text-gray-500">This immediately removes your account, recordings, and transcriptions from our systems.</p>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">Option 2 — Email us</h2>
          <p>
            Send a deletion request to{" "}
            <a href="mailto:leeclambert12@gmail.com" className="text-blue-600 hover:underline">
              leeclambert12@gmail.com
            </a>{" "}
            with the subject line <strong>"Data Deletion Request"</strong>. We will
            delete your data within 30 days and confirm by email.
          </p>
        </div>

        <div className="border-t pt-6">
          <p className="text-sm text-gray-500">
            We do not retain any Facebook user data beyond what is needed to operate
            your account. Upon deletion, all personal data is permanently removed.
          </p>
        </div>
      </section>
    </main>
  );
}
