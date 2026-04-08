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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID required" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    const captureResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureResponse.ok) {
      const error = await captureResponse.text();
      console.error("PayPal capture error:", error);
      return NextResponse.json(
        { error: `PayPal capture failed: ${error}` },
        { status: 500 }
      );
    }

    const captureData = await captureResponse.json();

    // Update order status
    const existingOrder = orders.get(orderId);
    if (existingOrder) {
      existingOrder.status = "paid";
      existingOrder.paypalOrderId = orderId;
      orders.set(orderId, existingOrder);
    }

    return NextResponse.json({
      success: true,
      captureId: captureData.purchase_units[0].payments.captures[0].id,
    });
  } catch (error) {
    console.error("PayPal capture error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to capture payment" },
      { status: 500 }
    );
  }
}