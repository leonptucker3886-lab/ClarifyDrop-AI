import { Resend } from "resend";

interface Perspective {
  yourVersion: string;
  theirVersion: string;
  explanation: string;
}

interface AnalysisResult {
  agreements: string[];
  discrepancies: Perspective[];
  summary: string;
  navigationScript: string;
}

const GROK_SYSTEM_PROMPT = `You are a precise, black-and-white factual analyzer. Your job is to identify where two people agree and where they disagree, without emotional language or speculation.

You respond ONLY in JSON. No explanation. No preamble. No filler. Just the JSON object.

Output format:
{
  "agreements": [
    "Factual statement both sides agree on"
  ],
  "discrepancies": [
    {
      "yourVersion": "What your side says happened",
      "theirVersion": "What their side says happened", 
      "explanation": "The factual difference in 1-2 sentences"
    }
  ],
  "summary": "2-3 sentence summary of the situation - just the facts, no opinion",
  "navigationScript": "Specific, actionable 3-step script for addressing this. No fluff. Direct instructions."
}

Rules:
- Use only black-and-white factual language
- Never use words like "seems", "probably", "might", "feel", "think" - use only facts
- Never add opinions or advice beyond the navigation script
- Be harsh on discrepancies - call them exactly what they are
- The navigation script should be specific conversation points or actions, not therapy
`;

export async function processWithGrok(yourPerspective: string, theirPerspective: string): Promise<AnalysisResult> {
  const xaiApiKey = process.env.XAI_API_KEY;
  
  if (!xaiApiKey) {
    throw new Error("XAI_API_KEY not configured");
  }

  const userPrompt = `ANALYZE THIS DISPUTE:

YOUR VERSION:
${yourPerspective}

THEIR VERSION:
${theirPerspective}

Identify exact agreements and exact discrepancies. Be precise.`;

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${xaiApiKey}`,
    },
    body: JSON.stringify({
      model: "grok-2-1212",
      messages: [
        { role: "system", content: GROK_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No response from Grok");
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error("Invalid JSON response from Grok");
  }

  try {
    const result = JSON.parse(jsonMatch[0]);
    
    return {
      agreements: result.agreements || [],
      discrepancies: result.discrepancies || [],
      summary: result.summary || "",
      navigationScript: result.navigationScript || "",
    };
  } catch (parseError) {
    throw new Error("Failed to parse Grok response");
  }
}

export async function sendReportEmail(
  email: string,
  yourPerspective: string,
  theirPerspective: string,
  result: AnalysisResult
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not configured - email not sent");
    return;
  }

  const resend = new Resend(resendApiKey);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
    h2 { font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 12px; }
    p { margin-bottom: 12px; }
    .summary { background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
    .agreement { background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; margin-bottom: 8px; }
    .discrepancy { background: #fff7ed; border-left: 4px solid #f97316; padding: 12px; margin-bottom: 16px; }
    .discrepancy-box { background: #fff7ed; padding: 12px; border-radius: 4px; margin-top: 8px; }
    .label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .script { background: #f1f5f9; padding: 16px; border-radius: 8px; white-space: pre-wrap; }
    ul { margin: 0; padding-left: 20px; }
    li { margin-bottom: 8px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <h1>ClarityDrop AI Report</h1>
  <p>Here's your analysis. The facts, plain and simple.</p>

  <h2>Summary</h2>
  <div class="summary">${result.summary}</div>

  ${result.agreements.length > 0 ? `
  <h2>Where You Agree (${result.agreements.length})</h2>
  <ul>
    ${result.agreements.map(a => `<li>${a}</li>`).join("")}
  </ul>
  ` : ""}

  ${result.discrepancies.length > 0 ? `
  <h2>Where You Disagree (${result.discrepancies.length})</h2>
  ${result.discrepancies.map(d => `
    <div class="discrepancy">
      <div style="display: flex; gap: 16px; margin-bottom: 8px;">
        <div style="flex: 1;">
          <div class="label">Your version</div>
          <div>${d.yourVersion}</div>
        </div>
        <div style="flex: 1;">
          <div class="label">Their version</div>
          <div>${d.theirVersion}</div>
        </div>
      </div>
      <div class="discrepancy-box">
        <strong>Analysis:</strong> ${d.explanation}
      </div>
    </div>
  `).join("")}
  ` : ""}

  <h2>What To Do Next</h2>
  <div class="script">${result.navigationScript}</div>

  <div class="footer">
    <p>ClarityDrop AI - Stop the rewrite. See the facts.</p>
  </div>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: "ClarityDrop AI <reports@claritydrop.ai>",
      to: email,
      subject: "ClarityDrop AI Report",
      html: htmlContent,
    });
  } catch (emailError) {
    console.error("Failed to send email:", emailError);
  }
}