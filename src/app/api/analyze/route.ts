import { NextRequest, NextResponse } from "next/server";
import { orders, results } from "@/lib/store";
import { processWithGrok, sendReportEmail } from "@/lib/process-order";

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

    const order = orders.get(orderId);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status !== "paid") {
      return NextResponse.json(
        { error: "Order not paid" },
        { status: 400 }
      );
    }

    const orderData = {
      email: order.email,
      yourPerspective: order.yourPerspective,
      brokeAgreement: order.brokeAgreement || "",
      desiredResolution: order.desiredResolution || "",
      previousAttempts: order.previousAttempts || "",
      theirPerspective: order.theirPerspective || ""
    };

    const result = await processWithGrok(orderData);

    await sendReportEmail(order.email, orderData, result);

    order.status = "completed";
    orders.set(orderId, order);

    results.set(orderId, result);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
