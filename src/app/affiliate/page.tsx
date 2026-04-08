"use client";

export default function Affiliate() {
  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Affiliate Program</h1>
          <p className="text-slate-400">Earn 30% commission on every sale</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">How to Join</h2>
          <div className="space-y-4 text-slate-300">
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-bold text-lg">1.</span>
              <div>
                <p className="font-medium">Pick your unique code</p>
                <p className="text-sm text-slate-400">Choose something memorable like &quot;yourname123&quot;</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-bold text-lg">2.</span>
              <div>
                <p className="font-medium">Use this link format</p>
                <p className="text-sm text-slate-400 bg-slate-900 p-2 rounded font-mono">https://clarify-drop-ai.vercel.app/?ref=YOURCODE</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-bold text-lg">3.</span>
              <div>
                <p className="font-medium">Email us to get paid</p>
                <p className="text-sm text-slate-400">Send your code and PayPal email to <a href="mailto:leonptucker3886@gmail.com" className="text-blue-400 hover:text-blue-300">leonptucker3886@gmail.com</a></p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500 rounded">
            <p className="text-blue-300 font-medium">Commission: 30% ($3 per $9.99 sale)</p>
            <p className="text-blue-400 text-sm mt-1">Paid monthly via PayPal. No account or dashboard needed.</p>
          </div>
        </div>

        <div className="text-center mt-8">
          <a href="/" className="text-blue-400 hover:text-blue-300 underline">← Back to Home</a>
        </div>
      </div>
    </main>
  );
}