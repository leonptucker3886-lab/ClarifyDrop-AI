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

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ approved: false }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ approved: false });
    }

    const data = await response.json();
    const status = data.status;

    if (status === "COMPLETED") {
      return NextResponse.json({ approved: true });
    }

    return NextResponse.json({ approved: false });
  } catch (error) {
    console.error("Check payment error:", error);
    return NextResponse.json({ approved: false });
  }
}