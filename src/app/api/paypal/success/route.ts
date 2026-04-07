import { NextRequest, NextResponse } from "next/server";
import { orders } from "@/lib/store";

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
    const paypalOrderId = request.nextUrl.searchParams.get("paypalOrderId");

    if (!orderId || !paypalOrderId) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const accessToken = await getAccessToken();

    const captureResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureResponse.ok) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const existingOrder = orders.get(orderId);
    if (existingOrder) {
      existingOrder.status = "paid";
      existingOrder.paypalOrderId = paypalOrderId;
      orders.set(orderId, existingOrder);
    }

    return NextResponse.redirect(new URL(`/result?orderId=${orderId}`, request.url));
  } catch (error) {
    console.error("PayPal success error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
