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

    const result = await processWithGrok(order.yourPerspective, order.theirPerspective);

    await sendReportEmail(order.email, order.yourPerspective, order.theirPerspective, result);

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
