import { NextRequest, NextResponse } from "next/server";

const PAYPAL_API_BASE = process.env.PAYPAL_MODE === "live" 
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get PayPal access token");
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: "Order ID and amount required" },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: orderId,
            amount: {
              currency_code: "USD",
              value: amount,
            },
          },
        ],
        application_context: {
          brand_name: "ClarityDrop AI",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${siteUrl}/api/paypal/success?orderId=${orderId}`,
          cancel_url: `${siteUrl}/api/paypal/cancel?orderId=${orderId}`,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `PayPal error: ${error}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const approvalUrl = data.links?.find((link: { rel: string }) => link.rel === "approve")?.href;

    if (!approvalUrl) {
      return NextResponse.json(
        { error: "No approval URL found" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: data.id,
      approvalUrl,
    });
  } catch (error) {
    console.error("PayPal create order error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create PayPal order" },
      { status: 500 }
    );
  }
}