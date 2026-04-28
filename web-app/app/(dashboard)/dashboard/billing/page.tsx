import Link from "next/link";

export default function BillingPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free plan */}
        <div className="border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-1">Free</h2>
          <p className="text-3xl font-bold mb-4">$0<span className="text-base font-normal text-gray-500">/mo</span></p>
          <ul className="text-sm text-gray-600 space-y-1 mb-6">
            <li>5 transcriptions / month</li>
            <li>Up to 10 min audio</li>
            <li>Grammar correction</li>
          </ul>
          <span className="text-sm text-gray-400 font-medium">Current plan</span>
        </div>

        {/* Pro plan */}
        <div className="border-2 border-brand-500 rounded-xl p-6 relative">
          <span className="absolute top-3 right-3 text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full">Popular</span>
          <h2 className="text-lg font-semibold mb-1">Pro</h2>
          <p className="text-3xl font-bold mb-4">$9<span className="text-base font-normal text-gray-500">/mo</span></p>
          <ul className="text-sm text-gray-600 space-y-1 mb-6">
            <li>Unlimited transcriptions</li>
            <li>Up to 2 hr audio</li>
            <li>Grammar + AI editing</li>
            <li>Download as .docx</li>
          </ul>
          {/* This will POST to /api/stripe/checkout */}
          <form action="/api/stripe/checkout" method="POST">
            <button
              type="submit"
              className="w-full bg-brand-600 text-white rounded-lg py-2 font-semibold hover:bg-brand-700 transition"
            >
              Upgrade to Pro
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
