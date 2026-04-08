"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface AnalysisResult {
  agreements: string[];
  discrepancies: { yourVersion: string; theirVersion: string; explanation: string }[];
  summary: string;
  navigationScript: string;
  solo_note?: string;
  resolution_gaps?: string[];
  perception_gaps?: string[];
}

const TERMS_TEXT = `This is a one-time digital purchase of an AI-generated factual report. No refunds. Payment supports development of larger conflict-management tools. Data deleted after 24 hours. Not therapy or legal advice.

This service delivers instant factual analysis based only on submitted text. Once the report is generated and emailed, the purchase is final.`;

const ClarityLogo = () => (
  <div className="flex items-center gap-4">
    <div className="relative w-16 h-16">
      {/* Brain left hemisphere */}
      <div className="absolute left-0 top-1 w-7 h-10 bg-blue-500 rounded-l-full"></div>
      {/* Brain right hemisphere */}
      <div className="absolute right-0 top-1 w-7 h-10 bg-blue-500 rounded-r-full"></div>
      {/* Brain stem */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-b-full"></div>
      {/* Brain folds left */}
      <div className="absolute top-3 left-1 w-1 h-5 bg-white rounded-full"></div>
      <div className="absolute top-5 left-2 w-1 h-3 bg-white rounded-full"></div>
      {/* Brain folds right */}
      <div className="absolute top-3 right-1 w-1 h-5 bg-white rounded-full"></div>
      <div className="absolute top-5 right-2 w-1 h-3 bg-white rounded-full"></div>
    </div>
    <div className="flex flex-col">
      <span className="text-white text-3xl font-bold tracking-tight" style={{ fontFamily: "'Dancing Script', cursive" }}>Clarity</span>
      <span className="text-blue-400 text-sm font-medium -mt-1">AI</span>
    </div>
  </div>
);

export default function Home() {
  const [step, setStep] = useState<"form" | "processing" | "result">("form");
  const [email, setEmail] = useState("");
  const [yourPerspective, setYourPerspective] = useState("");
  const [brokeAgreement, setBrokeAgreement] = useState("");
  const [desiredResolution, setDesiredResolution] = useState("");
  const [previousAttempts, setPreviousAttempts] = useState("");
  const [theirPerspective, setTheirPerspective] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
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

    if (!email || !yourPerspective) {
      setError("Email and your perspective are required.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    if (!agreedToTerms) {
      setError("You must agree to the terms to proceed.");
      return;
    }

    setStep("processing");

    try {
      const orderData = {
        email,
        yourPerspective,
        brokeAgreement: brokeAgreement || "",
        desiredResolution: desiredResolution || "",
        previousAttempts: previousAttempts || "",
        theirPerspective: theirPerspective || ""
      };

      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnderSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isImage && isUnderSize;
    });

    if (validFiles.length !== files.length) {
      setError("Please only upload images under 10MB each.");
      return;
    }

    if (evidenceFiles.length + validFiles.length > 5) {
      setError("Maximum 5 images allowed.");
      return;
    }

    setEvidenceFiles(prev => [...prev, ...validFiles]);
    setError("");
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

          {result.solo_note && (
            <div className="bg-amber-900/30 border-l-4 border-amber-500 p-4 mb-6">
              <p className="text-amber-300 font-medium">Note: {result.solo_note}</p>
            </div>
          )}

          <div className="card p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Summary</h2>
              <Button
                ref={summaryRef}
                onClick={() => copyToClipboard(result.summary, "summary")}
                variant="outline"
                size="sm"
              >
                {copyFeedback.summary || "Copy"}
              </Button>
            </div>
            <p className="text-slate-300 whitespace-pre-wrap">{result.summary}</p>
          </div>

          {result.perception_gaps && result.perception_gaps.length > 0 && (
            <div className="card p-6 mb-6 section-discrepancy">
              <h2 className="text-lg font-semibold text-orange-400 mb-4">
                Perception Gaps
                <span className="badge-discrepancy ml-2">{result.perception_gaps.length}</span>
              </h2>
              <ul className="space-y-3">
                {result.perception_gaps.map((gap, index) => (
                  <li key={index} className="text-orange-300 flex items-start gap-2">
                    <span className="text-orange-400 mt-1">○</span>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.resolution_gaps && result.resolution_gaps.length > 0 && (
            <div className="card p-6 mb-6" style={{ borderLeft: "4px solid #8b5cf6" }}>
              <h2 className="text-lg font-semibold text-purple-400 mb-4">
                Resolution Gaps
                <span className="bg-purple-500 text-white px-2 py-0.5 rounded text-xs font-semibold ml-2">{result.resolution_gaps.length}</span>
              </h2>
              <ul className="space-y-3">
                {result.resolution_gaps.map((gap, index) => (
                  <li key={index} className="text-purple-300 flex items-start gap-2">
                    <span className="text-purple-400 mt-1">◆</span>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.agreements.length > 0 && (
            <div className="card p-6 mb-6 section-agreement">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-emerald-400">
                  Where You Agree
                  <span className="badge-agreement ml-2">{result.agreements.length}</span>
                </h2>
                <Button
                  ref={agreementsRef}
                  onClick={() => copyToClipboard(result.agreements.join("\n"), "agreements")}
                  variant="outline"
                  size="sm"
                >
                  {copyFeedback.agreements || "Copy"}
                </Button>
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
              <Button
                ref={navigationRef}
                onClick={() => copyToClipboard(result.navigationScript, "navigation")}
                variant="outline"
                size="sm"
              >
                {copyFeedback.navigation || "Copy"}
              </Button>
            </div>
            <p className="text-slate-300 whitespace-pre-wrap">{result.navigationScript}</p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => window.location.href = "/"}
              variant="secondary"
            >
              Start Over
            </Button>
            <Button
              onClick={() => {
                const soloNote = result.solo_note ? `\nNOTE: ${result.solo_note}\n` : "";
                const resolutionGaps = result.resolution_gaps?.length ? `\nRESOLUTION GAPS (${result.resolution_gaps.length})\n${result.resolution_gaps.map((g, i) => `${i + 1}. ${g}`).join("\n")}\n` : "";
                const perceptionGaps = result.perception_gaps?.length ? `\nPERCEPTION GAPS (${result.perception_gaps.length})\n${result.perception_gaps.map((g, i) => `${i + 1}. ${g}`).join("\n")}\n` : "";
                const content = `
ClarityDrop AI Report
====================
${soloNote}
SUMMARY
${result.summary}
${resolutionGaps}
${perceptionGaps}
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
            >
              Download Report
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "", currency: "USD" }}>
      <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-10">
            <ClarityLogo />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            ClarityDrop AI – Stop the rewrite. Get the exact facts for $9.99.
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            One-time payment. Drop your side of the conflict in detail. The AI delivers a strictly factual report that shows real discrepancies in timelines, events, previous agreements or boundaries, and framing — based only on what you submit. No opinions. No sides taken. You receive clear navigation scripts you can copy and use, plus the full report by email and PDF. Data is automatically deleted after 24 hours.
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">What you get for $9.99</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300">Exact discrepancies in timelines, events, previous agreements or boundaries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300">Clear agreements and mismatches based only on submitted text</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300">Navigation scripts you can copy and use</span>
              </li>
            </ul>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300">Resolution gaps and factual next steps</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300">Full report emailed + PDF download</span>
              </li>
            </ul>
           </div>
         </div>

          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Sample Report Preview</h3>
            <div className="space-y-4">
              <div className="bg-orange-900/20 border border-orange-500 p-4 rounded">
                <h4 className="text-orange-400 font-semibold mb-2">Discrepancies</h4>
                <p className="text-slate-300 text-sm">Timeline inconsistencies, conflicting statements, broken agreements</p>
              </div>
              <div className="bg-green-900/20 border border-green-500 p-4 rounded">
                <h4 className="text-green-400 font-semibold mb-2">Agreements</h4>
                <p className="text-slate-300 text-sm">Shared facts, mutual understandings, aligned perspectives</p>
              </div>
              <div className="bg-blue-900/20 border border-blue-500 p-4 rounded">
                <h4 className="text-blue-400 font-semibold mb-2">Navigation Scripts</h4>
                <p className="text-slate-300 text-sm">Actionable phrases and approaches to resolve the conflict</p>
              </div>
            </div>
          </div>

         <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-lg mb-8">
          <p className="text-slate-300 text-sm">
            Provide complete details for a more precise report. More complete and neutral input = more accurate factual output.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-12 border-2 border-white/20 focus:border-white/40 text-white placeholder:text-white/60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="perspective" className="text-slate-300 text-lg font-semibold">Your full perspective – be as detailed and factual as possible</Label>
            <Textarea
              rows={8}
              value={yourPerspective}
              onChange={(e) => setYourPerspective(e.target.value)}
              placeholder="Describe your side of the conflict in detail..."
              className="mt-2 border-2 border-white/20 focus:border-white/40 text-white placeholder:text-white/60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agreement" className="text-slate-300 text-lg font-semibold">Did this break a previous agreement or boundary?</Label>
            <Textarea
              rows={4}
              value={brokeAgreement}
              onChange={(e) => setBrokeAgreement(e.target.value)}
              placeholder="If yes, describe the previous agreement or boundary that was broken. If no previous agreement existed, write 'No previous agreement or boundary was set.'"
              className="mt-2 border-2 border-white/20 focus:border-white/40 text-white placeholder:text-white/60"
            />
            <p className="text-slate-500 text-sm mt-1">
              If yes, describe the previous agreement or boundary that was broken. If no previous agreement existed, write &apos;No previous agreement or boundary was set.&apos;
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution" className="text-slate-300 text-lg font-semibold">What resolution or change do you want moving forward? Be specific and factual.</Label>
            <Textarea
              rows={4}
              value={desiredResolution}
              onChange={(e) => setDesiredResolution(e.target.value)}
              placeholder="Be specific about what you want to change or resolve..."
              className="mt-2 border-2 border-white/20 focus:border-white/40 text-white placeholder:text-white/60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attempts" className="text-slate-300 text-lg font-semibold">Any previous attempts to resolve this? What was said?</Label>
            <Textarea
              id="attempts"
              value={previousAttempts}
              onChange={(e) => setPreviousAttempts(e.target.value)}
              placeholder="Describe any previous attempts to resolve this conflict and what was said..."
              className="min-h-[140px] text-base border-2 border-white/20 focus:border-white/40 text-white placeholder:text-white/60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="their-perspective" className="text-slate-300 text-lg font-semibold">Other person&apos;s version</Label>
            <Textarea
              id="their-perspective"
              value={theirPerspective}
              onChange={(e) => setTheirPerspective(e.target.value)}
              placeholder="Their version of events..."
              className="min-h-[160px] text-base border-2 border-white/20 focus:border-white/40 text-white placeholder:text-white/60"
            />
            <p className="text-amber-400 text-sm mt-2 font-bold">
              If the other person is not filling this out themselves, describe their side as accurately as possible by putting yourself in their shoes. Be factual. If this description is incomplete or inaccurate, the report discrepancies and navigation scripts will be off.
            </p>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/10">
            <Label className="text-lg font-semibold text-white">Upload Evidence (Optional)</Label>
            <p className="text-slate-400 text-sm">
              Add screenshots, texts, emails, or other proof to support your perspective. Maximum 5 images, 10MB each.
            </p>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/30 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                id="evidence-upload"
                onChange={handleFileChange}
              />
              <label htmlFor="evidence-upload" className="cursor-pointer">
                <div className="text-4xl mb-2">📎</div>
                <div className="text-white font-medium">Click to upload evidence</div>
                <div className="text-slate-400 text-sm mt-1">PNG, JPG, GIF up to 10MB</div>
              </label>
            </div>

            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/30 transition-colors mt-4">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                id="evidence-upload-2"
                onChange={handleFileChange}
              />
              <label htmlFor="evidence-upload-2" className="cursor-pointer">
                <div className="text-4xl mb-2">📎</div>
                <div className="text-white font-medium">Upload more evidence</div>
                <div className="text-slate-400 text-sm mt-1">PNG, JPG, GIF up to 10MB</div>
              </label>
            </div>

            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/30 transition-colors mt-4">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                id="evidence-upload-3"
                onChange={handleFileChange}
              />
              <label htmlFor="evidence-upload-3" className="cursor-pointer">
                <div className="text-4xl mb-2">📎</div>
                <div className="text-white font-medium">Upload more evidence</div>
                <div className="text-slate-400 text-sm mt-1">PNG, JPG, GIF up to 10MB</div>
              </label>
            </div>

            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/30 transition-colors mt-4">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                id="evidence-upload-4"
                onChange={handleFileChange}
              />
              <label htmlFor="evidence-upload-4" className="cursor-pointer">
                <div className="text-4xl mb-2">📎</div>
                <div className="text-white font-medium">Upload more evidence</div>
                <div className="text-slate-400 text-sm mt-1">PNG, JPG, GIF up to 10MB</div>
              </label>
            </div>

            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/30 transition-colors mt-4">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                id="evidence-upload-5"
                onChange={handleFileChange}
              />
              <label htmlFor="evidence-upload-5" className="cursor-pointer">
                <div className="text-4xl mb-2">📎</div>
                <div className="text-white font-medium">Upload more evidence</div>
                <div className="text-slate-400 text-sm mt-1">PNG, JPG, GIF up to 10MB</div>
              </label>
            </div>

            {evidenceFiles.length > 0 && (
              <div className="mt-4">
                <div className="text-white text-sm font-medium mb-2">Uploaded Files:</div>
                <div className="space-y-2">
                  {evidenceFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-slate-800/50 rounded px-3 py-2">
                      <span className="text-slate-300 text-sm">{file.name}</span>
                      <span className="text-slate-500 text-xs">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                      <button
                        onClick={() => setEvidenceFiles(prev => prev.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-300 text-sm ml-auto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="border-white data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400"
              />
              <div className="space-y-2">
                <Label htmlFor="terms" className="text-sm text-slate-300 font-normal cursor-pointer">
                  I agree this is a one-time digital purchase of an AI-generated factual report. No refunds. Payment supports development of larger conflict-management tools. Data deleted after 24 hours. Not therapy or legal advice.{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-blue-400 hover:text-blue-300 underline"
                    onClick={() => setShowTerms(!showTerms)}
                  >
                    Read full Terms
                  </Button>
                </Label>
                {showTerms && (
                  <div className="mt-4 p-4 bg-slate-900 rounded text-sm text-slate-400 whitespace-pre-wrap">
                    {TERMS_TEXT}
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div style={{ pointerEvents: !agreedToTerms ? 'none' : 'auto', opacity: !agreedToTerms ? 0.5 : 1 }}>
            <PayPalButtons
              createOrder={async (data, actions) => {
                // First create internal order
                const internalResponse = await fetch('/api/create-order', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email,
                    yourPerspective,
                    brokeAgreement,
                    desiredResolution,
                    previousAttempts,
                    theirPerspective
                  })
                });
                if (!internalResponse.ok) throw new Error('Failed to create internal order');
                const internalOrder = await internalResponse.json();

                // Then create PayPal order
                const paypalResponse = await fetch('/api/paypal/create-order', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orderId: internalOrder.orderId,
                    amount: '9.99'
                  })
                });
                if (!paypalResponse.ok) throw new Error('Failed to create PayPal order');
                const paypalOrder = await paypalResponse.json();
                return paypalOrder.id;
              }}
              onApprove={async (data, actions) => {
                const response = await fetch('/api/paypal/success', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderId: data.orderID })
                });
                if (!response.ok) throw new Error('Payment failed');
                setStep('processing');
                setOrderId(data.orderID);
              }}
              style={{ color: 'blue', shape: 'rect', label: 'paypal' }}
            />
          </div>
        </form>

        <div className="text-center mt-12 p-6 bg-slate-900/50 rounded-lg border border-slate-700">
          <p className="text-slate-400 text-sm leading-relaxed">
            Affiliates earn 30% ($3) per sale.
            <br />
            1. Pick your unique code (e.g. yourname123)
            <br />
            2. Use this link: https://clarify-drop-ai.vercel.app/?ref=YOURCODE
            <br />
            3. Email leonptucker3886@gmail.com with your code and PayPal email to get paid monthly.
            <br />
            <br />
            No account or dashboard needed — simple and manual tracking.
          </p>
        </div>
      </div>
    </main>
    </PayPalScriptProvider>
  );
}