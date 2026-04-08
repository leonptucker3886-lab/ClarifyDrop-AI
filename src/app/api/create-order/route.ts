import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { orders } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, yourPerspective, brokeAgreement, desiredResolution, previousAttempts, theirPerspective } = body;

    if (!email || !yourPerspective) {
      return NextResponse.json(
        { error: "Email and your perspective are required" },
        { status: 400 }
      );
    }

    const orderId = randomUUID();
    const order = {
      id: orderId,
      email,
      yourPerspective,
      brokeAgreement: brokeAgreement || "",
      desiredResolution: desiredResolution || "",
      previousAttempts: previousAttempts || "",
      theirPerspective: theirPerspective || "",
      status: "pending" as const,
      createdAt: Date.now(),
    };

    orders.set(orderId, order);

    return NextResponse.json({ orderId });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");
  
  if (!orderId) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }

  const order = orders.get(orderId);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
