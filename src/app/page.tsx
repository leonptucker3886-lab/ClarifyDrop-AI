"use client";

import { useState, useRef, useEffect } from "react";

interface AnalysisResult {
  agreements: string[];
  discrepancies: { yourVersion: string; theirVersion: string; explanation: string }[];
  summary: string;
  navigationScript: string;
}

export default function Home() {
  const [step, setStep] = useState<"form" | "processing" | "result">("form");
  const [email, setEmail] = useState("");
  const [yourPerspective, setYourPerspective] = useState("");
  const [theirPerspective, setTheirPerspective] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<Record<string, string>>({});
  const summaryRef = useRef<HTMLButtonElement>(null);
  const agreementsRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (step === "processing" && orderId) {
      const checkPaymentStatus = async () => {
        try {
          const response = await fetch(`/api/check-payment?orderId=${orderId}`);
          const data = await response.json();

          if (data.approved) {
            const analysisResponse = await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId }),
            });

            const analysisData = await analysisResponse.json();

            if (!analysisResponse.ok) {
              throw new Error(analysisData.error || "Failed to analyze");
            }

            setResult(analysisData.result);
            setStep("result");
          } else {
            setTimeout(checkPaymentStatus, 2000);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Payment check failed");
        }
      };

      checkPaymentStatus();
    }
  }, [step, orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !yourPerspective || !theirPerspective) {
      setError("All fields are required.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    setStep("processing");

    try {
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, yourPerspective, theirPerspective }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      setOrderId(data.orderId);

      const paypalResponse = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderId, amount: "9.99" }),
      });

      const paypalData = await paypalResponse.json();

      if (!paypalResponse.ok) {
        throw new Error(paypalData.error || "Failed to create PayPal order");
      }

      window.location.href = paypalData.approvalUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("form");
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(prev => ({ ...prev, [key]: "Copied!" }));
    setTimeout(() => {
      setCopyFeedback(prev => ({ ...prev, [key]: "Copy" }));
    }, 2000);
  };

  if (step === "processing" && orderId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Processing</h2>
          <p className="text-slate-400 mb-4">Checking payment status...</p>
        </div>
      </main>
    );
  }

  if (step === "result" && result) {
    return (
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Your Analysis</h1>
            <p className="text-slate-400">Here&apos;s what the facts show</p>
          </div>

          <div className="card p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Summary</h2>
              <button
                ref={summaryRef}
                onClick={() => copyToClipboard(result.summary, "summary")}
              className="btn-secondary text-sm"
              style={{ cursor: "pointer" }}
            >
              {copyFeedback.summary || "Copy"}
            </button>
          </div>
          <p className="text-slate-300 whitespace-pre-wrap">{result.summary}</p>
        </div>

        {result.agreements.length > 0 && (
          <div className="card p-6 mb-6 section-agreement">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-emerald-400">
                Where You Agree
                <span className="badge-agreement ml-2">{result.agreements.length}</span>
              </h2>
              <button
                ref={agreementsRef}
                onClick={() => copyToClipboard(result.agreements.join("\n"), "agreements")}
                className="btn-secondary text-sm"
                style={{ cursor: "pointer" }}
              >
                  {copyFeedback.agreements || "Copy"}
                </button>
              </div>
              <ul className="space-y-3">
                {result.agreements.map((item, index) => (
                  <li key={index} className="text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.discrepancies.length > 0 && (
            <div className="card p-6 mb-6 section-discrepancy">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-orange-400">
                  Where You Disagree
                  <span className="badge-discrepancy ml-2">{result.discrepancies.length}</span>
                </h2>
              </div>
              <div className="space-y-4">
                {result.discrepancies.map((item, index) => (
                  <div key={index} className="border-t border-slate-700 pt-4 first:border-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase mb-1">Your version</p>
                        <p className="text-slate-300 text-sm">{item.yourVersion}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase mb-1">Their version</p>
                        <p className="text-slate-300 text-sm">{item.theirVersion}</p>
                      </div>
                    </div>
                    <div className="bg-orange-900/20 p-3 rounded">
                      <p className="text-orange-300 text-sm">{item.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">What To Do Next</h2>
              <button
                ref={navigationRef}
                onClick={() => copyToClipboard(result.navigationScript, "navigation")}
                className="btn-secondary text-sm"
              >
                {copyFeedback.navigation || "Copy"}
              </button>
            </div>
            <p className="text-slate-300 whitespace-pre-wrap">{result.navigationScript}</p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.href = "/"}
              className="btn-secondary"
            >
              Start Over
            </button>
            <button
              onClick={() => {
                const content = `
ClarityDrop AI Report
====================

SUMMARY
${result.summary}

AGREEMENTS (${result.agreements.length})
${result.agreements.map((a, i) => `${i + 1}. ${a}`).join("\n")}

DISCREPANCIES (${result.discrepancies.length})
${result.discrepancies.map((d, i) => `
${i + 1}. Your version: ${d.yourVersion}
   Their version: ${d.theirVersion}
   Analysis: ${d.explanation}
`).join("\n")}

NEXT STEPS
${result.navigationScript}
                `;
                const blob = new Blob([content], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "claritydrop-report.txt";
                a.click();
              }}
              className="btn-primary"
            >
              Download Report
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Stop the rewrite. See the facts.
          </h1>
          <p className="text-xl text-slate-400">
            Drop your side. Get the exact discrepancies and what to do next. <span className="text-blue-400 font-semibold">$9.99</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Your email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Your perspective – be as detailed as you want
            </label>
            <textarea
              value={yourPerspective}
              onChange={(e) => setYourPerspective(e.target.value)}
              className="input-field min-h-[150px]"
              placeholder="What happened, from your point of view..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Other person&apos;s version (paste texts or summary)
            </label>
            <textarea
              value={theirPerspective}
              onChange={(e) => setTheirPerspective(e.target.value)}
              className="input-field min-h-[150px]"
              placeholder="Their version of events..."
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full text-lg">
            Analyze for $9.99
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Secure payment via PayPal. Results sent to your email.
        </p>
      </div>
    </main>
  );
}